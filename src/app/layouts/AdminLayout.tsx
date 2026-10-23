import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FolderTree,
  FileText,
  CalendarCheck,
  CheckCircle2,
  Activity,
  ArrowLeft,
  Menu,
  X,
  LogOut,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../providers/AuthProvider';

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Guard: if user is not admin
  if (user && user.role !== 'ADMIN') {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center' }}>
        <ShieldAlert size={48} color="#EF4444" style={{ margin: '0 auto 16px' }} />
        <h2>Access Denied</h2>
        <p style={{ color: 'var(--color-text-secondary)', margin: '12px 0 24px' }}>
          You do not have administrative privileges to access this console.
        </p>
        <button onClick={() => navigate('/app')} className="btn btn-primary">
          Back to Learner App
        </button>
      </div>
    );
  }

  const navLinks = [
    { label: 'Overview', path: '/admin', icon: LayoutDashboard },
    { label: 'User Management', path: '/admin/users', icon: Users },
    { label: 'Categories', path: '/admin/categories', icon: FolderTree },
    { label: 'Sentences & CSV Import', path: '/admin/sentences', icon: FileText },
    { label: 'Daily Lessons', path: '/admin/lessons', icon: CalendarCheck },
    { label: 'Quizzes & Audits', path: '/admin/quizzes', icon: CheckCircle2 },
    { label: 'System Logs', path: '/admin/activity', icon: Activity },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F1F5F9' }}>
      {/* Desktop Sidebar */}
      <aside
        style={{
          width: '260px',
          backgroundColor: '#0F172A',
          color: '#F8FAFC',
          display: 'none',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 30,
        }}
        className="admin-sidebar-desktop"
      >
        <div style={{ padding: '24px 20px', borderBottom: '1px solid #1E293B' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 800,
              }}
            >
              P
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>Padikam Admin</div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Back-Office Console</div>
            </div>
          </div>
        </div>

        {/* Links */}
        <nav style={{ flex: 1, padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.path;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: isActive ? '#FFFFFF' : '#94A3B8',
                  backgroundColor: isActive ? 'var(--color-primary)' : 'transparent',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={18} />
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div style={{ padding: '20px 16px', borderTop: '1px solid #1E293B', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            onClick={() => navigate('/app')}
            className="btn btn-sm btn-ghost"
            style={{ color: '#E2E8F0', justifyContent: 'flex-start', padding: '10px' }}
          >
            <ArrowLeft size={16} />
            <span>Learner App</span>
          </button>
          <button
            onClick={handleLogout}
            className="btn btn-sm btn-ghost"
            style={{ color: '#EF4444', justifyContent: 'flex-start', padding: '10px' }}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Navbar */}
        <header
          style={{
            height: '64px',
            backgroundColor: '#FFFFFF',
            borderBottom: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            position: 'sticky',
            top: 0,
            zIndex: 20,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="btn-icon btn-ghost mobile-menu-btn"
              style={{ display: 'none' }}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
              Padikam Back-Office
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ textAlign: 'right', display: 'none' }} className="d-md-block">
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{user?.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 700 }}>
                ADMINISTRATOR
              </div>
            </div>
            <button
              onClick={() => navigate('/app')}
              className="btn btn-sm btn-secondary"
            >
              <ArrowLeft size={14} />
              <span>Learner View</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ flex: 1, padding: '24px', maxWidth: '1400px', width: '100%', margin: '0 auto' }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (min-width: 900px) {
          .admin-sidebar-desktop {
            display: flex !important;
          }
          .mobile-menu-btn {
            display: none !important;
          }
          .d-md-block {
            display: block !important;
          }
        }
        @media (max-width: 899px) {
          .mobile-menu-btn {
            display: flex !important;
          }
        }
      `}</style>
    </div>
  );
};
