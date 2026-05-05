import './ActivityFeed.css';

function ActivityFeed({ files, backups }) {
  const fileEvents = files.map((file) => ({
    id: `file-${file._id}`,
    type: 'File',
    title: `${file.originalName} synced`,
    subtitle: `Current version v${file.currentVersion}`,
    timestamp: file.updatedAt || file.uploadedAt
  }));

  const backupEvents = backups.map((backup) => ({
    id: `backup-${backup._id}`,
    type: backup.backupType === 'database' ? 'Database' : 'Version',
    title: backup.backupType === 'database'
      ? `${backup.fileName} created`
      : `${backup.originalName} captured`,
    subtitle: backup.backupType === 'database'
      ? 'Automated or manual database snapshot'
      : `Recovery point v${backup.versionNumber}`,
    timestamp: backup.createdAt
  }));

  const items = [...fileEvents, ...backupEvents]
    .sort((firstItem, secondItem) => new Date(secondItem.timestamp) - new Date(firstItem.timestamp))
    .slice(0, 6);

  const formatTime = (dateValue) =>
    new Date(dateValue).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

  return (
    <section className="activity-feed">
      <div className="section-header">
        <div>
          <h2 className="section-title">Recent Activity</h2>
          <p className="section-subtitle">Latest file changes and backup events from your workspace.</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="activity-empty">No activity yet. Upload a file or trigger a database backup.</div>
      ) : (
        <div className="activity-list">
          {items.map((item) => (
            <article key={item.id} className="activity-item">
              <div className="activity-badge">{item.type}</div>
              <div className="activity-content">
                <strong>{item.title}</strong>
                <p>{item.subtitle}</p>
              </div>
              <time>{formatTime(item.timestamp)}</time>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default ActivityFeed;
