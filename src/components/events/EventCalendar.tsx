import { useMemo, useState } from "react";
import { addMonths, format, isSameDay, startOfMonth } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { parseEventDate } from "@/lib/eventDate";
import EventCard, { type EventCardData } from "./EventCard";
import type { ViewerLike } from "@/lib/distance";

interface Props {
  events: EventCardData[];
  viewer: ViewerLike | null;
  badgesFor: (e: EventCardData) => string[];
  onChanged?: () => void;
}

/**
 * Mobile-first agenda calendar.
 * - Month nav at top
 * - Horizontal date strip with dots for days that have events
 * - Selected date shows that day's events; "All days" shows a date-grouped agenda
 */
export default function EventCalendar({ events, viewer, badgesFor, onChanged }: Props) {
  const today = useMemo(() => new Date(), []);
  const [monthAnchor, setMonthAnchor] = useState<Date>(startOfMonth(today));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Build map: dateKey (yyyy-MM-dd) -> events
  const byDate = useMemo(() => {
    const m = new Map<string, EventCardData[]>();
    for (const e of events) {
      const d = parseEventDate(e.event_date);
      const key = format(d, "yyyy-MM-dd");
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(e);
    }
    return m;
  }, [events]);

  // Date strip: show 14 days starting from max(today, monthAnchor first)
  const stripDays = useMemo(() => {
    const start =
      monthAnchor.getMonth() === today.getMonth() && monthAnchor.getFullYear() === today.getFullYear()
        ? today
        : monthAnchor;
    return Array.from({ length: 14 }).map((_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [monthAnchor, today]);

  const selectedKey = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null;
  const selectedEvents = selectedKey ? byDate.get(selectedKey) ?? [] : [];

  // Agenda when no day is picked: all upcoming events grouped by date
  const agenda = useMemo(() => {
    return Array.from(byDate.entries())
      .sort((a, b) => a[0].localeCompare(b[0]));
  }, [byDate]);

  return (
    <div className="space-y-5">
      {/* Month nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setMonthAnchor((m) => addMonths(m, -1))}
          aria-label="Previous month"
          className="w-9 h-9 rounded-full border border-[#E8E3DC] bg-white flex items-center justify-center hover:bg-[#FAF5E9] transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-[#1A1A1A]" />
        </button>
        <div
          style={{
            fontFamily: "'Anton', Impact, sans-serif",
            fontSize: 22,
            letterSpacing: "0.02em",
            textTransform: "uppercase",
            color: "#1A1A1A",
          }}
        >
          {format(monthAnchor, "MMMM yyyy")}
        </div>
        <button
          onClick={() => setMonthAnchor((m) => addMonths(m, 1))}
          aria-label="Next month"
          className="w-9 h-9 rounded-full border border-[#E8E3DC] bg-white flex items-center justify-center hover:bg-[#FAF5E9] transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-[#1A1A1A]" />
        </button>
      </div>

      {/* Date strip */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-5 px-5 pb-1">
        {selectedDate && (
          <button
            onClick={() => setSelectedDate(null)}
            className="shrink-0 px-3 h-[68px] rounded-2xl border border-[#E8E3DC] bg-white text-xs font-['Inter'] text-[#1A1A1A]/70 hover:bg-[#FAF5E9] transition-colors"
            style={{ fontFamily: "'Space Mono', ui-monospace, monospace", letterSpacing: "0.1em", textTransform: "uppercase" }}
          >
            All<br/>days
          </button>
        )}
        {stripDays.map((d) => {
          const key = format(d, "yyyy-MM-dd");
          const has = byDate.has(key);
          const isToday = isSameDay(d, today);
          const isSelected = selectedDate ? isSameDay(d, selectedDate) : false;
          return (
            <button
              key={key}
              onClick={() => setSelectedDate(isSelected ? null : d)}
              aria-pressed={isSelected}
              className="shrink-0 w-14 h-[68px] rounded-2xl flex flex-col items-center justify-center transition-all border"
              style={{
                background: isSelected ? "#1A1A1A" : has ? "#FFFFFF" : "transparent",
                color: isSelected ? "#FAF7F2" : "#1A1A1A",
                borderColor: isSelected ? "#1A1A1A" : has ? "#E8E3DC" : "transparent",
                opacity: has || isSelected ? 1 : 0.45,
              }}
            >
              <span
                style={{
                  fontFamily: "'Space Mono', ui-monospace, monospace",
                  fontSize: 10,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  opacity: 0.7,
                }}
              >
                {format(d, "EEE")}
              </span>
              <span
                style={{
                  fontFamily: "'Anton', Impact, sans-serif",
                  fontSize: 22,
                  lineHeight: 1,
                  marginTop: 2,
                }}
              >
                {format(d, "d")}
              </span>
              <span
                className="mt-1 w-1.5 h-1.5 rounded-full"
                style={{
                  background: has ? (isSelected ? "#FAF7F2" : "#E85D2F") : "transparent",
                }}
              />
              {isToday && !isSelected && (
                <span className="absolute sr-only">Today</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Body */}
      {selectedDate ? (
        <section>
          <div className="flex items-baseline gap-3 mb-3 pb-2 border-b border-[#1A1A1A]/10">
            <div style={{ fontFamily: "'Anton', Impact, sans-serif", fontSize: 28, lineHeight: 1, color: "#E85D2F" }}>
              {format(selectedDate, "d")}
            </div>
            <div
              style={{
                fontFamily: "'Space Mono', ui-monospace, monospace",
                fontSize: 11,
                letterSpacing: "0.22em",
                textTransform: "uppercase",
                color: "#1A1A1A",
              }}
            >
              {format(selectedDate, "EEEE · MMM yyyy")}
            </div>
          </div>
          {selectedEvents.length === 0 ? (
            <p className="font-['Playfair_Display'] italic text-[#1A1A1A]/55 py-6">
              Nothing on the books for this day. Yet.
            </p>
          ) : (
            <div className="space-y-3">
              {selectedEvents.map((c) => (
                <EventCard
                  key={c.id}
                  event={c}
                  viewer={viewer}
                  badges={badgesFor(c)}
                  onChanged={onChanged}
                />
              ))}
            </div>
          )}
        </section>
      ) : (
        <div className="space-y-6">
          {agenda.map(([dateKey, items]) => {
            const d = parseEventDate(dateKey);
            return (
              <section key={dateKey}>
                <div className="flex items-baseline gap-3 mb-3 pb-2 border-b border-[#1A1A1A]/10">
                  <div style={{ fontFamily: "'Anton', Impact, sans-serif", fontSize: 28, lineHeight: 1, color: "#E85D2F" }}>
                    {format(d, "d")}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Space Mono', ui-monospace, monospace",
                      fontSize: 11,
                      letterSpacing: "0.22em",
                      textTransform: "uppercase",
                      color: "#1A1A1A",
                    }}
                  >
                    {format(d, "EEE · MMM yyyy")}
                  </div>
                </div>
                <div className="space-y-3">
                  {items.map((c) => (
                    <EventCard
                      key={c.id}
                      event={c}
                      viewer={viewer}
                      badges={badgesFor(c)}
                      onChanged={onChanged}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
