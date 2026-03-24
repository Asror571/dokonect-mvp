import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '../ui/Button';

interface StarRatingProps {
  rating: number;
  max?: number;
  size?: 'sm' | 'md';
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

const StarRating: React.FC<StarRatingProps> = ({ rating, max = 5, size = 'sm', interactive, onChange }) => {
  const sz = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5';

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={cn(sz, 'transition-colors', {
            'fill-amber-400 text-amber-400': i < rating,
            'text-slate-300': i >= rating,
            'cursor-pointer hover:text-amber-400': interactive,
          })}
          onClick={() => interactive && onChange?.(i + 1)}
        />
      ))}
    </div>
  );
};

export default StarRating;
