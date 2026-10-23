import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/app/providers/AuthProvider';
import { isFirebaseConfigured } from '@/services/firebase';
import { AlertCircle, ExternalLink, KeyRound } from 'lucide-react';

interface GoogleAuthButtonProps {
  label?: string;
  onError?: (errorMessage: string) => void;
  onSuccess?: () => void;
}

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  label = 'Continue with Google',
  onError,
  onSuccess,
}) => {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);

  const handleClick = async () => {
    if (!isFirebaseConfigured()) {
      setShowConfigModal(true);
      return;
    }

    setIsLoading(true);
    try {
      const user = await loginWithGoogle();
      if (onSuccess) {
        onSuccess();
      } else {
        if (user.role === 'ADMIN') {
          navigate('/admin');
        } else {
          navigate('/app');
        }
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Google authentication was not completed.';
      if (onError) {
        onError(errorMsg);
      } else {
        alert(errorMsg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          padding: '11px 16px',
          backgroundColor: '#FFFFFF',
          border: '1.5px solid #E2E8F0',
          borderRadius: 'var(--radius-md, 10px)',
          fontSize: '0.95rem',
          fontWeight: 600,
          color: '#1E293B',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          transition: 'all 0.18s ease-in-out',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          position: 'relative',
        }}
        onMouseEnter={(e) => {
          if (!isLoading) {
            e.currentTarget.style.backgroundColor = '#F8FAFC';
            e.currentTarget.style.borderColor = '#CBD5E1';
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.07)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isLoading) {
            e.currentTarget.style.backgroundColor = '#FFFFFF';
            e.currentTarget.style.borderColor = '#E2E8F0';
            e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
          }
        }}
      >
        {isLoading ? (
          <div
            style={{
              width: '20px',
              height: '20px',
              border: '2.5px solid #E2E8F0',
              borderTopColor: 'var(--color-primary, #059669)',
              borderRadius: '50%',
              animation: 'spin 0.75s linear infinite',
            }}
          />
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27A7.06 7.06 0 0 1 4.9 12c0-.79.14-1.57.38-2.27V6.58H1.25A11.96 11.96 0 0 0 0 12c0 1.92.45 3.74 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
        )}
        <span>{isLoading ? 'Connecting to Google...' : label}</span>
      </button>

      {/* Configuration Required Modal / Help dialog if .env is missing keys */}
      {showConfigModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
            backdropFilter: 'blur(3px)',
          }}
          onClick={() => setShowConfigModal(false)}
        >
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              position: 'relative',
              textAlign: 'left',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: '#FEF3C7',
                  color: '#D97706',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <KeyRound size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#0F172A' }}>
                  Firebase Setup Required
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748B' }}>
                  Google Auth credentials needed in <code>frontend/.env</code>
                </p>
              </div>
            </div>

            <p style={{ fontSize: '0.92rem', color: '#334155', lineHeight: 1.5, marginBottom: '16px' }}>
              To enable <strong>Google Sign-In with Firebase</strong>, create a project in the Firebase Console, enable Google under Authentication, and paste your web app keys into <code>frontend/.env</code>:
            </p>

            <div
              style={{
                backgroundColor: '#0F172A',
                color: '#E2E8F0',
                padding: '14px 16px',
                borderRadius: '10px',
                fontFamily: 'monospace',
                fontSize: '0.82rem',
                lineHeight: 1.6,
                overflowX: 'auto',
                marginBottom: '18px',
              }}
            >
              VITE_FIREBASE_API_KEY=AIzaSy...<br />
              VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com<br />
              VITE_FIREBASE_PROJECT_ID=your-project-id<br />
              VITE_FIREBASE_STORAGE_BUCKET=your-app.appspot.com<br />
              VITE_FIREBASE_MESSAGING_SENDER_ID=123456789...<br />
              VITE_FIREBASE_APP_ID=1:123456789:web:...
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowConfigModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
