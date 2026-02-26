import './DashboardCards.css';

function DashboardCards({ totalUploads, storageUsed, storageLimit, lastUploadDate }) {
  // Calculate storage percentage
  const storagePercentage = Math.min((storageUsed / storageLimit) * 100, 100);
  const storageRemaining = storageLimit - storageUsed;

  // Format file size
  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'No uploads yet';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="dashboard-cards">
      {/* Total Uploads Card */}
      <div className="card card-uploads">
        <div className="card-icon">📦</div>
        <div className="card-content">
          <h3 className="card-title">Total Uploads</h3>
          <p className="card-value">{totalUploads}</p>
          <p className="card-subtitle">Files stored</p>
        </div>
      </div>

      {/* Storage Used Card */}
      <div className="card card-storage">
        <div className="card-icon">💾</div>
        <div className="card-content">
          <h3 className="card-title">Storage Used</h3>
          <p className="card-value">{formatSize(storageUsed)}</p>
          <div className="progress-container">
            <div 
              className="progress-bar" 
              style={{ width: `${storagePercentage}%` }}
            ></div>
          </div>
          <p className="card-subtitle">
            {storagePercentage.toFixed(1)}% of {formatSize(storageLimit)} used
          </p>
        </div>
      </div>

      {/* Last Upload Card */}
      <div className="card card-last-upload">
        <div className="card-icon">🕐</div>
        <div className="card-content">
          <h3 className="card-title">Last Upload</h3>
          <p className="card-value">{formatDate(lastUploadDate)}</p>
          <p className="card-subtitle">
            {storageRemaining > 0 
              ? `${formatSize(storageRemaining)} remaining` 
              : 'Storage full'}
          </p>
        </div>
      </div>
    </div>
  );
}

export default DashboardCards;
