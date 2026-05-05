import { useState } from 'react';
import './FileTable.css';

function FileTable({ files, onDelete, onDownload, onRestore }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'uploadedAt', direction: 'desc' });

  const filteredFiles = files.filter((file) =>
    file.originalName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedFiles = [...filteredFiles].sort((firstFile, secondFile) => {
    const directionMultiplier = sortConfig.direction === 'asc' ? 1 : -1;

    if (sortConfig.key === 'uploadedAt') {
      return (new Date(firstFile.uploadedAt) - new Date(secondFile.uploadedAt)) * directionMultiplier;
    }

    if (sortConfig.key === 'fileSize') {
      return (firstFile.fileSize - secondFile.fileSize) * directionMultiplier;
    }

    if (sortConfig.key === 'currentVersion') {
      return (firstFile.currentVersion - secondFile.currentVersion) * directionMultiplier;
    }

    if (sortConfig.key === 'category') {
      return (firstFile.category || 'other').localeCompare(secondFile.category || 'other') * directionMultiplier;
    }

    return firstFile.originalName.localeCompare(secondFile.originalName) * directionMultiplier;
  });

  const handleSort = (key) => {
    setSortConfig((currentConfig) => ({
      key,
      direction: currentConfig.key === key && currentConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const formatFileSize = (bytes) => {
    if (!bytes) {
      return '0 Bytes';
    }

    const units = ['Bytes', 'KB', 'MB', 'GB'];
    const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const size = bytes / 1024 ** unitIndex;

    return `${size.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`;
  };

  const formatDate = (dateValue) =>
    new Date(dateValue).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

  const getSortMarker = (key) => {
    if (sortConfig.key !== key) {
      return ' <> ';
    }

    return sortConfig.direction === 'asc' ? ' ^' : ' v';
  };

  return (
    <section className="file-table-section" id="files">
      <div className="section-header">
        <div className="title-wrapper">
          <h2 className="section-title">Protected Files</h2>
          <span className="file-count">{files.length} items</span>
        </div>

        <div className="search-box">
          <span className="search-icon">Find</span>
          <input
            type="text"
            placeholder="Search by filename"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {files.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">Vault</div>
          <h3 className="empty-title">No files backed up yet</h3>
          <p className="empty-subtitle">Upload a file to start building your recovery history.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="file-table">
            <thead>
              <tr>
                <th>Type</th>
                <th className="sortable" onClick={() => handleSort('originalName')}>
                  Filename{getSortMarker('originalName')}
                </th>
                <th className="sortable" onClick={() => handleSort('currentVersion')}>
                  Version{getSortMarker('currentVersion')}
                </th>
                <th className="sortable" onClick={() => handleSort('category')}>
                  Category{getSortMarker('category')}
                </th>
                <th className="sortable" onClick={() => handleSort('uploadedAt')}>
                  Updated{getSortMarker('uploadedAt')}
                </th>
                <th className="sortable" onClick={() => handleSort('fileSize')}>
                  Size{getSortMarker('fileSize')}
                </th>
                <th className="actions-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedFiles.map((file) => (
                <tr key={file._id} className="file-row">
                  <td className="td-icon">
                    <div className="file-type-icon">S3</div>
                  </td>
                  <td className="td-name">
                    <span className="file-name-text">{file.originalName}</span>
                    <span className="file-subtext">{file.mimeType || 'application/octet-stream'}</span>
                  </td>
                  <td className="td-version">
                    <span className="version-pill">v{file.currentVersion}</span>
                  </td>
                  <td className="td-category">
                    <span className="size-badge">{file.category || 'other'}</span>
                  </td>
                  <td className="td-date">{formatDate(file.uploadedAt)}</td>
                  <td className="td-size">
                    <span className="size-badge">{formatFileSize(file.fileSize)}</span>
                  </td>
                  <td className="td-actions">
                    <button className="action-btn download" onClick={() => onDownload(file)} title="Download latest version">
                      Download
                    </button>
                    <button className="action-btn restore" onClick={() => onRestore(file)} title="Open version history">
                      Versions
                    </button>
                    <button className="action-btn delete" onClick={() => onDelete(file)} title="Delete file metadata">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default FileTable;
