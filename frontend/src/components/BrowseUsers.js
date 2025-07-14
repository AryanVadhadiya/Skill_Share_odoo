import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SKILL_LIST } from '../skills';
import RatingDisplay from './RatingDisplay';
import { useAuth } from '../context/AuthContext';

const BrowseUsers = () => {
  const { user: currentUser, api } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState({
    weekdays: false,
    weekends: false,
    evenings: false,
    mornings: false
  });
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [requestForm, setRequestForm] = useState({
    skillOffered: '',
    skillRequested: '',
    message: ''
  });
  const [requestLoading, setRequestLoading] = useState(false);
  const limit = 4; // Show only 4 user cards at a time

  useEffect(() => {
    fetchUsers();
  }, [page]); // Re-fetch when page changes

  const fetchUsers = async () => {
    try {
      setLoading(true);
      let url = '/api/users/browse';
      const params = new URLSearchParams();

      if (searchTerm) params.append('skill', searchTerm);
      if (locationFilter) params.append('location', locationFilter);
      Object.entries(availabilityFilter).forEach(([key, value]) => {
        if (value) params.append('availability', key);
      });
      if (showAllUsers) params.append('showAll', 'true');
      params.append('page', page);
      params.append('limit', limit);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      console.log('[Frontend] Making API call to:', url);
      console.log('[Frontend] Search params:', { searchTerm, showAllUsers, locationFilter, availabilityFilter });

      const response = await api.get(url);
      console.log('[Frontend] API response:', { users: response.data.users?.length, total: response.data.total });

      setUsers(response.data.users);
      setTotal(response.data.total);
    } catch (error) {
      setError('Failed to load users');
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1); // Reset page to 1 when new search
    fetchUsers();
  };

  const handleClear = () => {
    setSearchTerm('');
    setLocationFilter('');
    setAvailabilityFilter({ weekdays: false, weekends: false, evenings: false, mornings: false });
    setShowAllUsers(false);
    setPage(1); // Reset page to 1 when clear
    fetchUsers();
  };

  const openRequestModal = (user) => {
    setSelectedUser(user);
    setRequestForm({
      skillOffered: '',
      skillRequested: '',
      message: ''
    });
    setShowRequestModal(true);
  };

  const closeRequestModal = () => {
    setShowRequestModal(false);
    setSelectedUser(null);
    setRequestForm({
      skillOffered: '',
      skillRequested: '',
      message: ''
    });
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();

    if (!requestForm.skillOffered || !requestForm.skillRequested) {
      setError('Please select both skills');
      return;
    }

    try {
      setRequestLoading(true);
      await api.post('/api/swaps', {
        recipientId: selectedUser._id,
        skillOffered: requestForm.skillOffered,
        skillRequested: requestForm.skillRequested,
        message: requestForm.message
      });

      closeRequestModal();
      setError('');
      // Optionally show success message or redirect
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to send request');
    } finally {
      setRequestLoading(false);
    }
  };

  // Get available skills for the current user to offer
  const getAvailableSkillsToOffer = () => {
    if (!currentUser || !currentUser.skillsOffered) return [];
    return currentUser.skillsOffered.filter(skill =>
      selectedUser?.skillsWanted?.includes(skill)
    );
  };

  // Get all skills the selected user can teach, with highlighting info
  const getSkillsTheyCanTeach = () => {
    if (!selectedUser || !selectedUser.skillsOffered) return [];
    if (!currentUser || !currentUser.skillsWanted) return selectedUser.skillsOffered.map(skill => ({ skill, isWanted: false }));

    return selectedUser.skillsOffered.map(skill => ({
      skill,
      isWanted: currentUser.skillsWanted.includes(skill)
    }));
  };

  // Get available skills the selected user can teach
  const getAvailableSkillsToRequest = () => {
    if (!selectedUser || !selectedUser.skillsOffered) return [];
    return selectedUser.skillsOffered.filter(skill =>
      currentUser?.skillsWanted?.includes(skill)
    );
  };

  if (loading) {
    return <div className="loading">Loading users...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div>
      <h2 className="text-center mb-20">Browse Users</h2>

      <div className="search-info mb-20">
        <p className="text-center" style={{ color: '#666', fontSize: '14px' }}>
                    {!currentUser ? (
            'Showing all public users. Log in to see personalized skill matches and send swap requests.'
          ) : showAllUsers ? (
            searchTerm ?
              `Showing all users who can teach "${searchTerm}" (skill matching disabled)` :
              'Showing all public users (skill matching disabled)'
          ) : searchTerm ? (
            `Showing users who can teach "${searchTerm}" AND want to learn something you offer`
          ) : (
            'Showing users who want to learn something you offer'
          )}
        </p>
      </div>

      <div className="card mb-20">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-row">
            <select
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                // Auto-search when skill is selected
                if (e.target.value) {
                  setPage(1);
                  setTimeout(() => fetchUsers(), 100); // Small delay to ensure state is updated
                }
              }}
              className="form-control search-select"
            >
              <option value="">Search for people who can teach...</option>
              {SKILL_LIST.map(skill => (
                <option key={skill} value={skill}>{skill}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Filter by location"
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="form-control search-input"
            />
          </div>

          <div className="availability-row">
            <label className="availability-label">Availability:</label>
            <div className="availability-checkboxes">
              {Object.entries(availabilityFilter).map(([key, value]) => (
                <label key={key} className="availability-checkbox">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={e => setAvailabilityFilter(prev => ({ ...prev, [key]: e.target.checked }))}
                  />
                  <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                </label>
              ))}
            </div>
          </div>

          {currentUser && (
            <div className="show-all-row">
              <label className="show-all-checkbox">
                <input
                  type="checkbox"
                  checked={showAllUsers}
                  onChange={e => {
                    setShowAllUsers(e.target.checked);
                    // Auto-search when checkbox changes
                    setPage(1);
                    setTimeout(() => fetchUsers(), 100);
                  }}
                />
                <span>Show all users (bypass mutual skill matching)</span>
              </label>
            </div>
          )}

          <div className="search-actions">
            <button type="submit" className="btn btn-primary">
              Search
            </button>
            <button type="button" onClick={handleClear} className="btn btn-secondary">
              Clear
            </button>
          </div>
        </form>
      </div>

      {Array.isArray(users) && users.length === 0 ? (
        <div className="text-center">
          <p>No users found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-3">
          {users.map(user => (
            <div key={user._id} className="user-card">
              <div className="text-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {user.profilePhoto ? (
                  <img
                    src={user.profilePhoto}
                    alt={user.name}
                    className="user-avatar"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                ) : null}
                <div
                  className="user-avatar"
                  style={{
                    display: user.profilePhoto ? 'none' : 'flex',
                    backgroundColor: '#e9ecef',
                    color: '#495057',
                    fontSize: '28px',
                    fontWeight: 'bold',
                    lineHeight: '90px',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '90px',
                    height: '90px',
                    borderRadius: '50%'
                  }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>

                <h3>{user.name}</h3>
                {user.location && <p style={{ color: '#666', marginBottom: '10px' }}>{user.location}</p>}

                <RatingDisplay
                  rating={user.rating || 3.5}
                  totalRatings={user.totalRatings || 0}
                  size="medium"
                />
              </div>

              <div className="skills-section">
                <h4>Skills Offered:</h4>
                <div className="skills-list scrollable-skills">
                  {user.skillsOffered.map((skill, index) => (
                    <span key={index} className="skill-tag">{skill}</span>
                  ))}
                </div>
              </div>

              <div className="skills-section">
                <h4>Skills Wanted:</h4>
                <div className="skills-list scrollable-skills">
                  {user.skillsWanted.map((skill, index) => (
                    <span key={index} className="skill-tag">{skill}</span>
                  ))}
                </div>
              </div>

              <div className="text-center">
                <Link to={`/user/${user._id}`} className="btn btn-primary">
                  View Profile
                </Link>
                {currentUser && (
                  <button
                    onClick={() => openRequestModal(user)}
                    className="btn btn-secondary"
                    style={{ marginLeft: '10px' }}
                  >
                    Send Request
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Enhanced pagination controls */}
      {total > limit && (
        <div className="pagination-container">
          <div className="pagination-info">
            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} users (4 per page)
          </div>
          <div className="pagination-controls">
            <button
              className="pagination-btn"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              ← Previous
            </button>

            <div className="pagination-numbers">
              {Array.from({ length: Math.min(5, Math.ceil(total / limit)) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    className={`pagination-btn ${page === pageNum ? 'active' : ''}`}
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
              {Math.ceil(total / limit) > 5 && (
                <>
                  {page > 3 && <span className="pagination-ellipsis">...</span>}
                  {page > 3 && (
                    <button
                      className="pagination-btn"
                      onClick={() => setPage(page - 1)}
                    >
                      {page - 1}
                    </button>
                  )}
                  {page > 3 && page < Math.ceil(total / limit) - 2 && (
                    <button className="pagination-btn active">{page}</button>
                  )}
                  {page < Math.ceil(total / limit) - 2 && (
                    <button
                      className="pagination-btn"
                      onClick={() => setPage(page + 1)}
                    >
                      {page + 1}
                    </button>
                  )}
                  {page < Math.ceil(total / limit) - 2 && <span className="pagination-ellipsis">...</span>}
                  {page < Math.ceil(total / limit) - 2 && (
                    <button
                      className="pagination-btn"
                      onClick={() => setPage(Math.ceil(total / limit))}
                    >
                      {Math.ceil(total / limit)}
                    </button>
                  )}
                </>
              )}
            </div>

            <button
              className="pagination-btn"
              onClick={() => setPage(p => (p * limit < total ? p + 1 : p))}
              disabled={page * limit >= total}
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Request Modal */}
      {showRequestModal && selectedUser && (
        <div className="modal-overlay" onClick={closeRequestModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Send Swap Request to {selectedUser.name}</h3>
              <button onClick={closeRequestModal} className="modal-close">&times;</button>
            </div>

            <form onSubmit={handleRequestSubmit} className="modal-body">
              <div className="form-group">
                <label>Skill you'll teach:</label>
                <select
                  value={requestForm.skillOffered}
                  onChange={e => setRequestForm(prev => ({ ...prev, skillOffered: e.target.value }))}
                  className="form-control"
                  required
                >
                  <option value="">Select a skill you can teach...</option>
                  {getAvailableSkillsToOffer().map(skill => (
                    <option key={skill} value={skill}>{skill}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Skill you want to learn:</label>
                <select
                  value={requestForm.skillRequested}
                  onChange={e => setRequestForm(prev => ({ ...prev, skillRequested: e.target.value }))}
                  className="form-control"
                  required
                >
                  <option value="">Select a skill you want to learn</option>
                  {getSkillsTheyCanTeach().map((skillInfo, index) => (
                    <option key={index} value={skillInfo.skill}>
                      {skillInfo.skill}{skillInfo.isWanted ? ' ⭐ (You want this!)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Message (optional):</label>
                <textarea
                  value={requestForm.message}
                  onChange={e => setRequestForm(prev => ({ ...prev, message: e.target.value }))}
                  className="form-control"
                  placeholder="Add a personal message to your request..."
                  rows="3"
                />
              </div>

              {error && <div className="error-message">{error}</div>}

              <div className="modal-actions">
                <button type="button" onClick={closeRequestModal} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={requestLoading}>
                  {requestLoading ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrowseUsers;
