// Shared helpers for the /stats page. Dates are IST calendar-day keys (`YYYY-MM-DD`) --
// the same key /stats/reports/daily buckets by -- so a day on the axis and a day in the
// API can never disagree about where midnight falls.

const DAY_MS = 24 * 60 * 60 * 1000;
const IST_OFFSET_MS = 330 * 60 * 1000;

export const MONTH_SHORT = ["जन", "फर", "मार", "अप्र", "मई", "जून", "जुल", "अग", "सित", "अक्ट", "नव", "दिस"];
export const WEEKDAY_SHORT = ["रवि", "सोम", "मंगल", "बुध", "गुरु", "शुक्र", "शनि"];

/** URL-state plumbing shared by StatsView and the tabs it hosts. */
export interface ParamReader {
  get(name: string): string | null;
}
export type UpdateParams = (patch: Record<string, string | undefined>) => void;

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

/** A real `YYYY-MM-DD` from untrusted input (the URL), or `fallback`. */
export function dayKeyOr(value: string | null, fallback: string): string {
  if (value === null || !DAY_KEY.test(value)) return fallback;
  const t = Date.parse(`${value}T00:00:00.000Z`);
  return !Number.isNaN(t) && new Date(t).toISOString().slice(0, 10) === value ? value : fallback;
}

export function todayIst(): string {
  return new Date(Date.now() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

export function shiftDay(key: string, days: number): string {
  return new Date(Date.parse(`${key}T00:00:00.000Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

/** Number of calendar days from `from` to `to`, both included. */
export function daysInclusive(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00.000Z`) - Date.parse(`${from}T00:00:00.000Z`)) / DAY_MS) + 1;
}

function parts(key: string): { y: number; m: number; d: number } {
  const [y = 0, m = 1, d = 1] = key.split("-").map(Number);
  return { y, m, d };
}

/** "5 सित" */
export function formatDayShort(key: string): string {
  const { m, d } = parts(key);
  return `${d} ${MONTH_SHORT[m - 1] ?? ""}`;
}

/** "5 सित 2026" */
export function formatDayLong(key: string): string {
  const { y } = parts(key);
  return `${formatDayShort(key)} ${y}`;
}

export function weekdayOf(key: string): string {
  return WEEKDAY_SHORT[new Date(`${key}T00:00:00.000Z`).getUTCDay()] ?? "";
}

/** Indian digit grouping (1,23,456) -- what the register's readers expect. */
export function formatCount(n: number): string {
  return n.toLocaleString("en-IN");
}

/** One decimal, dropping a trailing ".0". */
export function formatAvg(n: number): string {
  return n.toLocaleString("en-IN", { maximumFractionDigits: 1 });
}

/** A bar from `base` up to `y`: square at the baseline, `radius`-rounded at the data end
 *  (pass `round = false` for a segment buried inside a stack). */
export function barPath(x: number, y: number, w: number, base: number, round = true, radius = 4): string {
  const r = round ? Math.min(radius, w / 2, base - y) : 0;
  return `M${x},${base} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${base} Z`;
}

/** Round axis: integer ticks from 0 up to a clean top that covers `rawMax`. */
export function niceScale(rawMax: number, targetTicks = 4): { max: number; ticks: number[] } {
  const max = Math.max(rawMax, 1);
  const rough = max / targetTicks;
  const pow = 10 ** Math.floor(Math.log10(rough));
  const f = rough / pow;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
  const step = Math.max(1, nice * pow);
  const top = step * Math.ceil(max / step);
  const ticks: number[] = [];
  for (let v = 0; v <= top; v += step) ticks.push(v);
  return { max: top, ticks };
}
