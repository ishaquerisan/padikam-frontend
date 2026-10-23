import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api/client';
import { Activity, Search } from 'lucide-react';

export const AdminActivityPage: React.FC = () => {
  const [activityType, setActivityType] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<{
    total: number;
    page: number;
    totalPages: number;
    logs: any[];
  }>({
    queryKey: ['admin-activity', activityType, page],
    queryFn: () => {
      const q = new URLSearchParams({
        page: String(page),
        limit: '20',
        ...(activityType && { activityType }),
      });
      return apiClient.get(`/admin/activity?${q.toString()}`);
    },
  });

  const logs = data?.logs || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>System Activity & Audit Trail</h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
          Real-time event logging across user registrations, completed goals, and admin modifications.
        </p>
      </div>

      <div className="card" style={{ padding: '16px', display: 'flex', gap: '12px' }}>
        <select
          className="form-select"
          value={activityType}
          onChange={(e) => {
            setActivityType(e.target.value);
            setPage(1);
          }}
          style={{ maxWidth: '240px' }}
        >
          <option value="">All Event Types</option>
          <option value="USER_REGISTERED">User Registered</option>
          <option value="USER_LOGGED_IN">User Logged In</option>
          <option value="DAILY_LESSON_STARTED">Lesson Started</option>
          <option value="DAILY_TARGET_COMPLETED">Daily Target Completed</option>
          <option value="QUIZ_COMPLETED">Quiz Completed</option>
          <option value="PASSWORD_CHANGED">Password Changed</option>
        </select>
      </div>

      <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-surface-muted)', borderBottom: '1px solid var(--color-border)' }}>
              <th style={{ padding: '14px 16px', fontWeight: 700 }}>Timestamp</th>
              <th style={{ padding: '14px 16px', fontWeight: 700 }}>Event Type</th>
              <th style={{ padding: '14px 16px', fontWeight: 700 }}>User</th>
              <th style={{ padding: '14px 16px', fontWeight: 700 }}>Details</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  Loading activity logs...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  No activity logs found.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '14px 16px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(log.created_at || log.createdAt).toLocaleString()}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span className="badge" style={{ backgroundColor: '#E2E8F0', color: '#1E293B' }}>
                      {log.activity_type}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 600 }}>{log.user?.name || 'System'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{log.user?.email}</div>
                  </td>
                  <td style={{ padding: '14px 16px', fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                    {JSON.stringify(log.details)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
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
  );
};
