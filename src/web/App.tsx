import React from 'react';
import Header from './components/Header';
import HomeScreen from './screens/HomeScreen';
import NotesScreen from './screens/NotesScreen';
import ScheduleScreen from './screens/ScheduleScreen';
import CountdownsScreen from './screens/CountdownsScreen';
import SettingsScreen from './screens/SettingsScreen';
import { useState } from 'react';

type Screen = 'home' | 'notes' | 'schedule' | 'countdowns' | 'settings';

export type { Screen };

function App() {
  const [activeScreen, setActiveScreen] = useState<Screen>('home');

  return (
    <div className="app">
      <Header activeScreen={activeScreen} onScreenChange={(screen: string) => setActiveScreen(screen as Screen)} />
      <main className="main-content" role="main">
        {activeScreen === 'home' && <HomeScreen />}
        {activeScreen === 'notes' && <NotesScreen />}
        {activeScreen === 'schedule' && <ScheduleScreen />}
        {activeScreen === 'countdowns' && <CountdownsScreen />}
        {activeScreen === 'settings' && <SettingsScreen />}
      </main>
    </div>
  );
}

export default App;