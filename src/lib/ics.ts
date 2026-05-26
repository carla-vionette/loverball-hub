// Lightweight client-side ICS (iCalendar) generator for "Add to Calendar"
// No deps. Builds a single VEVENT and triggers a download.

interface ICSInput {
  title: string;
  description?: string;
  location?: string;
  url?: string;
  // ISO date (YYYY-MM-DD) and optional HH:MM (24h). If no time given, all-day.
  date: string;
  time?: string | null;
  endTime?: string | null;
  uid?: string;
}

function pad(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

function formatICSDate(d: Date, allDay = false) {
  if (allDay) {
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;
  }
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T` +
    `${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
}

function escapeText(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export function buildICS({ title, description, location, url, date, time, endTime, uid }: ICSInput): string {
  const allDay = !time;
  const start = allDay
    ? new Date(`${date}T00:00:00Z`)
    : new Date(`${date}T${time}:00`);
  const end = endTime
    ? new Date(`${date}T${endTime}:00`)
    : new Date(start.getTime() + (allDay ? 24 * 60 * 60 * 1000 : 2 * 60 * 60 * 1000));

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Loverball//Events//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid || `${Date.now()}@loverball`}`,
    `DTSTAMP:${formatICSDate(new Date())}`,
    allDay
      ? `DTSTART;VALUE=DATE:${formatICSDate(start, true)}`
      : `DTSTART:${formatICSDate(start)}`,
    allDay
      ? `DTEND;VALUE=DATE:${formatICSDate(end, true)}`
      : `DTEND:${formatICSDate(end)}`,
    `SUMMARY:${escapeText(title)}`,
    description ? `DESCRIPTION:${escapeText(description)}` : "",
    location ? `LOCATION:${escapeText(location)}` : "",
    url ? `URL:${url}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  return lines.join("\r\n");
}

export function downloadICS(input: ICSInput) {
  const ics = buildICS(input);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${input.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
