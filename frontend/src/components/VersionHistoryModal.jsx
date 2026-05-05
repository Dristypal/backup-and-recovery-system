import './VersionHistoryModal.css';

function VersionHistoryModal({
  file,
  versions,
  loading,
  onClose,
  onDownloadVersion,
  onRestoreVersion,
  activeDownloadId,
  activeRestoreId
}) {
  if (!file) {
    return null;
  }

  const formatDate = (dateValue) =>
    new Date(dateValue).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

  return (
    <div className="version-modal-overlay" onClick={onClose}>
      <div className="version-modal" onClick={(event) => event.stopPropagation()}>
        <div className="version-modal-header">
          <div>
            <p className="version-modal-kicker">Version History</p>
            <h3>{file.originalName}</h3>
            <p className="version-modal-subtitle">
              Review S3-backed versions and restore a previous recovery point safely.
            </p>
          </div>
          <button className="version-close" onClick={onClose}>Close</button>
        </div>

        {loading ? (
          <div className="version-empty">Loading versions...</div>
        ) : versions.length === 0 ? (
          <div className="version-empty">No previous versions found for this file.</div>
        ) : (
          <div className="version-list">
            {versions.map((version) => (
              <article key={version._id} className="version-item">
                <div className="version-main">
                  <div className="version-pill-wrap">
                    <span className="version-pill">v{version.versionNumber}</span>
                    {version.isLatest && <span className="version-status">Latest</span>}
                  </div>
                  <strong>{formatDate(version.createdAt)}</strong>
                  <p>{version.mimeType} - {version.category || 'other'} - {(version.fileSize / (1024 * 1024)).toFixed(2)} MB</p>
                </div>

                <div className="version-actions">
                  <button
                    className="version-action secondary"
                    onClick={() => onDownloadVersion(version)}
                    disabled={activeDownloadId === version._id}
                  >
                    {activeDownloadId === version._id ? 'Downloading...' : 'Download'}
                  </button>
                  <button
                    className="version-action primary"
                    onClick={() => onRestoreVersion(version)}
                    disabled={version.isLatest || activeRestoreId === version._id}
                  >
                    {activeRestoreId === version._id ? 'Restoring...' : version.isLatest ? 'Current Version' : 'Restore'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default VersionHistoryModal;
