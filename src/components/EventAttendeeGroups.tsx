// EventAttendeeGroups — renders the "Who's going and where" section for an
// event, splitting attendees into:
//   • Going to the stadium 🏟️
//   • Watching at <bar name> 🍺 (one group per bar)
//   • Going (group when no stadium/bar choice was made)
//
// Each attendee is a clickable card that opens AttendeeProfileDrawer and
// surfaces an inline AddFriendButton so members can connect from the event.
//
// Backed by the SECURITY DEFINER RPC `get_event_attendee_breakdown` so the
// gate is enforced server-side and only signed-in members can read the list.

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Tv, Users } from "lucide-react";
import AttendeeProfileDrawer from "./AttendeeProfileDrawer";
import AddFriendButton from "./AddFriendButton";

interface AttendeeRow {
  user_id: string;
  name: string | null;
  profile_photo_url: string | null;
  bio: string | null;
  city: string | null;
  favorite_sports: string[] | null;
  primary_role: string | null;
  rsvp_type: "stadium" | "bar" | null;
  bar_id: string | null;
  bar_name: string | null;
}

interface Props {
  eventId: string;
  /** Bump to force-refresh after the local user RSVPs. */
  refreshKey?: number;
}

const EventAttendeeGroups = ({ eventId, refreshKey }: Props) => {
  const { user } = useAuth();
  const [rows, setRows] = useState<AttendeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AttendeeRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc(
      "get_event_attendee_breakdown" as any,
      { p_event_id: eventId },
    );
    if (!error && Array.isArray(data)) {
      setRows(data as unknown as AttendeeRow[]);
    } else {
      setRows([]);
    }
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const { stadium, bars, unspecified } = useMemo(() => {
    const stadium: AttendeeRow[] = [];
    const unspecified: AttendeeRow[] = [];
    const barMap = new Map<string, { name: string; people: AttendeeRow[] }>();
    for (const r of rows) {
      if (r.rsvp_type === "stadium") stadium.push(r);
      else if (r.rsvp_type === "bar" && r.bar_name) {
        const key = (r.bar_id || r.bar_name).toLowerCase();
        const existing = barMap.get(key);
        if (existing) existing.people.push(r);
        else barMap.set(key, { name: r.bar_name, people: [r] });
      } else unspecified.push(r);
    }
    const bars = Array.from(barMap.values()).sort(
      (a, b) => b.people.length - a.people.length,
    );
    return { stadium, bars, unspecified };
  }, [rows]);

  if (loading) {
    return (
      <div className="mt-6 rounded-2xl border border-border bg-card/40 p-4">
        <div className="h-4 w-40 bg-muted rounded animate-pulse mb-3" />
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="w-12 h-12 rounded-full bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (rows.length === 0) return null;

  const openProfile = (r: AttendeeRow) => {
    setSelected(r);
    setDrawerOpen(true);
  };

  const AttendeeCard = ({ r }: { r: AttendeeRow }) => (
    <div className="flex flex-col items-center gap-1.5 w-[88px]">
      <button
        type="button"
        onClick={() => openProfile(r)}
        className="flex flex-col items-center gap-1.5 p-1.5 rounded-xl hover:bg-secondary transition-colors w-full"
        aria-label={`View ${r.name}'s profile`}
      >
        <Avatar className="w-14 h-14 border-2 border-primary/20">
          {r.profile_photo_url && (
            <AvatarImage src={r.profile_photo_url} alt={r.name || "member"} />
          )}
          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
            {r.name?.charAt(0).toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
        <span className="text-xs font-medium text-foreground truncate max-w-full">
          {r.name?.split(" ")[0] || "Member"}
        </span>
      </button>
      {user && r.user_id !== user.id && (
        <AddFriendButton targetUserId={r.user_id} size="sm" />
      )}
    </div>
  );

  const Section = ({
    icon,
    title,
    subtitle,
    accent,
    people,
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle?: string;
    accent: string;
    people: AttendeeRow[];
  }) => (
    <div
      className="rounded-2xl border p-4"
      style={{
        background: "hsl(var(--card))",
        borderColor: "hsl(var(--border))",
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
          style={{ background: accent, color: "white" }}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold text-foreground truncate">
            {title}
          </div>
          {subtitle && (
            <div className="text-[11px] text-muted-foreground truncate">
              {subtitle}
            </div>
          )}
        </div>
        <span className="ml-auto text-[11px] font-semibold text-muted-foreground">
          {people.length} {people.length === 1 ? "person" : "people"}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        {people.map((r) => (
          <AttendeeCard key={r.user_id} r={r} />
        ))}
      </div>
    </div>
  );

  return (
    <>
      <div className="mt-6 space-y-3">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold text-foreground">
            Who's going & where
          </h3>
          <span className="text-sm text-muted-foreground">({rows.length})</span>
        </div>

        {stadium.length > 0 && (
          <Section
            icon={<MapPin className="w-4 h-4" />}
            title="Going to the stadium"
            subtitle="At the venue 🏟️"
            accent="hsl(173 58% 39%)"
            people={stadium}
          />
        )}

        {bars.map((b) => (
          <Section
            key={b.name}
            icon={<Tv className="w-4 h-4" />}
            title={`Watch party at ${b.name}`}
            subtitle="🍺 Catching the game at the bar"
            accent="hsl(var(--primary))"
            people={b.people}
          />
        ))}

        {unspecified.length > 0 && (
          <Section
            icon={<Users className="w-4 h-4" />}
            title="Going"
            subtitle="Hasn't picked a spot yet"
            accent="hsl(var(--muted-foreground))"
            people={unspecified}
          />
        )}
      </div>

      <AttendeeProfileDrawer
        profile={
          selected
            ? {
                id: selected.user_id,
                name: selected.name || "Member",
                profile_photo_url: selected.profile_photo_url,
                bio: selected.bio,
                favorite_sports: selected.favorite_sports,
                primary_role: selected.primary_role,
                city: selected.city,
              }
            : null
        }
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </>
  );
};

export default EventAttendeeGroups;
