'use client';

import { Star } from 'lucide-react';
import { useState } from 'react';

interface StarRatingProps {
  value: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
}

/**
 * Star Rating Component
 * Displays 5 stars with hover and click interactions for rating selection
 */
export const StarRating = ({
  value,
  onChange,
  disabled = false,
}: StarRatingProps) => {
  const [hoverRating, setHoverRating] = useState<number>(0);

  const handleClick = (rating: number) => {
    if (!disabled) {
      onChange(rating);
    }
  };

  const handleMouseEnter = (rating: number) => {
    if (!disabled) {
      setHoverRating(rating);
    }
  };

  const handleMouseLeave = () => {
    if (!disabled) {
      setHoverRating(0);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent, rating: number) => {
    if (disabled) return;

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onChange(rating);
    } else if (event.key === 'ArrowLeft' && rating > 1) {
      event.preventDefault();
      onChange(rating - 1);
    } else if (event.key === 'ArrowRight' && rating < 5) {
      event.preventDefault();
      onChange(rating + 1);
    }
  };

  const displayRating = hoverRating || value;

  return (
    <div
      className="flex gap-1"
      onMouseLeave={handleMouseLeave}
      role="radiogroup"
      aria-label="Rating"
    >
      {[1, 2, 3, 4, 5].map((rating) => {
        const isFilled = rating <= displayRating;

        return (
          <button
            key={rating}
            type="button"
            onClick={() => handleClick(rating)}
            onMouseEnter={() => handleMouseEnter(rating)}
            onKeyDown={(event) => handleKeyDown(event, rating)}
            disabled={disabled}
            className={`
              transition-all duration-150
              ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
              ${isFilled ? 'scale-110' : 'scale-100'}
              focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 rounded
            `}
            aria-label={`Rate ${rating} star${rating > 1 ? 's' : ''}`}
            aria-checked={value === rating}
            role="radio"
          >
            <Star
              className={`
                w-8 h-8 transition-colors duration-150
                ${
                  isFilled
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'fill-none text-gray-300'
                }
                ${!disabled && 'hover:text-yellow-300'}
              `}
            />
          </button>
        );
      })}
    </div>
  );
};
