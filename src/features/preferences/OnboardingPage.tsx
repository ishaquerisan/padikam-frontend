import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api/client';
import { Category } from '@/types';
import { Check, Sparkles, ArrowRight, Target } from 'lucide-react';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([1, 2, 7, 10]);
  const [dailyTarget, setDailyTarget] = useState<number>(5);
  const [step, setStep] = useState<'categories' | 'target'>('categories');

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
      await apiClient.put('/user-settings', { daily_target: dailyTarget });
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
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.85rem',
            }}
          >
            1
          </div>
          <div style={{ width: '40px', height: '3px', backgroundColor: step === 'target' ? 'var(--color-primary)' : 'var(--color-border)' }} />
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              backgroundColor: step === 'target' ? 'var(--color-primary)' : 'var(--color-surface-hover)',
              color: step === 'target' ? '#fff' : 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '0.85rem',
            }}
          >
            2
          </div>
        </div>

        {step === 'categories' ? (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Choose Topics You Love</h1>
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
              onClick={() => setStep('target')}
              className="btn btn-primary btn-block btn-lg"
              disabled={selectedCategoryIds.length === 0}
            >
              <span>Continue to Daily Target</span>
              <ArrowRight size={20} />
            </button>
          </div>
        ) : (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Set Your Daily Goal</h1>
              <p className="font-ml" style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                ദിവസവും എത്ര വാക്യങ്ങൾ പഠിക്കണം?
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                Consistency beats intensity. You can always change this later.
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
                      border: isSelected ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                      backgroundColor: isSelected ? 'var(--color-primary-subtle)' : 'var(--color-surface)',
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
                onClick={() => setStep('categories')}
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
