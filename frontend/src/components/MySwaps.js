import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import RatingModal from './RatingModal';

const MySwaps = () => {
  const { user, api } = useAuth();
  const [swaps, setSwaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('received');
  const [ratingModal, setRatingModal] = useState({
    isOpen: false,
    swap: null
  });

  const fetchSwaps = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/swaps/my-swaps');
      setSwaps(response.data);
    } catch (error) {
      console.error('Error fetching swaps:', error);
      setError('Failed to load swaps. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    if (user) {
      fetchSwaps();
      const interval = setInterval(fetchSwaps, 15000); // Poll every 15 seconds
      return () => clearInterval(interval);
    }
  }, [user, fetchSwaps]);

  const handleSwapAction = async (swapId, action) => {
    try {
      setError('');
      await api.put(`/swaps/${swapId}/${action}`);
      await fetchSwaps();
    } catch (error) {
      console.error(`Error ${action}ing swap:`, error);
      setError(error.response?.data?.message || `Failed to ${action} swap`);
    }
  };

  const handleDeleteSwap = async (swapId) => {
    if (window.confirm('Are you sure you want to delete this request?')) {
      try {
        setError('');
        await api.put(`/swaps/${swapId}/cancel`);
        await fetchSwaps();
      } catch (error) {
        console.error('Error deleting swap:', error);
        setError(error.response?.data?.message || 'Failed to delete request');
      }
    }
  };

  const openRatingModal = (swap) => {
    console.log('Opening rating modal for swap:', swap);
    setRatingModal({ isOpen: true, swap });
  };

  const closeRatingModal = () => {
    setRatingModal({ isOpen: false, swap: null });
  };

  const handleRatingSubmitted = () => {
    fetchSwaps();
  };

  const handleMarkCompleted = async (swapId) => {
    try {
      setError('');
      await api.put(`/swaps/${swapId}/complete`);
      await fetchSwaps();
    } catch (error) {
      console.error('Error marking swap as completed:', error);
      setError('Failed to mark swap as completed');
    }
  };

  // Helper function to display user rating
  const displayUserRating = (user) => {
    if (!user) return <div className="unrated">Unrated</div>;
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

  // Helper function to check if user can rate a swap
  const canRateSwap = (swap, currentUserId) => {
    if (swap.status !== 'completed') return false;

    const isRequester = swap.requester && swap.requester._id === currentUserId;
    const isRecipient = swap.recipient && swap.recipient._id === currentUserId;

    if (isRequester && !swap.requesterRating) return true;
    if (isRecipient && !swap.recipientRating) return true;

    return false;
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

  // Filter swaps based on current user's role, and only include swaps with valid requester and recipient
  const sentSwaps = swaps.filter(
    swap => swap.requester && swap.recipient && swap.requester._id === user?._id
  );
  const receivedSwaps = swaps.filter(
    swap => swap.requester && swap.recipient && swap.recipient._id === user?._id
  );

  // Group received swaps by status
  const pendingReceived = receivedSwaps.filter(swap => swap.status === 'pending');
  const otherReceived = receivedSwaps.filter(swap => swap.status !== 'pending');

  if (!user) {
    return (
      <div className="container">
        <div className="card">
          <h2 className="text-center">Please log in to view your swaps</h2>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <div className="loading-spinner"></div>
          <span>Loading your swaps...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="alert alert-danger">
          <h3>Error</h3>
          <p>{error}</p>
          <button onClick={fetchSwaps} className="btn btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="swaps-header">
        <h1>My Skill Swaps</h1>
        <p className="text-secondary">
          Manage your skill exchange requests and track their progress
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="tabs">
        <button
          onClick={() => setActiveTab('received')}
          className={`tab-btn ${activeTab === 'received' ? 'active' : ''}`}
        >
          Received ({receivedSwaps.length})
        </button>
        <button
          onClick={() => setActiveTab('sent')}
          className={`tab-btn ${activeTab === 'sent' ? 'active' : ''}`}
        >
          Sent ({sentSwaps.length})
        </button>
      </div>

      {/* Received Swaps Tab */}
      {activeTab === 'received' && (
        <div className="swaps-content">
          {receivedSwaps.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>No swap requests yet</h3>
              <p>When other users request to swap skills with you, they'll appear here.</p>
            </div>
          ) : (
            <div>
              {/* Pending Requests - Actions Section */}
              {pendingReceived.length > 0 && (
                <div className="section">
                  <h3 className="section-title">
                    Actions Required ({pendingReceived.length})
                  </h3>
                  <div className="swaps-grid">
                    {pendingReceived.map(swap => (
                      <SwapCard
                        key={swap._id}
                        swap={swap}
                        user={user}
                        onAction={handleSwapAction}
                        onDelete={handleDeleteSwap}
                        onRate={openRatingModal}
                        onComplete={handleMarkCompleted}
                        displayUserRating={displayUserRating}
                        getStatusColor={getStatusColor}
                        canRateSwap={canRateSwap}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Other Received Swaps */}
              {otherReceived.length > 0 && (
                <div className="section">
                  <h3 className="section-title">
                    Other Requests ({otherReceived.length})
                  </h3>
                  <div className="swaps-grid">
                    {otherReceived.map(swap => (
                      <SwapCard
                        key={swap._id}
                        swap={swap}
                        user={user}
                        onAction={handleSwapAction}
                        onDelete={handleDeleteSwap}
                        onRate={openRatingModal}
                        onComplete={handleMarkCompleted}
                        displayUserRating={displayUserRating}
                        getStatusColor={getStatusColor}
                        canRateSwap={canRateSwap}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Sent Swaps Tab */}
      {activeTab === 'sent' && (
        <div className="swaps-content">
          {sentSwaps.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📤</div>
              <h3>No sent requests</h3>
              <p>When you request skill swaps from other users, they'll appear here.</p>
            </div>
          ) : (
            <div className="swaps-grid">
              {sentSwaps.map(swap => (
                <SwapCard
                  key={swap._id}
                  swap={swap}
                  user={user}
                  onAction={handleSwapAction}
                  onDelete={handleDeleteSwap}
                  onRate={openRatingModal}
                  onComplete={handleMarkCompleted}
                  displayUserRating={displayUserRating}
                  getStatusColor={getStatusColor}
                  canRateSwap={canRateSwap}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Rating Modal */}
      {/* DEBUG: Always render the modal for testing */}
      <RatingModal
        swap={ratingModal.swap}
        onClose={closeRatingModal}
        onRatingSubmitted={handleRatingSubmitted}
      />
    </div>
  );
};

// Separate SwapCard component for better organization
const SwapCard = ({
  swap,
  user,
  onAction,
  onDelete,
  onRate,
  onComplete,
  displayUserRating,
  getStatusColor,
  canRateSwap
}) => {
  const isRequester = swap.requester && swap.requester._id === user._id;
  const otherUser = isRequester ? swap.recipient : swap.requester;

  return (
    <div className={`swap-card ${swap.status}`}>
      <div className="swap-header">
        <div className="user-info" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {otherUser && otherUser.profilePhoto ? (
            <img
              src={otherUser.profilePhoto}
              alt={otherUser.name}
              className="user-avatar"
            />
          ) : (
            <div className="user-avatar-fallback" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#e9ecef', color: '#495057', fontSize: '24px', fontWeight: 'bold' }}>
              {otherUser && otherUser.name ? otherUser.name.charAt(0).toUpperCase() : '?'}
            </div>
          )}
          <div className="user-details">
            <h4>{otherUser && otherUser.name ? otherUser.name : 'Unknown User'}</h4>
            {displayUserRating(otherUser)}
                      <span className={`status-badge ${getStatusColor(swap.status)}`}>
                        {swap.status.charAt(0).toUpperCase() + swap.status.slice(1)}
                      </span>
                    </div>
                  </div>
      </div>

      <div className="swap-details">
        <div className="skill-exchange">
          <div className="skill-item">
            <span className="skill-label">You'll learn:</span>
            <span className="skill-value">{isRequester ? swap.skillRequested : swap.skillOffered}</span>
          </div>
          <div className="skill-item">
            <span className="skill-label">You'll teach:</span>
            <span className="skill-value">{isRequester ? swap.skillOffered : swap.skillRequested}</span>
          </div>
        </div>

                    {swap.message && (
          <div className="swap-message">
            <strong>Message:</strong> "{swap.message}"
          </div>
                    )}
                  </div>

      <div className="swap-actions">
        {swap.status === 'pending' && !isRequester && (
          <div className="action-buttons">
            <button
              onClick={() => onAction(swap._id, 'accept')}
              className="btn btn-success"
              disabled={swap.status !== 'pending'}
            >
              Accept
            </button>
            <button
              onClick={() => onAction(swap._id, 'reject')}
              className="btn btn-danger"
              disabled={swap.status !== 'pending'}
            >
              Reject
            </button>
          </div>
        )}
        {/* Show error if swap is not pending */}
        {swap.status !== 'pending' && !isRequester && (
          <div className="alert alert-warning" style={{ marginTop: '10px' }}>
            This swap is no longer pending (current status: {swap.status}).
          </div>
        )}

        {swap.status === 'accepted' && (
          <button
            onClick={() => onComplete(swap._id)}
            className="btn btn-primary"
          >
            Mark as Completed
          </button>
        )}

        {swap.status === 'completed' && canRateSwap(swap, user._id) && (
          <button
            onClick={() => {
              console.log('Rate button clicked', swap);
              onRate(swap);
            }}
            className="btn btn-warning"
          >
            ⭐ Rate This Swap
          </button>
        )}

        {swap.status === 'pending' && isRequester && (
          <button
            onClick={() => onDelete(swap._id)}
            className="btn btn-danger"
          >
            Cancel Request
          </button>
        )}

        {/* Display existing ratings */}
        {swap.status === 'completed' && (swap.requesterRating || swap.recipientRating) && (
          <div className="swap-ratings">
            {swap.requesterRating && (
              <div className="rating-item">
                <strong>Your rating:</strong> {swap.requesterRating} stars
              </div>
            )}
            {swap.recipientRating && (
              <div className="rating-item">
                <strong>Their rating:</strong> {swap.recipientRating} stars
              </div>
            )}
          </div>
        )}
        </div>
    </div>
  );
};

export default MySwaps;
