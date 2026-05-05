import { useLocation, useNavigate } from 'react-router-dom';
import './Sidebar.css';

function Sidebar({ onCreateBackup, onRestoreLatestBackup, backupLoading, isAdmin }) {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: 'Dashboard' },
    { path: '/dashboard#upload', label: 'Upload Files', icon: 'Upload' },
    { path: '/dashboard#files', label: 'My Files', icon: 'Files' },
    { path: '/dashboard#backups', label: 'Backups', icon: 'Recovery' }
  ];

  const handleNavigate = (path) => {
    if (path.includes('#')) {
      window.location.assign(path);
      return;
    }

    navigate(path);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <span className="logo-icon">CB</span>
          <span className="logo-text">CLOUDORIA</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => handleNavigate(item.path)}
            className={`nav-item ${location.pathname === '/dashboard' && item.path.startsWith('/dashboard') ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>

      {isAdmin && (
        <div className="sidebar-footer action-stack">
          <button onClick={onCreateBackup} className="sidebar-action primary" disabled={backupLoading}>
            {backupLoading ? 'Creating...' : 'Backup Now'}
          </button>
          <button onClick={onRestoreLatestBackup} className="sidebar-action secondary" disabled={backupLoading}>
            Restore Latest
          </button>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
