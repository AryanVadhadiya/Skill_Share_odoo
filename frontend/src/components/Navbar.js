import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const location = useLocation();

  const isActive = (path) => location.pathname === path ? 'active' : '';

  return (
    <nav className="navbar" aria-label="Main Navigation">
      <div className="container">
        <div className="navbar-content" style={{ gap: 32 }}>
          <Link to="/" className="navbar-brand" style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: 1 }}>
            <span className="brand-text">SkillSwap</span>
        </Link>

          <div className="navbar-menu" style={{ gap: 24 }}>
            <Link to="/" className={`nav-link ${isActive('/')}`}>Home</Link>
            <Link to="/browse" className={`nav-link ${isActive('/browse')}`}>Browse Users</Link>
            {user && (
            <>
                <Link to="/my-swaps" className={`nav-link ${isActive('/my-swaps')}`}>My Swaps</Link>
                <Link to="/profile" className={`nav-link ${isActive('/profile')}`}>Profile</Link>
                <Link to="/admin-access" className={`nav-link ${isActive('/admin-access')}`}>Admin</Link>
              </>
              )}
          </div>

          <div className="navbar-actions" style={{ gap: 16 }}>
                <button
              onClick={toggleTheme}
              className="theme-toggle"
              aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
              style={{ fontSize: '1.5rem', padding: '6px 10px' }}
            >
              {isDarkMode ? '☀️' : '🌙'}
            </button>
            {user && (
              <>
                <Link to="/profile" style={{ textDecoration: 'none' }}>
                  <div className="user-avatar" style={{ width: 40, height: 40, fontSize: '1.2rem', cursor: 'pointer' }}>
                    {user.profilePhoto ? (
                      <img src={user.profilePhoto} alt={user.name} />
                    ) : (
                      <span>{user.name.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                </Link>
                <button onClick={logout} className="logout-btn" style={{ fontSize: '1rem', padding: '8px 16px' }}>
                  Logout
                </button>
            </>
          )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
