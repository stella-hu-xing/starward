import React from 'react';

import type { Screen } from '../App';

interface HeaderProps {
  activeScreen: Screen;
  onScreenChange: (screen: string) => void;
}

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'notes', label: 'Notes', icon: '📝' },
  { id: 'schedule', label: 'Schedule', icon: '📅' },
  { id: 'countdowns', label: 'Countdowns', icon: '⏰' },
  { id: 'settings', label: 'Settings', icon: '⚙️' }
];

function Header({ activeScreen, onScreenChange }: HeaderProps) {
  return (
    <header className="header" role="banner">
      <nav aria-label="Main navigation">
        <ul className="nav-list">
          {NAV_ITEMS.map((item) => (
            <li key={item.id} className="nav-item">
              <button
                className={`nav-btn ${activeScreen === item.id ? 'nav-btn-active' : ''}`}
                onClick={() => onScreenChange(item.id)}
                aria-pressed={activeScreen === item.id}
              >
                <span className="nav-icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="nav-label">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

export default Header;