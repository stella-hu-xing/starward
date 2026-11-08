import React from 'react';

function ScheduleScreen() {
  return (
    <div className="schedule-screen">
      <div className="schedule-views">
        <button className="view-btn">Today</button>
        <button className="view-btn">Next 7 days</button>
        <button className="view-btn">Agenda</button>
      </div>
      <div className="events-list">
        <p className="empty-state">
          No events yet. Connect Google Calendar or add an event.
        </p>
      </div>
    </div>
  );
}

export default ScheduleScreen;