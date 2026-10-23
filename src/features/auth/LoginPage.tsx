import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { LogIn } from 'lucide-react';
import { GoogleAuthButton } from './components/GoogleAuthButton';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const user = await login({ email, password });
      if (user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/app');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
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
      <div
        className="card"
        style={{
          maxWidth: '440px',
          width: '100%',
          padding: '36px 28px',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        {/* Brand header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '16px',
              backgroundColor: 'var(--color-primary)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '1.8rem',
              marginBottom: '12px',
              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
            }}
          >
            പ
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Welcome to Padikam
          </h1>
          <p className="font-ml" style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', marginTop: '4px' }}>
            ഇംഗ്ലീഷ് എളുപ്പത്തിൽ പഠിക്കാം
          </p>
        </div>

        {error && (
          <div
            style={{
              backgroundColor: 'var(--color-danger-subtle)',
              color: 'var(--color-danger)',
              padding: '12px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              marginBottom: '20px',
              border: '1px solid #FECACA',
            }}
          >
            {error}
          </div>
        )}

        {/* Google Auth Button */}
        <div style={{ marginBottom: '20px' }}>
          <GoogleAuthButton
            label="Sign in with Google"
            onError={(msg) => setError(msg)}
          />
        </div>

        {/* Divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            margin: '20px 0',
            color: 'var(--color-text-secondary)',
            fontSize: '0.82rem',
          }}
        >
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border)' }} />
          <span style={{ padding: '0 12px', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
            or with email
          </span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--color-border)' }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="e.g. rahul@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>Password</label>
              <Link
                to="/forgot-password"
                style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 600 }}
              >
                Forgot?
              </Link>
            </div>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={isSubmitting}
            style={{ marginTop: '8px' }}
          >
            <LogIn size={20} />
            <span>{isSubmitting ? 'Signing in...' : 'Sign In'}</span>
          </button>
        </form>


        {/* Footer */}
        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
            Create one free
          </Link>
        </div>
      </div>
    </div>
  );
};
