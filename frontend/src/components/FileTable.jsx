import { useState } from 'react';
import './FileTable.css';

function FileTable({ files, onDownload, onDelete, onRestore }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'uploadedAt', direction: 'desc' });

  // Filter files based on search
  const filteredFiles = files.filter((file) =>
    file.originalName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Sort files
  const sortedFiles = [...filteredFiles].sort((a, b) => {
    if (sortConfig.key === 'uploadedAt') {
      return sortConfig.direction === 'asc'
        ? new Date(a.uploadedAt) - new Date(b.uploadedAt)
        : new Date(b.uploadedAt) - new Date(a.uploadedAt);
    }
    if (sortConfig.key === 'fileSize') {
      return sortConfig.direction === 'asc'
        ? a.fileSize - b.fileSize
        : b.fileSize - a.fileSize;
    }
    if (sortConfig.key === 'originalName') {
      return sortConfig.direction === 'asc'
        ? a.originalName.localeCompare(b.originalName)
        : b.originalName.localeCompare(a.originalName);
    }
    return 0;
  });

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return ' ↕️';
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <div className="file-table-section" id="files">
      <div className="section-header">
        <div className="title-wrapper">
          <h2 className="section-title">📁 My Uploaded Files</h2>
          <span className="file-count">{files.length} files</span>
        </div>
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {files.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3 className="empty-title">No files uploaded yet</h3>
          <p className="empty-subtitle">Upload your first file to get started</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="file-table">
            <thead>
              <tr>
                <th className="th-icon">📄</th>
                <th 
                  className="sortable" 
                  onClick={() => handleSort('originalName')}
                >
                  Filename{getSortIcon('originalName')}
                </th>
                <th 
                  className="sortable"
                  onClick={() => handleSort('uploadedAt')}
                >
                  Upload Date{getSortIcon('uploadedAt')}
                </th>
                <th 
                  className="sortable"
                  onClick={() => handleSort('fileSize')}
                >
                  Size{getSortIcon('fileSize')}
                </th>
                <th className="actions-header">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedFiles.map((file) => (
                <tr key={file._id} className="file-row">
                  <td className="td-icon">
                    <div className="file-type-icon">📄</div>
                  </td>
                  <td className="td-name">
                    <span className="file-name-text">{file.originalName}</span>
                  </td>
                  <td className="td-date">{formatDate(file.uploadedAt)}</td>
                  <td className="td-size">
                    <span className="size-badge">{formatFileSize(file.fileSize)}</span>
                  </td>
                  <td className="td-actions">
                    <button
                      className="action-btn download"
                      onClick={() => onDownload(file._id, file.originalName)}
                      title="Download"
                    >
                      ⬇️
                    </button>
                    <button
                      className="action-btn restore"
                      onClick={() => onRestore(file)}
                      title="Restore"
                    >
                      ↩️
                    </button>
                    <button
                      className="action-btn delete"
                      onClick={() => onDelete(file._id, file.originalName)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default FileTable;
