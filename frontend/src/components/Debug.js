import React from 'react';
import { useAuth } from '../context/AuthContext';

const Debug = () => {
  const { user, loading } = useAuth();

  return (
    <div className="container">
      <div className="card">
        <h2>Debug Information</h2>
        <div style={{ textAlign: 'left', fontFamily: 'monospace' }}>
          <p><strong>Loading:</strong> {loading ? 'true' : 'false'}</p>
          <p><strong>User:</strong> {user ? JSON.stringify(user, null, 2) : 'null'}</p>
          <p><strong>User Role:</strong> {user?.role || 'undefined'}</p>
          <p><strong>Current URL:</strong> {window.location.href}</p>
          <p><strong>User Agent:</strong> {navigator.userAgent}</p>
        </div>
        
        <div style={{ marginTop: '20px' }}>
          <h3>Quick Links:</h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <a href="/" className="btn btn-primary">Home</a>
            <a href="/browse" className="btn btn-primary">Browse</a>
            {user && (
              <>
                <a href="/profile" className="btn btn-primary">Profile</a>
                <a href="/my-swaps" className="btn btn-primary">My Swaps</a>
                <a href="/admin-access" className="btn btn-primary">Admin Access</a>
                {user.role === 'admin' && (
                  <a href="/admin" className="btn btn-primary">Admin Dashboard</a>
                )}
              </>
            )}
            {!user && (
              <>
                <a href="/login" className="btn btn-primary">Login</a>
                <a href="/register" className="btn btn-primary">Register</a>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Debug; 