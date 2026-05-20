import React, { useEffect, useState } from"react";
import { useNavigate } from"react-router-dom";
import { ChevronLeft } from"lucide-react";
import { supabase } from"@/integrations/supabase/client";
import { useAuth } from"@/hooks/useAuth";
import BottomNav from"@/components/BottomNav";
import Seo from"@/components/Seo";
import IncomingDraftCard from"@/components/club/IncomingDraftCard";
import MutualDraftCelebration from"@/components/club/MutualDraftCelebration";
import { toast } from"sonner";

const C = {
  bg:"#0a0a0a",
  card:"#1A1A1A",
  cardElev:"#2A2A2A",
  text:"#FAF5E9",
  muted:"#B8B8B8",
  faint:"#6B6B70",
  raspberry:"#F04E23",
  copper:"#E6F25A",
  border:"rgba(250, 245, 233, 0.08)",
};

type IncomingRow = {
  id: string;
  requester_id: string;
  mutual_teams: string[] | null;
  created_at: string;
  requester?: {
    id: string;
    name: string | null;
    city: string | null;
    profile_photo_url: string | null;
    favorite_la_teams: string[] | null;
  } | null;
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return"Now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

const ClubDrafts: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<IncomingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<string | null>(null);
  const [me, setMe] = useState<{ photo: string | null; initial: string } | null>(null);
  const [celebration, setCelebration] = useState<{
    open: boolean;
    themPhoto: string | null;
    themFirst: string;
    themInitial: string;
    upcomingHint?: string;
  }>({ open: false, themPhoto: null, themFirst:"", themInitial:"" });

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!user) return;
      setLoading(true);

      const { data: myRow } = await supabase
        .from("profiles")
        .select("name, profile_photo_url")
        .eq("id", user.id)
        .maybeSingle();
      if (myRow) {
        setMe({
          photo: myRow.profile_photo_url || null,
          initial: (myRow.name?.[0] ||"·").toUpperCase(),
        });
      }

      const { data: incoming } = await supabase
        .from("friendships")
        .select("id, requester_id, mutual_teams, created_at")
        .eq("addressee_id", user.id)
        .eq("status","pending")
        .order("created_at", { ascending: false });

      const reqIds = (incoming || []).map((r: any) => r.requester_id);
      let profilesById: Record<string, any> = {};
      if (reqIds.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, name, city, profile_photo_url, favorite_la_teams")
          .in("id", reqIds);
        (profs || []).forEach((p: any) => (profilesById[p.id] = p));
      }

      const merged: IncomingRow[] = (incoming || []).map((r: any) => ({
        ...r,
        requester: profilesById[r.requester_id] || null,
      }));

      if (!cancelled) {
        setRows(merged);
        setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleDraftBack = async (row: IncomingRow) => {
    if (!row.requester) return;
    setPending(row.id);
    const { error } = await supabase
      .from("friendships")
      .update({ status:"accepted" })
      .eq("id", row.id);
    setPending(null);
    if (error) {
      toast.error("Couldn't draft back. Try again.");
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== row.id));
    const first = row.requester.name?.split("")[0] ||"Member";
    const last = row.requester.name?.split("").slice(-1)[0]?.[0] ||"·";
    const team = row.requester.favorite_la_teams?.[0];
    setCelebration({
      open: true,
      themPhoto: row.requester.profile_photo_url,
      themFirst: first,
      themInitial: last.toUpperCase(),
      upcomingHint: team ? `${team} — this weekend's matchup` : undefined,
    });
  };

  return (
    <div style={{ background: C.bg, color: C.text }} className="min-h-screen">
      <Seo
        title="Incoming Drafts | Club — Loverball"
        description="Members who drafted you. Draft back to open the DM."
        path="/club/drafts"
      />
      <BottomNav />

      <main className="pb-28 md:pb-10">
        <div className="max-w-[440px] md:max-w-2xl mx-auto px-5">
          {/* Top bar */}
          <div className="flex items-center justify-between py-3">
            <button
              onClick={() => navigate("/club")}
              className="p-1.5 -ml-1.5 rounded-full"
              style={{ color: C.text }}
              aria-label="Back to Club"
            >
              <ChevronLeft size={22} />
            </button>
            <span
              className="text-[10px] uppercase font-bold"
              style={{
                fontFamily:"'Poppins', system-ui, sans-serif",
                letterSpacing:"0.28em",
                color: C.muted,
              }}
            >
              Drafts · Incoming
            </span>
            <span style={{ width: 22 }} />
          </div>

          {/* Masthead */}
          <header className="pt-2 pb-5">
            <p
              className="text-[10px] uppercase mb-2"
              style={{
                fontFamily:"'Poppins', system-ui, sans-serif",
                color: C.copper,
                letterSpacing:"0.22em",
              }}
            >
              They picked you
            </p>
            <h1
              className="leading-[0.92] tracking-tight"
              style={{
                fontFamily:"'Oswald', system-ui, sans-serif",
                fontStyle:"italic",
                fontSize: 42,
                color: C.text,
              }}
            >
              On the wire.
            </h1>
            <p
              className="mt-2 text-[12.5px] leading-relaxed"
              style={{ color: C.muted }}
            >
              Members who drafted you this week. Draft back and the DM opens.
            </p>
          </header>

          {loading ? (
            <ul className="space-y-3">
              {[0, 1].map((i) => (
                <li
                  key={i}
                  className="rounded-2xl p-4 animate-pulse"
                  style={{
                    background: C.cardElev,
                    border: `1px solid ${C.border}`,
                    height: 168,
                  }}
                />
              ))}
            </ul>
          ) : rows.length === 0 ? (
            <div
              className="rounded-2xl px-6 py-10 text-center"
              style={{
                background: C.cardElev,
                border: `1px solid ${C.border}`,
              }}
            >
              <p
                className="text-[10px] uppercase mb-3"
                style={{
                  fontFamily:"'Poppins', system-ui, sans-serif",
                  color: C.copper,
                  letterSpacing:"0.22em",
                }}
              >
                Quiet wire
              </p>
              <h3
                style={{
                  fontFamily:"'Oswald', system-ui, sans-serif",
                  fontStyle:"italic",
                  fontSize: 26,
                  color: C.text,
                  lineHeight: 1.05,
                }}
              >
                No drafts yet
                <br />
                this week.
              </h3>
              <p
                className="mt-3 text-[12.5px]"
                style={{ color: C.muted, lineHeight: 1.5 }}
              >
                Keep showing up — your people will find you.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {rows.map((r) => {
                const first = r.requester?.name?.split("")[0] ||"Member";
                const bits: string[] = [];
                if (r.requester?.favorite_la_teams?.[0])
                  bits.push(r.requester.favorite_la_teams[0]);
                if (r.requester?.city) bits.push(r.requester.city);
                const shared = (r.mutual_teams || [])[0];
                const tail = shared
                  ? `You both ride for ${shared}.`
                  :"Your scenes overlap.";
                const context = `${bits.join(" ·")}${bits.length ?" ·" :""}${tail}`;
                return (
                  <li key={r.id}>
                    <IncomingDraftCard
                      firstName={first}
                      context={context}
                      timeLabel={timeAgo(r.created_at)}
                      pending={pending === r.id}
                      onDraftBack={() => handleDraftBack(r)}
                      onViewProfile={() =>
                        r.requester && navigate(`/members/${r.requester.id}`)
                      }
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>

      <MutualDraftCelebration
        open={celebration.open}
        myPhotoUrl={me?.photo}
        themPhotoUrl={celebration.themPhoto}
        themFirstName={celebration.themFirst}
        myInitial={me?.initial}
        themInitial={celebration.themInitial}
        upcomingHint={celebration.upcomingHint}
        onClose={() => setCelebration((s) => ({ ...s, open: false }))}
        onSayHi={() => navigate("/inbox")}
      />
    </div>
  );
};

export default ClubDrafts;
