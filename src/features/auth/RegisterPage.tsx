import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { UserPlus } from 'lucide-react';
import { GoogleAuthButton } from './components/GoogleAuthButton';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register({ name, email, password });
      navigate('/onboarding');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
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
            }}
          >
            പ
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Start Learning English</h1>
          <p className="font-ml" style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', marginTop: '4px' }}>
            ഇന്ന് തന്നെ പഠനം തുടങ്ങാം!
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
            label="Sign up with Google"
            onError={(msg) => setError(msg)}
            onSuccess={() => navigate('/app')}
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

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Rahul Menon"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

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

          <div className="form-group">
            <label className="form-label">Password (min 6 characters)</label>
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
            style={{ marginTop: '12px' }}
          >
            <UserPlus size={20} />
            <span>{isSubmitting ? 'Creating account...' : 'Create Account'}</span>
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
