import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '@/services/api/client';
import { KeyRound, ArrowLeft } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);
    try {
      const res = (await apiClient.post('/auth/forgot-password', { email })) as any;
      setMessage(res.message);
      if (res.resetToken) {
        setResetToken(res.resetToken);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to process request.');
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
            <KeyRound size={24} />
          </div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Reset Password</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Enter your registered email address to receive password reset instructions.
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

        {message && (
          <div
            style={{
              backgroundColor: 'var(--color-success-subtle)',
              color: 'var(--color-primary-dark)',
              padding: '14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              marginBottom: '20px',
            }}
          >
            <p>{message}</p>
            {resetToken && (
              <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #A7F3D0' }}>
                <p style={{ fontWeight: 600, fontSize: '0.8rem' }}>Demo Quick Reset Link:</p>
                <button
                  type="button"
                  onClick={() => navigate(`/reset-password?token=${resetToken}`)}
                  className="btn btn-sm btn-primary"
                  style={{ marginTop: '6px' }}
                >
                  Proceed to Reset Password
                </button>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="rahul@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={isSubmitting}
            style={{ marginTop: '8px' }}
          >
            {isSubmitting ? 'Sending...' : 'Send Reset Instructions'}
          </button>
        </form>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <Link
            to="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem',
              color: 'var(--color-text-secondary)',
            }}
          >
            <ArrowLeft size={16} />
            <span>Back to Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
