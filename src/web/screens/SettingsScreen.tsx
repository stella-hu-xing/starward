function SettingsScreen() {
  return (
    <div className="settings-page">
      <div className="settings-container">
        <h2 className="settings-title">Settings</h2>

        <section className="settings-section">
          <h3>Journal</h3>
          <p>
            Timezone: <strong>Australia/Melbourne</strong>
          </p>
          <p className="settings-note">
            Report day boundaries follow this IANA timezone. Confirming the owner timezone is an
            open M0 decision.
          </p>
        </section>

        <section className="settings-section">
          <h3>Account</h3>
          <p>
            Owner: <strong>stella@stellahu.me</strong>
          </p>
          <p className="settings-note">Single local login arrives with M0.</p>
        </section>

        <section className="settings-section">
          <h3>Backup</h3>
          <p>Last backup: never</p>
          <button className="btn btn-secondary" disabled type="button">
            Run backup now
          </button>
          <p className="settings-note">End-to-end encrypted backup lands with M0.</p>
        </section>
      </div>
    </div>
  );
}

export default SettingsScreen;
