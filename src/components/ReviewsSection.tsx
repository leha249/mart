import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, MessageSquare, Plus, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatDate } from '../utils/format';
import type { Review } from '../types/database';

interface Props {
  productId: number;
  onWriteReview: () => void;
}

const ReviewsSection = ({ productId, onWriteReview }: Props) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    supabase
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .eq('approved', true)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!mounted) return;
        if (!error && data) setReviews(data);
        setLoading(false);
      });

    // Realtime
    const channel = supabase
      .channel(`reviews-${productId}-${Math.random().toString(36).slice(2)}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reviews',
          filter: `product_id=eq.${productId}`,
        },
        () => {
          supabase
            .from('reviews')
            .select('*')
            .eq('product_id', productId)
            .eq('approved', true)
            .order('created_at', { ascending: false })
            .then(({ data }) => {
              if (mounted && data) setReviews(data);
            });
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [productId]);

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : 0;

  const visible = showAll ? reviews : reviews.slice(0, 3);

  if (loading) {
    return (
      <div
        style={{
          padding: 24,
          display: 'flex',
          justifyContent: 'center',
          color: 'var(--muted)',
        }}
      >
        <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              fontSize: 11,
              color: 'var(--muted)',
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
            }}
          >
            Отзывы ({reviews.length})
          </div>
          {reviews.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ display: 'flex', gap: 2 }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    size={12}
                    fill={avgRating >= n - 0.5 ? 'var(--accent)' : 'none'}
                    stroke={avgRating >= n - 0.5 ? 'var(--accent)' : 'var(--muted)'}
                  />
                ))}
              </div>
              <span
                className="price-num"
                style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600 }}
              >
                {avgRating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        <button
          onClick={onWriteReview}
          style={{
            padding: '8px 16px',
            borderRadius: 100,
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--text)',
            fontSize: 12,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Plus size={13} /> Написать отзыв
        </button>
      </div>

      {reviews.length === 0 ? (
        <div
          style={{
            padding: 24,
            textAlign: 'center',
            color: 'var(--muted)',
            fontSize: 13,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 12,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <MessageSquare size={24} strokeWidth={1.5} />
          Будьте первым, кто оставит отзыв
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {visible.map((review, i) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              style={{
                padding: 16,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 12,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 10,
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'var(--bg)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'var(--accent)',
                    }}
                  >
                    {review.author_name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>
                      {review.author_name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                      {formatDate(review.created_at)}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 2 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      size={12}
                      fill={review.rating >= n ? 'var(--accent)' : 'none'}
                      stroke={review.rating >= n ? 'var(--accent)' : 'var(--muted)'}
                    />
                  ))}
                </div>
              </div>
              <p
                style={{
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: 'var(--text-dim)',
                }}
              >
                {review.text}
              </p>
            </motion.div>
          ))}

          {reviews.length > 3 && !showAll && (
            <button
              onClick={() => setShowAll(true)}
              style={{
                padding: '10px 16px',
                borderRadius: 100,
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--muted)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Показать все {reviews.length} отзывов
            </button>
          )}
        </div>
      )}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ReviewsSection;