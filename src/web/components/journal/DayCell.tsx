import type { CalendarDay } from '../../lib/calendar';

interface DayCellProps {
  day: CalendarDay;
  chatCount: number;
  topics: string[];
  isSelected: boolean;
  isToday: boolean;
  onSelect: (key: string) => void;
}

export default function DayCell({
  day,
  chatCount,
  topics,
  isSelected,
  isToday,
  onSelect,
}: DayCellProps) {
  const classes = ['day-cell'];
  if (!day.inMonth) {
    classes.push('day-cell-muted');
  }
  if (isSelected) {
    classes.push('day-cell-selected');
  }
  if (isToday) {
    classes.push('day-cell-today');
  }
  return (
    <button
      aria-label={`${day.key}${isToday ? ', today' : ''}, ${chatCount} ${chatCount === 1 ? 'chat' : 'chats'}${topics.length ? `, ${topics.join(', ')}` : ''}`}
      aria-current={isToday ? 'date' : undefined}
      aria-pressed={isSelected}
      className={classes.join(' ')}
      onClick={() => onSelect(day.key)}
      type="button"
    >
      <span className="day-cell-number">{day.day}</span>
      {topics.length > 0 ? (
        <span className="day-topics">
          {topics.slice(0, 3).map((topic) => (
            <span className="topic-chip" key={topic}>
              {topic}
            </span>
          ))}
        </span>
      ) : null}
      <span className="day-badge-row">
        {chatCount > 0 ? (
          <span className="day-chat-count">
            {chatCount} {chatCount === 1 ? 'chat' : 'chats'}
          </span>
        ) : (
          <span aria-hidden="true" className="day-dot" />
        )}
      </span>
    </button>
  );
}
