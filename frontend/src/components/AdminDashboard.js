import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
  const { api } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [swaps, setSwaps] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('stats');
  const [newMessage, setNewMessage] = useState({
    title: '',
    content: '',
    type: 'info'
  });
  const [skillDescriptions, setSkillDescriptions] = useState([]);
  const [moderationLoading, setModerationLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [swapFilter, setSwapFilter] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      setStats(response.data);
    } catch (error) {
      setError('Failed to load statistics');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      setError('Failed to load users');
    }
  };

  const fetchSwaps = async () => {
    try {
      const response = await api.get('/admin/swaps');
      setSwaps(response.data);
    } catch (error) {
      setError('Failed to load swaps');
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await api.get('/admin/messages');
      setMessages(response.data);
    } catch (error) {
      setError('Failed to load messages');
    }
  };

  const fetchSkillDescriptions = async () => {
    setModerationLoading(true);
    try {
      const res = await api.get('/users/skills/descriptions');
      setSkillDescriptions(res.data);
    } catch (e) {
      setError('Failed to load skill descriptions');
    } finally {
      setModerationLoading(false);
    }
  };

  const handleBanUser = async (userId, isBanned) => {
    try {
      await api.put(`/admin/users/${userId}/ban`, { isBanned });
      fetchUsers();
      fetchStats();
    } catch (error) {
      setError('Failed to update user status');
    }
  };

  const handleMessageSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/messages', newMessage);
      setNewMessage({ title: '', content: '', type: 'info' });
      fetchMessages();
    } catch (error) {
      setError('Failed to create message');
    }
  };

  const handleRejectDescription = async (userId, skill) => {
    try {
      await api.delete(`/users/skills-offered/${userId}/${skill}/description`);
      fetchSkillDescriptions();
    } catch (e) {
      setError('Failed to reject skill description');
    }
  };

  const handleSwapAction = async (swapId, action) => {
    try {
      await api.put(`/swaps/${swapId}/${action}`);
      fetchSwaps();
    } catch (error) {
      setError(error.response?.data?.message || `Failed to ${action} swap`);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError('');

    switch (tab) {
      case 'stats':
        fetchStats();
        break;
      case 'users':
        fetchUsers();
        break;
      case 'swaps':
        fetchSwaps();
        break;
      case 'messages':
        fetchMessages();
        break;
      case 'moderation':
        fetchSkillDescriptions();
        break;
      case 'analytics':
        fetchAnalytics();
        break;
      default:
        break;
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/admin/analytics');
      setAnalytics(response.data);
    } catch (error) {
      setError('Failed to load analytics');
    }
  };

  const downloadReport = async (reportType, format = 'csv') => {
    setReportLoading(true);
    try {
      const response = await api.get(`/admin/reports/${reportType}/download?format=${format}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportType}-report.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError('Failed to download report');
    } finally {
      setReportLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading admin dashboard...</div>;
  }

  return (
    <div>
      <h2 className="text-center mb-20">Admin Dashboard</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Navigation Tabs */}
      <div className="flex" style={{ marginBottom: '20px', borderBottom: '1px solid #ddd' }}>
        <button
          onClick={() => handleTabChange('stats')}
          className={`btn ${activeTab === 'stats' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ marginRight: '10px' }}
        >
          Statistics
        </button>
        <button
          onClick={() => handleTabChange('users')}
          className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ marginRight: '10px' }}
        >
          Users
        </button>
        <button
          onClick={() => handleTabChange('swaps')}
          className={`btn ${activeTab === 'swaps' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ marginRight: '10px' }}
        >
          Swaps
        </button>
        <button
          onClick={() => handleTabChange('messages')}
          className={`btn ${activeTab === 'messages' ? 'btn-primary' : 'btn-secondary'}`}
        >
          Messages
        </button>
        <button
          onClick={() => handleTabChange('moderation')}
          className={`btn ${activeTab === 'moderation' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ marginRight: '10px' }}
        >
          Skill Moderation
        </button>
        <button
          onClick={() => handleTabChange('analytics')}
          className={`btn ${activeTab === 'analytics' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ marginRight: '10px' }}
        >
          Analytics
        </button>
      </div>

      {/* Statistics Tab */}
      {activeTab === 'stats' && stats && (
        <div>
          <div className="admin-stats">
            <div className="stat-card">
              <div className="stat-number">{stats.totalUsers}</div>
              <div className="stat-label">Total Users</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.totalSwaps}</div>
              <div className="stat-label">Total Swaps</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.pendingSwaps}</div>
              <div className="stat-label">Pending Swaps</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.completedSwaps}</div>
              <div className="stat-label">Completed Swaps</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.bannedUsers}</div>
              <div className="stat-label">Banned Users</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{stats.completionRate}%</div>
              <div className="stat-label">Completion Rate</div>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div>
          <h3>User Management</h3>
          <div className="card">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #ddd' }}>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Name</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Email</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Location</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user._id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px' }}>{user.name}</td>
                    <td style={{ padding: '10px' }}>{user.email}</td>
                    <td style={{ padding: '10px' }}>{user.location || 'N/A'}</td>
                    <td style={{ padding: '10px' }}>
                      <span className={`status-badge ${user.isBanned ? 'status-rejected' : 'status-accepted'}`}>
                        {user.isBanned ? 'Banned' : 'Active'}
                      </span>
                    </td>
                    <td style={{ padding: '10px' }}>
                      <button
                        onClick={() => handleBanUser(user._id, !user.isBanned)}
                        className={`btn ${user.isBanned ? 'btn-success' : 'btn-danger'}`}
                        style={{ fontSize: '12px', padding: '5px 10px' }}
                      >
                        {user.isBanned ? 'Unban' : 'Ban'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Swaps Tab */}
      {activeTab === 'swaps' && (
        <div>
          <h3>Swap Monitoring</h3>
          <div className="swap-filters">
            <select
              value={swapFilter}
              onChange={(e) => setSwapFilter(e.target.value)}
              className="form-control"
              style={{ width: '200px' }}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="completed">Completed</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="swaps-table">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #ddd' }}>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Requester</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Recipient</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Skill Offered</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Skill Requested</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Created</th>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {swaps
                  .filter(swap => !swapFilter || swap.status === swapFilter)
                  .map(swap => (
                  <tr key={swap._id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '10px' }}>{swap.requester.name}</td>
                    <td style={{ padding: '10px' }}>{swap.recipient.name}</td>
                    <td style={{ padding: '10px' }}>{swap.skillOffered}</td>
                    <td style={{ padding: '10px' }}>{swap.skillRequested}</td>
                    <td style={{ padding: '10px' }}>
                      <span className={`status-badge ${getStatusColor(swap.status)}`}>
                        {swap.status.charAt(0).toUpperCase() + swap.status.slice(1)}
                      </span>
                    </td>
                    <td style={{ padding: '10px' }}>
                      {new Date(swap.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '10px' }}>
                      <button
                        onClick={() => handleSwapAction(swap._id, 'complete')}
                        className="btn btn-success btn-sm"
                        disabled={swap.status !== 'accepted'}
                      >
                        Complete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Messages Tab */}
      {activeTab === 'messages' && (
        <div>
          <h3>Platform Messages</h3>

          {/* Create New Message */}
          <div className="card mb-20">
            <h4>Create New Message</h4>
            <form onSubmit={handleMessageSubmit}>
              <div className="form-group">
                <label htmlFor="title">Title</label>
                <input
                  type="text"
                  id="title"
                  className="form-control"
                  value={newMessage.title}
                  onChange={(e) => setNewMessage(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="content">Content</label>
                <textarea
                  id="content"
                  className="form-control"
                  rows="4"
                  value={newMessage.content}
                  onChange={(e) => setNewMessage(prev => ({ ...prev, content: e.target.value }))}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="type">Type</label>
                <select
                  id="type"
                  className="form-control"
                  value={newMessage.type}
                  onChange={(e) => setNewMessage(prev => ({ ...prev, type: e.target.value }))}
                >
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="alert">Alert</option>
                  <option value="update">Update</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary">
                Create Message
              </button>
            </form>
          </div>

          {/* Existing Messages */}
          <div className="card">
            <h4>Existing Messages</h4>
            {messages.map(message => (
              <div key={message._id} className="card" style={{ marginBottom: '15px' }}>
                <div className="flex flex-between">
                  <h5>{message.title}</h5>
                  <span className={`status-badge ${message.isActive ? 'status-accepted' : 'status-cancelled'}`}>
                    {message.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p>{message.content}</p>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  Type: {message.type} | Created: {new Date(message.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skill Moderation Tab */}
      {activeTab === 'moderation' && (
        <div>
          <h3>Skill Description Moderation</h3>
          {moderationLoading ? <div>Loading...</div> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr><th>User</th><th>Skill</th><th>Description</th><th>Action</th></tr>
              </thead>
              <tbody>
                {skillDescriptions.map(desc => (
                  <tr key={desc.userId + desc.skill}>
                    <td>{desc.userName}</td>
                    <td>{desc.skill}</td>
                    <td>{desc.description}</td>
                    <td><button className="btn btn-danger" onClick={() => handleRejectDescription(desc.userId, desc.skill)}>Reject</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && analytics && (
        <div className="analytics-dashboard">
          <div className="analytics-header">
            <h3>Platform Analytics</h3>
            <div className="report-actions">
              <button
                onClick={() => downloadReport('user-activity', 'csv')}
                className="btn btn-secondary"
                disabled={reportLoading}
              >
                {reportLoading ? 'Downloading...' : 'Download User Report'}
              </button>
              <button
                onClick={() => downloadReport('feedback-logs', 'csv')}
                className="btn btn-secondary"
                disabled={reportLoading}
              >
                {reportLoading ? 'Downloading...' : 'Download Feedback Report'}
              </button>
              <button
                onClick={() => downloadReport('swap-stats', 'csv')}
                className="btn btn-secondary"
                disabled={reportLoading}
              >
                {reportLoading ? 'Downloading...' : 'Download Swap Report'}
              </button>
            </div>
          </div>

          <div className="analytics-grid">
            <div className="analytics-card">
              <h4>User Analytics</h4>
              <div className="analytics-stats">
                <div className="stat-item">
                  <span className="stat-label">Total Users:</span>
                  <span className="stat-value">{analytics.userAnalytics.totalUsers}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Active Users:</span>
                  <span className="stat-value">{analytics.userAnalytics.activeUsers}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Banned Users:</span>
                  <span className="stat-value">{analytics.userAnalytics.bannedUsers}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Public Profiles:</span>
                  <span className="stat-value">{analytics.userAnalytics.publicProfiles}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Average Rating:</span>
                  <span className="stat-value">{analytics.userAnalytics.averageRating}</span>
                </div>
              </div>

              <div className="top-skills">
                <h5>Top Skills Offered</h5>
                <div className="skills-list">
                  {analytics.userAnalytics.topSkills.map((skill, index) => (
                    <div key={index} className="skill-item">
                      <span>{skill.skill}</span>
                      <span className="skill-count">{skill.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="analytics-card">
              <h4>Swap Analytics</h4>
              <div className="analytics-stats">
                <div className="stat-item">
                  <span className="stat-label">Total Swaps:</span>
                  <span className="stat-value">{analytics.swapAnalytics.totalSwaps}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Completion Rate:</span>
                  <span className="stat-value">{analytics.swapAnalytics.completionRate}%</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Average Rating:</span>
                  <span className="stat-value">{analytics.swapAnalytics.averageRating}</span>
                </div>
              </div>

              <div className="swap-status-breakdown">
                <h5>Swap Status Breakdown</h5>
                <div className="status-list">
                  <div className="status-item pending">
                    <span>Pending: {analytics.swapAnalytics.byStatus.pending}</span>
                  </div>
                  <div className="status-item accepted">
                    <span>Accepted: {analytics.swapAnalytics.byStatus.accepted}</span>
                  </div>
                  <div className="status-item completed">
                    <span>Completed: {analytics.swapAnalytics.byStatus.completed}</span>
                  </div>
                  <div className="status-item rejected">
                    <span>Rejected: {analytics.swapAnalytics.byStatus.rejected}</span>
                  </div>
                  <div className="status-item cancelled">
                    <span>Cancelled: {analytics.swapAnalytics.byStatus.cancelled}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const getStatusColor = (status) => {
  switch (status) {
    case 'pending': return 'status-pending';
    case 'accepted': return 'status-accepted';
    case 'completed': return 'status-completed';
    case 'rejected': return 'status-rejected';
    case 'cancelled': return 'status-cancelled';
    default: return '';
  }
};

export default AdminDashboard;
