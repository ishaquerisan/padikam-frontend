import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api/client';
import { Calendar, Eye, X, CheckCircle2, Clock } from 'lucide-react';

export const AdminLessonsPage: React.FC = () => {
  const [date, setDate] = useState('');
  const [page, setPage] = useState(1);
  const [selectedLesson, setSelectedLesson] = useState<any | null>(null);

  const { data, isLoading } = useQuery<{
    total: number;
    page: number;
    totalPages: number;
    lessons: any[];
  }>({
    queryKey: ['admin-lessons', date, page],
    queryFn: () => {
      const q = new URLSearchParams({
        page: String(page),
        limit: '15',
        ...(date && { date }),
      });
      return apiClient.get(`/admin/lessons?${q.toString()}`);
    },
  });

  const lessons = data?.lessons || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Daily Lesson Records</h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
          Inspect user daily lessons and immutable snapshot sentence assignments.
        </p>
      </div>

      <div className="card" style={{ padding: '16px', display: 'flex', gap: '12px' }}>
        <input
          type="date"
          className="form-input"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setPage(1);
          }}
          style={{ maxWidth: '200px' }}
        />
        {date && (
          <button onClick={() => setDate('')} className="btn btn-sm btn-ghost">
            Clear Date
          </button>
        )}
      </div>

      <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-surface-muted)', borderBottom: '1px solid var(--color-border)' }}>
              <th style={{ padding: '14px 16px', fontWeight: 700 }}>Lesson Date</th>
              <th style={{ padding: '14px 16px', fontWeight: 700 }}>User</th>
              <th style={{ padding: '14px 16px', fontWeight: 700 }}>Target</th>
              <th style={{ padding: '14px 16px', fontWeight: 700 }}>Assigned</th>
              <th style={{ padding: '14px 16px', fontWeight: 700 }}>Status</th>
              <th style={{ padding: '14px 16px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  Loading lesson logs...
                </td>
              </tr>
            ) : lessons.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  No lessons found.
                </td>
              </tr>
            ) : (
              lessons.map((l) => (
                <tr key={l.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 600 }}>{l.lesson_date}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 600 }}>{l.user?.name || 'N/A'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{l.user?.email}</div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>{l.target_count} sentences</td>
                  <td style={{ padding: '14px 16px' }}>{l.sentences?.length || 0} sentences</td>
                  <td style={{ padding: '14px 16px' }}>
                    <span className={`badge badge-${l.status === 'COMPLETED' ? 'success' : 'warning'}`}>
                      {l.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <button onClick={() => setSelectedLesson(l)} className="btn btn-sm btn-secondary">
                      <Eye size={14} />
                      <span>Inspect</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Snapshot Inspection Modal */}
      {selectedLesson && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '640px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Lesson Snapshots</h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  Date: {selectedLesson.lesson_date} • User: {selectedLesson.user?.name}
                </div>
              </div>
              <button onClick={() => setSelectedLesson(null)} className="btn-icon btn-ghost">
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '60vh', overflowY: 'auto' }}>
              {selectedLesson.sentences?.map((s: any) => (
                <div
                  key={s.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-surface-muted)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)' }}>
                      Position #{s.position}
                    </span>
                    <span className={`badge badge-${s.status === 'LEARNED' ? 'success' : 'warning'}`}>
                      {s.status}
                    </span>
                  </div>
                  {(s.word_snapshot || s.sentence?.word) && (
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '2px' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--color-primary)' }}>
                        {s.word_snapshot || s.sentence?.word}
                      </span>
                      <span className="font-ml" style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                        ({s.word_meaning_snapshot || s.sentence?.word_meaning})
                      </span>
                    </div>
                  )}
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                    {s.english_text_snapshot || s.sentence?.english_text}
                  </div>
                  <div className="font-ml" style={{ fontSize: '0.85rem', color: 'var(--color-primary-dark)', marginTop: '2px' }}>
                    {s.malayalam_meaning_snapshot || s.sentence?.malayalam_meaning}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setSelectedLesson(null)}
              className="btn btn-primary btn-block"
              style={{ marginTop: '20px' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
