import { formatConversationTimestamp } from '../../lib/calendar';
import type { Conversation } from '../../types';

interface ConversationListProps {
  /** Newest-first list. */
  conversations: Conversation[];
  activeId: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onClose: () => void;
}

export default function ConversationList({
  conversations,
  activeId,
  onSelect,
  onNew,
  onClose,
}: ConversationListProps) {
  return (
    <div className="chat-sidebar">
      <div className="chat-sidebar-head">
        <span className="sidebar-title">Chats</span>
        <button className="btn btn-secondary btn-new-chat" onClick={onNew} type="button">
          + New chat
        </button>
        <button
          aria-label="Close conversations"
          className="btn-icon btn-sidebar-close"
          onClick={onClose}
          type="button"
        >
          ✕
        </button>
      </div>
      <nav aria-label="Conversations" className="conversation-list">
        {conversations.map((conversation) => (
          <button
            className={`conversation-item${
              conversation.id === activeId ? ' conversation-item-active' : ''
            }`}
            key={conversation.id}
            onClick={() => onSelect(conversation.id)}
            type="button"
          >
            <span className="conv-title">{conversation.title}</span>
            <span className="conv-sub">{formatConversationTimestamp(conversation.updatedAt)}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
