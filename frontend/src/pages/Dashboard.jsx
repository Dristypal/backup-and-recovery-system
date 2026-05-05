import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/useAuth';
import api from '../utils/api';
import BackupPanel from '../components/BackupPanel';
import ControlCenter from '../components/ControlCenter';
import DashboardCards from '../components/DashboardCards';
import FileTable from '../components/FileTable';
import Sidebar from '../components/Sidebar';
import UploadSection from '../components/UploadSection';
import VersionHistoryModal from '../components/VersionHistoryModal';
import ActivityFeed from '../components/ActivityFeed';
import './Dashboard.css';

const STORAGE_LIMIT = 100 * 1024 * 1024;

function Dashboard() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [files, setFiles] = useState([]);
  const [backups, setBackups] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [loadingBackups, setLoadingBackups] = useState(true);
  const [notification, setNotification] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileVersions, setFileVersions] = useState([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [activeDownloadId, setActiveDownloadId] = useState(null);
  const [activeRestoreId, setActiveRestoreId] = useState(null);
  const [restoreMode, setRestoreMode] = useState('replace');
  const [refreshing, setRefreshing] = useState(false);

  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type });
  }, []);

  useEffect(() => {
    if (!notification) {
      return undefined;
    }

    const timer = setTimeout(() => setNotification(null), 3500);
    return () => clearTimeout(timer);
  }, [notification]);

  const fetchFiles = useCallback(async () => {
    try {
      const response = await api.get('/files');
      setFiles(response.data.files || []);
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to fetch files', 'error');
    }
  }, [showNotification]);

  const fetchBackups = useCallback(async () => {
    try {
      setLoadingBackups(true);
      const response = await api.get('/backups');
      setBackups(response.data.backups || []);
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to fetch backups', 'error');
    } finally {
      setLoadingBackups(false);
    }
  }, [showNotification]);

  const fetchDashboardData = useCallback(async () => {
    await Promise.all([fetchFiles(), fetchBackups()]);
  }, [fetchBackups, fetchFiles]);

  useEffect(() => {
    void fetchDashboardData();
  }, [fetchDashboardData]);

  const refreshDashboard = async () => {
    try {
      setRefreshing(true);
      await fetchDashboardData();
      showNotification('Dashboard refreshed successfully');
    } catch {
      showNotification('Failed to refresh dashboard', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  const handleUpload = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      setUploading(true);
      const response = await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showNotification(response.data.message || 'File uploaded successfully');
      await fetchDashboardData();
    } catch (error) {
      showNotification(error.response?.data?.message || 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (file) => {
    try {
      await downloadBlobFromApi(`/files/${file._id}/download`, file.originalName);
      showNotification('File downloaded successfully');
    } catch (error) {
      showNotification(error.response?.data?.message || 'Download failed', 'error');
    }
  };

  const handleDelete = async (file) => {
    const confirmed = window.confirm(`Delete metadata for "${file.originalName}"?`);
    if (!confirmed) {
      return;
    }

    try {
      const response = await api.delete(`/files/${file._id}`);
      showNotification(response.data.message || 'File deleted successfully');
      await fetchDashboardData();
    } catch (error) {
      showNotification(error.response?.data?.message || 'Delete failed', 'error');
    }
  };

  const openFileVersionHistory = async (fileOrId) => {
    try {
      const file = typeof fileOrId === 'string'
        ? files.find((currentFile) => currentFile._id === fileOrId)
        : fileOrId;

      if (!file) {
        showNotification('File not found in the current session', 'error');
        return;
      }

      setSelectedFile(file);
      setLoadingVersions(true);
      const versionResponse = await api.get(`/files/${file._id}/versions`);
      setFileVersions(versionResponse.data.versions || []);
    } catch (error) {
      showNotification(error.response?.data?.message || 'Failed to load version history', 'error');
    } finally {
      setLoadingVersions(false);
    }
  };

  const handleCreateDatabaseBackup = async () => {
    try {
      setBackupLoading(true);
      const response = await api.post('/backups/database');
      showNotification(response.data.message || 'Database backup created successfully');
      await fetchBackups();
    } catch (error) {
      showNotification(error.response?.data?.message || 'Database backup failed', 'error');
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestoreLatestBackup = async () => {
    const confirmed = window.confirm('Restore the latest database backup into MongoDB?');
    if (!confirmed) {
      return;
    }

    try {
      setBackupLoading(true);
      const response = await api.post('/backups/restore-latest', { mode: restoreMode });
      showNotification(response.data.message || 'Latest database backup restored');
      await fetchDashboardData();
    } catch (error) {
      showNotification(error.response?.data?.message || 'Restore latest backup failed', 'error');
    } finally {
      setBackupLoading(false);
    }
  };

  const handleDownloadBackup = async (backup) => {
    try {
      await downloadBlobFromApi(`/backups/${backup._id}/download`, backup.originalName);
      showNotification('Backup downloaded successfully');
    } catch (error) {
      showNotification(error.response?.data?.message || 'Backup download failed', 'error');
    }
  };

  const handleRestoreDatabase = async (backup) => {
    const confirmed = window.confirm(`Restore database backup "${backup.fileName}"?`);
    if (!confirmed) {
      return;
    }

    try {
      setBackupLoading(true);
      const response = await api.post(`/backups/${backup._id}/restore`, { mode: restoreMode });
      showNotification(response.data.message || 'Database backup restored');
      await fetchDashboardData();
    } catch (error) {
      showNotification(error.response?.data?.message || 'Database restore failed', 'error');
    } finally {
      setBackupLoading(false);
    }
  };

  const handleDownloadVersion = async (version) => {
    if (!selectedFile) {
      return;
    }

    try {
      setActiveDownloadId(version._id);
      await downloadBlobFromApi(
        `/files/${selectedFile._id}/download?versionId=${encodeURIComponent(version.s3VersionId)}`,
        `${selectedFile.originalName.replace(/\.(?=[^.]+$)/, `-v${version.versionNumber}.`)}`
      );
      showNotification(`Version ${version.versionNumber} downloaded successfully`);
    } catch (error) {
      showNotification(error.response?.data?.message || 'Version download failed', 'error');
    } finally {
      setActiveDownloadId(null);
    }
  };

  const handleRestoreVersion = async (version) => {
    if (!selectedFile) {
      return;
    }

    const confirmed = window.confirm(`Restore version ${version.versionNumber} of "${selectedFile.originalName}"?`);
    if (!confirmed) {
      return;
    }

    try {
      setActiveRestoreId(version._id);
      const response = await api.post(`/files/restore/${version._id}`);
      showNotification(response.data.message || 'File restored successfully');
      await fetchDashboardData();
      await openFileVersionHistory(selectedFile._id);
    } catch (error) {
      showNotification(error.response?.data?.message || 'Version restore failed', 'error');
    } finally {
      setActiveRestoreId(null);
    }
  };

  const closeVersionHistory = () => {
    setSelectedFile(null);
    setFileVersions([]);
    setLoadingVersions(false);
    setActiveDownloadId(null);
    setActiveRestoreId(null);
  };

  const downloadBlobFromApi = async (url, fileName) => {
    const response = await api.get(url, {
      responseType: 'blob'
    });
    const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
    const anchor = document.createElement('a');
    anchor.href = blobUrl;
    anchor.setAttribute('download', fileName);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.URL.revokeObjectURL(blobUrl);
  };

  const stats = useMemo(() => {
    const totalUploads = files.length;
    const storageUsed = files.reduce((runningTotal, file) => runningTotal + (file.fileSize || 0), 0);
    const lastUploadDate = files.length
      ? [...files].sort((left, right) => new Date(right.uploadedAt) - new Date(left.uploadedAt))[0].uploadedAt
      : null;
    const lastBackupDate = backups.length
      ? [...backups].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))[0].createdAt
      : null;

    return {
      totalUploads,
      storageUsed,
      lastUploadDate,
      lastBackupDate,
      backupCount: backups.length
    };
  }, [backups, files]);

  return (
    <div className="dashboard-layout">
      <Sidebar
        onCreateBackup={handleCreateDatabaseBackup}
        onRestoreLatestBackup={handleRestoreLatestBackup}
        backupLoading={backupLoading}
        isAdmin={isAdmin}
      />

      <main className="main-content">
        <header className="top-header">
          <div className="header-copy">
            <p className="eyebrow">Cloud Backup and Recovery</p>
            <h1 className="welcome-title">Welcome back, {user?.name || 'User'}</h1>
            <p className="welcome-subtitle">
              Upload files, inspect versions, trigger database snapshots, and restore from S3 when needed.
            </p>
          </div>

          <div className="header-actions">
            <div className="profile-card">
              <div className="avatar">{user?.name?.slice(0, 1)?.toUpperCase() || 'U'}</div>
              <div>
                <div className="profile-name">{user?.name}</div>
                <div className="profile-email">{user?.email} - {user?.role || 'user'}</div>
              </div>
            </div>
            <button className="logout-button" onClick={logout}>Logout</button>
          </div>
        </header>

        {notification && (
          <div className={`notification ${notification.type}`}>
            <span className="notification-badge">{notification.type === 'error' ? '!' : 'OK'}</span>
            <span>{notification.message}</span>
          </div>
        )}

        <DashboardCards
          totalUploads={stats.totalUploads}
          storageUsed={stats.storageUsed}
          storageLimit={STORAGE_LIMIT}
          lastUploadDate={stats.lastUploadDate}
          lastBackupDate={stats.lastBackupDate}
          backupCount={stats.backupCount}
        />

        <ControlCenter
          restoreMode={restoreMode}
          setRestoreMode={setRestoreMode}
          onRefresh={refreshDashboard}
          refreshing={refreshing}
          files={files}
          backups={backups}
          isAdmin={isAdmin}
        />

        <UploadSection onUpload={handleUpload} uploading={uploading} />

        <FileTable
          files={files}
          onDownload={handleDownload}
          onDelete={handleDelete}
          onRestore={openFileVersionHistory}
        />

        <BackupPanel
          backups={backups}
          loading={loadingBackups}
          onDownload={handleDownloadBackup}
          onRestoreDatabase={handleRestoreDatabase}
          onOpenFileHistory={openFileVersionHistory}
        />

        <ActivityFeed files={files} backups={backups} />
      </main>

      <VersionHistoryModal
        file={selectedFile}
        versions={fileVersions}
        loading={loadingVersions}
        onClose={closeVersionHistory}
        onDownloadVersion={handleDownloadVersion}
        onRestoreVersion={handleRestoreVersion}
        activeDownloadId={activeDownloadId}
        activeRestoreId={activeRestoreId}
      />
    </div>
  );
}

export default Dashboard;
