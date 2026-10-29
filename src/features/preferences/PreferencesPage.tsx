import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api/client';
import { Category, UserSettings, SentenceDifficulty } from '@/types';
import { useAuth } from '@/app/providers/AuthProvider';
import { Check, Save, Target, FolderTree, Bell, AlertCircle, GraduationCap } from 'lucide-react';

export const PreferencesPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, updateUser } = useAuth();
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [dailyTarget, setDailyTarget] = useState<number>(5);
  const [difficultyLevel, setDifficultyLevel] = useState<SentenceDifficulty>('BEGINNER');
  const [isSavingDifficulty, setIsSavingDifficulty] = useState(false);
  const [difficultySavedMessage, setDifficultySavedMessage] = useState<string | null>(null);
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
    } else if (allCategories.length > 0 && selectedCategoryIds.length === 0) {
      setSelectedCategoryIds(allCategories.map((c) => c.id));
    }
  }, [userCategories, allCategories]);

  useEffect(() => {
    if (userSettings) {
      setDailyTarget(userSettings.daily_target);
      if (userSettings.difficulty_level) {
        setDifficultyLevel(userSettings.difficulty_level);
      }
      setNotifications(userSettings.notifications_enabled);
    } else if (user?.difficulty_level) {
      setDifficultyLevel(user.difficulty_level);
    }
  }, [userSettings, user]);

  const handleSelectAndSaveDifficulty = async (level: SentenceDifficulty) => {
    setDifficultyLevel(level);
    setIsSavingDifficulty(true);
    setDifficultySavedMessage(null);
    setErrorMessage(null);

    try {
      await apiClient.put('/user-settings', {
        daily_target: dailyTarget,
        difficulty_level: level,
        notifications_enabled: notifications,
      });

      if (user) {
        updateUser({
          ...user,
          difficulty_level: level,
          settings: {
            ...(user.settings || { id: 0, user_id: user.id, daily_target: dailyTarget, timezone: 'Asia/Kolkata', notifications_enabled: notifications }),
            difficulty_level: level,
          },
        });
      }

      queryClient.invalidateQueries({ queryKey: ['user-settings'] });
      queryClient.invalidateQueries({ queryKey: ['lesson'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });

      setDifficultySavedMessage(`Difficulty level saved as ${level}!`);
      setTimeout(() => setDifficultySavedMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to update difficulty level. Please try again.');
      setTimeout(() => setErrorMessage(null), 4000);
    } finally {
      setIsSavingDifficulty(false);
    }
  };

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
      if (selectedCategoryIds.length > 0) {
        await apiClient.put('/user-categories', { category_ids: selectedCategoryIds });
      }
      await apiClient.put('/user-settings', {
        daily_target: dailyTarget,
        difficulty_level: difficultyLevel,
        notifications_enabled: notifications,
      });

      if (user) {
        updateUser({
          ...user,
          difficulty_level: difficultyLevel,
          settings: {
            ...(user.settings || { id: 0, user_id: user.id, daily_target: dailyTarget, timezone: 'Asia/Kolkata', notifications_enabled: notifications }),
            difficulty_level: difficultyLevel,
          },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-categories'] });
      queryClient.invalidateQueries({ queryKey: ['user-settings'] });
      queryClient.invalidateQueries({ queryKey: ['lesson'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setSuccessMessage('Preferences updated successfully!');
      setTimeout(() => setSuccessMessage(null), 4000);
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

      {/* Difficulty Level Setting */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <GraduationCap size={22} color="var(--color-primary)" />
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>Learning Difficulty Level</h2>
          </div>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginBottom: '16px' }}>
          All new users start at Beginner level by default. Choose your preferred level for daily lesson sentences.
        </p>

        {difficultySavedMessage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              backgroundColor: '#ECFDF5',
              color: '#065F46',
              border: '1px solid #A7F3D0',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '16px',
            }}
          >
            <Check size={16} />
            <span>{difficultySavedMessage}</span>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
          {/* Beginner */}
          <div
            onClick={() => handleSelectAndSaveDifficulty('BEGINNER')}
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-lg)',
              border: difficultyLevel === 'BEGINNER' ? '2px solid #059669' : '1px solid var(--color-border)',
              backgroundColor: difficultyLevel === 'BEGINNER' ? '#ECFDF5' : 'var(--color-surface)',
              cursor: isSavingDifficulty ? 'wait' : 'pointer',
              transition: 'all 0.15s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
            className="card-interactive"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="badge badge-beginner">BEGINNER</span>
              {difficultyLevel === 'BEGINNER' ? (
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#059669', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={12} />
                </div>
              ) : (
                <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>Default</span>
              )}
            </div>
            <div style={{ fontWeight: 750, fontSize: '0.95rem', color: 'var(--color-text-main)' }}>Beginner</div>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
              Basic daily sentences & everyday vocabulary.
            </span>
            <span className="font-ml" style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 600 }}>
              ലളിതമായ ദൈനംദിന വാക്യങ്ങൾ
            </span>
          </div>

          {/* Intermediate */}
          <div
            onClick={() => handleSelectAndSaveDifficulty('INTERMEDIATE')}
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-lg)',
              border: difficultyLevel === 'INTERMEDIATE' ? '2px solid #D97706' : '1px solid var(--color-border)',
              backgroundColor: difficultyLevel === 'INTERMEDIATE' ? '#FFFBEB' : 'var(--color-surface)',
              cursor: isSavingDifficulty ? 'wait' : 'pointer',
              transition: 'all 0.15s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
            className="card-interactive"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="badge badge-intermediate">INTERMEDIATE</span>
              {difficultyLevel === 'INTERMEDIATE' && (
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#D97706', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={12} />
                </div>
              )}
            </div>
            <div style={{ fontWeight: 750, fontSize: '0.95rem', color: 'var(--color-text-main)' }}>Intermediate</div>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
              Conversational dialogues, travel & workplace phrases.
            </span>
            <span className="font-ml" style={{ fontSize: '0.75rem', color: '#B45309', fontWeight: 600 }}>
              ഓഫീസ്, യാത്രാ സംഭാഷണങ്ങൾ
            </span>
          </div>

          {/* Advanced */}
          <div
            onClick={() => handleSelectAndSaveDifficulty('ADVANCED')}
            style={{
              padding: '16px',
              borderRadius: 'var(--radius-lg)',
              border: difficultyLevel === 'ADVANCED' ? '2px solid #4F46E5' : '1px solid var(--color-border)',
              backgroundColor: difficultyLevel === 'ADVANCED' ? '#EEF2FF' : 'var(--color-surface)',
              cursor: isSavingDifficulty ? 'wait' : 'pointer',
              transition: 'all 0.15s ease',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
            className="card-interactive"
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="badge badge-advanced">ADVANCED</span>
              {difficultyLevel === 'ADVANCED' && (
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#4F46E5', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={12} />
                </div>
              )}
            </div>
            <div style={{ fontWeight: 750, fontSize: '0.95rem', color: 'var(--color-text-main)' }}>Advanced</div>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
              Nuanced expressions & professional English.
            </span>
            <span className="font-ml" style={{ fontSize: '0.75rem', color: '#4338CA', fontWeight: 600 }}>
              ഉന്നതവും ഔദ്യോഗികവുമായ ഇംഗ്ലീഷ്
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
            Selected Level: <strong style={{ color: 'var(--color-text-main)' }}>{difficultyLevel}</strong>. Tap any tier to update instantly.
          </span>
          {isSavingDifficulty && (
            <span style={{ fontSize: '0.82rem', color: 'var(--color-primary)', fontWeight: 600 }}>
              Saving and updating today's lesson...
            </span>
          )}
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
        disabled={saveMutation.isPending}
      >
        <Save size={20} />
        <span>{saveMutation.isPending ? 'Saving Preferences...' : 'Save Preferences'}</span>
      </button>
    </div>
  );
};
