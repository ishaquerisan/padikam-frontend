import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api/client';
import { LessonHistoryItem } from '@/types';
import {
  Calendar,
  CheckCircle,
  HelpCircle,
  BookOpen,
  ArrowRight,
  Clock,
} from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<{
    total: number;
    page: number;
    totalPages: number;
    lessons: LessonHistoryItem[];
  }>({
    queryKey: ['lesson-history', page],
    queryFn: () => apiClient.get(`/activity/history?page=${page}&limit=10`),
  });

  const lessons = data?.lessons || [];

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Lesson History</h1>
        <p className="font-ml" style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '2px' }}>
          കഴിഞ്ഞ ദിവസങ്ങളിലെ പാഠങ്ങളും ക്വിസ് സ്കോറുകളും
        </p>
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: '90px', borderRadius: '16px' }} />
          ))}
        </div>
      ) : lessons.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 20px' }}>
          <Calendar size={40} color="var(--color-text-muted)" style={{ margin: '0 auto 12px' }} />
          <h3>No past lesson records yet</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '6px' }}>
            Complete today’s lesson to see your historical archive here tomorrow.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {lessons.map((item) => (
            <div
              key={item.id}
              className="card"
              style={{
                padding: '18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '12px',
                    backgroundColor: item.isCompleted ? 'var(--color-primary-subtle)' : 'var(--color-surface-muted)',
                    color: item.isCompleted ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Calendar size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--color-text-main)' }}>
                    {new Date(item.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                    {item.learnedCount} of {item.targetCount} sentences learned
                    {item.quizScore !== null && ` • Quiz Score: ${item.quizScore}%`}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => navigate(`/app/lesson/${item.date}`)}
                  className="btn btn-sm btn-secondary"
                  title="Review lesson sentences"
                >
                  <BookOpen size={14} />
                  <span>Review</span>
                </button>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn btn-sm btn-secondary"
              >
                Previous
              </button>
              <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                Page {page} of {data.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={page === data.totalPages}
                className="btn btn-sm btn-secondary"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
