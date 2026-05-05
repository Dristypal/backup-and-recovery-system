import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import './Auth.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');

    try {
      setLoading(true);
      await login(email, password);
      navigate('/dashboard');
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-panel brand">
        <p className="auth-kicker">Cloud Backup Platform</p>
        <h1>Recover your data without panic.</h1>
        <p>
          Secure files in S3, trigger database snapshots, and restore versions from one dashboard.
        </p>
        <ul className="feature-list">
          <li>Version-aware file recovery</li>
          <li>Daily database backups</li>
          <li>MongoDB metadata and audit logs</li>
        </ul>
      </div>

      <div className="auth-panel form">
        <div className="auth-header">
          <div className="auth-logo">CB</div>
          <h2>Sign In</h2>
          <p>Access your recovery console</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="form-label">
            Email
            <input
              type="email"
              placeholder="eshika@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="form-input"
              required
            />
          </label>

          <label className="form-label">
            Password
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="form-input"
              required
            />
          </label>

          {errorMessage && <div className="form-alert">{errorMessage}</div>}

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Signing in...' : 'Login'}
          </button>

          <p className="auth-footer">
            New here? <Link to="/register">Create an account</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Login;
