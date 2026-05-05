import './BackupPanel.css';

function BackupPanel({ backups, loading, onDownload, onRestoreDatabase, onOpenFileHistory }) {
  const formatDate = (dateValue) =>
    new Date(dateValue).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

  const databaseBackups = backups.filter((backup) => backup.backupType === 'database');
  const fileBackups = backups.filter((backup) => backup.backupType === 'file');

  return (
    <section className="backup-panel" id="backups">
      <div className="section-header">
        <div>
          <h2 className="section-title">Backup Activity</h2>
          <p className="section-subtitle">Database snapshots and file recovery points from S3 versioning.</p>
        </div>
      </div>

      <div className="backup-grid">
        <div className="backup-column">
          <div className="backup-column-header">
            <h3>Database Backups</h3>
            <span>{databaseBackups.length}</span>
          </div>

          {loading ? (
            <p className="backup-empty">Loading backup history...</p>
          ) : databaseBackups.length === 0 ? (
            <p className="backup-empty">No database backups created yet.</p>
          ) : (
            databaseBackups.map((backup) => (
              <article key={backup._id} className="backup-item">
                <div>
                  <strong>{backup.fileName}</strong>
                  <p>{formatDate(backup.createdAt)}</p>
                </div>
                <div className="backup-actions">
                  <button onClick={() => onDownload(backup)}>Download</button>
                  <button className="secondary" onClick={() => onRestoreDatabase(backup)}>
                    Restore
                  </button>
                </div>
              </article>
            ))
          )}
        </div>

        <div className="backup-column">
          <div className="backup-column-header">
            <h3>File Versions</h3>
            <span>{fileBackups.length}</span>
          </div>

          {loading ? (
            <p className="backup-empty">Loading backup history...</p>
          ) : fileBackups.length === 0 ? (
            <p className="backup-empty">No file versions recorded yet.</p>
          ) : (
            fileBackups.slice(0, 8).map((backup) => (
              <article key={backup._id} className="backup-item">
                <div>
                  <strong>{backup.originalName}</strong>
                  <p>Version {backup.versionNumber} - {backup.category || 'other'} - {formatDate(backup.createdAt)}</p>
                </div>
                <div className="backup-actions">
                  {backup.fileId && (
                    <button className="secondary" onClick={() => onOpenFileHistory(backup.fileId)}>
                      Open File
                    </button>
                  )}
                  <div className="backup-tag">{backup.isLatest ? 'Latest' : 'Archived'}</div>
                </div>
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

export default BackupPanel;
