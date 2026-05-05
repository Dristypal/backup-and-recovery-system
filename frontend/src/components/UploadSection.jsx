import { useRef, useState } from 'react';
import './UploadSection.css';

function UploadSection({ onUpload, uploading }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const inputRef = useRef(null);

  const updateSelectedFile = (file) => {
    setSelectedFile(file || null);
  };

  const handleDrag = (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (event.type === 'dragenter' || event.type === 'dragover') {
      setDragActive(true);
    } else {
      setDragActive(false);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);

    if (event.dataTransfer.files?.[0]) {
      updateSelectedFile(event.dataTransfer.files[0]);
    }
  };

  const handleUploadClick = async () => {
    if (!selectedFile) {
      return;
    }

    await onUpload(selectedFile);
    updateSelectedFile(null);

    if (inputRef.current) {
      inputRef.current.value = '';
    }
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

  return (
    <section className="upload-section" id="upload">
      <div className="section-header">
        <h2 className="section-title">Upload Your Next Recovery Point</h2>
        <p className="section-subtitle">
          Drop a file here and the app will store it in S3 with metadata and version history.
        </p>
      </div>

      <div
        className={`upload-area ${dragActive ? 'drag-active' : ''} ${selectedFile ? 'has-file' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          onChange={(event) => updateSelectedFile(event.target.files?.[0])}
          className="file-input"
        />

        {selectedFile ? (
          <div className="file-selected">
            <div className="file-icon">FILE</div>
            <div className="file-info">
              <p className="file-name">{selectedFile.name}</p>
              <p className="file-size">{formatFileSize(selectedFile.size)}</p>
            </div>
            <button
              className="remove-file-btn"
              onClick={(event) => {
                event.stopPropagation();
                updateSelectedFile(null);
                if (inputRef.current) {
                  inputRef.current.value = '';
                }
              }}
            >
              X
            </button>
          </div>
        ) : (
          <div className="upload-placeholder">
            <div className="upload-icon">S3</div>
            <p className="upload-text">
              Drag and drop files here or <span className="upload-link">browse from your device</span>
            </p>
            <p className="upload-hint">Each re-upload of the same filename creates a new recoverable version.</p>
          </div>
        )}
      </div>

      <div className="upload-actions">
        <button
          className="upload-btn"
          onClick={handleUploadClick}
          disabled={!selectedFile || uploading}
        >
          {uploading ? 'Uploading...' : 'Upload to Backup Vault'}
        </button>
      </div>
    </section>
  );
}

export default UploadSection;
