import { useState } from 'react';
import ChatThread from '../components/chat/ChatThread';
import Composer from '../components/chat/Composer';
import ConversationList from '../components/chat/ConversationList';
import type { ChatJournalState } from '../hooks/useChatJournal';
import type { Conversation } from '../types';

interface ChatScreenProps {
  journal: ChatJournalState;
  onOpenJournal: () => void;
}

export default function ChatScreen({ journal, onOpenJournal }: ChatScreenProps) {
  const [draft, setDraft] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const activeConversation: Conversation | undefined = journal.conversations.find(
    (conversation) => conversation.id === journal.activeConversationId,
  );

  const handleSend = () => {
    if (!draft.trim() || journal.streaming) {
      return;
    }
    journal.sendMessage(draft);
    setDraft('');
  };

  return (
    <div className={`chat-layout${sidebarOpen ? ' sidebar-open' : ''}`}>
      <button
        aria-label="Close conversations"
        className="sidebar-backdrop"
        onClick={() => setSidebarOpen(false)}
        type="button"
      />
      <ConversationList
        onClose={() => setSidebarOpen(false)}
        activeId={journal.activeConversationId}
        conversations={journal.recentConversations}
        onNew={() => {
          journal.startNewChat();
          setDraft('');
          setSidebarOpen(false);
        }}
        onSelect={(id) => {
          journal.selectConversation(id);
          setSidebarOpen(false);
        }}
      />
      <div className="chat-main-column">
        <ChatThread
          conversation={activeConversation ?? null}
          messages={journal.activeMessages}
          onOpenJournal={onOpenJournal}
          onOpenSidebar={() => setSidebarOpen(true)}
        />
        <Composer
          disabled={journal.streaming}
          onChange={setDraft}
          onSend={handleSend}
          value={draft}
        />
      </div>
    </div>
  );
}
