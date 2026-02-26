import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Sidebar from '../components/Sidebar';
import DashboardCards from '../components/DashboardCards';
import UploadSection from '../components/UploadSection';
import FileTable from '../components/FileTable';
import './Dashboard.css';

// Storage limit in bytes (100MB for demo)
const STORAGE_LIMIT = 100 * 1024 * 1024;

function Dashboard() {
  const { user, logout } = useAuth();
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Fetch files on mount
  useEffect(() => {
    fetchFiles();
  }, []);

  // Auto-hide notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchFiles = async () => {
    try {
      const res = await api.get('/file/files');
      setFiles(res.data.files || []);
    } catch (error) {
      console.error('Error fetching files:', error);
      showNotification('Failed to fetch files', 'error');
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
  };

  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      await api.post('/file/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showNotification('File uploaded successfully!');
      fetchFiles();
    } catch (error) {
      showNotification(
        error.response?.data?.message || 'Upload failed',
        'error'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (fileId, fileName) => {
    try {
      const res = await api.get(`/file/files/${fileId}`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showNotification('File downloaded successfully!');
    } catch (error) {
      showNotification(
        error.response?.data?.message || 'Download failed',
        'error'
      );
    }
  };

  const handleDelete = async (fileId, fileName) => {
    if (!window.confirm(`Are you sure you want to delete "${fileName}"?`)) {
      return;
    }

    try {
      await api.delete(`/file/files/${fileId}`);
      showNotification('File deleted successfully!');
      fetchFiles();
    } catch (error) {
      showNotification(
        error.response?.data?.message || 'Delete failed',
        'error'
      );
    }
  };

  const handleRestore = async (file) => {
    // Restore functionality - for now shows info
    showNotification(`Restore feature: "${file.originalName}" can be restored from backup`, 'info');
  };

  // Calculate stats using useMemo for performance
  const stats = useMemo(() => {
    const totalUploads = files.length;
    const storageUsed = files.reduce((total, file) => total + (file.fileSize || 0), 0);
    
    const lastUploadDate = files.length > 0
      ? files.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))[0].uploadedAt
      : null;

    return { totalUploads, storageUsed, lastUploadDate };
  }, [files]);

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="top-header">
          <div className="header-left">
            <h1 className="welcome-title">
              Welcome back, <span className="highlight">{user?.name || 'Student'}</span> 👋
            </h1>
            <p className="welcome-subtitle">Manage your cloud backups efficiently</p>
          </div>
          <div className="header-right">
            <div className="profile-section">
              <div className="avatar">
                {user?.name?.charAt(0)?.toUpperCase() || 'S'}
              </div>
              <div className="profile-info">
                <span className="profile-name">{user?.name}</span>
                <span className="profile-email">{user?.email}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Notification */}
        {notification && (
          <div className={`notification ${notification.type}`}>
            <span className="notification-icon">
              {notification.type === 'success' ? '✅' : 
               notification.type === 'error' ? '❌' : 'ℹ️'}
            </span>
            {notification.message}
          </div>
        )}

        {/* Dashboard Summary Cards */}
        <DashboardCards
          totalUploads={stats.totalUploads}
          storageUsed={stats.storageUsed}
          storageLimit={STORAGE_LIMIT}
          lastUploadDate={stats.lastUploadDate}
        />

        {/* Upload Section */}
        <UploadSection onUpload={handleUpload} uploading={uploading} />

        {/* Files Table */}
        <FileTable
          files={files}
          onDownload={handleDownload}
          onDelete={handleDelete}
          onRestore={handleRestore}
        />
      </main>
    </div>
  );
}

export default Dashboard;
