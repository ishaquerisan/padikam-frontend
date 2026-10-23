import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { apiClient } from '@/services/api/client';
import { Lock, CheckCircle2 } from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post('/auth/reset-password', {
        token,
        newPassword,
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        backgroundColor: '#F8FAFC',
      }}
    >
      <div className="card" style={{ maxWidth: '440px', width: '100%', padding: '36px 28px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary-dark)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '12px',
            }}
          >
            <Lock size={24} />
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Create New Password</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Choose a secure new password for your Padikam account.
          </p>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: 'var(--color-danger-subtle)',
              color: 'var(--color-danger)',
              padding: '12px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              marginBottom: '16px',
            }}
          >
            {error}
          </div>
        )}

        {success ? (
          <div
            style={{
              textAlign: 'center',
              padding: '24px 16px',
              backgroundColor: 'var(--color-success-subtle)',
              borderRadius: 'var(--radius-lg)',
            }}
          >
            <CheckCircle2 size={40} color="var(--color-primary)" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ color: 'var(--color-primary-dark)', marginBottom: '8px' }}>Password Reset!</h3>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
              Redirecting you to the sign-in page in a moment...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {!tokenFromUrl && (
              <div className="form-group">
                <label className="form-label">Reset Token</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Paste token here"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block"
              disabled={isSubmitting}
              style={{ marginTop: '12px' }}
            >
              {isSubmitting ? 'Updating...' : 'Set New Password'}
            </button>
          </form>
        )}

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <Link to="/login" style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
