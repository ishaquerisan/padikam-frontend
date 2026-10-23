import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api/client';
import { User, UserRole, UserStatus } from '@/types';
import {
  Users,
  Search,
  Shield,
  ShieldAlert,
  CheckCircle,
  XCircle,
  Eye,
  X,
} from 'lucide-react';

export const AdminUsersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [role, setRole] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [page, setPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  const { data, isLoading } = useQuery<{
    total: number;
    page: number;
    totalPages: number;
    users: User[];
  }>({
    queryKey: ['admin-users', search, role, status, page],
    queryFn: () => {
      const q = new URLSearchParams({
        page: String(page),
        limit: '10',
        ...(search && { search }),
        ...(role && { role }),
        ...(status && { status }),
      });
      return apiClient.get(`/admin/users?${q.toString()}`);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (payload: { id: number; status: UserStatus }) =>
      apiClient.put(`/admin/users/${payload.id}/status`, { status: payload.status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const updateRoleMutation = useMutation({
    mutationFn: (payload: { id: number; role: UserRole }) =>
      apiClient.put(`/admin/users/${payload.id}/role`, { role: payload.role }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const handleViewUser = async (id: number) => {
    try {
      const detail = await apiClient.get(`/admin/users/${id}`);
      setSelectedUser(detail);
    } catch (e) {
      alert('Failed to load user details');
    }
  };

  const users = data?.users || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>User Management</h2>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
            Inspect learner accounts, role authorizations, and learning telemetry.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="card" style={{ padding: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
          <Search size={18} color="var(--color-text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{ paddingLeft: '38px' }}
          />
        </div>

        <select
          className="form-select"
          value={role}
          onChange={(e) => {
            setRole(e.target.value);
            setPage(1);
          }}
          style={{ width: '140px' }}
        >
          <option value="">All Roles</option>
          <option value="USER">Learner</option>
          <option value="ADMIN">Administrator</option>
        </select>

        <select
          className="form-select"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          style={{ width: '140px' }}
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: '0', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-surface-muted)', borderBottom: '1px solid var(--color-border)' }}>
              <th style={{ padding: '14px 16px', fontWeight: 700 }}>User</th>
              <th style={{ padding: '14px 16px', fontWeight: 700 }}>Role</th>
              <th style={{ padding: '14px 16px', fontWeight: 700 }}>Status</th>
              <th style={{ padding: '14px 16px', fontWeight: 700 }}>Daily Goal</th>
              <th style={{ padding: '14px 16px', fontWeight: 700 }}>Joined</th>
              <th style={{ padding: '14px 16px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  Loading users...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  No users found matching query.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ fontWeight: 600 }}>{u.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{u.email}</div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <button
                      onClick={() =>
                        updateRoleMutation.mutate({
                          id: u.id,
                          role: u.role === 'ADMIN' ? 'USER' : 'ADMIN',
                        })
                      }
                      className="btn btn-sm btn-subtle"
                      title="Click to toggle role"
                    >
                      {u.role === 'ADMIN' ? 'ADMIN' : 'LEARNER'}
                    </button>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <button
                      onClick={() =>
                        updateStatusMutation.mutate({
                          id: u.id,
                          status: u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
                        })
                      }
                      className={`badge badge-${u.status === 'ACTIVE' ? 'success' : 'danger'}`}
                      style={{ cursor: 'pointer' }}
                      title="Click to toggle status"
                    >
                      {u.status}
                    </button>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {u.settings?.daily_target || 5} sentences
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--color-text-muted)' }}>
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleViewUser(u.id)}
                      className="btn btn-sm btn-secondary"
                    >
                      <Eye size={14} />
                      <span>Details</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
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

      {/* User Details Modal */}
      {selectedUser && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Learner Profile & Stats</h3>
              <button onClick={() => setSelectedUser(null)} className="btn-icon btn-ghost">
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Name</div>
                <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{selectedUser.user?.name}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Email</div>
                <div style={{ fontWeight: 600 }}>{selectedUser.user?.email}</div>
              </div>

              {/* Stats Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                <div className="card" style={{ padding: '14px', backgroundColor: 'var(--color-surface-muted)' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{selectedUser.stats?.totalLessons}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Total Lessons</div>
                </div>
                <div className="card" style={{ padding: '14px', backgroundColor: 'var(--color-surface-muted)' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{selectedUser.stats?.sentencesLearned}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Sentences Mastered</div>
                </div>
                <div className="card" style={{ padding: '14px', backgroundColor: 'var(--color-surface-muted)' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{selectedUser.stats?.completedLessons}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Completed Goals</div>
                </div>
                <div className="card" style={{ padding: '14px', backgroundColor: 'var(--color-surface-muted)' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>{selectedUser.stats?.quizAttempts}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Quiz Attempts</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedUser(null)}
              className="btn btn-primary btn-block"
              style={{ marginTop: '24px' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
