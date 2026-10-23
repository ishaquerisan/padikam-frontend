import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api/client';
import { HelpCircle, Eye, X, CheckCircle2, XCircle } from 'lucide-react';

export const AdminQuizzesPage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [selectedQuiz, setSelectedQuiz] = useState<any | null>(null);

  const { data, isLoading } = useQuery<{
    total: number;
    page: number;
    totalPages: number;
    quizzes: any[];
  }>({
    queryKey: ['admin-quizzes', page],
    queryFn: () => apiClient.get(`/admin/quizzes?page=${page}&limit=15`),
  });

  const quizzes = data?.quizzes || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Quiz Attempt Audits</h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
          Inspect learner quiz attempts, question accuracy, and scoring logs.
        </p>
      </div>

      <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-surface-muted)', borderBottom: '1px solid var(--color-border)' }}>
              <th style={{ padding: '14px 16px', fontWeight: 700 }}>Date</th>
              <th style={{ padding: '14px 16px', fontWeight: 700 }}>Learner</th>
              <th style={{ padding: '14px 16px', fontWeight: 700 }}>Quiz Type</th>
              <th style={{ padding: '14px 16px', fontWeight: 700 }}>Score</th>
              <th style={{ padding: '14px 16px', fontWeight: 700 }}>Accuracy</th>
              <th style={{ padding: '14px 16px', fontWeight: 700 }}>Status</th>
              <th style={{ padding: '14px 16px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  Loading quizzes...
                </td>
              </tr>
            ) : quizzes.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  No quiz attempts recorded yet.
                </td>
              </tr>
            ) : (
              quizzes.map((q) => (
                <tr key={q.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 600 }}>{q.quiz_date}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 600 }}>{q.user?.name || 'N/A'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{q.user?.email}</div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span className="badge" style={{ backgroundColor: 'var(--color-surface-muted)' }}>
                      {q.quiz_type}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontWeight: 800, color: 'var(--color-primary)' }}>
                    {q.score}%
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {q.correct_answers} / {q.total_questions}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span className={`badge badge-${q.status === 'COMPLETED' ? 'success' : 'warning'}`}>
                      {q.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <button onClick={() => setSelectedQuiz(q)} className="btn btn-sm btn-secondary">
                      <Eye size={14} />
                      <span>Review</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Answers Audit Modal */}
      {selectedQuiz && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '640px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Quiz Breakdown</h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  Score: {selectedQuiz.score}% • {selectedQuiz.user?.name}
                </div>
              </div>
              <button onClick={() => setSelectedQuiz(null)} className="btn-icon btn-ghost">
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '60vh', overflowY: 'auto' }}>
              {selectedQuiz.answers?.map((ans: any, idx: number) => (
                <div
                  key={ans.id}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: ans.is_correct ? 'var(--color-primary-subtle)' : 'var(--color-danger-subtle)',
                    border: ans.is_correct ? '1px solid #A7F3D0' : '1px solid #FECACA',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>Question #{idx + 1}</span>
                    {ans.is_correct ? (
                      <CheckCircle2 size={16} color="var(--color-primary)" />
                    ) : (
                      <XCircle size={16} color="var(--color-danger)" />
                    )}
                  </div>
                  <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                    Prompt: "{ans.sentence?.english_text || ans.question_data?.prompt}"
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                    Learner Answer: <strong>{ans.selected_answer || 'Empty'}</strong>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => setSelectedQuiz(null)} className="btn btn-primary btn-block" style={{ marginTop: '20px' }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
