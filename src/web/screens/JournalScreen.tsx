import { useMemo, useState } from 'react';
import DayDetail from '../components/journal/DayDetail';
import MonthGrid from '../components/journal/MonthGrid';
import type { ChatJournalState } from '../hooks/useChatJournal';
import {
  JOURNAL_TIMEZONE,
  addMonths,
  buildDayIndex,
  monthLabel,
  parseDayKey,
  todayDayKey,
} from '../lib/calendar';

interface JournalScreenProps {
  journal: ChatJournalState;
  onOpenConversation: (id: string) => void;
}

export default function JournalScreen({ journal, onOpenConversation }: JournalScreenProps) {
  const todayKey = todayDayKey();
  const todayParts = parseDayKey(todayKey);
  const [view, setView] = useState({ year: todayParts.year, month: todayParts.month });
  const [selectedKey, setSelectedKey] = useState(todayKey);

  // Aggregates every conversation that had activity on each local day.
  const dayIndex = useMemo(
    () => buildDayIndex(journal.conversations, journal.messagesByConversation, JOURNAL_TIMEZONE),
    [journal.conversations, journal.messagesByConversation],
  );

  const entries = dayIndex.get(selectedKey) ?? [];
  const summary = journal.daySummaries[selectedKey];

  const shiftMonth = (delta: number) => {
    setView((prev) => addMonths(prev.year, prev.month, delta));
  };

  const jumpToToday = () => {
    setView({ year: todayParts.year, month: todayParts.month });
    setSelectedKey(todayKey);
  };

  return (
    <div className="journal-page">
      <div className="journal-container">
        <section className="calendar-card">
          <div className="calendar-head">
            <h2 className="calendar-title">{monthLabel(view.year, view.month)}</h2>
            <div className="calendar-nav">
              <button
                aria-label="Previous month"
                className="btn-icon"
                onClick={() => shiftMonth(-1)}
                type="button"
              >
                ‹
              </button>
              <button className="btn btn-secondary btn-today" onClick={jumpToToday} type="button">
                Today
              </button>
              <button
                aria-label="Next month"
                className="btn-icon"
                onClick={() => shiftMonth(1)}
                type="button"
              >
                ›
              </button>
            </div>
          </div>
          <MonthGrid
            dayIndex={dayIndex}
            month={view.month}
            onSelectDay={setSelectedKey}
            selectedKey={selectedKey}
            summaries={journal.daySummaries}
            todayKey={todayKey}
            year={view.year}
          />
        </section>
        <DayDetail
          dayKey={selectedKey}
          entries={entries}
          onOpenConversation={onOpenConversation}
          summary={summary}
        />
      </div>
    </div>
  );
}
