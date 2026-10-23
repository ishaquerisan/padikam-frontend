import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api/client';
import {
  Users,
  FolderTree,
  FileText,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Activity,
  ArrowUpRight,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { data: stats, isLoading } = useQuery<any>({
    queryKey: ['admin-dashboard'],
    queryFn: () => apiClient.get('/admin/dashboard'),
  });

  if (isLoading || !stats) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton" style={{ height: '110px', borderRadius: '16px' }} />
        ))}
      </div>
    );
  }

  const metricCards = [
    { label: 'Registered Users', value: stats.totalUsers, sub: `${stats.activeUsers} active`, icon: Users, color: '#0284C7' },
    { label: 'Learning Categories', value: stats.totalCategories, sub: 'Active taxonomies', icon: FolderTree, color: '#059669' },
    { label: 'Approved Sentences', value: stats.totalActiveSentences, sub: 'Available for learning', icon: FileText, color: '#8B5CF6' },
    { label: 'Lessons Today', value: stats.lessonsStartedToday, sub: `${stats.lessonsCompletedToday} completed`, icon: CalendarCheck, color: '#F59E0B' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Executive Analytics Overview</h2>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
          Real-time telemetry on learner activities, content inventory, and lesson completion.
        </p>
      </div>

      {/* 4 Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {metricCards.map((m, idx) => {
          const Icon = m.icon;
          return (
            <div key={idx} className="card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                    {m.label}
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--color-text-main)', margin: '4px 0' }}>
                    {m.value}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    {m.sub}
                  </div>
                </div>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    backgroundColor: `${m.color}15`,
                    color: m.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={22} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Content Availability by Category */}
      <div className="card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>
          Content Inventory by Category
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
          {stats.categoryContentAvailability?.map((cat: any) => (
            <div
              key={cat.id}
              style={{
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-surface-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{cat.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{cat.slug}</div>
              </div>
              <span className="badge badge-success" style={{ textTransform: 'none' }}>
                {cat.sentenceCount} items
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent System Activity Stream */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Activity size={20} color="var(--color-primary)" />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Recent Application Activity</h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {stats.recentActivity?.slice(0, 10).map((log: any) => (
            <div
              key={log.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderBottom: '1px solid var(--color-border)',
                fontSize: '0.85rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="badge" style={{ backgroundColor: '#E2E8F0', color: '#334155' }}>
                  {log.activity_type}
                </span>
                <span style={{ fontWeight: 600 }}>{log.user?.name || 'System'}</span>
                <span style={{ color: 'var(--color-text-muted)' }}>({log.user?.email || 'N/A'})</span>
              </div>
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                {new Date(log.created_at || log.createdAt).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
