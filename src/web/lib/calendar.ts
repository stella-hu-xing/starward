/** Pure date/calendar helpers for the journal view.
 *
 * Day keys are local dates (YYYY-MM-DD) derived from UTC timestamps using an
 * explicit IANA timezone, matching the report-boundary rules in
 * agents/ARCHITECTURE.md. No date library: all calendar math uses UTC arithmetic
 * so DST shifts cannot misalign the grid, and timezone conversions go through
 * Intl.DateTimeFormat with an explicit timezone.
 */

import type { Conversation, DayConversationEntry, Message } from '../types';

// TODO(M0): confirm the owner's IANA timezone; this is the legacy scaffold default.
export const JOURNAL_TIMEZONE = 'Australia/Melbourne';

export interface CalendarDay {
  /** Local day key, YYYY-MM-DD. */
  key: string;
  year: number;
  /** 1-12. */
  month: number;
  /** 1-31. */
  day: number;
  /** 1 (Monday) .. 7 (Sunday). */
  isoWeekday: number;
  /** True when the day belongs to the grid's focal month. */
  inMonth: boolean;
}

export function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

export function dayKey(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

/** Parse a YYYY-MM-DD key into its numeric parts; throws on malformed keys. */
export function parseDayKey(key: string): { year: number; month: number; day: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) {
    throw new Error(`Invalid day key: ${key}`);
  }
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

/** Number of days in a month, using UTC arithmetic (DST-safe). */
export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

const ISO_WEEKDAY_OF_UTC_DAY = [7, 1, 2, 3, 4, 5, 6]; // JS getUTCDay() Sunday=0 -> ISO Sunday=7

function isoWeekdayOf(year: number, month: number, day: number): number {
  return ISO_WEEKDAY_OF_UTC_DAY[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
}

/** Shift a year/month pair by a month delta, rolling over years. */
export function addMonths(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const zeroBased = year * 12 + (month - 1) + delta;
  return { year: Math.floor(zeroBased / 12), month: (zeroBased % 12) + 1 };
}

/** Monday-first grid of weeks covering the given month (4, 5, or 6 rows). */
export function buildMonthGrid(year: number, month: number): CalendarDay[] {
  const total = daysInMonth(year, month);
  const leading = isoWeekdayOf(year, month, 1) - 1; // Days before the 1st, in the prior month.
  const start = new Date(Date.UTC(year, month - 1, 1 - leading));
  const cells: CalendarDay[] = [];
  const weeks = Math.ceil((leading + total) / 7);
  for (let index = 0; index < weeks * 7; index += 1) {
    const cursor = new Date(start.getTime() + index * 86_400_000); // UTC day math; no DST drift.
    const cellYear = cursor.getUTCFullYear();
    const cellMonth = cursor.getUTCMonth() + 1;
    const cellDay = cursor.getUTCDate();
    cells.push({
      key: dayKey(cellYear, cellMonth, cellDay),
      year: cellYear,
      month: cellMonth,
      day: cellDay,
      isoWeekday: (index % 7) + 1,
      inMonth: cellYear === year && cellMonth === month,
    });
  }
  return cells;
}

/** Local day key (YYYY-MM-DD) of a UTC ISO timestamp in the given IANA timezone. */
export function localDayKey(utcIso: string, timeZone: string = JOURNAL_TIMEZONE): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(utcIso));
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return `${value('year')}-${value('month')}-${value('day')}`;
}

/** Local day key for "now" in the given IANA timezone. */
export function todayDayKey(timeZone: string = JOURNAL_TIMEZONE): string {
  return localDayKey(new Date().toISOString(), timeZone);
}

/** Day key of the day before the given key, using UTC arithmetic. */
export function previousDayKey(key: string): string {
  const { year, month, day } = parseDayKey(key);
  const cursor = new Date(Date.UTC(year, month - 1, day - 1));
  return dayKey(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, cursor.getUTCDate());
}

/** Local HH:MM label (24h) for a UTC timestamp in the given timezone. */
export function formatDayTime(utcIso: string, timeZone: string = JOURNAL_TIMEZONE): string {
  return new Intl.DateTimeFormat('en-AU', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(utcIso));
}

/** Long, human heading for a day key, e.g. "Sunday, 15 November 2026". */
export function formatDayHeading(key: string): string {
  const { year, month, day } = parseDayKey(key);
  return new Intl.DateTimeFormat('en-AU', {
    timeZone: 'UTC',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

/** Short date label for a day key, e.g. "15 Nov". */
export function formatShortDate(key: string): string {
  const { year, month, day } = parseDayKey(key);
  return new Intl.DateTimeFormat('en-AU', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'short',
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

/** Sidebar-friendly label for a conversation's last activity, e.g. "Today 14:32". */
export function formatConversationTimestamp(
  utcIso: string,
  timeZone: string = JOURNAL_TIMEZONE,
): string {
  const key = localDayKey(utcIso, timeZone);
  const today = todayDayKey(timeZone);
  const time = formatDayTime(utcIso, timeZone);
  if (key === today) {
    return `Today ${time}`;
  }
  if (key === previousDayKey(today)) {
    return `Yesterday ${time}`;
  }
  return formatShortDate(key);
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export const WEEKDAY_SHORT_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function monthLabel(year: number, month: number): string {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

/** Group conversations by local day, with per-day message counts.
 *
 * Follows the report rules in agents/DATA_MODEL.md: unfinished assistant
 * attempts (pending/streaming/interrupted/failed) are excluded from day counts.
 * Days without chats are absent from the index. A day can hold entries from
 * multiple conversations.
 */
export function buildDayIndex(
  conversations: Conversation[],
  messagesByConversation: Record<string, Message[]>,
  timeZone: string = JOURNAL_TIMEZONE,
): Map<string, DayConversationEntry[]> {
  const index = new Map<string, DayConversationEntry[]>();
  for (const conversation of conversations) {
    const byDay = new Map<string, Message[]>();
    for (const message of messagesByConversation[conversation.id] ?? []) {
      if (message.role === 'assistant' && message.status !== 'complete') {
        continue;
      }
      const key = localDayKey(message.createdAt, timeZone);
      const list = byDay.get(key) ?? [];
      list.push(message);
      byDay.set(key, list);
    }
    for (const [key, list] of byDay) {
      const sorted = [...list].sort((a, b) => a.sequence - b.sequence);
      const entries = index.get(key) ?? [];
      entries.push({
        conversation,
        messageCount: sorted.length,
        firstMessageAt: sorted[0].createdAt,
        lastMessageAt: sorted[sorted.length - 1].createdAt,
      });
      index.set(key, entries);
    }
  }
  for (const entries of index.values()) {
    entries.sort((a, b) => a.firstMessageAt.localeCompare(b.firstMessageAt));
  }
  return index;
}
