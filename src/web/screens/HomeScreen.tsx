import React, { useState } from 'react';

function HomeScreen() {
  const [noteText, setNoteText] = useState('');

  return (
    <div className="home-screen">
      <section className="welcome-card">
        <h1 className="welcome-title">Good morning, Stella</h1>
        <p className="welcome-subtitle">
          Capture a thought or plan your day.
        </p>
      </section>

      <section className="capture-card">
        <label className="capture-label" htmlFor="note-input">
          What's on your mind?
        </label>
        <textarea
          id="note-input"
          className="note-input"
          placeholder="Type or dictate your note..."
          rows={4}
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
        />
        <div className="capture-actions">
          <button className="btn-primary" disabled>
            Save
          </button>
        </div>
      </section>

      <section className="quick-stats">
        <div className="stat-card">
          <span className="stat-value">0</span>
          <span className="stat-label">Notes</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">0</span>
          <span className="stat-label">Countdowns</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">0</span>
          <span className="stat-label">Events today</span>
        </div>
      </section>
    </div>
  );
}

export default HomeScreen;