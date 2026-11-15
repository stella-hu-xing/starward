import { WEEKDAY_SHORT_NAMES, buildMonthGrid } from '../../lib/calendar';
import type { DayConversationEntry, DaySummary } from '../../types';
import DayCell from './DayCell';

interface MonthGridProps {
  year: number;
  month: number;
  dayIndex: Map<string, DayConversationEntry[]>;
  summaries: Record<string, DaySummary>;
  selectedKey: string;
  todayKey: string;
  onSelectDay: (key: string) => void;
}

export default function MonthGrid({
  year,
  month,
  dayIndex,
  summaries,
  selectedKey,
  todayKey,
  onSelectDay,
}: MonthGridProps) {
  const grid = buildMonthGrid(year, month);
  return (
    <div>
      <div className="calendar-weekdays">
        {WEEKDAY_SHORT_NAMES.map((name) => (
          <span className="calendar-weekday" key={name}>
            {name}
          </span>
        ))}
      </div>
      <div className="calendar-grid">
        {grid.map((day) => (
          <DayCell
            chatCount={dayIndex.get(day.key)?.length ?? 0}
            day={day}
            isSelected={day.key === selectedKey}
            isToday={day.key === todayKey}
            key={day.key}
            onSelect={onSelectDay}
            topics={summaries[day.key]?.topics ?? []}
          />
        ))}
      </div>
    </div>
  );
}
