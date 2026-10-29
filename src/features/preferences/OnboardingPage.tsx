import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api/client';
import { Category, SentenceDifficulty } from '@/types';
import { useAuth } from '@/app/providers/AuthProvider';
import { Check, Sparkles, ArrowRight, Target, Award, Compass, Zap } from 'lucide-react';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, updateUser } = useAuth();

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([1, 2, 7, 10]);
  const [difficultyLevel, setDifficultyLevel] = useState<SentenceDifficulty>('BEGINNER');
  const [dailyTarget, setDailyTarget] = useState<number>(5);
  const [step, setStep] = useState<'categories' | 'difficulty' | 'target'>('categories');

  // Fetch categories from backend
  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => apiClient.get('/categories'),
  });

  const toggleCategory = (id: number) => {
    if (selectedCategoryIds.includes(id)) {
      if (selectedCategoryIds.length === 1) return; // Must keep at least one
      setSelectedCategoryIds(selectedCategoryIds.filter((cid) => cid !== id));
    } else {
      setSelectedCategoryIds([...selectedCategoryIds, id]);
    }
  };

  const savePreferencesMutation = useMutation({
    mutationFn: async () => {
      await apiClient.put('/user-categories', { category_ids: selectedCategoryIds });
      await apiClient.put('/user-settings', {
        daily_target: dailyTarget,
        difficulty_level: difficultyLevel,
      });

      if (user) {
        updateUser({
          ...user,
          difficulty_level: difficultyLevel,
          settings: {
            ...(user.settings || {
              id: 0,
              user_id: user.id,
              daily_target: dailyTarget,
              timezone: 'Asia/Kolkata',
              notifications_enabled: true,
            }),
            daily_target: dailyTarget,
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
      navigate('/app');
    },
  });

  const handleFinish = () => {
    savePreferencesMutation.mutate();
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', padding: '24px 16px' }}>
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '24px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.9rem',
            }}
          >
            1
          </div>
          <div
            style={{
              width: '36px',
              height: '3px',
              backgroundColor: step === 'difficulty' || step === 'target' ? 'var(--color-primary)' : 'var(--color-border)',
            }}
          />
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: step === 'difficulty' || step === 'target' ? 'var(--color-primary)' : 'var(--color-surface-hover)',
              color: step === 'difficulty' || step === 'target' ? '#fff' : 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.9rem',
            }}
          >
            2
          </div>
          <div
            style={{
              width: '36px',
              height: '3px',
              backgroundColor: step === 'target' ? 'var(--color-primary)' : 'var(--color-border)',
            }}
          />
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: step === 'target' ? 'var(--color-primary)' : 'var(--color-surface-hover)',
              color: step === 'target' ? '#fff' : 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.9rem',
            }}
          >
            3
          </div>
        </div>

        {/* STEP 1: CATEGORIES */}
        {step === 'categories' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Step 1 of 3
              </span>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px' }}>Choose Topics You Love</h1>
              <p className="font-ml" style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                നിങ്ങൾക്ക് താല്പര്യമുള്ള വിഷയങ്ങൾ തിരഞ്ഞെടുക്കൂ
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                Select one or more categories for your daily English lessons.
              </p>
            </div>

            {isLoading ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="skeleton" style={{ height: '72px' }} />
                ))}
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
                  gap: '12px',
                  marginBottom: '28px',
                }}
              >
                {categories.map((cat) => {
                  const isSelected = selectedCategoryIds.includes(cat.id);
                  return (
                    <div
                      key={cat.id}
                      onClick={() => toggleCategory(cat.id)}
                      className="card card-interactive"
                      style={{
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                        backgroundColor: isSelected ? 'var(--color-primary-subtle)' : 'var(--color-surface)',
                        cursor: 'pointer',
                        borderRadius: 'var(--radius-lg)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '1.3rem' }}>💬</span>
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '6px',
                            border: isSelected ? 'none' : '2px solid var(--color-border)',
                            backgroundColor: isSelected ? 'var(--color-primary)' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                          }}
                        >
                          {isSelected && <Check size={14} strokeWidth={3} />}
                        </div>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text-main)' }}>
                        {cat.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                        {cat.sentenceCount || 0} sentences
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              onClick={() => setStep('difficulty')}
              className="btn btn-primary btn-block btn-lg"
              disabled={selectedCategoryIds.length === 0}
            >
              <span>Continue to Difficulty Level</span>
              <ArrowRight size={20} />
            </button>
          </div>
        )}

        {/* STEP 2: DIFFICULTY LEVEL */}
        {step === 'difficulty' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Step 2 of 3
              </span>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px' }}>Choose Your Learning Level</h1>
              <p className="font-ml" style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                നിങ്ങളുടെ പഠന നിലവാരം തിരഞ്ഞെടുക്കൂ
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                All users start as Beginner by default. You can choose a different level now or anytime in settings.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '32px' }}>
              {[
                {
                  level: 'BEGINNER' as SentenceDifficulty,
                  title: 'Beginner (തുടക്കക്കാർ)',
                  badge: 'Default / Recommended',
                  badgeColor: '#059669',
                  badgeBg: '#ECFDF5',
                  desc: 'Everyday vocabulary, simple sentence construction, and daily communication fundamentals.',
                  examples: 'eat, water, help, clean, friend, school',
                },
                {
                  level: 'INTERMEDIATE' as SentenceDifficulty,
                  title: 'Intermediate (ഇടത്തരം)',
                  badge: 'Conversational',
                  badgeColor: '#D97706',
                  badgeBg: '#FFFBEB',
                  desc: 'Conversational fluency, office & workplace phrases, travel discussions and compound sentences.',
                  examples: 'punctuality, initiative, feedback, policy, commute',
                },
                {
                  level: 'ADVANCED' as SentenceDifficulty,
                  title: 'Advanced (വിദഗ്ദ്ധർ)',
                  badge: 'Professional',
                  badgeColor: '#4F46E5',
                  badgeBg: '#EEF2FF',
                  desc: 'Rich vocabulary, complex grammar nuances, professional debates, idioms and advanced expressions.',
                  examples: 'feasibility, comprehensive, mitigation, consensus',
                },
              ].map((item) => {
                const isSelected = difficultyLevel === item.level;
                return (
                  <div
                    key={item.level}
                    onClick={() => setDifficultyLevel(item.level)}
                    className="card card-interactive"
                    style={{
                      padding: '20px',
                      borderRadius: 'var(--radius-lg)',
                      border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      backgroundColor: isSelected ? 'var(--color-primary-subtle)' : 'var(--color-surface)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--color-text-main)' }}>
                          {item.title}
                        </span>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '999px',
                            color: item.badgeColor,
                            backgroundColor: item.badgeBg,
                          }}
                        >
                          {item.badge}
                        </span>
                      </div>
                      <div
                        style={{
                          width: '22px',
                          height: '22px',
                          borderRadius: '50%',
                          border: isSelected ? 'none' : '2px solid var(--color-border)',
                          backgroundColor: isSelected ? 'var(--color-primary)' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                        }}
                      >
                        {isSelected && <Check size={14} strokeWidth={3} />}
                      </div>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', margin: '4px 0 8px', lineHeight: 1.45 }}>
                      {item.desc}
                    </p>
                    <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
                      <strong>Examples:</strong> {item.examples}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setStep('categories')}
                className="btn btn-secondary btn-lg"
                style={{ flex: 1 }}
              >
                Back
              </button>
              <button
                onClick={() => setStep('target')}
                className="btn btn-primary btn-lg"
                style={{ flex: 2 }}
              >
                <span>Continue to Daily Target</span>
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: DAILY TARGET */}
        {step === 'target' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Step 3 of 3
              </span>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '4px' }}>Set Your Daily Goal</h1>
              <p className="font-ml" style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                ദിവസവും എത്ര വാക്യങ്ങൾ പഠിക്കണം?
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                Consistency beats intensity. You can always change this later in settings.
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '32px' }}>
              {[
                { count: 5, label: 'Gentle (Recommended for Beginners)', time: '~3 mins / day' },
                { count: 10, label: 'Regular & Consistent', time: '~7 mins / day' },
                { count: 20, label: 'Dedicated Learner', time: '~15 mins / day' },
                { count: 30, label: 'Intensive (Daily Maximum Cap)', time: '~25 mins / day' },
              ].map((opt) => {
                const isSelected = dailyTarget === opt.count;
                return (
                  <div
                    key={opt.count}
                    onClick={() => setDailyTarget(opt.count)}
                    className="card card-interactive"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '20px',
                      borderRadius: 'var(--radius-lg)',
                      border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      backgroundColor: isSelected ? 'var(--color-primary-subtle)' : 'var(--color-surface)',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '12px',
                          backgroundColor: isSelected ? 'var(--color-primary)' : 'var(--color-surface-muted)',
                          color: isSelected ? '#fff' : 'var(--color-text-main)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.2rem',
                          fontWeight: 800,
                        }}
                      >
                        {opt.count}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                          {opt.count} Sentences / day
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                          {opt.label} • {opt.time}
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check size={22} color="var(--color-primary)" strokeWidth={3} />}
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => setStep('difficulty')}
                className="btn btn-secondary btn-lg"
                style={{ flex: 1 }}
              >
                Back
              </button>
              <button
                onClick={handleFinish}
                className="btn btn-primary btn-lg"
                style={{ flex: 2 }}
                disabled={savePreferencesMutation.isPending}
              >
                <Sparkles size={20} />
                <span>{savePreferencesMutation.isPending ? 'Saving...' : 'Start Learning!'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
