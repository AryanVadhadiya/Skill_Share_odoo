import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const RatingModal = ({ isOpen, onClose, swap, onRatingSubmitted }) => {
  console.log('RatingModal rendered', { isOpen, swap });
  const { user, api } = useAuth();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // Determine if current user is requester or recipient
      const forRole = swap.requester._id === user._id ? 'recipient' : 'requester';

      await api.post(`/api/swaps/${swap._id}/rate`, {
        rating,
        comment,
        forRole
      });

      onRatingSubmitted();
      onClose();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>Rate Your Swap Experience</h3>

        <div className="swap-details">
          <p><strong>Swap:</strong> {swap.skillOffered} ↔ {swap.skillRequested}</p>
          <p><strong>Partner:</strong> {swap.recipient?.name || swap.requester?.name}</p>
        </div>

        <form onSubmit={handleSubmit} className="rating-form">
          <div className="form-group">
            <label>Rating:</label>
            <div className="star-rating">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className={`star-btn ${star <= rating ? 'filled' : ''}`}
                  onClick={() => setRating(star)}
                >
                  ★
                </button>
              ))}
            </div>
            <span className="rating-text">{rating} out of 5</span>
          </div>

          <div className="form-group">
            <label htmlFor="comment">Comment (Optional):</label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="form-control"
              rows="3"
              placeholder="Share your experience with this swap..."
            />
          </div>

          {error && <div className="alert alert-danger">{error}</div>}

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Rating'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RatingModal;
