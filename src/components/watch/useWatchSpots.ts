import { useEffect, useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { FriendCheckin, WatchContext, WatchSpot, WatchState } from "./types";

interface Response {
  spots: WatchSpot[];
  state: WatchState;
  sources: Record<string, string>;
  updatedAt: string;
}

const contextKey = (ctx: WatchContext) => [
  "watch-spots",
  ctx.kind,
  ctx.externalGameId ?? null,
  ctx.eventId ?? null,
  ctx.city ?? null,
  ctx.lat ?? null,
  ctx.lng ?? null,
] as const;

export function useWatchSpots(ctx: WatchContext) {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const query = useQuery<Response>({
    queryKey: contextKey(ctx),
    enabled: !!(ctx.externalGameId || ctx.eventId),
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("where-to-watch-spots", {
        body: {
          kind: ctx.kind,
          externalGameId: ctx.externalGameId,
          eventId: ctx.eventId,
          league: ctx.league,
          homeTeam: ctx.homeTeam,
          awayTeam: ctx.awayTeam,
          city: ctx.city ?? undefined,
          lat: ctx.lat ?? undefined,
          lng: ctx.lng ?? undefined,
          startTime: ctx.startTime,
          radiusMiles: 8,
        },
      });
      if (error || !data) {
        return { spots: [], state: "error", sources: {}, updatedAt: new Date().toISOString() } as Response;
      }
      return data as Response;
    },
  });

  // Friends watching (RPC)
  const friendsQuery = useQuery<FriendCheckin[]>({
    queryKey: ["watch-friends", ctx.externalGameId ?? ctx.eventId, user?.id],
    enabled: !!user && !!(ctx.externalGameId || ctx.eventId),
    staleTime: 30_000,
    queryFn: async () => {
      const { data } = await supabase.rpc("get_friend_watch_checkins", {
        p_game_id: ctx.externalGameId ?? null,
        p_event_id: ctx.eventId ?? null,
      });
      return (Array.isArray(data) ? data : []) as FriendCheckin[];
    },
  });

  // My current check-in
  const [myCheckin, setMyCheckin] = useState<{
    id: string;
    watch_location_id: string | null;
    place_external_id: string | null;
    place_snapshot: { name?: string };
  } | null>(null);

  const loadMyCheckin = useCallback(async () => {
    if (!user) return setMyCheckin(null);
    let q = supabase
      .from("game_watch_checkins")
      .select("id, watch_location_id, place_external_id, place_snapshot")
      .eq("user_id", user.id)
      .gt("expires_at", new Date().toISOString())
      .limit(1);
    if (ctx.externalGameId) q = q.eq("external_game_id", ctx.externalGameId);
    else if (ctx.eventId) q = q.eq("event_id", ctx.eventId);
    else return setMyCheckin(null);
    const { data } = await q.maybeSingle();
    setMyCheckin((data as any) ?? null);
  }, [user?.id, ctx.externalGameId, ctx.eventId]);

  useEffect(() => {
    loadMyCheckin();
  }, [loadMyCheckin]);

  // Realtime: invalidate counts when check-ins change for this game/event
  useEffect(() => {
    if (!ctx.externalGameId && !ctx.eventId) return;
    const channel = supabase.channel(
      `watch-checkins:${ctx.externalGameId ?? ctx.eventId}:${user?.id ?? "anon"}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
    );
    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "game_watch_checkins",
        filter: ctx.externalGameId
          ? `external_game_id=eq.${ctx.externalGameId}`
          : `event_id=eq.${ctx.eventId}`,
      },
      () => {
        queryClient.invalidateQueries({ queryKey: contextKey(ctx) });
        queryClient.invalidateQueries({ queryKey: ["watch-friends", ctx.externalGameId ?? ctx.eventId] });
        loadMyCheckin();
      },
    );
    channel.subscribe((status, err) => {
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        console.error(`[useWatchSpots] Realtime ${status}`, err);
      }
    });
    return () => {
      supabase.removeChannel(channel);
    };
  }, [ctx.externalGameId, ctx.eventId, user?.id, queryClient, loadMyCheckin]);

  const checkIn = useCallback(
    async (spot: WatchSpot) => {
      if (!user) throw new Error("auth_required");
      const expiresAt = ctx.startTime
        ? new Date(new Date(ctx.startTime).getTime() + 4 * 60 * 60 * 1000).toISOString()
        : new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();

      // Replace any existing check-in for this game/event
      const payload: any = {
        user_id: user.id,
        external_game_id: ctx.externalGameId ?? null,
        event_id: ctx.eventId ?? null,
        watch_location_id: spot.watchLocationId ?? null,
        place_external_id: spot.placeExternalId ?? null,
        place_snapshot: {
          name: spot.name,
          city: spot.city,
          neighborhood: spot.neighborhood,
          lat: spot.lat,
          lng: spot.lng,
          source: spot.source,
        },
        expires_at: expiresAt,
      };
      // Delete existing for this user+target first (replace semantics)
      let del = supabase.from("game_watch_checkins").delete().eq("user_id", user.id);
      del = ctx.externalGameId
        ? del.eq("external_game_id", ctx.externalGameId)
        : del.eq("event_id", ctx.eventId!);
      await del;
      const { error } = await supabase.from("game_watch_checkins").insert(payload);
      if (error) throw error;
      await loadMyCheckin();
      queryClient.invalidateQueries({ queryKey: contextKey(ctx) });
    },
    [user, ctx, loadMyCheckin, queryClient],
  );

  const clearCheckin = useCallback(async () => {
    if (!user) return;
    let del = supabase.from("game_watch_checkins").delete().eq("user_id", user.id);
    del = ctx.externalGameId
      ? del.eq("external_game_id", ctx.externalGameId)
      : del.eq("event_id", ctx.eventId!);
    await del;
    setMyCheckin(null);
    queryClient.invalidateQueries({ queryKey: contextKey(ctx) });
  }, [user, ctx, queryClient]);

  const state: WatchState = query.isLoading
    ? "loading"
    : query.data?.state ?? (query.data?.spots?.length ? "live-ok" : "empty");

  return {
    spots: query.data?.spots ?? [],
    state,
    sources: query.data?.sources ?? {},
    friends: friendsQuery.data ?? [],
    myCheckin,
    refetch: query.refetch,
    checkIn,
    clearCheckin,
  };
}
