import {
  JOURNAL_TIMEZONE,
  formatDayHeading,
  formatDayTime,
  formatShortDate,
} from '../../lib/calendar';
import type { DayConversationEntry, DaySummary } from '../../types';

interface DayDetailProps {
  dayKey: string;
  entries: DayConversationEntry[];
  summary: DaySummary | undefined;
  onOpenConversation: (id: string) => void;
}

export default function DayDetail({
  dayKey,
  entries,
  summary,
  onOpenConversation,
}: DayDetailProps) {
  const messageTotal = entries.reduce((total, entry) => total + entry.messageCount, 0);
  return (
    <section className="day-detail">
      <h3 className="day-detail-date">{formatDayHeading(dayKey)}</h3>
      <p className="day-detail-meta">
        {entries.length === 0
          ? 'No chats this day'
          : `${entries.length} ${entries.length === 1 ? 'conversation' : 'conversations'} · ${messageTotal} ${messageTotal === 1 ? 'message' : 'messages'}`}
      </p>
      {summary && summary.topics.length > 0 && (
        <div aria-label="Day topics" className="day-detail-topics">
          {summary.topics.map((topic) => (
            <span className="topic-chip" key={topic}>
              {topic}
            </span>
          ))}
        </div>
      )}
      {entries.length > 0 ? (
        <div className="day-conversations">
          {entries.map((entry) => (
            <div className="day-conversation" key={entry.conversation.id}>
              <div className="day-conversation-text">
                <span className="day-conversation-title">{entry.conversation.title}</span>
                <span className="day-conversation-sub">
                  {formatDayTime(entry.firstMessageAt)}–{formatDayTime(entry.lastMessageAt)} ·{' '}
                  {entry.messageCount} {entry.messageCount === 1 ? 'message' : 'messages'}
                </span>
              </div>
              <button
                className="btn btn-secondary btn-open-chat"
                onClick={() => onOpenConversation(entry.conversation.id)}
                type="button"
              >
                Open chat
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="empty-note">Nothing was recorded this day. It will fill in as you chat.</p>
      )}
      <div className="summary-section">
        <h4 className="summary-label">Daily summary</h4>
        {summary ? (
          <div>
            <p className="summary-meta">
              Generated {formatShortDate(summary.date)} {formatDayTime(summary.generatedAt)} ·
              Covers messages until {formatDayTime(summary.cutoff)} ({JOURNAL_TIMEZONE})
            </p>
            <div className="summary-body">
              {summary.summary.split('\n\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>
        ) : (
          <p className="empty-note">
            No summary generated for this day yet. Real daily summaries arrive with M3; the ones on
            other days are demo text.
          </p>
        )}
      </div>
    </section>
  );
}
