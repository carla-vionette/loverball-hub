import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Calendar, Tv, MapPin, Check, Loader2, Radio, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

/**
 * Card for synthetic game-feed entries (from sports-scoreboard edge function).
 * These games don't exist in the events table, so RSVPs persist to localStorage
 * keyed by external game id. Going is only offered for HOME games (in-town);
 * away games offer Watch only.
 */

export interface FeedGame {
  id: string;                          // ESPN external id
  sport: string;
  sportLabel: string;
  status: "live" | "final" | "scheduled";
  statusDetail: string;
  startTime: string;
  venue?: string;
  broadcast?: string;
  homeTeam: { name: string; abbreviation: string; score: string; logo: string; isLocal: boolean };
  awayTeam: { name: string; abbreviation: string; score: string; logo: string; isLocal: boolean };
  homeIsLocal: boolean;
}

type Mode = "going" | "watching" | null;

const STORAGE_KEY = "lb:game-rsvp:v1";

function readAll(): Record<string, Mode> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, Mode>;
  } catch {
    return {};
  }
}

function writeMode(id: string, mode: Mode) {
  const all = readAll();
  if (mode === null) delete all[id];
  else all[id] = mode;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(all)); } catch { /* noop */ }
}

const RASPBERRY = "#E85D2F";
const INK = "#1A1A1A";

export default function GameFeedCard({ game }: { game: FeedGame }) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>(() => readAll()[game.id] ?? null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setMode(readAll()[game.id] ?? null);
  }, [game.id]);

  const setRsvp = (next: Mode) => {
    setPending(true);
    const finalNext = mode === next ? null : next;
    writeMode(game.id, finalNext);
    setMode(finalNext);
    setPending(false);
    if (finalNext === "going") toast({ title: "You're going 🏟️" });
    else if (finalNext === "watching") toast({ title: "Watching this one 📺" });
    else toast({ title: "RSVP cleared" });
  };

  const openExternal = (e: React.MouseEvent) => {
    e.stopPropagation();
    const q = encodeURIComponent(`${game.awayTeam.name} vs ${game.homeTeam.name}`);
    window.open(`https://www.espn.com/search/_/q/${q}`, "_blank", "noopener,noreferrer");
  };

  const date = game.startTime ? new Date(game.startTime) : null;
  const dateLabel = date && !Number.isNaN(date.getTime()) ? format(date, "EEE, MMM d") : "TBD";
  const timeLabel = date && !Number.isNaN(date.getTime()) ? format(date, "h:mm a") : "";

  const localTeamName =
    (game.homeTeam.isLocal ? game.homeTeam.name : game.awayTeam.isLocal ? game.awayTeam.name : null) ||
    (game.homeIsLocal ? game.homeTeam.name : game.awayTeam.name);
  const oppTeamName = game.homeTeam.isLocal ? game.awayTeam.name : game.homeTeam.name;
  const homeAwayLabel = game.homeIsLocal ? "Home" : "Away";

  const buttonBase =
    "px-4 py-1.5 rounded-full text-[11px] uppercase tracking-[0.16em] font-['Space_Mono',ui-monospace,monospace] inline-flex items-center gap-1.5 transition-colors disabled:opacity-50";

  return (
    <article
      onClick={openExternal}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter") openExternal(e as any); }}
      className="group relative bg-[#FAF5E9] rounded-2xl overflow-hidden border border-black/5 hover:border-black/20 transition-all cursor-pointer flex"
    >
      <div className="w-1 flex-shrink-0" style={{ background: RASPBERRY }} />
      <div className="flex-1 min-w-0 p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <span
              className="inline-block mb-1.5"
              style={{
                fontFamily: "'Space Mono', ui-monospace, monospace",
                fontSize: 11,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: RASPBERRY,
              }}
            >
              {game.sportLabel} · {homeAwayLabel}
              {game.status === "live" && (
                <span className="ml-2 inline-flex items-center gap-1 text-[#E85D2F]">
                  <Radio className="w-3 h-3 animate-pulse" /> LIVE
                </span>
              )}
            </span>
            <h3
              className="text-[#1A1A1A]"
              style={{
                fontFamily: "'Anton', Impact, sans-serif",
                fontWeight: 400,
                fontSize: "clamp(20px, 2.6vw, 26px)",
                lineHeight: 0.95,
                letterSpacing: "-0.01em",
                textTransform: "uppercase",
              }}
            >
              {localTeamName} {game.homeIsLocal ? "vs" : "@"} {oppTeamName}
            </h3>
          </div>
          <ExternalLink className="w-4 h-4 text-[#1A1A1A]/40 mt-1" />
        </div>

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-['Inter'] text-[#1A1A1A]/60">
          <span className="inline-flex items-center gap-1">
            <Calendar className="w-3 h-3" /> {dateLabel}{timeLabel ? ` · ${timeLabel}` : ""}
          </span>
          {game.venue && (
            <span className="inline-flex items-center gap-1 truncate max-w-[180px]">
              <MapPin className="w-3 h-3" /> {game.venue}
            </span>
          )}
          {game.broadcast && (
            <span className="inline-flex items-center gap-1 text-[#1A1A1A]/50">
              <Tv className="w-3 h-3" /> {game.broadcast}
            </span>
          )}
          {game.status !== "scheduled" && game.statusDetail && (
            <span className="font-mono text-[#1A1A1A]/50">
              {game.awayTeam.abbreviation} {game.awayTeam.score} — {game.homeTeam.score} {game.homeTeam.abbreviation}
            </span>
          )}
        </div>

        <div className="pt-1" onClick={(e) => e.stopPropagation()}>
          <div className="flex flex-wrap items-center gap-2">
            {game.homeIsLocal && (
              <button
                type="button"
                disabled={pending}
                onClick={() => setRsvp("going")}
                className={buttonBase}
                style={
                  mode === "going"
                    ? { background: RASPBERRY, color: "#fff" }
                    : { background: "transparent", color: INK, border: `1.5px solid ${RASPBERRY}` }
                }
                aria-pressed={mode === "going"}
              >
                {pending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : mode === "going" ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <MapPin className="w-3.5 h-3.5" />
                )}
                Going
              </button>
            )}

            <button
              type="button"
              disabled={pending}
              onClick={() => setRsvp("watching")}
              className={buttonBase}
              style={
                mode === "watching"
                  ? { background: INK, color: "#fff" }
                  : { background: "transparent", color: INK, border: `1.5px solid ${INK}` }
              }
              aria-pressed={mode === "watching"}
            >
              {pending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : mode === "watching" ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Tv className="w-3.5 h-3.5" />
              )}
              Watch
            </button>

            {!game.homeIsLocal && (
              <span className="text-[11px] text-[#1A1A1A]/50 font-['Inter']">
                Away game — watch with fans
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
