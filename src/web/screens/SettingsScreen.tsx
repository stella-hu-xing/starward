import React from 'react';

function SettingsScreen() {
  return (
    <div className="settings-screen">
      <h2 className="settings-title">Settings</h2>
      <div className="settings-section">
        <h3>Account</h3>
        <p>Owner: stella@stellahu.me</p>
      </div>

      <div className="settings-section">
        <h3>Backup</h3>
        <p>Last backup: never</p>
        <button className="btn-secondary">Run backup now</button>
      </div>
    </div>
  );
}

export default SettingsScreen;