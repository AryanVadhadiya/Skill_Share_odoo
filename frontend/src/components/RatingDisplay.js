import React from 'react';

const RatingDisplay = ({ rating, totalRatings, showTotal = true, size = 'medium' }) => {
  const getSizeClass = () => {
    switch (size) {
      case 'small': return 'rating-small';
      case 'large': return 'rating-large';
      default: return 'rating-medium';
    }
  };

  const renderStars = () => {
    const fullStars = Math.round(rating);
    const emptyStars = 5 - fullStars;

    return (
      <>
        {'★'.repeat(fullStars)}
        {'☆'.repeat(emptyStars)}
      </>
    );
  };

  const getRatingText = () => {
    if (totalRatings === 0) {
      return `(${rating.toFixed(1)}) - New User`;
    }
    return `(${rating.toFixed(1)})${showTotal ? ` - ${totalRatings} rating${totalRatings !== 1 ? 's' : ''}` : ''}`;
  };

  return (
    <div className={`rating ${getSizeClass()}`}>
      {renderStars()}
      <span className="rating-text">{getRatingText()}</span>
    </div>
  );
};

export default RatingDisplay;
