import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

function ProtectedRoute({ children }) {
  const { loading, user } = useAuth();

  if (loading) {
    return (
      <div style={styles.wrapper}>
        <div style={styles.card}>
          <div style={styles.loader}></div>
          <p style={styles.text}>Restoring your session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

const styles = {
  wrapper: {
    alignItems: 'center',
    background: 'linear-gradient(180deg, #f4efe4 0%, #ece3d4 100%)',
    display: 'flex',
    height: '100vh',
    justifyContent: 'center'
  },
  card: {
    alignItems: 'center',
    background: '#ffffff',
    borderRadius: '20px',
    boxShadow: '0 24px 60px rgba(57, 44, 25, 0.12)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '32px 42px'
  },
  loader: {
    animation: 'spin 0.9s linear infinite',
    border: '4px solid rgba(56, 98, 86, 0.18)',
    borderRadius: '999px',
    borderTopColor: '#245d50',
    height: '44px',
    width: '44px'
  },
  text: {
    color: '#3f3426',
    fontSize: '15px',
    margin: 0
  }
};

export default ProtectedRoute;
