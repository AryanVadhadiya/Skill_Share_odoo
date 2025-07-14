import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const AdminAccess = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [showKeyInput, setShowKeyInput] = useState(false);

  const makeAdmin = async () => {
    if (!user) {
      setMessage('Please login first');
      return;
    }

    if (!adminKey) {
      setMessage('Please enter the admin key');
      return;
    }

    if (adminKey !== 'Admin@odoo') {
      setMessage('Incorrect admin key');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await axios.put(`/api/admin/make-admin/${user.email}`);
      setMessage('Successfully made admin! Please refresh the page.');

      // Update user context with admin role
      updateUser({ ...user, role: 'admin' });

      // Reload the page after a short delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to make admin');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAdmin = () => {
    setShowKeyInput(true);
    setMessage('');
  };

  if (!user) {
    return (
      <div className="container">
        <div className="card">
          <h2>Admin Access</h2>
          <p>Please login first to access admin features.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <h2>Admin Access</h2>
        <p>Current user: {user.name} ({user.email})</p>
        <p>Current role: {user.role || 'user'}</p>

        {user.role === 'admin' ? (
          <div className="success">
            <p>✅ You are already an admin! You can access the admin dashboard.</p>
            <a href="/admin" className="btn btn-primary">Go to Admin Dashboard</a>
          </div>
        ) : (
          <div>
            <p>To become an admin, you need to provide the correct admin key.</p>

            {!showKeyInput ? (
              <button
                onClick={handleRequestAdmin}
                className="btn btn-primary"
              >
                Request Admin Access
              </button>
            ) : (
              <div className="form-group">
                <label htmlFor="adminKey">Admin Key:</label>
                <input
                  type="password"
                  id="adminKey"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  className="form-control"
                  placeholder="Enter admin key"
                  style={{ marginBottom: '10px' }}
                />
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={makeAdmin}
                    disabled={loading || !adminKey}
                    className="btn btn-primary"
                  >
                    {loading ? 'Making Admin...' : 'Make Me Admin'}
                  </button>
                  <button
                    onClick={() => {
                      setShowKeyInput(false);
                      setAdminKey('');
                      setMessage('');
                    }}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {message && (
          <div className={`alert ${message.includes('Success') ? 'alert-success' : 'alert-danger'}`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAccess;
