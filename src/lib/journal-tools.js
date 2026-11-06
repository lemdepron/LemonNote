/** Date formats, period notes and ready-made journal templates for the Journal tab. */
import { dateKey, parseKey, shiftDay } from "@/lib/journal";

const pad = (n) => String(n).padStart(2, "0");

/** ISO-8601 week: Thursday decides the year. Returns "2026-W45". */
export function weekKey(date = new Date()) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${pad(week)}`;
}

export const monthKey = (date = new Date()) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
export const yearKey = (date = new Date()) => String(date.getFullYear());

export function dayOfYear(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date - start) / 86400000);
}

export const DATE_FORMATS = [
  { id: "iso", label: "2026-11-06", make: (d) => dateKey(d) },
  { id: "long", label: "Friday, 6 November 2026", make: (d) => d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" }) },
  { id: "medium", label: "6 Nov 2026", make: (d) => d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) },
  { id: "us", label: "11/06/2026", make: (d) => `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}` },
  { id: "eu", label: "06/11/2026", make: (d) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}` },
  { id: "weekday", label: "Weekday name", make: (d) => d.toLocaleDateString(undefined, { weekday: "long" }) },
  { id: "month", label: "Month name", make: (d) => d.toLocaleDateString(undefined, { month: "long", year: "numeric" }) },
  { id: "time24", label: "Time 24 h", make: (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}` },
  { id: "time12", label: "Time 12 h", make: (d) => d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit", hour12: true }) },
  { id: "datetime", label: "Date and time", make: (d) => `${dateKey(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}` },
  { id: "week", label: "Week number", make: (d) => weekKey(d) },
  { id: "doy", label: "Day of the year", make: (d) => `Day ${dayOfYear(d)}` },
  { id: "quarter", label: "Quarter", make: (d) => `Q${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()}` },
  { id: "unix", label: "Unix timestamp", make: (d) => String(Math.floor(d.getTime() / 1000)) },
];

export const isWeekTitle = (title = "") => /^\d{4}-W\d{2}$/.test(String(title).trim());
export const isMonthTitle = (title = "") => /^\d{4}-\d{2}$/.test(String(title).trim());

/** Mondays of ISO week "YYYY-Www" → list of 7 day keys. */
export function daysOfWeek(key) {
  const [year, week] = key.split("-W").map(Number);
  const jan4 = new Date(year, 0, 4, 12);
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - ((jan4.getDay() || 7) - 1) + (week - 1) * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return dateKey(d);
  });
}

/** The day, week or month before/after the title of the open note. */
export function neighbourTitle(title, direction) {
  const t = String(title).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return shiftDay(t, direction);
  if (isWeekTitle(t)) {
    const first = parseKey(daysOfWeek(t)[0]);
    first.setDate(first.getDate() + 7 * direction);
    return weekKey(first);
  }
  if (isMonthTitle(t)) {
    const [y, m] = t.split("-").map(Number);
    return monthKey(new Date(y, m - 1 + direction, 1, 12));
  }
  return null;
}

const wikiDays = (key) => daysOfWeek(key).map((day) => `- [[${day}]]`).join("\n");

export const JOURNAL_TEMPLATES = [
  {
    id: "morning",
    label: "Morning plan",
    text: "## Morning plan\n\n**Top 3 for today**\n\n- [ ] \n- [ ] \n- [ ] \n\n**Energy (1–5):** \n\n**One thing I will not do:** \n",
  },
  {
    id: "evening",
    label: "Evening reflection",
    text: "## Evening reflection\n\n- What went well: \n- What did not: \n- What I learned: \n- Tomorrow's first step: \n",
  },
  {
    id: "gratitude",
    label: "Gratitude (3 things)",
    text: "## Grateful for\n\n1. \n2. \n3. \n",
  },
  {
    id: "mood",
    label: "Mood and sleep log",
    text: "| Time | Mood (1–5) | Energy (1–5) | Note |\n| --- | --- | --- | --- |\n|   |   |   |   |\n",
  },
  {
    id: "habits",
    label: "Weekly habit tracker",
    text: "| Habit | Mon | Tue | Wed | Thu | Fri | Sat | Sun |\n| --- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |\n|   |   |   |   |   |   |   |   |\n|   |   |   |   |   |   |   |   |\n|   |   |   |   |   |   |   |   |\n",
  },
  {
    id: "meeting",
    label: "Meeting notes",
    text: "## Meeting: \n\n**Date:** \n**Who:** \n\n### Agenda\n\n- \n\n### Decisions\n\n- \n\n### Action items\n\n- [ ] \n",
  },
  {
    id: "goals",
    label: "Goals and key results",
    text: "## Goal\n\n**Why it matters:** \n\n| Key result | Target | Now |\n| --- | --- | --- |\n|   |   |   |\n\n### Next actions\n\n- [ ] \n",
  },
  {
    id: "review",
    label: "Review prompts",
    text: "## Review\n\n- Wins: \n- Misses: \n- Patterns I notice: \n- Change for next period: \n",
  },
];

/** Notes created from the "Weekly note" / "Monthly note" buttons. */
export function weeklyTemplate(key) {
  return `## Week ${key}\n\n### Days\n\n${wikiDays(key)}\n\n### Focus\n\n- [ ] \n- [ ] \n- [ ] \n\n### Review\n\n- Wins: \n- Misses: \n- Next week: \n`;
}

export function monthlyTemplate(key) {
  return `## ${key}\n\n### Goals\n\n- [ ] \n- [ ] \n\n### Highlights\n\n- \n\n### Review\n\n- Wins: \n- Misses: \n- Next month: \n`;
}
