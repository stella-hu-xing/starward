import { describe, expect, test } from 'vitest';

import {
  JOURNAL_TIMEZONE,
  addMonths,
  buildDayIndex,
  buildMonthGrid,
  dayKey,
  daysInMonth,
  formatDayHeading,
  formatDayTime,
  localDayKey,
  monthLabel,
  parseDayKey,
  previousDayKey,
} from '../src/web/lib/calendar';
import type { Conversation, Message } from '../src/web/types';

function makeMessage(overrides: {
  id: string;
  conversationId: string;
  sequence: number;
  createdAt: string;
  role?: 'user' | 'assistant';
  source?: 'text' | 'model';
  status?: Message['status'];
}): Message {
  return {
    id: overrides.id,
    conversationId: overrides.conversationId,
    sequence: overrides.sequence,
    role: overrides.role ?? 'user',
    content: 'demo text',
    source: overrides.source ?? 'text',
    status: overrides.status ?? 'complete',
    createdAt: overrides.createdAt,
  };
}

describe('day keys', () => {
  test('dayKey pads month and day', () => {
    expect(dayKey(2026, 11, 5)).toBe('2026-11-05');
  });

  test('parseDayKey round-trips and rejects malformed keys', () => {
    expect(parseDayKey('2026-01-31')).toEqual({ year: 2026, month: 1, day: 31 });
    expect(() => parseDayKey('2026-1-31')).toThrow(/Invalid day key/);
  });

  test('daysInMonth handles leap years', () => {
    expect(daysInMonth(2027, 2)).toBe(28);
    expect(daysInMonth(2028, 2)).toBe(29);
    expect(daysInMonth(2026, 1)).toBe(31);
  });

  test('localDayKey maps UTC instants to Melbourne local days across DST', () => {
    // AEDT (UTC+11) in November.
    expect(localDayKey('2026-11-15T13:00:00Z', JOURNAL_TIMEZONE)).toBe('2026-11-16');
    // The night DST ends (2026-04-05 03:00 -> 02:00 AEST): both instants land on Apr 5.
    expect(localDayKey('2026-04-04T15:30:00Z', JOURNAL_TIMEZONE)).toBe('2026-04-05');
    expect(localDayKey('2026-04-04T16:30:00Z', JOURNAL_TIMEZONE)).toBe('2026-04-05');
    // AEST (UTC+10) in winter.
    expect(localDayKey('2026-06-15T14:30:00Z', JOURNAL_TIMEZONE)).toBe('2026-06-16');
  });

  test('previousDayKey crosses month and leap-year boundaries', () => {
    expect(previousDayKey('2026-03-01')).toBe('2026-02-28');
    expect(previousDayKey('2028-03-01')).toBe('2028-02-29');
  });

  test('addMonths rolls over year boundaries in both directions', () => {
    expect(addMonths(2026, 1, -1)).toEqual({ year: 2025, month: 12 });
    expect(addMonths(2026, 11, 2)).toEqual({ year: 2027, month: 1 });
    expect(addMonths(2026, 7, 0)).toEqual({ year: 2026, month: 7 });
  });
});

describe('buildMonthGrid', () => {
  test('November 2026 starts Monday before the 1st and covers the month', () => {
    const grid = buildMonthGrid(2026, 11);
    // Nov 1 2026 is a Sunday, so the Monday-first grid starts on Oct 26.
    expect(grid[0]).toMatchObject({ key: '2026-10-26', isoWeekday: 1, inMonth: false });
    expect(grid.filter((day) => day.inMonth)).toHaveLength(30);
    // 6 leading days + 30 November days = 36 -> 6 weeks = 42 cells.
    expect(grid).toHaveLength(42);
    expect(grid[grid.length - 1].key).toBe('2026-12-06');
    // Every week starts on a Monday (ISO 1..7 across each row).
    for (let index = 0; index < grid.length; index += 1) {
      expect(grid[index].isoWeekday).toBe((index % 7) + 1);
    }
  });

  test('February 2027 fits in exactly four weeks', () => {
    const grid = buildMonthGrid(2027, 2);
    // Feb 1 2027 is a Monday, so no leading days and 28 cells total.
    expect(grid[0]).toMatchObject({ key: '2027-02-01', isoWeekday: 1 });
    expect(grid).toHaveLength(28);
    expect(grid[grid.length - 1]).toMatchObject({ key: '2027-02-28', isoWeekday: 7 });
    expect(grid.every((day) => day.inMonth)).toBe(true);
  });

  test('July 2026 mixes leading, in-month, and trailing cells', () => {
    const grid = buildMonthGrid(2026, 7);
    // Jul 1 2026 is a Wednesday: two leading Jun days, five trailing Aug days.
    expect(grid[0]).toMatchObject({ key: '2026-06-29', isoWeekday: 1, inMonth: false });
    expect(grid.filter((day) => day.inMonth)).toHaveLength(31);
    expect(grid).toHaveLength(35);
    expect(grid[grid.length - 1]).toMatchObject({ key: '2026-08-02', isoWeekday: 7 });
  });
});

describe('grouping and labels', () => {
  test('aggregates multiple chats and excludes unfinished assistants', () => {
    const conversations: Conversation[] = ['a', 'b'].map((id) => ({
      id,
      title: id,
      createdAt: '2026-11-15T01:00:00Z',
      updatedAt: '2026-11-15T02:00:00Z',
    }));
    const message = (id: string, sequence: number, status: Message['status'] = 'complete') =>
      makeMessage({
        id: `${id}-${sequence}`,
        conversationId: id,
        sequence,
        createdAt: '2026-11-15T01:00:00Z',
        role: sequence === 1 ? 'user' : 'assistant',
        status,
      });
    const index = buildDayIndex(conversations, {
      a: [message('a', 1), message('a', 2)],
      b: [message('b', 1), message('b', 2, 'streaming')],
    });
    expect(index.get('2026-11-15')?.map((entry) => entry.messageCount)).toEqual([2, 1]);
    expect(index.get('2026-11-14')).toBeUndefined();
    expect(buildDayIndex([], {}).size).toBe(0);
  });
  test('empty months have complete grids', () => {
    const index = buildDayIndex([], {});
    expect(buildMonthGrid(2026, 4).filter((day) => day.inMonth)).toHaveLength(30);
    expect(buildMonthGrid(2026, 4).every((day) => !index.has(day.key))).toBe(true);
  });
  test('formats timezone labels', () => {
    expect(formatDayTime('2026-11-15T03:07:00Z')).toBe('14:07');
    expect(formatDayHeading('2026-11-15').replace(',', '')).toBe('Sunday 15 November 2026');
    expect(monthLabel(2026, 11)).toBe('November 2026');
  });
});
