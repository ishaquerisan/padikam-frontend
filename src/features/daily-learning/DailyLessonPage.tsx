import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api/client';
import { DailyLesson, DailyLessonItem } from '@/types';
import { audioManager } from '@/utils/audio.utils';
import confetti from 'canvas-confetti';
import {
  Volume2,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  CheckCircle,
  Sparkles,
  ArrowRight,
  X,
  HelpCircle,
  RotateCcw,
  AlertCircle,
  Lightbulb,
  Languages,
} from 'lucide-react';

export const DailyLessonPage: React.FC = () => {
  const { date } = useParams<{ date?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isPlayingWordAudio, setIsPlayingWordAudio] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [showSkippedModal, setShowSkippedModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch today's lesson (or past lesson if date param provided)
  const isPastLesson = !!date;
  const endpoint = isPastLesson ? `/daily-lessons/history/${date}` : '/daily-lessons/today';

  const { data: lesson, isLoading, error } = useQuery<DailyLesson>({
    queryKey: ['lesson', date || 'today'],
    queryFn: () => apiClient.get(endpoint),
  });

  // Mark sentence as learned mutation
  const markLearnedMutation = useMutation({
    mutationFn: async (sentenceId: number): Promise<DailyLesson> => {
      const res = await apiClient.post('/daily-lessons/mark-learned', { sentenceId });
      return res as unknown as DailyLesson;
    },
    onSuccess: (updatedLesson: DailyLesson) => {
      queryClient.setQueryData(['lesson', date || 'today'], updatedLesson);
      queryClient.invalidateQueries({ queryKey: ['lesson'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['progress'] });

      // Check if target was just reached
      const justCompleted = !lesson?.isTargetCompleted && updatedLesson.isTargetCompleted;
      if (justCompleted) {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
        });
        setShowCompletionModal(true);
      } else {
        // Move to next sentence automatically if not last
        if (currentIndex < (updatedLesson.sentences?.length || 1) - 1) {
          setCurrentIndex((prev) => prev + 1);
        } else if (updatedLesson.isTargetCompleted) {
          setShowCompletionModal(true);
        } else {
          // If on last sentence but earlier sentences were skipped, alert the learner
          const remainingUnlearned = (updatedLesson.sentences || []).filter((s) => s.status !== 'LEARNED').length;
          if (remainingUnlearned > 0) {
            setShowSkippedModal(true);
          }
        }
      }
    },
    onError: (err: any) => {
      setErrorMessage(err?.message || 'Failed to mark sentence as learned.');
      setTimeout(() => setErrorMessage(null), 3500);
    },
  });

  // Toggle favorite mutation
  const toggleFavMutation = useMutation({
    mutationFn: (sentenceId: number) =>
      apiClient.post(`/favorites/toggle/${sentenceId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson'] });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
    },
  });

  // Increase target mutation
  const increaseTargetMutation = useMutation({
    mutationFn: async (target: number): Promise<DailyLesson> => {
      const res = await apiClient.post('/daily-lessons/increase-target', { target });
      return res as unknown as DailyLesson;
    },
    onSuccess: (updatedLesson: DailyLesson) => {
      queryClient.setQueryData(['lesson', date || 'today'], updatedLesson);
      queryClient.invalidateQueries({ queryKey: ['lesson'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setShowCompletionModal(false);
      // Point index to first unlearned sentence
      const firstUnlearned = updatedLesson.sentences.findIndex((s) => s.status !== 'LEARNED');
      if (firstUnlearned !== -1) {
        setCurrentIndex(firstUnlearned);
      }
    },
    onError: (err: any) => {
      setErrorMessage(err?.message || 'Failed to increase target. Please try again.');
      setTimeout(() => setErrorMessage(null), 3500);
    },
  });

  const sentences = lesson?.sentences || [];
  const currentSentence = sentences[currentIndex] as DailyLessonItem | undefined;

  // Track skipped / unlearned sentences
  const unlearnedSentences = sentences
    .map((s, index) => ({ ...s, index }))
    .filter((s) => s.status !== 'LEARNED');
  const unlearnedCount = unlearnedSentences.length;
  const firstUnlearnedIndex = unlearnedSentences.length > 0 ? unlearnedSentences[0].index : -1;

  const handleReviewGoal = () => {
    if (lesson?.isTargetCompleted || unlearnedCount === 0) {
      setShowCompletionModal(true);
    } else {
      setShowSkippedModal(true);
    }
  };

  const handlePlayWordAudio = () => {
    if (!currentSentence?.word) return;
    setIsPlayingWordAudio(true);
    audioManager.speak(currentSentence.word, 0.8, () => {
      setIsPlayingWordAudio(false);
    });
  };

  const handlePlayAudio = () => {
    if (!currentSentence) return;
    setIsPlayingAudio(true);
    audioManager.speak(currentSentence.englishText, 0.85, () => {
      setIsPlayingAudio(false);
    });
  };

  const renderSentenceWithHighlight = (sentence: string, targetWord?: string) => {
    if (!targetWord || !targetWord.trim()) return sentence;
    const regex = new RegExp(`(\\b${targetWord}\\b)`, 'gi');
    const parts = sentence.split(regex);
    return parts.map((part, idx) =>
      part.toLowerCase() === targetWord.toLowerCase() ? (
        <span
          key={idx}
          style={{
            backgroundColor: '#DCFCE7',
            color: '#047857',
            padding: '2px 8px',
            borderRadius: '6px',
            fontWeight: 800,
            borderBottom: '2px solid #059669',
            display: 'inline-block',
          }}
        >
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  const handleMarkLearned = () => {
    if (!currentSentence || isPastLesson) return;
    markLearnedMutation.mutate(currentSentence.sentenceId);
  };

  // Helper for difficulty badge styling according to design specs
  const getDifficultyBadgeStyle = (difficulty?: string) => {
    const d = (difficulty || '').toUpperCase();
    if (d === 'ADVANCED') {
      return {
        backgroundColor: '#FCE7F3', // light pink background
        color: '#9D174D',           // dark pink text
        border: '1px solid #FBCFE8',
      };
    }
    if (d === 'INTERMEDIATE') {
      return {
        backgroundColor: '#FEF3C7', // soft amber background
        color: '#B45309',           // dark amber text
        border: '1px solid #FDE68A',
      };
    }
    return {
      backgroundColor: '#ECFDF5',   // light green background
      color: '#047857',             // dark green text
      border: '1px solid #A7F3D0',
    };
  };

  if (isLoading) {
    return (
      <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingTop: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="skeleton" style={{ height: '24px', width: '180px', borderRadius: '8px' }} />
          <div className="skeleton" style={{ height: '24px', width: '90px', borderRadius: '9999px' }} />
        </div>
        <div className="skeleton" style={{ height: '8px', width: '100%', borderRadius: '9999px' }} />
        <div className="skeleton" style={{ height: '400px', width: '100%', borderRadius: '24px' }} />
        <div className="skeleton" style={{ height: '54px', width: '100%', borderRadius: '14px' }} />
      </div>
    );
  }

  if (error || !lesson || sentences.length === 0) {
    const errorMsg = (error as any)?.message || '';
    const isCompletedAll = errorMsg.toLowerCase().includes('completed all sentences') || errorMsg.includes('based on your selected categories');

    if (isCompletedAll) {
      return (
        <div
          className="card"
          style={{
            textAlign: 'center',
            padding: '48px 24px',
            margin: '40px auto',
            maxWidth: '520px',
            borderRadius: '24px',
            border: '1px solid #E2E8F0',
            backgroundColor: '#FFFFFF',
            boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.05)',
          }}
        >
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(5, 150, 105, 0.12), rgba(16, 185, 129, 0.18))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 8px 20px rgba(5, 150, 105, 0.15)',
            }}
          >
            <Sparkles size={38} color="#059669" />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '8px', color: '#0F172A' }}>
            All Sentences Completed! 🎉
          </h2>
          <p style={{ fontSize: '1rem', fontWeight: 600, color: '#059669', marginBottom: '12px' }}>
            നിങ്ങൾ തിരഞ്ഞെടുത്ത വിഷയങ്ങളിലെ എല്ലാ വാക്യങ്ങളും പഠിച്ചു കഴിഞ്ഞു!
          </p>
          <p style={{ color: '#64748B', fontSize: '0.95rem', lineHeight: 1.5, margin: '0 auto 28px', maxWidth: '420px' }}>
            {errorMsg || 'You have completed all sentences based on your selected categories! Please select more categories in preferences to continue learning.'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={() => navigate('/app/preferences')}
              className="btn btn-primary"
              style={{
                backgroundColor: '#059669',
                padding: '14px 24px',
                fontSize: '1rem',
                fontWeight: 700,
                borderRadius: '14px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              Explore More Categories <ArrowRight size={18} style={{ marginLeft: '8px' }} />
            </button>
            <button
              onClick={() => navigate('/app')}
              className="btn btn-secondary"
              style={{ padding: '12px 24px', borderRadius: '14px' }}
            >
              Back to Home
            </button>
          </div>
        </div>
      );
    }

    return (
      <div
        className="card"
        style={{
          textAlign: 'center',
          padding: '40px 20px',
          margin: '40px auto',
          maxWidth: '480px',
          borderRadius: '24px',
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
        }}
      >
        <HelpCircle size={48} color="#059669" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ color: '#0F172A', fontWeight: 800, fontSize: '1.3rem' }}>No Sentences Found</h2>
        <p style={{ color: '#64748B', margin: '12px 0 24px', fontSize: '0.92rem' }}>
          {(error as any)?.message || 'Please ensure you have selected active categories in your preferences.'}
        </p>
        <button
          onClick={() => navigate('/app/preferences')}
          className="btn btn-primary"
          style={{ backgroundColor: '#059669', borderRadius: '12px', fontWeight: 700 }}
        >
          Adjust Learning Topics
        </button>
      </div>
    );
  }

  const activeLevel = (currentSentence?.difficulty || lesson.difficultyLevel || 'BEGINNER').toUpperCase();
  const diffBadgeStyle = getDifficultyBadgeStyle(activeLevel);

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {errorMessage && (
        <div
          style={{
            backgroundColor: '#FEE2E2',
            color: '#B91C1C',
            padding: '12px 16px',
            borderRadius: '12px',
            fontWeight: 600,
            fontSize: '0.9rem',
            border: '1px solid #FECACA',
          }}
        >
          {errorMessage}
        </div>
      )}

      {/* ========================================================
          5. Daily Lesson Progress Section
         ======================================================== */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Top Header Row with Title & Badges */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                color: '#059669',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '2px',
              }}
            >
              {isPastLesson ? `LESSON DATE: ${lesson.date}` : "TODAY'S DAILY LESSON"}
            </div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A', margin: 0, lineHeight: 1.25 }}>
              Sentence {currentIndex + 1} of {sentences.length}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Level Badge */}
            <span
              style={{
                ...diffBadgeStyle,
                padding: '4px 12px',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {activeLevel}
            </span>

            {/* Learned Counter Badge */}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                backgroundColor: '#ECFDF5',
                color: '#047857',
                border: '1px solid #A7F3D0',
                padding: '4px 12px',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.02em',
              }}
            >
              <CheckCircle size={13} color="#059669" />
              <span>
                {lesson.learnedCount} / {sentences.length} LEARNED
              </span>
            </span>
          </div>
        </div>

        {/* Progress Track & Fill */}
        <div
          style={{
            height: '7px',
            backgroundColor: '#E2E8F0',
            borderRadius: '9999px',
            overflow: 'hidden',
          }}
          role="progressbar"
          aria-valuenow={currentIndex + 1}
          aria-valuemin={1}
          aria-valuemax={sentences.length}
        >
          <div
            style={{
              height: '100%',
              width: `${Math.min(100, Math.round(((currentIndex + 1) / sentences.length) * 100))}%`,
              backgroundColor: '#059669',
              borderRadius: '9999px',
              transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        </div>

        {/* Numbered Lesson Navigation Buttons (Horizontally Scrollable) */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            overflowX: 'auto',
            padding: '2px 2px 6px',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {sentences.map((s, idx) => {
            const isCurrent = idx === currentIndex;
            const isLearned = s.status === 'LEARNED';

            let btnBg = '#FFFFFF';
            let btnColor = '#64748B';
            let btnBorder = '1px solid #E2E8F0';
            let boxShadow = '0 1px 2px rgba(0,0,0,0.03)';

            if (isCurrent) {
              btnBg = '#059669';
              btnColor = '#FFFFFF';
              btnBorder = '2px solid #047857';
              boxShadow = '0 3px 8px rgba(5, 150, 105, 0.3)';
            } else if (isLearned) {
              btnBg = '#ECFDF5';
              btnColor = '#047857';
              btnBorder = '1px solid #A7F3D0';
            }

            return (
              <button
                key={s.id || idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                style={{
                  minWidth: '36px',
                  height: '36px',
                  padding: '0 6px',
                  borderRadius: '10px',
                  fontSize: '0.82rem',
                  fontWeight: isCurrent ? 800 : isLearned ? 700 : 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '3px',
                  cursor: 'pointer',
                  backgroundColor: btnBg,
                  color: btnColor,
                  border: btnBorder,
                  boxShadow,
                  transform: isCurrent ? 'scale(1.05)' : 'none',
                  transition: 'all 0.15s ease',
                  flexShrink: 0,
                }}
                title={`Sentence ${idx + 1}: ${isLearned ? 'Learned' : 'Incomplete'}`}
                aria-label={`Go to sentence ${idx + 1}`}
              >
                {isLearned && !isCurrent && <CheckCircle size={11} color="#059669" />}
                <span>{idx + 1}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Alert banner when reached the end with skipped sentences */}
      {currentIndex === sentences.length - 1 && unlearnedCount > 0 && (
        <div
          style={{
            backgroundColor: '#FFFBEB',
            border: '1px solid #FDE68A',
            borderRadius: '16px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={20} color="#D97706" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#92400E' }}>
                {unlearnedCount} Sentence{unlearnedCount > 1 ? 's' : ''} Skipped!
              </div>
              <div style={{ fontSize: '0.78rem', color: '#B45309' }}>
                Complete all sentences to finish today's goal and keep your streak.
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-sm"
            onClick={() => setShowSkippedModal(true)}
            style={{
              backgroundColor: '#FEF3C7',
              color: '#B45309',
              fontWeight: 700,
              border: '1px solid #FDE68A',
              padding: '6px 12px',
              fontSize: '0.8rem',
              borderRadius: '8px',
              whiteSpace: 'nowrap',
            }}
          >
            Review Skipped
          </button>
        </div>
      )}

      {/* ========================================================
          6. Main Lesson Card
         ======================================================== */}
      {currentSentence && (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            border: currentSentence.status === 'LEARNED' ? '1.5px solid #A7F3D0' : '1px solid #E2E8F0',
            boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 2px 6px -1px rgba(15, 23, 42, 0.03)',
            padding: '28px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            transition: 'border-color 0.2s ease',
          }}
        >
          {/* A. Category and Difficulty Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              {currentSentence.category && (
                <span
                  style={{
                    backgroundColor: '#F1F5F9',
                    color: '#475569',
                    border: '1px solid #E2E8F0',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '4px 10px',
                    borderRadius: '9999px',
                  }}
                >
                  {currentSentence.category.name}
                </span>
              )}

              <span
                style={{
                  ...getDifficultyBadgeStyle(currentSentence.difficulty),
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  padding: '4px 10px',
                  borderRadius: '9999px',
                }}
              >
                {currentSentence.difficulty}
              </span>
            </div>

            {/* Bookmark button aligned to the right */}
            <button
              onClick={() => toggleFavMutation.mutate(currentSentence.sentenceId)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '6px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: currentSentence.isFavorite ? '#059669' : '#94A3B8',
                transition: 'all 0.15s ease',
              }}
              title={currentSentence.isFavorite ? 'Remove from saved' : 'Save word & sentence'}
              aria-label={currentSentence.isFavorite ? 'Remove bookmark' : 'Bookmark this sentence'}
            >
              <Bookmark
                size={22}
                fill={currentSentence.isFavorite ? '#059669' : 'none'}
                color={currentSentence.isFavorite ? '#059669' : '#94A3B8'}
              />
            </button>
          </div>

          {/* B. New Word Section */}
          {currentSentence.word && (
            <div
              style={{
                backgroundColor: '#ECFDF5',
                borderRadius: '16px',
                border: '1px solid #D1FAE5',
                padding: '22px 18px',
                textAlign: 'center',
              }}
            >
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: '#059669',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  backgroundColor: '#FFFFFF',
                  padding: '3px 12px',
                  borderRadius: '9999px',
                  display: 'inline-block',
                  marginBottom: '10px',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
                }}
              >
                NEW WORD TO LEARN
              </span>

              {/* English word - Most prominent element */}
              <div
                style={{
                  fontSize: '2.1rem',
                  fontWeight: 800,
                  color: '#0F172A',
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                }}
              >
                {currentSentence.word}
              </div>

              {/* Malayalam meaning immediately below */}
              <div
                className="font-ml"
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: '#047857',
                  marginTop: '4px',
                  marginBottom: '14px',
                }}
              >
                {currentSentence.wordMeaning}
              </div>

              {/* Pronounce Word button */}
              <button
                type="button"
                onClick={handlePlayWordAudio}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#FFFFFF',
                  color: '#059669',
                  border: '1.5px solid #059669',
                  borderRadius: '9999px',
                  padding: '7px 18px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(5, 150, 105, 0.1)',
                  transition: 'all 0.15s ease',
                }}
              >
                <Volume2
                  size={16}
                  color="#059669"
                  className={isPlayingWordAudio ? 'pulse' : ''}
                />
                <span>{isPlayingWordAudio ? 'Playing...' : 'Pronounce Word'}</span>
              </button>
            </div>
          )}

          {/* C. Usage in Sentence */}
          <div style={{ textAlign: 'center', padding: '0 4px' }}>
            <div
              style={{
                fontSize: '0.74rem',
                fontWeight: 800,
                color: '#64748B',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: '12px',
              }}
            >
              USAGE IN SENTENCE
            </div>

            {/* Sentence with vocabulary word highlighted */}
            <div
              style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#0F172A',
                lineHeight: 1.55,
                marginBottom: '14px',
              }}
            >
              {renderSentenceWithHighlight(currentSentence.englishText, currentSentence.word)}
            </div>

            {/* Listen to Sentence button */}
            <button
              type="button"
              onClick={handlePlayAudio}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#F1F5F9',
                color: '#0F172A',
                border: '1px solid #CBD5E1',
                borderRadius: '9999px',
                padding: '7px 18px',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <Volume2
                size={17}
                color="#059669"
                className={isPlayingAudio ? 'pulse' : ''}
              />
              <span>{isPlayingAudio ? 'Playing...' : 'Listen to Sentence'}</span>
            </button>
          </div>

          {/* D. Malayalam Translation (Soft warm-yellow background) */}
          <div
            style={{
              backgroundColor: '#FEFCE8',
              borderRadius: '16px',
              border: '1px solid #FEF08A',
              padding: '16px 18px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
              <Languages size={15} color="#B45309" />
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  color: '#B45309',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                MALAYALAM TRANSLATION
              </span>
            </div>
            <div
              className="font-ml"
              style={{
                fontSize: '1.15rem',
                fontWeight: 600,
                color: '#14532D',
                lineHeight: 1.65,
              }}
            >
              {currentSentence.malayalamMeaning}
            </div>
          </div>

          {/* E. Context Tip (Subtle light-blue background) */}
          {currentSentence.usageExample && (
            <div
              style={{
                backgroundColor: '#F0F9FF',
                borderRadius: '16px',
                border: '1px solid #BAE6FD',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
              }}
            >
              <Lightbulb size={18} color="#0284C7" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: '0.88rem', color: '#0369A1', lineHeight: 1.5 }}>
                <span style={{ fontWeight: 700 }}>Context Tip: </span>
                <span style={{ fontStyle: 'italic' }}>"{currentSentence.usageExample}"</span>
              </div>
            </div>
          )}

          {/* F. Learning Instruction */}
          <div style={{ textAlign: 'center', paddingTop: '4px' }}>
            {currentSentence.status === 'LEARNED' ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: '#ECFDF5',
                  color: '#059669',
                  border: '1px solid #A7F3D0',
                  padding: '5px 14px',
                  borderRadius: '9999px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                }}
              >
                <CheckCircle size={14} color="#059669" />
                <span>Marked as Learned</span>
              </span>
            ) : (
              <span style={{ color: '#64748B', fontSize: '0.85rem', fontWeight: 500 }}>
                Tap 'Mark as Learned' when ready
              </span>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          7. Bottom Learning Controls
         ======================================================== */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        {/* Previous sentence button */}
        <button
          type="button"
          onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            color: currentIndex === 0 ? '#94A3B8' : '#334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: currentIndex === 0 ? 'not-allowed' : 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            transition: 'all 0.15s ease',
            flexShrink: 0,
          }}
          title="Previous Sentence"
          aria-label="Previous sentence"
        >
          <ChevronLeft size={24} />
        </button>

        {/* Main Action Button */}
        {!isPastLesson && currentSentence?.status !== 'LEARNED' ? (
          <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
            <button
              type="button"
              onClick={handleMarkLearned}
              disabled={markLearnedMutation.isPending}
              style={{
                flex: 1,
                minHeight: '52px',
                borderRadius: '14px',
                backgroundColor: '#059669',
                color: '#FFFFFF',
                border: 'none',
                fontWeight: 700,
                fontSize: '1rem',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                cursor: markLearnedMutation.isPending ? 'wait' : 'pointer',
                boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
                transition: 'all 0.15s ease',
              }}
            >
              <CheckCircle size={20} />
              <span>{markLearnedMutation.isPending ? 'Saving...' : 'Mark as Learned'}</span>
            </button>

            {currentIndex === sentences.length - 1 && (
              <button
                type="button"
                onClick={handleReviewGoal}
                style={{
                  padding: '0 16px',
                  minHeight: '52px',
                  borderRadius: '14px',
                  backgroundColor: '#FFFFFF',
                  color: '#0F172A',
                  border: '1px solid #CBD5E1',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
                title="Review Goal"
              >
                <span>Review Goal</span>
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              if (currentIndex < sentences.length - 1) {
                setCurrentIndex((prev) => prev + 1);
              } else {
                handleReviewGoal();
              }
            }}
            style={{
              flex: 1,
              minHeight: '52px',
              borderRadius: '14px',
              backgroundColor: '#059669',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 700,
              fontSize: '1rem',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)',
              transition: 'all 0.15s ease',
            }}
          >
            {currentIndex < sentences.length - 1 ? (
              <>
                <span>Next Sentence</span>
                <ChevronRight size={20} />
              </>
            ) : (
              <>
                <span>Review Goal</span>
                <Sparkles size={20} />
              </>
            )}
          </button>
        )}

        {/* Next sentence button */}
        <button
          type="button"
          onClick={() => setCurrentIndex((prev) => Math.min(sentences.length - 1, prev + 1))}
          disabled={currentIndex === sentences.length - 1}
          style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            color: currentIndex === sentences.length - 1 ? '#94A3B8' : '#334155',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: currentIndex === sentences.length - 1 ? 'not-allowed' : 'pointer',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
            transition: 'all 0.15s ease',
            flexShrink: 0,
          }}
          title="Next Sentence"
          aria-label="Next sentence"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* ========================================================
          Target Completion Dialog
         ======================================================== */}
      {showCompletionModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ borderRadius: '24px', padding: '28px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowCompletionModal(false)}
                className="btn-icon btn-ghost"
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#ECFDF5',
                  color: '#059669',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                }}
              >
                <Sparkles size={32} />
              </div>

              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0F172A' }}>
                Today's learning target completed!
              </h2>
              <p style={{ color: '#64748B', marginTop: '8px', lineHeight: 1.5 }}>
                Great job! You've completed your daily English-learning goal.
              </p>
            </div>

            {/* 30-Sentence Limit Check */}
            {lesson.learnedCount >= 30 ? (
              <div
                style={{
                  backgroundColor: '#ECFDF5',
                  padding: '16px',
                  borderRadius: '16px',
                  marginBottom: '20px',
                  textAlign: 'center',
                  border: '1px solid #A7F3D0',
                }}
              >
                <p style={{ fontWeight: 700, color: '#047857', fontSize: '0.95rem' }}>
                  You've reached today's maximum of 30 sentences. Great work!
                </p>
                <p style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '4px' }}>
                  You can revise previous lessons or take a quiz to reinforce retention.
                </p>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0F172A', marginBottom: '12px', textAlign: 'center' }}>
                  Would you like to learn more sentences today?
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
                  {[10, 20, 30]
                    .filter((t) => t > lesson.targetCount)
                    .map((nextTarget) => (
                      <button
                        key={nextTarget}
                        type="button"
                        onClick={() => increaseTargetMutation.mutate(nextTarget)}
                        disabled={increaseTargetMutation.isPending}
                        className="btn btn-secondary card-interactive"
                        style={{
                          justifyContent: 'space-between',
                          padding: '16px',
                          border: '1px solid #E2E8F0',
                          borderRadius: '16px',
                        }}
                      >
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontWeight: 700, color: '#0F172A' }}>
                            Increase target to {nextTarget} sentences
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>
                            Adds {nextTarget - lesson.targetCount} more new sentences for today
                          </div>
                        </div>
                        <ArrowRight size={18} color="#059669" />
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Alternative Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                onClick={() => navigate('/app/quiz')}
                className="btn btn-primary btn-block"
                style={{ backgroundColor: '#059669', borderRadius: '14px', fontWeight: 700 }}
              >
                <span>Take Retention Quiz</span>
                <ArrowRight size={18} />
              </button>
              <button
                type="button"
                onClick={() => navigate('/app')}
                className="btn btn-ghost btn-block"
                style={{ borderRadius: '14px' }}
              >
                Return to Home
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          Skipped Sentences Alert Modal (Shows when sentences skipped)
         ======================================================== */}
      {showSkippedModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '480px', borderRadius: '24px', padding: '28px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowSkippedModal(false)}
                className="btn-icon btn-ghost"
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: '#FEF3C7',
                  color: '#D97706',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '14px',
                  border: '2px solid #FDE68A',
                }}
              >
                <AlertCircle size={32} />
              </div>

              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A' }}>
                Some Sentences Were Skipped!
              </h2>
              <p style={{ color: '#64748B', marginTop: '8px', fontSize: '0.9rem', lineHeight: 1.5 }}>
                You have learned <strong>{lesson.learnedCount} of {lesson.targetCount}</strong> sentences. You still have <strong>{unlearnedCount} skipped sentence{unlearnedCount > 1 ? 's' : ''}</strong> that must be marked as learned to complete today's goal.
              </p>
            </div>

            {/* List of skipped sentences */}
            <div style={{ marginBottom: '20px' }}>
              <div
                style={{
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  color: '#64748B',
                  letterSpacing: '0.04em',
                  marginBottom: '8px',
                }}
              >
                Skipped Sentences ({unlearnedCount})
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  maxHeight: '220px',
                  overflowY: 'auto',
                  paddingRight: '4px',
                }}
              >
                {unlearnedSentences.map((item) => (
                  <div
                    key={item.id || item.index}
                    onClick={() => {
                      setCurrentIndex(item.index);
                      setShowSkippedModal(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      backgroundColor: '#FFFBEB',
                      border: '1px solid #FDE68A',
                      borderRadius: '14px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    className="card-interactive"
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#B45309' }}>
                          Sentence {item.index + 1}
                        </span>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            backgroundColor: '#FEF2F2',
                            color: '#DC2626',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            fontWeight: 700,
                          }}
                        >
                          Not Learned
                        </span>
                      </div>
                      <div style={{ fontWeight: 750, fontSize: '0.92rem', color: '#0F172A', marginTop: '3px' }}>
                        {item.word}{' '}
                        <span className="font-ml" style={{ fontWeight: 600, color: '#047857', fontSize: '0.82rem' }}>
                          ({item.wordMeaning})
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-sm"
                      style={{
                        backgroundColor: '#059669',
                        color: '#ffffff',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        padding: '5px 12px',
                        borderRadius: '8px',
                        flexShrink: 0,
                      }}
                    >
                      Go to Sentence
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {firstUnlearnedIndex !== -1 && (
                <button
                  type="button"
                  onClick={() => {
                    setCurrentIndex(firstUnlearnedIndex);
                    setShowSkippedModal(false);
                  }}
                  className="btn btn-primary btn-block"
                  style={{
                    backgroundColor: '#059669',
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    fontWeight: 700,
                  }}
                >
                  <RotateCcw size={16} />
                  <span>Go to Sentence {firstUnlearnedIndex + 1}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowSkippedModal(false)}
                className="btn btn-ghost btn-block"
                style={{ borderRadius: '14px' }}
              >
                Close & Continue Reviewing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
