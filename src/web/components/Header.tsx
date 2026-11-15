import type { Screen } from '../App';

interface HeaderProps {
  activeScreen: Screen;
  onScreenChange: (screen: Screen) => void;
}

const NAV_ITEMS: Array<{ id: Screen; label: string; icon: string }> = [
  { id: 'chat', label: 'Chat', icon: '💬' },
  { id: 'journal', label: 'Journal', icon: '🗓️' },
  { id: 'settings', label: 'Settings', icon: '⚙️' },
];

function Header({ activeScreen, onScreenChange }: HeaderProps) {
  return (
    <header className="header" role="banner">
      <div className="brand">
        <span aria-hidden="true" className="brand-mark">
          ✦
        </span>
        <span className="brand-name">Starward</span>
      </div>
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
