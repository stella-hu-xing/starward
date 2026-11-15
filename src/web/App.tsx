import { useState } from 'react';
import Header from './components/Header';
import { useChatJournal } from './hooks/useChatJournal';
import ChatScreen from './screens/ChatScreen';
import JournalScreen from './screens/JournalScreen';
import SettingsScreen from './screens/SettingsScreen';

type Screen = 'chat' | 'journal' | 'settings';

export type { Screen };

function App() {
  const [activeScreen, setActiveScreen] = useState<Screen>('chat');
  const journal = useChatJournal();

  return (
    <div className="app">
      <Header activeScreen={activeScreen} onScreenChange={setActiveScreen} />
      <main className="main-content" role="main">
        {activeScreen === 'chat' && (
          <ChatScreen journal={journal} onOpenJournal={() => setActiveScreen('journal')} />
        )}
        {activeScreen === 'journal' && (
          <JournalScreen
            journal={journal}
            onOpenConversation={(id) => {
              journal.selectConversation(id);
              setActiveScreen('chat');
            }}
          />
        )}
        {activeScreen === 'settings' && <SettingsScreen />}
      </main>
    </div>
  );
}

export default App;
