'use client';

import React, { memo } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  maxRating?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  uniqueId?: string;
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-8 w-8'
};

export const StarRating = memo<StarRatingProps>(function StarRating({
  rating,
  maxRating = 5,
  size = 'md',
  className,
  interactive = false,
  onRatingChange,
  uniqueId = 'default'
}) {
  const handleStarClick = (index: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(index + 1);
    }
  };

  return (
    <div className={cn('flex items-center', className)}>
      {Array.from({ length: maxRating }, (_, i) => (
        <Star
          key={`star-${uniqueId}-${i}`}
          className={cn(
            sizeClasses[size],
            i < rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300',
            interactive && 'cursor-pointer hover:text-yellow-400'
          )}
          onClick={() => handleStarClick(i)}
        />
      ))}
    </div>
  );
});