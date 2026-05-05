import './DashboardCards.css';

function DashboardCards({ totalUploads, storageUsed, storageLimit, lastUploadDate, lastBackupDate, backupCount }) {
  const storagePercentage = Math.min((storageUsed / storageLimit) * 100, 100);
  const storageRemaining = Math.max(storageLimit - storageUsed, 0);

  const formatSize = (bytes) => {
    if (!bytes) {
      return '0 Bytes';
    }

    const units = ['Bytes', 'KB', 'MB', 'GB'];
    const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const size = bytes / 1024 ** unitIndex;

    return `${size.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) {
      return 'No uploads yet';
    }

    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <section className="dashboard-cards">
      <article className="card card-uploads">
        <div className="card-icon">Files</div>
        <div className="card-content">
          <h3 className="card-title">Total Files</h3>
          <p className="card-value">{totalUploads}</p>
          <p className="card-subtitle">Protected file entries in MongoDB</p>
        </div>
      </article>

      <article className="card card-storage">
        <div className="card-icon">Usage</div>
        <div className="card-content">
          <h3 className="card-title">Storage Used</h3>
          <p className="card-value">{formatSize(storageUsed)}</p>
          <div className="progress-container">
            <div className="progress-bar" style={{ width: `${storagePercentage}%` }}></div>
          </div>
          <p className="card-subtitle">
            {storagePercentage.toFixed(1)}% used, {formatSize(storageRemaining)} remaining
          </p>
        </div>
      </article>

      <article className="card card-last-upload">
        <div className="card-icon">Backups</div>
        <div className="card-content">
          <h3 className="card-title">Recovery Points</h3>
          <p className="card-value">{backupCount}</p>
          <p className="card-subtitle">Last backup: {formatDate(lastBackupDate)}</p>
          <p className="card-subtitle">Last upload: {formatDate(lastUploadDate)}</p>
        </div>
      </article>
    </section>
  );
}

export default DashboardCards;
