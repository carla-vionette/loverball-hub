import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Tv, ChevronDown, ChevronUp, Users, Sparkles } from "lucide-react";
import { useGoingGraph, type AttendeeLite, type WatchPartyGroup } from "@/hooks/useGoingGraph";
import AttendeeProfileDrawer from "@/components/AttendeeProfileDrawer";
import { formatMiles } from "@/lib/distance";

interface Props {
  eventId: string;
  viewer: { lat: number | null; lng: number | null } | null;
  refreshKey?: number;
}

const RASPBERRY = "#E85D2F";
const TEAL = "#1A1A1A";

const SLUG_STYLE: React.CSSProperties = {
  fontFamily: "'Space Mono', ui-monospace, monospace",
  fontSize: 11,
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  color: "#E85D2F",
};

function AvatarChip({ a, onClick }: { a: AttendeeLite; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 group min-w-0"
      aria-label={`View ${a.name}'s profile`}
    >
      {a.profile_photo_url ? (
        <img
          src={a.profile_photo_url}
          alt={a.name}
          className="w-12 h-12 rounded-full object-cover border-2 border-white shadow group-hover:scale-105 transition-transform"
        />
      ) : (
        <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-br from-[#E8185A] to-[#00B8A9] text-white font-semibold font-['Inter'] border-2 border-white shadow group-hover:scale-105 transition-transform">
          {a.name?.[0]?.toUpperCase() || "?"}
        </div>
      )}
      <span className="text-[10px] font-['Inter'] text-[#1A1A1A]/70 truncate max-w-[64px]">
        {a.name?.split(" ")[0]}
      </span>
    </button>
  );
}

function AvatarStack({ atts, max = 5 }: { atts: AttendeeLite[]; max?: number }) {
  const slice = atts.slice(0, max);
  const extra = Math.max(0, atts.length - max);
  return (
    <div className="flex -space-x-2">
      {slice.map((a) => (
        <div key={a.id}>
          {a.profile_photo_url ? (
            <img
              src={a.profile_photo_url}
              alt={a.name}
              className="w-8 h-8 rounded-full object-cover border-2 border-white"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#E8185A] to-[#00B8A9] border-2 border-white flex items-center justify-center text-white text-[10px] font-semibold">
              {a.name?.[0]?.toUpperCase() || "?"}
            </div>
          )}
        </div>
      ))}
      {extra > 0 && (
        <div className="w-8 h-8 rounded-full bg-[#1A1A1A] border-2 border-white flex items-center justify-center text-white text-[10px] font-semibold">
          +{extra}
        </div>
      )}
    </div>
  );
}

function ProfileForDrawer(a: AttendeeLite) {
  return {
    id: a.id,
    name: a.name,
    profile_photo_url: a.profile_photo_url,
    bio: null as string | null,
    favorite_sports: null,
    primary_role: null,
    city: (a as { city?: string | null }).city ?? null,
  };
}

export default function GoingGraph({ eventId, viewer, refreshKey = 0 }: Props) {
  const { data, loading } = useGoingGraph(eventId, viewer, refreshKey);
  const [expanded, setExpanded] = useState(false);
  const [profileSel, setProfileSel] = useState<AttendeeLite | null>(null);

  const stadium = data.stadium.attendees;
  const groups: WatchPartyGroup[] = data.watch_parties.groups;
  const visibleGroups = expanded ? groups : groups.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Stadium section */}
      <section>
        <header className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} color={RASPBERRY} />
            <span style={SLUG_STYLE}>At The Venue</span>
            <span className="text-xs font-['Space_Mono',ui-monospace,monospace] text-[#1A1A1A]/50">
              · {data.stadium.total}
            </span>
          </div>
        </header>
        {loading ? (
          <div className="flex gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="w-12 h-12 rounded-full bg-black/5 animate-pulse" />
            ))}
          </div>
        ) : stadium.length === 0 ? (
          <p className="text-sm font-['Playfair_Display'] italic text-[#1A1A1A]/50">
            No one has RSVP'd to the venue yet — be the first.
          </p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {stadium.map((a) => (
              <AvatarChip key={a.id} a={a} onClick={() => setProfileSel(a)} />
            ))}
          </div>
        )}
      </section>

      {/* Watch parties section */}
      <section>
        <header className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} color={RASPBERRY} />
            <span style={SLUG_STYLE}>Watch Parties</span>
            <span className="text-xs font-['Space_Mono',ui-monospace,monospace] text-[#1A1A1A]/50">
              · {data.watch_parties.total}
            </span>
          </div>
        </header>
        {loading ? (
          <div className="space-y-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-20 rounded-2xl bg-black/5 animate-pulse" />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <p className="text-sm font-['Playfair_Display'] italic text-[#1A1A1A]/50">
            No watch parties yet. RSVP as Watching to start one.
          </p>
        ) : (
          <div className="space-y-2">
            {visibleGroups.map((g) => (
              <div
                key={g.watch_location_id ?? g.bar_name ?? "unknown"}
                className="p-4 rounded-2xl bg-white border border-black/5"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <div className="font-['Inter'] font-semibold text-[#1A1A1A] truncate">
                      {g.bar_name || "Watching from home"}
                    </div>
                    <div className="text-xs text-[#1A1A1A]/60 truncate">
                      {[g.neighborhood, g.city].filter(Boolean).join(" · ") ||
                        "Location not set"}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs font-mono text-[#1A1A1A]/50">
                      {g.distance_mi != null ? formatMiles(g.distance_mi) : ""}
                    </div>
                    <div className="text-xs font-['Inter'] text-[#1A1A1A]/60 inline-flex items-center gap-1">
                      <Users className="w-3 h-3" /> {g.attendee_count}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <AvatarStack atts={g.attendees} />
                  <button
                    onClick={() => g.attendees[0] && setProfileSel(g.attendees[0])}
                    className="text-xs font-['Inter'] text-[#00B8A9] font-semibold hover:underline"
                  >
                    See who
                  </button>
                </div>
              </div>
            ))}
            {groups.length > 3 && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="w-full text-xs font-['Inter'] font-semibold text-[#1A1A1A]/60 hover:text-[#1A1A1A] inline-flex items-center justify-center gap-1 py-2"
              >
                {expanded ? (
                  <>
                    Show less <ChevronUp className="w-3 h-3" />
                  </>
                ) : (
                  <>
                    More watch parties ({groups.length - 3}) <ChevronDown className="w-3 h-3" />
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </section>

      <AttendeeProfileDrawer
        profile={profileSel ? ProfileForDrawer(profileSel) : null}
        open={!!profileSel}
        onOpenChange={(o) => !o && setProfileSel(null)}
      />
    </div>
  );
}
