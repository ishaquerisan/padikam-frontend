import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api/client';
import { Category, UserSettings } from '@/types';
import { Check, Save, Target, FolderTree, Bell, AlertCircle } from 'lucide-react';

export const PreferencesPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [dailyTarget, setDailyTarget] = useState<number>(5);
  const [notifications, setNotifications] = useState<boolean>(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load all categories
  const { data: allCategories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => apiClient.get('/categories'),
  });

  // Load user selected categories
  const { data: userCategories = [] } = useQuery<Category[]>({
    queryKey: ['user-categories'],
    queryFn: () => apiClient.get('/user-categories'),
  });

  // Load user settings
  const { data: userSettings } = useQuery<UserSettings>({
    queryKey: ['user-settings'],
    queryFn: () => apiClient.get('/user-settings'),
  });

  useEffect(() => {
    if (userCategories.length > 0) {
      setSelectedCategoryIds(userCategories.map((c) => c.id));
    }
  }, [userCategories]);

  useEffect(() => {
    if (userSettings) {
      setDailyTarget(userSettings.daily_target);
      setNotifications(userSettings.notifications_enabled);
    }
  }, [userSettings]);

  const toggleCategory = (id: number) => {
    if (selectedCategoryIds.includes(id)) {
      if (selectedCategoryIds.length === 1) return; // Keep at least one
      setSelectedCategoryIds(selectedCategoryIds.filter((cid) => cid !== id));
    } else {
      setSelectedCategoryIds([...selectedCategoryIds, id]);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      await apiClient.put('/user-categories', { category_ids: selectedCategoryIds });
      await apiClient.put('/user-settings', {
        daily_target: dailyTarget,
        notifications_enabled: notifications,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-categories'] });
      queryClient.invalidateQueries({ queryKey: ['user-settings'] });
      queryClient.invalidateQueries({ queryKey: ['lesson'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setSuccessMessage('Preferences updated successfully! Redirecting to home...');
      setTimeout(() => {
        navigate('/app');
      }, 600);
    },
    onError: (err: any) => {
      setErrorMessage(err?.message || 'Failed to save preferences. Please try again.');
      setTimeout(() => setErrorMessage(null), 4000);
    },
  });

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Learning Preferences</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
          Customize your daily target and topics anytime without losing historical progress.
        </p>
      </div>

      {successMessage && (
        <div
          style={{
            backgroundColor: 'var(--color-success-subtle)',
            color: 'var(--color-primary-dark)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            fontSize: '0.9rem',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Check size={18} color="var(--color-primary)" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div
          style={{
            backgroundColor: '#FEE2E2',
            color: '#B91C1C',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            fontSize: '0.9rem',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertCircle size={18} color="#B91C1C" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Daily Target Setting */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Target size={22} color="var(--color-primary)" />
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Daily Sentence Target</h2>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
          Allowed target counts: 5, 10, 20, or 30 sentences per day.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
          {[5, 10, 20, 30].map((count) => {
            const isSelected = dailyTarget === count;
            return (
              <button
                key={count}
                type="button"
                onClick={() => setDailyTarget(count)}
                style={{
                  padding: '16px 12px',
                  borderRadius: 'var(--radius-md)',
                  border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                  backgroundColor: isSelected ? 'var(--color-primary-subtle)' : 'var(--color-surface)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ fontSize: '1.4rem', fontWeight: 800, color: isSelected ? 'var(--color-primary)' : 'var(--color-text-main)' }}>
                  {count}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                  sentences / day
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Category Selection */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <FolderTree size={22} color="var(--color-primary)" />
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Selected Topics</h2>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
          Lessons are generated from sentences in your selected categories.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
          {allCategories.map((cat) => {
            const isSelected = selectedCategoryIds.includes(cat.id);
            return (
              <div
                key={cat.id}
                onClick={() => toggleCategory(cat.id)}
                className="card-interactive"
                style={{
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                  backgroundColor: isSelected ? 'var(--color-primary-subtle)' : 'var(--color-surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {cat.name}
                  </div>
                </div>
                <div
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '4px',
                    border: isSelected ? 'none' : '2px solid var(--color-border)',
                    backgroundColor: isSelected ? 'var(--color-primary)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    flexShrink: 0,
                  }}
                >
                  {isSelected && <Check size={12} strokeWidth={3} />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Notification Setting */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bell size={22} color="var(--color-primary)" />
            <div>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Daily Practice Reminders</h2>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                Receive reminders to maintain your daily streak
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setNotifications(!notifications)}
            className="btn btn-sm"
            style={{
              backgroundColor: notifications ? 'var(--color-primary)' : 'var(--color-surface-hover)',
              color: notifications ? '#fff' : 'var(--color-text-secondary)',
              fontWeight: 600,
              minWidth: '80px',
            }}
          >
            {notifications ? 'Enabled' : 'Disabled'}
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => saveMutation.mutate()}
        className="btn btn-primary btn-block btn-lg"
        disabled={saveMutation.isPending || selectedCategoryIds.length === 0}
      >
        <Save size={20} />
        <span>{saveMutation.isPending ? 'Saving Preferences...' : 'Save Preferences'}</span>
      </button>
    </div>
  );
};
