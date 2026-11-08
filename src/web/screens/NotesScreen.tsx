import React, { useState } from 'react';

function NotesScreen() {
  const [search, setSearch] = useState('');

  return (
    <div className="notes-screen">
      <div className="search-bar">
        <input
          type="search"
          className="search-input"
          placeholder="Search notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>
      <div className="notes-list">
        <p className="empty-state">
          No notes yet. Start capturing from the Home screen.
        </p>
      </div>
    </div>
  );
}

export default NotesScreen;