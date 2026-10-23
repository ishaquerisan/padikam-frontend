import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/api/client';
import { DashboardSummary } from '@/types';
import { useAuth } from '@/app/providers/AuthProvider';
import {
  BookOpen,
  HelpCircle,
  Flame,
  Bookmark,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Trophy,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: summary, isLoading } = useQuery<DashboardSummary>({
    queryKey: ['dashboard-summary'],
    queryFn: () => apiClient.get('/dashboard/summary'),
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (isLoading || !summary) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="skeleton" style={{ height: '80px', width: '100%' }} />
        <div className="skeleton" style={{ height: '220px', width: '100%' }} />
        <div className="skeleton" style={{ height: '140px', width: '100%' }} />
      </div>
    );
  }

  const progressPercent = summary.targetCount > 0
    ? Math.min(100, Math.round((summary.learnedCount / summary.targetCount) * 100))
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Friendly User Greeting */}
      <div>
        <div style={{ fontSize: '0.85rem', color: 'var(--color-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {getGreeting()}, {user?.name?.split(' ')[0] || 'Friend'}!
        </div>
        <h1 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-text-main)', marginTop: '2px', letterSpacing: '-0.02em' }}>
          Ready for today’s English words & sentences?
        </h1>
        <p className="font-ml" style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', marginTop: '2px' }}>
          ഇന്നത്തെ പുതിയ വാക്കുകളും വാക്യങ്ങളും പഠിക്കാൻ തയ്യാറാണോ?
        </p>
      </div>

      {/* Main Today's Lesson Hero Card */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
          color: '#FFFFFF',
          borderRadius: 'var(--radius-xl)',
          padding: '24px 20px',
          boxShadow: '0 10px 20px rgba(5, 150, 105, 0.25)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span
              style={{
                display: 'inline-block',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                marginBottom: '10px',
              }}
            >
              Today's Lesson
            </span>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
              {summary.isTargetCompleted
                ? 'Target Completed! 🎉'
                : `${summary.learnedCount} of ${summary.targetCount} Learned`}
            </h2>
            <p style={{ fontSize: '0.9rem', color: '#D1FAE5', marginTop: '4px' }}>
              {summary.isDailyMaxReached
                ? "You've reached today's 30-sentence limit!"
                : summary.isTargetCompleted
                ? 'Great job! You can learn more or practice quizzes.'
                : `${summary.remainingCount} more to reach your daily goal`}
            </p>
          </div>

          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <BookOpen size={28} color="#FFFFFF" />
          </div>
        </div>

        {/* Progress bar */}
        <div
          style={{
            height: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.25)',
            borderRadius: 'var(--radius-full)',
            margin: '20px 0',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progressPercent}%`,
              backgroundColor: '#34D399',
              borderRadius: 'var(--radius-full)',
              transition: 'width 0.4s ease',
            }}
          />
        </div>

        <button
          onClick={() => navigate('/app/lesson')}
          className="btn btn-block"
          style={{
            backgroundColor: '#FFFFFF',
            color: 'var(--color-primary-dark)',
            fontWeight: 800,
            fontSize: '1rem',
            padding: '14px 20px',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          }}
        >
          <span>
            {summary.isTargetCompleted
              ? 'Review Today’s Sentences'
              : summary.learnedCount > 0
              ? 'Continue Learning'
              : 'Start Today’s Lesson'}
          </span>
          <ArrowRight size={18} />
        </button>
      </div>

      {/* Yesterday's Quiz Card */}
      <div
        onClick={() => navigate('/app/quiz')}
        className="card card-interactive"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '18px 20px',
          borderLeft: '4px solid var(--color-accent)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              backgroundColor: 'var(--color-accent-light)',
              color: 'var(--color-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <HelpCircle size={24} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--color-text-main)' }}>
              Yesterday's Retention Quiz
            </div>
            <div className="font-ml" style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
              {summary.yesterdayQuiz.completed
                ? `പൂർത്തിയാക്കി (Score: ${summary.yesterdayQuiz.score}%) • വീണ്ടും പരീക്ഷിക്കാം`
                : summary.yesterdayQuiz.available
                ? 'ഇന്നലത്തെ വാക്യങ്ങൾ എത്രമാത്രം ഓർമ്മയുണ്ട് എന്ന് നോക്കാം!'
                : 'ഇന്നലെ പൂർത്തിയാക്കിയ പാഠങ്ങൾ ലഭ്യമല്ല'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {summary.yesterdayQuiz.completed && (
            <span className="badge badge-success" style={{ textTransform: 'none' }}>
              {summary.yesterdayQuiz.score}%
            </span>
          )}
          <ArrowRight size={18} color="var(--color-text-muted)" />
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
        {/* Streak Card */}
        <div
          onClick={() => navigate('/app/progress')}
          className="card card-interactive"
          style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: '#FEF3C7',
              color: '#F59E0B',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Flame size={22} fill={summary.currentStreak > 0 ? '#F59E0B' : 'none'} />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{summary.currentStreak} Days</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
              Learning Streak
            </div>
          </div>
        </div>

        {/* Saved Sentences Card */}
        <div
          onClick={() => navigate('/app/favorites')}
          className="card card-interactive"
          style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: '#E0E7FF',
              color: '#4F46E5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Bookmark size={22} />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>{summary.favoriteCount} Saved</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
              Favorite Sentences
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
