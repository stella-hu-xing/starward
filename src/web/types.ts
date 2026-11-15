/** Shared UI types for the chat journal.
 *
 * Aligned with the target v1 schema in agents/DATA_MODEL.md. Timestamps are UTC
 * ISO-8601 strings; local day keys are YYYY-MM-DD derived with an explicit IANA
 * timezone (see lib/calendar.ts).
 */

export type ChatRole = 'user' | 'assistant';
export type MessageSource = 'text' | 'voice' | 'model';
export type MessageStatus = 'pending' | 'streaming' | 'complete' | 'interrupted' | 'failed';

export interface Message {
  id: string;
  conversationId: string;
  /** Increasing within a conversation; the server assigns it in the real backend. */
  sequence: number;
  role: ChatRole;
  /** User text or assistant Markdown. Only unfinished assistant attempts may be empty. */
  content: string;
  source: MessageSource;
  status: MessageStatus;
  /** UTC ISO-8601 timestamp. */
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string;
  /** UTC ISO-8601 timestamp. */
  createdAt: string;
  /** UTC ISO-8601 timestamp of the last activity. */
  updatedAt: string;
}

/** One day's aggregated journal entry, across all conversations that day. */
export interface DaySummary {
  /** Local day key, YYYY-MM-DD. */
  date: string;
  /** Short topic/keyword chips shown in the calendar cell. */
  topics: string[];
  /** Longer Markdown summary paragraph of that day's chats. */
  summary: string;
  /** UTC ISO timestamp when the summary was generated. */
  generatedAt: string;
  /** UTC ISO cutoff: the summary covers messages created before this time. */
  cutoff: string;
}

/** A conversation's activity within one local day. A day can hold many chats. */
export interface DayConversationEntry {
  conversation: Conversation;
  messageCount: number;
  firstMessageAt: string;
  lastMessageAt: string;
}
