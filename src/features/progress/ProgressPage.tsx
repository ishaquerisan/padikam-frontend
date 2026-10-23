import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api/client';
import { LearnerProgress } from '@/types';
import {
  Flame,
  Award,
  BookCheck,
  Calendar,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export const ProgressPage: React.FC = () => {
  const navigate = useNavigate();

  const { data: progress, isLoading } = useQuery<LearnerProgress>({
    queryKey: ['learner-progress'],
    queryFn: () => apiClient.get('/activity/progress'),
  });

  if (isLoading || !progress) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="skeleton" style={{ height: '36px', width: '50%' }} />
        <div className="skeleton" style={{ height: '140px', width: '100%', borderRadius: '20px' }} />
        <div className="skeleton" style={{ height: '200px', width: '100%', borderRadius: '20px' }} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Learning Progress</h1>
        <p className="font-ml" style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginTop: '2px' }}>
          നിങ്ങളുടെ ഇംഗ്ലീഷ് പഠന പുരോഗതി
        </p>
      </div>

      {/* Streak Hero Card */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
          border: '1px solid #FDE68A',
          padding: '24px 20px',
          borderRadius: 'var(--radius-xl)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: '#F59E0B',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)',
            }}
          >
            <Flame size={32} fill="#FFFFFF" />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#B45309', textTransform: 'uppercase' }}>
              Current Streak
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#78350F', lineHeight: 1.1 }}>
              {progress.currentStreak} Days
            </div>
            <div style={{ fontSize: '0.8rem', color: '#92400E', marginTop: '4px' }}>
              Longest Streak: {progress.longestStreak} days
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate('/app/history')}
          className="btn btn-sm btn-secondary"
          style={{ backgroundColor: '#FFFFFF', border: '1px solid #FCD34D' }}
        >
          <span>History</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {/* 4 Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
        <div className="card" style={{ padding: '16px' }}>
          <div style={{ color: 'var(--color-primary)', marginBottom: '8px' }}>
            <BookCheck size={24} />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>
            {progress.totalUniqueSentencesLearned}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
            Sentences Learned
          </div>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <div style={{ color: '#0284C7', marginBottom: '8px' }}>
            <Calendar size={24} />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>
            {progress.totalLearningDays}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
            Total Active Days
          </div>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <div style={{ color: '#10B981', marginBottom: '8px' }}>
            <CheckCircle size={24} />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>
            {progress.completedTargetsCount}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
            Targets Completed
          </div>
        </div>

        <div className="card" style={{ padding: '16px' }}>
          <div style={{ color: '#8B5CF6', marginBottom: '8px' }}>
            <HelpCircle size={24} />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800 }}>
            {progress.averageQuizAccuracy}%
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
            Quiz Accuracy ({progress.quizCount} tests)
          </div>
        </div>
      </div>

      {/* Weekly Activity Bar Chart */}
      <div className="card" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>Weekly Learning Activity</h3>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            height: '140px',
            paddingTop: '20px',
          }}
        >
          {progress.weeklyActivity.map((day) => {
            const maxVal = Math.max(10, ...progress.weeklyActivity.map((d) => d.sentencesLearned));
            const heightPercent = Math.max(8, Math.round((day.sentencesLearned / maxVal) * 100));
            return (
              <div
                key={day.date}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  flex: 1,
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                  {day.sentencesLearned > 0 ? day.sentencesLearned : ''}
                </div>
                <div
                  style={{
                    width: '28px',
                    height: `${heightPercent}%`,
                    backgroundColor: day.sentencesLearned > 0 ? 'var(--color-primary)' : 'var(--color-surface-hover)',
                    borderRadius: '6px',
                    transition: 'height 0.4s ease',
                  }}
                />
                <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>
                  {day.dayOfWeek}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Category Mastery Progress */}
      <div className="card" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>Category Progress</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {progress.categoryBreakdown.map((cat) => (
            <div key={cat.categoryId}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                <span style={{ fontWeight: 600 }}>{cat.name}</span>
                <span style={{ color: 'var(--color-text-muted)' }}>
                  {cat.learnedSentences} / {cat.totalSentences} ({cat.percentage}%)
                </span>
              </div>
              <div
                style={{
                  height: '8px',
                  backgroundColor: 'var(--color-surface-hover)',
                  borderRadius: 'var(--radius-full)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${cat.percentage}%`,
                    backgroundColor: 'var(--color-primary)',
                    borderRadius: 'var(--radius-full)',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
