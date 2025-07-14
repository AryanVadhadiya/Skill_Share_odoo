import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SKILL_LIST } from '../skills';
import RatingDisplay from './RatingDisplay';

const UserDetail = () => {
  const { id } = useParams();
  const { user: currentUser, api } = useAuth();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestForm, setRequestForm] = useState({
    skillOffered: '',
    skillRequested: '',
    message: ''
  });

  useEffect(() => {
    fetchUser();
  }, [id]);

  const fetchUser = async () => {
    try {
      const response = await api.get(`/users/${id}`);
      setUser(response.data);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to load user');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();

    if (!requestForm.skillOffered || !requestForm.skillRequested) {
      setError('Please select both skills');
      return;
    }

    try {
      await api.post('/swaps', {
        recipientId: id,
        skillOffered: requestForm.skillOffered,
        skillRequested: requestForm.skillRequested,
        message: requestForm.message
      });

      setShowRequestForm(false);
      setRequestForm({ skillOffered: '', skillRequested: '', message: '' });
      navigate('/my-swaps');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create swap request');
    }
  };

  // Calculate skill intersections
  const getSkillIntersections = () => {
    if (!currentUser || !user) return { offered: [], requested: [] };

    console.log('Current user skills offered:', currentUser.skillsOffered);
    console.log('Current user skills wanted:', currentUser.skillsWanted);
    console.log('Other user skills offered:', user.skillsOffered);
    console.log('Other user skills wanted:', user.skillsWanted);

    // Skills I can offer that they want
    const offeredIntersection = currentUser.skillsOffered?.filter(skill =>
      user.skillsWanted?.includes(skill)
    ) || [];

    // Skills I want that they can offer
    const requestedIntersection = currentUser.skillsWanted?.filter(skill =>
      user.skillsOffered?.includes(skill)
    ) || [];

    console.log('Offered intersection:', offeredIntersection);
    console.log('Requested intersection:', requestedIntersection);

    return { offered: offeredIntersection, requested: requestedIntersection };
  };

  const skillIntersections = getSkillIntersections();
  console.log('Final skill intersections:', skillIntersections);

  // Get all skills they offer, with highlighting info
  const getSkillsTheyOffer = () => {
    if (!user || !user.skillsOffered) return [];
    if (!currentUser || !currentUser.skillsWanted) return user.skillsOffered;

    return user.skillsOffered.map(skill => ({
      skill,
      isWanted: currentUser.skillsWanted.includes(skill)
    }));
  };

  const skillsTheyOffer = getSkillsTheyOffer();

  if (loading) {
    return <div className="loading">Loading user profile...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!user) {
    return <div className="error">User not found</div>;
  }

  return (
    <div>
      <div className="profile-header" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {user.profilePhoto ? (
            <img
              src={user.profilePhoto}
              alt={user.name}
              className="profile-avatar"
              style={{ width: '200px', height: '200px', borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <div
              className="profile-avatar"
              style={{
                backgroundColor: '#e9ecef',
                color: '#495057',
                fontSize: '80px',
                fontWeight: 'bold',
                lineHeight: '200px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '200px',
                height: '200px',
                borderRadius: '50%'
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <h2>{user.name}</h2>
        {user.location && <p>{user.location}</p>}
        <RatingDisplay
          rating={user.rating || 3.5}
          totalRatings={user.totalRatings || 0}
          size="large"
        />
      </div>

      <div className="skills-section">
        <h3>Skills Offered</h3>
        <div>
          {skillsTheyOffer.map((skillInfo, index) => (
            <span
              key={index}
              className={`
