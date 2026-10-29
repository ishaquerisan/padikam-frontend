import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/providers/AuthProvider';
import { apiClient } from '@/services/api/client';
import { User } from '@/types';
import { useQueryClient } from '@tanstack/react-query';
import {
  User as UserIcon,
  Lock,
  Mail,
  Shield,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Save,
  KeyRound,
  ExternalLink,
  Sliders,
  Check,
  LogOut,
  LogIn,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ProfilePage: React.FC = () => {
  const { user, updateUser, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Session & logout state
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);



  // Profile edit state
  const [name, setName] = useState(user?.name || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const isGoogleAccount = user?.auth_provider === 'google';



  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess(null);
    setProfileError(null);

    if (!name.trim()) {
      setProfileError('Name cannot be empty.');
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const updatedUser = (await apiClient.put('/auth/profile', {
        name: name.trim(),
      })) as User;

      updateUser(updatedUser);
      setProfileSuccess('Profile name updated successfully!');
      setTimeout(() => setProfileSuccess(null), 4000);
    } catch (err: any) {
      setProfileError(err?.message || 'Failed to update profile. Please try again.');
      setTimeout(() => setProfileError(null), 5000);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccess(null);
    setPasswordError(null);

    if (!isGoogleAccount && !currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match. Please verify and try again.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await apiClient.post('/auth/change-password', {
        currentPassword: currentPassword || undefined,
        newPassword,
      });

      setPasswordSuccess('Password updated successfully! You can now use your new password.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      await refreshUser();
      setTimeout(() => setPasswordSuccess(null), 5000);
    } catch (err: any) {
      setPasswordError(err?.message || 'Failed to change password. Please check your credentials.');
      setTimeout(() => setPasswordError(null), 5000);
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Format member since date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Active Member';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateString;
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
      navigate('/login');
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  const handleSwitchAccount = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Switch account error:', err);
      navigate('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  // User initials for avatar
  const getInitials = (fullName: string) => {
    if (!fullName) return 'P';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return fullName.slice(0, 2).toUpperCase();
  };

  // Unauthenticated fallback
  if (!user) {
    return (
      <div style={{ maxWidth: '680px', margin: '40px auto', padding: '0 16px' }}>
        <div
          className="card"
          style={{
            padding: '44px 28px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '20px',
              backgroundColor: '#ECFDF5',
              color: 'var(--color-primary)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <UserIcon size={32} />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Account & Profile</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', maxWidth: '440px', margin: 0, lineHeight: 1.5 }}>
            You are currently not signed in. Log in to your Padikam account to customize your profile, sync daily learning streaks, and track vocabulary progress.
          </p>
          <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => navigate('/login')}
              style={{ minWidth: '150px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <LogIn size={16} />
              <span>Log In</span>
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/register')}
              style={{ minWidth: '150px' }}
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', paddingBottom: '40px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Account & Profile</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
          Manage your personal details and account security settings.
        </p>
      </div>

      {/* User Overview Card */}
      <div
        className="card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '20px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: 'var(--shadow-sm)',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1, minWidth: '240px' }}>
          {/* Avatar */}
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.name}
              referrerPolicy="no-referrer"
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid #E2E8F0',
                flexShrink: 0,
              }}
            />
          ) : (
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--color-primary) 0%, #047857 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 800,
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
              }}
            >
              {getInitials(user?.name || '')}
            </div>
          )}

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--color-text-main)' }}>
                {user?.name}
              </h2>
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  backgroundColor: user?.role === 'ADMIN' ? '#FEF3C7' : '#E0E7FF',
                  color: user?.role === 'ADMIN' ? '#92400E' : '#3730A3',
                }}
              >
                {user?.role}
              </span>
            </div>

            <p
              style={{
                margin: '4px 0 0 0',
                fontSize: '0.88rem',
                color: 'var(--color-text-secondary)',
                wordBreak: 'break-all',
              }}
            >
              {user?.email}
            </p>

            {/* Provider Badge */}
            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {isGoogleAccount ? (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: '#1E293B',
                    backgroundColor: '#F1F5F9',
                    padding: '3px 10px',
                    borderRadius: '6px',
                    border: '1px solid #E2E8F0',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27A7.06 7.06 0 0 1 4.9 12c0-.79.14-1.57.38-2.27V6.58H1.25A11.96 11.96 0 0 0 0 12c0 1.92.45 3.74 1.25 5.42l4.03-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                  </svg>
                  Google Account
                </span>
              ) : (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    color: '#059669',
                    backgroundColor: '#ECFDF5',
                    padding: '3px 10px',
                    borderRadius: '6px',
                    border: '1px solid #A7F3D0',
                  }}
                >
                  <Mail size={13} />
                  Email / Password Account
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Header Actions: Log Out */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => setShowLogoutModal(true)}
            style={{
              backgroundColor: '#FEF2F2',
              color: '#DC2626',
              border: '1px solid #FECACA',
              fontWeight: 600,
              gap: '6px',
              padding: '8px 14px',
              borderRadius: 'var(--radius-md)',
              transition: 'all 0.15s ease',
            }}
            title="Log out of your account"
          >
            <LogOut size={15} />
            <span>Log Out</span>
          </button>
        </div>
      </div>
      {/* Section 1: Edit Profile Name */}
      <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: '#ECFDF5',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <UserIcon size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Personal Information</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', margin: 0 }}>
              Update your display name visible across your learning activities.
            </p>
          </div>
        </div>

        {profileSuccess && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#ECFDF5',
              color: '#065F46',
              border: '1px solid #A7F3D0',
              fontSize: '0.85rem',
              marginBottom: '16px',
            }}
          >
            <CheckCircle size={18} />
            <span>{profileSuccess}</span>
          </div>
        )}

        {profileError && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#FEF2F2',
              color: '#991B1B',
              border: '1px solid #FECACA',
              fontSize: '0.85rem',
              marginBottom: '16px',
            }}
          >
            <AlertCircle size={18} />
            <span>{profileError}</span>
          </div>
        )}

        <form onSubmit={handleUpdateProfile}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rahul Menon"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              value={user?.email || ''}
              disabled
              style={{ backgroundColor: 'var(--color-surface-muted)', color: 'var(--color-text-muted)', cursor: 'not-allowed' }}
            />
            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-secondary)', marginTop: '4px', display: 'block' }}>
              Your email is permanently linked to your Padikam progress and cannot be modified.
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isUpdatingProfile || name.trim() === user?.name}
            >
              <Save size={16} />
              <span>{isUpdatingProfile ? 'Saving...' : 'Save Profile'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Section 2: Password Management */}
      <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: '#EFF6FF',
              color: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Lock size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Security & Password</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', margin: 0 }}>
              {isGoogleAccount
                ? 'Your authentication is secured via Google'
                : 'Change your password regularly to keep your account safe.'}
            </p>
          </div>
        </div>

        {passwordSuccess && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#ECFDF5',
              color: '#065F46',
              border: '1px solid #A7F3D0',
              fontSize: '0.85rem',
              marginBottom: '16px',
            }}
          >
            <CheckCircle size={18} />
            <span>{passwordSuccess}</span>
          </div>
        )}

        {passwordError && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#FEF2F2',
              color: '#991B1B',
              border: '1px solid #FECACA',
              fontSize: '0.85rem',
              marginBottom: '16px',
            }}
          >
            <AlertCircle size={18} />
            <span>{passwordError}</span>
          </div>
        )}

        {isGoogleAccount && (
          <div
            style={{
              backgroundColor: '#F8FAFC',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #E2E8F0',
              padding: '16px',
              marginBottom: '20px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <Shield size={20} color="#2563EB" style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <h3 style={{ fontSize: '0.92rem', fontWeight: 700, margin: 0, color: '#1E293B' }}>
                  Managed by Google Authentication
                </h3>
                <p style={{ fontSize: '0.84rem', color: '#64748B', margin: '4px 0 0 0', lineHeight: 1.5 }}>
                  You signed in using <strong>{user?.email}</strong>. Your password, two-factor authentication, and account safety are verified by Google.
                </p>
                <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '8px 0 0 0' }}>
                  If you would like to also enable email/password sign-in alongside Google, set a password below:
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Change Password Form */}
        <form onSubmit={handleChangePassword}>
          {!isGoogleAccount && (
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  className="form-input"
                  style={{ paddingRight: '42px' }}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-text-muted)',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                  }}
                >
                  {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">
              {isGoogleAccount ? 'Set New Password (min 6 characters)' : 'New Password (min 6 characters)'}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showNewPassword ? 'text' : 'password'}
                className="form-input"
                style={{ paddingRight: '42px' }}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                }}
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                className="form-input"
                style={{ paddingRight: '42px' }}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                }}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {newPassword && confirmPassword && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.8rem',
                  marginTop: '4px',
                  fontWeight: 600,
                  color: newPassword === confirmPassword ? '#059669' : '#DC2626',
                }}
              >
                {newPassword === confirmPassword ? <Check size={14} /> : <AlertCircle size={14} />}
                {newPassword === confirmPassword ? 'Passwords match' : 'Passwords do not match'}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '18px' }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isChangingPassword || !newPassword || newPassword !== confirmPassword}
            >
              <KeyRound size={16} />
              <span>{isChangingPassword ? 'Updating Password...' : isGoogleAccount ? 'Set Password' : 'Change Password'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Section 3: Account Session & Sign-In */}
      <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: '#FEF2F2',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Shield size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Account Session & Sign-In</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)', margin: 0 }}>
              Manage your active login session, switch accounts, or securely log out.
            </p>
          </div>
        </div>

        {/* Session details grid */}
        <div
          style={{
            backgroundColor: 'var(--color-surface-muted)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            marginBottom: '20px',
            border: '1px solid var(--color-border)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '14px',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Session Status
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', fontSize: '0.88rem', fontWeight: 700, color: '#059669' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#10B981',
                  boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.2)',
                }}
              />
              Active Session
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Signed In As
            </div>
            <div style={{ marginTop: '4px', fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-text-main)', wordBreak: 'break-all' }}>
              {user.email}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Sign-In Provider
            </div>
            <div style={{ marginTop: '4px', fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
              {isGoogleAccount ? 'Google Authentication' : 'Email & Password'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Member Since
            </div>
            <div style={{ marginTop: '4px', fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
              {formatDate(user.createdAt)}
            </div>
          </div>
        </div>

        {/* Buttons: User Login (Switch Account) & User Logout */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleSwitchAccount}
            disabled={isLoggingOut}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            title="Log in with a different Padikam account"
          >
            <LogIn size={16} />
            <span>Switch Account / Sign In</span>
          </button>

          <button
            type="button"
            className="btn btn-danger"
            onClick={() => setShowLogoutModal(true)}
            disabled={isLoggingOut}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#DC2626',
            }}
            title="End current active session"
          >
            <LogOut size={16} />
            <span>Log Out</span>
          </button>
        </div>
      </div>

      {/* Quick Access Card */}
      <div
        className="card"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 24px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: '#FEF3C7',
              color: '#D97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sliders size={18} />
          </div>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700 }}>Learning Goals & Categories</h4>
            <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
              Change daily sentence targets (5, 10, 20, 30) and selected topics
            </p>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-sm btn-subtle"
          onClick={() => navigate('/app/preferences')}
        >
          Preferences
        </button>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && !isLoggingOut) {
              setShowLogoutModal(false);
            }
          }}
        >
          <div
            className="card"
            style={{
              maxWidth: '420px',
              width: '100%',
              padding: '28px',
              borderRadius: '20px',
              boxShadow: 'var(--shadow-float)',
              position: 'relative',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                backgroundColor: '#FEF2F2',
                color: '#DC2626',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                border: '1px solid #FECACA',
              }}
            >
              <LogOut size={26} />
            </div>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--color-text-main)' }}>
              Log out of Padikam?
            </h3>

            <p
              style={{
                fontSize: '0.88rem',
                color: 'var(--color-text-secondary)',
                marginTop: '8px',
                marginBottom: '24px',
                lineHeight: 1.5,
              }}
            >
              Are you sure you want to end your active session for <strong>{user.email}</strong>? Your vocabulary progress and daily streaks are safely saved.
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                style={{ flex: 1, backgroundColor: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                <LogOut size={16} />
                <span>{isLoggingOut ? 'Logging out...' : 'Log Out'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
