import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import './Auth.css';

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    adminCode: ''
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');

    try {
      setLoading(true);
      await register(formData.name, formData.email, formData.password, formData.role, formData.adminCode);
      navigate('/dashboard');
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="auth-panel brand">
        <p className="auth-kicker">Production Ready Recovery Flow</p>
        <h1>Build your own secure backup workspace.</h1>
        <p>
          Register once and manage file uploads, database snapshots, and restore operations from the same app.
        </p>
        <ul className="feature-list">
          <li>AWS SDK integration</li>
          <li>S3 version history</li>
          <li>Daily cron-based backup automation</li>
        </ul>
      </div>

      <div className="auth-panel form">
        <div className="auth-header">
          <div className="auth-logo">CB</div>
          <h2>Create Account</h2>
          <p>Start managing backups from your dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="form-label">
            Full Name
            <input
              type="text"
              placeholder="Eshika Mathur"
              value={formData.name}
              onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
              className="form-input"
              required
            />
          </label>

          <label className="form-label">
            Email
            <input
              type="email"
              placeholder="eshika@example.com"
              value={formData.email}
              onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
              className="form-input"
              required
            />
          </label>

          <label className="form-label">
            Password
            <input
              type="password"
              placeholder="Minimum 6 characters"
              value={formData.password}
              onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))}
              className="form-input"
              minLength={6}
              required
            />
          </label>

          <label className="form-label">
            Account Role
            <select
              value={formData.role}
              onChange={(event) => setFormData((current) => ({ ...current, role: event.target.value }))}
              className="form-input"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </label>

          {formData.role === 'admin' && (
            <label className="form-label">
              Admin Code
              <input
                type="password"
                placeholder="Enter admin registration code"
                value={formData.adminCode}
                onChange={(event) => setFormData((current) => ({ ...current, adminCode: event.target.value }))}
                className="form-input"
                required
              />
            </label>
          )}

          {errorMessage && <div className="form-alert">{errorMessage}</div>}

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Creating account...' : 'Register'}
          </button>

          <p className="auth-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Register;
