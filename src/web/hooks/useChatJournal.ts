import { useEffect, useMemo, useRef, useState } from 'react';
import { MOCK_REPLIES, createMockJournal } from '../data/mockData';
import type { Conversation, DaySummary, Message } from '../types';

export interface ChatJournalState {
  conversations: Conversation[];
  /** Newest-first order for the sidebar. */
  recentConversations: Conversation[];
  messagesByConversation: Record<string, Message[]>;
  /** Mock daily summaries, keyed by local day key (YYYY-MM-DD). */
  daySummaries: Record<string, DaySummary>;
  activeConversationId: string;
  activeMessages: Message[];
  /** True while the active conversation has a stream in flight. */
  streaming: boolean;
  selectConversation: (id: string) => void;
  startNewChat: () => void;
  sendMessage: (text: string) => void;
}

const STREAM_CHUNK_CHARS = 6;
const STREAM_INTERVAL_MS = 25;

function newId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

function titleFromMessage(text: string): string {
  const trimmed = text.trim().replace(/\s+/g, ' ');
  return trimmed.length > 48 ? `${trimmed.slice(0, 48)}…` : trimmed;
}

/** Chat state for the redesigned UI, seeded with typed mock data.
 *
 * Replies are simulated locally (progressive text reveal) so nothing here
 * implies real AI integration — backend wiring arrives with M1.
 */
export function useChatJournal(): ChatJournalState {
  const [initial] = useState(createMockJournal);
  const [conversations, setConversations] = useState<Conversation[]>(initial.conversations);
  const [messagesByConversation, setMessages] = useState<Record<string, Message[]>>(
    initial.messagesByConversation,
  );
  const [activeConversationId, setActiveConversationId] = useState<string>(
    initial.conversations[0]?.id ?? '',
  );
  const replyIndex = useRef(0);
  const streamTimers = useRef<Set<number>>(new Set());

  // One active turn per conversation: concurrent mock streams are allowed.
  useEffect(
    () => () => {
      for (const timer of streamTimers.current) {
        window.clearInterval(timer);
      }
      streamTimers.current.clear();
    },
    [],
  );

  const activeMessages = useMemo(
    () =>
      (messagesByConversation[activeConversationId] ?? [])
        .slice()
        .sort((a, b) => a.sequence - b.sequence),
    [messagesByConversation, activeConversationId],
  );

  const streaming = useMemo(
    () =>
      activeMessages.some(
        (message) => message.status === 'streaming' || message.status === 'pending',
      ),
    [activeMessages],
  );

  const recentConversations = useMemo(
    () => [...conversations].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [conversations],
  );

  function selectConversation(id: string) {
    setActiveConversationId(id);
  }

  function startNewChat() {
    const now = new Date().toISOString();
    const conversation: Conversation = {
      id: newId('conv'),
      title: 'New chat',
      createdAt: now,
      updatedAt: now,
    };
    setConversations((prev) => [conversation, ...prev]);
    setMessages((prev) => ({ ...prev, [conversation.id]: [] }));
    setActiveConversationId(conversation.id);
  }

  /** Append the user's text and a simulated assistant reply for it. */
  function sendMessage(text: string) {
    const trimmed = text.trim();
    const conversationId = activeConversationId;
    if (!trimmed || !conversationId) {
      return;
    }
    const current = messagesByConversation[conversationId] ?? [];
    if (current.some((message) => message.status === 'streaming' || message.status === 'pending')) {
      return; // One active turn per conversation, matching the M1 rules.
    }
    const now = new Date().toISOString();
    const nextSequence = (current.length ? current[current.length - 1].sequence : 0) + 1;
    const userMessage: Message = {
      id: newId('msg'),
      conversationId,
      sequence: nextSequence,
      role: 'user',
      content: trimmed,
      source: 'text',
      status: 'complete',
      createdAt: now,
    };
    const assistantMessage: Message = {
      id: newId('msg'),
      conversationId,
      sequence: nextSequence + 1,
      role: 'assistant',
      content: '',
      source: 'model',
      status: 'streaming',
      createdAt: now,
    };
    setMessages((prev) => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] ?? []), userMessage, assistantMessage],
    }));
    setConversations((prev) =>
      prev.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              updatedAt: now,
              title:
                conversation.title === 'New chat' ? titleFromMessage(trimmed) : conversation.title,
            }
          : conversation,
      ),
    );
    const fullText = MOCK_REPLIES[replyIndex.current % MOCK_REPLIES.length];
    replyIndex.current += 1;
    let revealed = 0;
    const timer = window.setInterval(() => {
      revealed = Math.min(fullText.length, revealed + STREAM_CHUNK_CHARS);
      const finished = revealed >= fullText.length;
      setMessages((prev) => ({
        ...prev,
        [conversationId]: (prev[conversationId] ?? []).map((message) =>
          message.id === assistantMessage.id
            ? {
                ...message,
                content: finished ? fullText : fullText.slice(0, revealed),
                status: finished ? 'complete' : 'streaming',
              }
            : message,
        ),
      }));
      if (finished) {
        window.clearInterval(timer);
        streamTimers.current.delete(timer);
      }
    }, STREAM_INTERVAL_MS);
    streamTimers.current.add(timer);
  }

  return {
    conversations,
    recentConversations,
    messagesByConversation,
    daySummaries: initial.daySummaries,
    activeConversationId,
    activeMessages,
    streaming,
    selectConversation,
    startNewChat,
    sendMessage,
  };
}
