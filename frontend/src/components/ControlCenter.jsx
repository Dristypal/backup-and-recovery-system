import './ControlCenter.css';

function ControlCenter({
  restoreMode,
  setRestoreMode,
  onRefresh,
  refreshing,
  files,
  backups,
  isAdmin
}) {
  const latestDatabaseBackup = backups
    .filter((backup) => backup.backupType === 'database')
    .sort((firstItem, secondItem) => new Date(secondItem.createdAt) - new Date(firstItem.createdAt))[0];

  const latestFileBackup = backups
    .filter((backup) => backup.backupType === 'file')
    .sort((firstItem, secondItem) => new Date(secondItem.createdAt) - new Date(firstItem.createdAt))[0];

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return 'Not available yet';
    }

    return new Date(dateValue).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <section className="control-center">
      <div className="control-card">
        <p className="control-kicker">Recovery Settings</p>
        <h3>Restore Mode</h3>
        <p className="control-copy">
          Choose how database restore requests should behave from the dashboard.
        </p>
        {isAdmin ? (
          <div className="mode-switch">
            <button
              className={restoreMode === 'replace' ? 'active' : ''}
              onClick={() => setRestoreMode('replace')}
            >
              Replace Data
            </button>
            <button
              className={restoreMode === 'merge' ? 'active' : ''}
              onClick={() => setRestoreMode('merge')}
            >
              Merge Data
            </button>
          </div>
        ) : (
          <p className="control-copy">Database restore controls are available to admins only.</p>
        )}
      </div>

      <div className="control-card">
        <p className="control-kicker">Vault Health</p>
        <h3>Live Snapshot</h3>
        <div className="control-metric-grid">
          <div>
            <span>{files.length}</span>
            <p>Tracked Files</p>
          </div>
          <div>
            <span>{backups.length}</span>
            <p>Total Backups</p>
          </div>
        </div>
        <button className="refresh-button" onClick={onRefresh} disabled={refreshing}>
          {refreshing ? 'Refreshing...' : 'Refresh Dashboard'}
        </button>
      </div>

      <div className="control-card">
        <p className="control-kicker">Latest Signals</p>
        <h3>What Changed</h3>
        <ul className="signal-list">
          <li>Latest DB backup: {formatDate(latestDatabaseBackup?.createdAt)}</li>
          <li>Latest file version: {formatDate(latestFileBackup?.createdAt)}</li>
          <li>Current restore mode: {restoreMode}</li>
        </ul>
      </div>
    </section>
  );
}

export default ControlCenter;
