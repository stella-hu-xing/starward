import { useEffect, useRef } from 'react';
import MarkdownLite from '../MarkdownLite';
import { formatDayTime } from '../../lib/calendar';
import type { Conversation, Message } from '../../types';

interface ChatThreadProps {
  conversation: Conversation | null;
  messages: Message[];
  onOpenSidebar: () => void;
  onOpenJournal: () => void;
}

export default function ChatThread({
  conversation,
  messages,
  onOpenSidebar,
  onOpenJournal,
}: ChatThreadProps) {
  const listRef = useRef<HTMLDivElement>(null);
  // Track the last message length so streaming text keeps the view pinned down.
  const lastLength = messages.length > 0 ? messages[messages.length - 1].content.length : 0;

  useEffect(() => {
    const element = listRef.current;
    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  }, [messages.length, lastLength]);

  return (
    <section className="chat-main">
      <div className="chat-thread-head">
        <button
          aria-label="Open conversations"
          className="btn-icon btn-sidebar-toggle"
          onClick={onOpenSidebar}
          type="button"
        >
          ☰
        </button>
        <h2 className="chat-thread-title">{conversation?.title ?? 'Chat'}</h2>
      </div>
      <div className="message-list" ref={listRef}>
        {messages.length === 0 ? (
          <div className="chat-empty">
            <p className="chat-empty-title">Nothing here yet.</p>
            <p className="chat-empty-sub">
              Say anything below to start this chat. Replies are simulated demo text, not real AI.
            </p>
            <button className="btn btn-secondary" onClick={onOpenJournal} type="button">
              Browse your journal →
            </button>
          </div>
        ) : (
          messages.map((message) => <MessageRow key={message.id} message={message} />)
        )}
      </div>
    </section>
  );
}

function MessageRow({ message }: { message: Message }) {
  const pending = message.status === 'streaming' || message.status === 'pending';
  const metaParts = [formatDayTime(message.createdAt)];
  if (message.source === 'voice') {
    metaParts.push('🎙 voice');
  }
  return (
    <div className={`msg-row msg-${message.role}`}>
      <div className="msg-bubble">
        {message.role === 'assistant' ? (
          message.content.length === 0 && pending ? (
            <span aria-label="Assistant is typing" className="typing-dots">
              <span />
              <span />
              <span />
            </span>
          ) : (
            <MarkdownLite text={message.content} />
          )
        ) : (
          message.content
        )}
      </div>
      <span className="msg-meta">{metaParts.join(' · ')}</span>
    </div>
  );
}
