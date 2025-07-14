import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { SKILL_LIST } from '../skills';

const Profile = () => {
  const { user, updateUser, api } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    skillsOffered: [],
    skillsWanted: [],
    availability: {
      weekdays: false,
      weekends: false,
      evenings: false,
      mornings: false
    },
    isPublic: true
  });
  const [newSkill, setNewSkill] = useState({ offered: '', wanted: '' });

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/auth/me');
      setProfile(response.data);
      setFormData({
        name: response.data.name,
        location: response.data.location || '',
        skillsOffered: response.data.skillsOffered || [],
        skillsWanted: response.data.skillsWanted || [],
        availability: response.data.availability || {
          weekdays: false,
          weekends: false,
          evenings: false,
          mornings: false
        },
        isPublic: response.data.isPublic
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to load profile. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user, fetchProfile]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name.startsWith('availability.')) {
      const availabilityKey = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        availability: {
          ...prev.availability,
          [availabilityKey]: checked
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await api.put('/api/users/profile', formData);
      setProfile(response.data);
      updateUser(response.data);
      setSuccess('Profile updated successfully!');
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const addSkill = async (type) => {
    const skill = type === 'offered' ? newSkill.offered : newSkill.wanted;
    if (!skill.trim()) return;

    console.log(`Adding ${type} skill:`, skill);

    try {
      setError('');
      const response = await api.post(`/api/users/skills-${type}`, { skill: skill.trim() });
      console.log('Skill added successfully:', response.data);
      setFormData(prev => ({
        ...prev,
        [`skills${type.charAt(0).toUpperCase() + type.slice(1)}`]: response.data
      }));
      setNewSkill(prev => ({ ...prev, [type]: '' }));
    } catch (error) {
      console.error('Error adding skill:', error);
      setError(error.response?.data?.message || 'Failed to add skill');
    }
  };

  const removeSkill = async (type, skill) => {
    try {
      setError('');
      const response = await api.delete(`/api/users/skills-${type}/${encodeURIComponent(skill)}`);
      setFormData(prev => ({
        ...prev,
        [`skills${type.charAt(0).toUpperCase() + type.slice(1)}`]: response.data
      }));
    } catch (error) {
      console.error('Error removing skill:', error);
      setError(error.response?.data?.message || 'Failed to remove skill');
    }
  };

  const uploadPhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('photo', file);

    try {
      setError('');
      setSuccess('');
      const response = await api.post('/api/auth/upload-photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProfile(response.data);
      updateUser(response.data);
      setSuccess('Profile photo updated successfully!');
    } catch (error) {
      console.error('Error uploading photo:', error);
      setError('Failed to upload photo');
    }
  };

  // Helper function to display user rating
  const displayUserRating = (user) => {
    if ((user.totalRatings || 0) === 0) {
      return (
        <div className="rating">
          {'★'.repeat(4)}{'☆'}
          <span className="rating-text">(3.5)</span>
        </div>
      );
    } else if (user.rating > 0) {
      return (
        <div className="rating">
          {'★'.repeat(Math.round(user.rating))}
          {'☆'.repeat(5 - Math.round(user.rating))}
          <span className="rating-text">({user.rating.toFixed(1)})</span>
        </div>
      );
    } else {
      return <div className="unrated">Unrated</div>;
    }
  };

  if (!user) {
    return (
      <div className="container">
        <div className="card">
          <h2 className="text-center">Please log in to view your profile</h2>
        </div>
      </div>
    );
  }

  if (loading && !profile) {
    return (
      <div className="container">
        <div className="loading">
          <div className="loading-spinner"></div>
          <span>Loading profile...</span>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container">
        <div className="alert alert-danger">
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={fetchProfile} className="btn btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="profile-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div className="profile-avatar-section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {profile.profilePhoto ? (
            <img src={profile.profilePhoto} alt={profile.name} className="profile-avatar" />
          ) : (
            <div className="profile-avatar-fallback">
              {profile.name.charAt(0).toUpperCase()}
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={uploadPhoto}
            style={{ display: 'none' }}
            id="photo-upload"
          />
          <label htmlFor="photo-upload" className="btn btn-secondary">
            Change Photo
          </label>
        </div>

        <div className="profile-info">
          <h1>{profile.name}</h1>
          {profile.location && <p className="profile-location">{profile.location}</p>}
          {displayUserRating(profile)}
          </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="card">
        <div className="card-header">
          <h2>Profile Information</h2>
          <button
            onClick={() => {
              console.log('Toggle editing, current state:', editing);
              setEditing(!editing);
            }}
            className="btn btn-primary"
          >
            {editing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        {editing ? (
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                className="form-control"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="location">Address/Location</label>
              <input
                type="text"
                id="location"
                name="location"
                className="form-control"
                value={formData.location}
                onChange={handleChange}
                placeholder="City, Country"
              />
            </div>

            <div className="form-group">
              <label>Availability</label>
              <div className="availability-grid">
                {Object.entries(formData.availability).map(([key, value]) => (
                  <label key={key} className="availability-item">
                    <input
                      type="checkbox"
                      name={`availability.${key}`}
                      checked={value}
                      onChange={handleChange}
                    />
                    <span>{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  name="isPublic"
                  checked={formData.isPublic}
                  onChange={handleChange}
                />
                Make my profile public
              </label>
            </div>

            <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="profile-details">
            <div className="detail-item">
              <strong>Name:</strong> {profile.name}
            </div>
            {profile.location && (
              <div className="detail-item">
                <strong>Location:</strong> {profile.location}
              </div>
            )}
            <div className="detail-item">
              <div className="availability-tags">
                {Object.entries(profile.availability || {}).map(([key, value]) =>
                  value && <span key={key} className="availability-tag">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                )}
                {!Object.values(profile.availability || {}).some(v => v) && (
                  <span className="no-availability">Not specified</span>
                )}
              </div>
            </div>
            <div className="detail-item">
              <strong>Profile Visibility:</strong> {profile.isPublic ? 'Public' : 'Private'}
            </div>
          </div>
        )}
      </div>

      {/* Skills Sections */}
      <div className="skills-sections">
        <div className="card">
          <h3>Skills I Can Teach</h3>
          {console.log('Editing state:', editing)}
          {console.log('Profile skills offered:', profile.skillsOffered)}
          {console.log('Form data skills offered:', formData.skillsOffered)}
          {editing ? (
            <div className="skills-editor">
        <div className="skill-input-group">
          <select
            value=""
            onChange={e => {
              if (e.target.value) {
                setNewSkill(prev => ({ ...prev, offered: e.target.value }));
              }
            }}
            className="form-control"
          >
            <option value="">Select a skill</option>
            {SKILL_LIST.filter(skill => !formData.skillsOffered.includes(skill)).map((skill, idx) => (
              <option key={idx} value={skill}>{skill}</option>
            ))}
          </select>
          <input
            type="text"
            value={newSkill.offered}
            onChange={e => setNewSkill(prev => ({ ...prev, offered: e.target.value }))}
            placeholder="Or type a custom skill"
            className="form-control"
            style={{ marginTop: 8 }}
          />
          <button
            type="button"
            onClick={() => addSkill('offered')}
            className="btn btn-primary"
            disabled={!newSkill.offered.trim()}
          >
            Add
          </button>
        </div>
              <div className="skills-list">
          {formData.skillsOffered.map((skill, index) => (
                  <div key={index} className="skill-tag">
              {skill}
              <button
                onClick={() => removeSkill('offered', skill)}
                      className="skill-remove"
              >
                ×
              </button>
                  </div>
          ))}
        </div>
            </div>
          ) : (
            <div className="skills-display">
              {profile.skillsOffered && profile.skillsOffered.length > 0 ? (
                <div className="skills-tags">
                  {profile.skillsOffered.map((skill, index) => (
                    <span key={index} className="skill-tag">{skill}</span>
                  ))}
                </div>
              ) : (
                <p className="no-skills">No skills added yet</p>
              )}
            </div>
          )}
      </div>

        <div className="card">
        <h3>Skills I Want to Learn</h3>
          {editing ? (
            <div className="skills-editor">
        <div className="skill-input-group">
          <select
            value=""
            onChange={e => {
              if (e.target.value) {
                setNewSkill(prev => ({ ...prev, wanted: e.target.value }));
              }
            }}
            className="form-control"
          >
            <option value="">Select a skill</option>
            {SKILL_LIST.filter(skill => !formData.skillsWanted.includes(skill)).map((skill, idx) => (
              <option key={idx} value={skill}>{skill}</option>
            ))}
          </select>
          <input
            type="text"
            value={newSkill.wanted}
            onChange={e => setNewSkill(prev => ({ ...prev, wanted: e.target.value }))}
            placeholder="Or type a custom skill"
            className="form-control"
            style={{ marginTop: 8 }}
          />
          <button
            type="button"
            onClick={() => addSkill('wanted')}
            className="btn btn-primary"
            disabled={!newSkill.wanted.trim()}
          >
            Add
          </button>
        </div>
              <div className="skills-list">
          {formData.skillsWanted.map((skill, index) => (
                  <div key={index} className="skill-tag wanted">
              {skill}
              <button
                onClick={() => removeSkill('wanted', skill)}
                      className="skill-remove"
              >
                ×
              </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="skills-display">
              {profile.skillsWanted && profile.skillsWanted.length > 0 ? (
                <div className="skills-tags">
                  {profile.skillsWanted.map((skill, index) => (
                    <span key={index} className="skill-tag wanted">{skill}</span>
          ))}
                </div>
              ) : (
                <p className="no-skills">No skills added yet</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
