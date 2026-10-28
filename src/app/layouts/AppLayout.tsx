import React from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  BookOpen,
  HelpCircle,
  Bookmark,
  TrendingUp,
  Settings,
  ShieldCheck,
  LogOut,
  Flame,
} from 'lucide-react';
import { useAuth } from '../providers/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api/client';
import { DashboardSummary } from '@/types';

export const AppLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Quick summary query for live streak badge in header
  const { data: summary } = useQuery<DashboardSummary>({
    queryKey: ['dashboard-summary'],
    queryFn: () => apiClient.get('/dashboard/summary'),
    enabled: !!user,
  });


  const navItems = [
    { label: 'Home', path: '/app', icon: Home },
    { label: 'Learn', path: '/app/lesson', icon: BookOpen },
    { label: 'Quiz', path: '/app/quiz', icon: HelpCircle },
    { label: 'Saved', path: '/app/favorites', icon: Bookmark },
    { label: 'Progress', path: '/app/progress', icon: TrendingUp },
  ];

  return (
    <div className="app-container">
      {/* Top Learner Header */}
      <header
        style={{
          height: 'var(--header-height)',
          backgroundColor: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
        }}
      >
        <div
          onClick={() => navigate('/app')}
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '1.2rem',
            }}
          >
            പ
          </div>
          <div>
            <span style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--color-text-main)', letterSpacing: '-0.02em' }}>
              Padikam
            </span>
            <span className="font-ml" style={{ fontSize: '0.8rem', color: 'var(--color-primary)', marginLeft: '6px', fontWeight: 600 }}>
              പഠിക്കാം
            </span>
          </div>
        </div>

        {/* Right side items */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Streak Badge */}
          {summary !== undefined && (
            <div
              onClick={() => navigate('/app/progress')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
                backgroundColor: summary.currentStreak > 0 ? '#FEF3C7' : 'var(--color-surface-muted)',
                color: summary.currentStreak > 0 ? '#B45309' : 'var(--color-text-muted)',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
              title="Daily Learning Streak"
            >
              <Flame size={16} fill={summary.currentStreak > 0 ? '#F59E0B' : 'none'} color="#F59E0B" />
              <span>{summary.currentStreak}d</span>
            </div>
          )}

          {/* Settings / Preferences */}
          <button
            onClick={() => navigate('/app/preferences')}
            className="btn-icon btn-ghost"
            title="Learning Preferences"
          >
            <Settings size={20} />
          </button>

          {/* User Profile Button */}
          <button
            onClick={() => navigate('/app/profile')}
            style={{
              background: 'none',
              border: location.pathname === '/app/profile' ? '2px solid var(--color-primary)' : '2px solid transparent',
              borderRadius: '50%',
              padding: '2px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            title="Account & Profile Settings"
          >
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.name}
                referrerPolicy="no-referrer"
                style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--color-primary)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </div>
            )}
          </button>

          {/* Admin link if user is admin */}
          {user?.role === 'ADMIN' && (
            <button
              onClick={() => navigate('/admin')}
              className="btn btn-sm btn-subtle"
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
              title="Admin Back-Office"
            >
              <ShieldCheck size={16} />
              <span style={{ display: 'none', minWidth: '40px' }} className="d-md-inline">Admin</span>
            </button>
          )}

       
        </div>
      </header>

      {/* Main Screen Content */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 'calc(var(--bottom-nav-height) + env(safe-area-inset-bottom, 0px))',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          backgroundColor: 'var(--color-surface)',
          borderTop: '1px solid var(--color-border)',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          zIndex: 50,
          boxShadow: '0 -2px 10px rgba(0,0,0,0.03)',
        }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path || (item.path !== '/app' && location.pathname.startsWith(item.path));
          return (
            <NavLink
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                flex: 1,
                height: '100%',
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.75rem',
                transition: 'color 0.15s ease',
              }}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};
