import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import StarRating from './StarRating';

interface ReviewCardProps {
  review: {
    id: string;
    rating: number;
    comment?: string;
    createdAt: string;
    storeOwner: { storeName: string };
  };
  onDelete?: (id: string) => void;
  canDelete?: boolean;
}

const ReviewCard: React.FC<ReviewCardProps> = ({ review, onDelete, canDelete }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-4">
    <div className="flex items-start justify-between gap-2">
      <div>
        <p className="text-sm font-semibold text-slate-800">{review.storeOwner.storeName}</p>
        <div className="flex items-center gap-2 mt-1">
          <StarRating rating={review.rating} />
          <span className="text-xs text-slate-400">
            {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
          </span>
        </div>
      </div>
      {canDelete && (
        <button
          onClick={() => onDelete?.(review.id)}
          className="text-xs text-red-400 hover:text-red-600 transition-colors"
        >
          O'chirish
        </button>
      )}
    </div>
    {review.comment && (
      <p className="text-sm text-slate-600 mt-2">{review.comment}</p>
    )}
  </div>
);

export default ReviewCard;
