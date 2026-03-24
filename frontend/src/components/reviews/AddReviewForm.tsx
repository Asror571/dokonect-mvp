import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../api/api';
import StarRating from './StarRating';
import { Button } from '../ui/Button';

interface AddReviewFormProps {
  productId: string;
  onSuccess?: () => void;
}

const AddReviewForm: React.FC<AddReviewFormProps> = ({ productId, onSuccess }) => {
  const [rating, setRating]   = useState(0);
  const [comment, setComment] = useState('');
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: () => api.post('/reviews', { productId, rating, comment }),
    onSuccess: () => {
      toast.success('Sharh qo\'shildi');
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setRating(0);
      setComment('');
      onSuccess?.();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Xatolik yuz berdi');
    },
  });

  return (
    <div className="bg-slate-50 rounded-xl p-4 space-y-3">
      <p className="text-sm font-semibold text-slate-700">Sharh yozish</p>
      <div className="flex items-center gap-2">
        <StarRating rating={rating} size="md" interactive onChange={setRating} />
        <span className="text-sm text-slate-500">{rating > 0 ? `${rating}/5` : 'Baho bering'}</span>
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Izoh (ixtiyoriy)..."
        rows={2}
        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 resize-none"
      />
      <Button size="sm" onClick={() => mutate()} disabled={rating === 0} isLoading={isPending}>
        Yuborish
      </Button>
    </div>
  );
};

export default AddReviewForm;
