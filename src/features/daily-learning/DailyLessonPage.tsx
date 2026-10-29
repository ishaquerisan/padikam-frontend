import React, { useState, useEffect } from 'react';
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
  TrendingUp,
  X,
  HelpCircle,
  RotateCcw,
  AlertCircle,
  AlertTriangle,
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
            backgroundColor: '#EEF2FF',
            color: 'var(--color-primary)',
            padding: '2px 6px',
            borderRadius: '6px',
            fontWeight: 800,
            borderBottom: '2px solid var(--color-primary)',
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

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '20px' }}>
        <div className="skeleton" style={{ height: '30px', width: '40%' }} />
        <div className="skeleton" style={{ height: '360px', width: '100%', borderRadius: '24px' }} />
        <div className="skeleton" style={{ height: '56px', width: '100%' }} />
      </div>
    );
  }

  if (error || !lesson || sentences.length === 0) {
    const errorMsg = (error as any)?.message || '';
    const isCompletedAll = errorMsg.toLowerCase().includes('completed all sentences') || errorMsg.includes('based on your selected categories');

    if (isCompletedAll) {
      return (
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px', margin: '40px auto', maxWidth: '520px', borderRadius: '24px' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.1), rgba(147, 51, 234, 0.15))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 8px 20px rgba(99, 102, 241, 0.15)',
            }}
          >
            <Sparkles size={38} color="var(--color-primary)" />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '8px' }}>
            All Sentences Completed! 🎉
          </h2>
          <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '12px' }}>
            നിങ്ങൾ തിരഞ്ഞെടുത്ത വിഷയങ്ങളിലെ എല്ലാ വാക്യങ്ങളും പഠിച്ചു കഴിഞ്ഞു!
          </p>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.95rem', lineHeight: 1.5, margin: '0 auto 28px', maxWidth: '420px' }}>
            {errorMsg || 'You have completed all sentences based on your selected categories! Please select more categories in preferences to continue learning.'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={() => navigate('/app/preferences')}
              className="btn btn-primary"
              style={{ padding: '14px 24px', fontSize: '1rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            >
              Explore More Categories <ArrowRight size={18} style={{ marginLeft: '8px' }} />
            </button>
            <button
              onClick={() => navigate('/app/dashboard')}
              className="btn btn-secondary"
              style={{ padding: '12px 24px' }}
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px 20px', margin: '40px auto', maxWidth: '480px' }}>
        <HelpCircle size={48} color="var(--color-primary)" style={{ margin: '0 auto 16px' }} />
        <h2>No Sentences Found</h2>
        <p style={{ color: 'var(--color-text-secondary)', margin: '12px 0 24px' }}>
          {(error as any)?.message || 'Please ensure you have selected active categories in your preferences.'}
        </p>
        <button onClick={() => navigate('/app/preferences')} className="btn btn-primary">
          Adjust Learning Topics
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {errorMessage && (
        <div
          style={{
            backgroundColor: '#FEE2E2',
            color: '#B91C1C',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            fontWeight: 600,
            fontSize: '0.9rem',
          }}
        >
          {errorMessage}
        </div>
      )}

      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-primary)', textTransform: 'uppercase' }}>
            {isPastLesson ? `Lesson Date: ${lesson.date}` : "Today's Daily Lesson"}
          </span>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
            Sentence {currentIndex + 1} of {sentences.length}
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {lesson.difficultyLevel && (
            <span
              className={`badge badge-${lesson.difficultyLevel.toLowerCase()}`}
              style={{ fontWeight: 800 }}
            >
              {lesson.difficultyLevel}
            </span>
          )}
          <span className="badge badge-success">
            {lesson.learnedCount} / {lesson.targetCount} Learned
          </span>
        </div>
      </div>

      {/* Progress line */}
      <div
        style={{
          height: '6px',
          backgroundColor: 'var(--color-surface-hover)',
          borderRadius: 'var(--radius-full)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${((currentIndex + 1) / sentences.length) * 100}%`,
            backgroundColor: 'var(--color-primary)',
            borderRadius: 'var(--radius-full)',
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      {/* Quick Sentence Navigator Pills (shows learned vs skipped sentences) */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          alignItems: 'center',
          overflowX: 'auto',
          padding: '2px 0 6px',
          scrollbarWidth: 'none',
        }}
      >
        {sentences.map((s, idx) => {
          const isCurrent = idx === currentIndex;
          const isLearned = s.status === 'LEARNED';
          return (
            <button
              key={s.id || idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              style={{
                minWidth: '34px',
                height: '34px',
                padding: '0 8px',
                borderRadius: '10px',
                fontSize: '0.8rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                cursor: 'pointer',
                border: isCurrent
                  ? '2px solid var(--color-primary)'
                  : isLearned
                  ? '1px solid #A7F3D0'
                  : '1px solid var(--color-border)',
                backgroundColor: isCurrent
                  ? '#EEF2FF'
                  : isLearned
                  ? '#ECFDF5'
                  : 'var(--color-surface-muted)',
                color: isCurrent
                  ? 'var(--color-primary)'
                  : isLearned
                  ? '#065F46'
                  : 'var(--color-text-secondary)',
                transform: isCurrent ? 'scale(1.08)' : 'none',
                boxShadow: isCurrent ? '0 2px 6px rgba(79, 70, 229, 0.2)' : 'none',
                transition: 'all 0.15s ease',
                flexShrink: 0,
              }}
              title={`Sentence ${idx + 1}: ${isLearned ? 'Learned' : 'Not Learned'}`}
            >
              {isLearned && <CheckCircle size={12} color="#059669" />}
              <span>{idx + 1}</span>
            </button>
          );
        })}
      </div>

      {/* Alert banner when reached the end with skipped sentences */}
      {currentIndex === sentences.length - 1 && unlearnedCount > 0 && (
        <div
          style={{
            backgroundColor: '#FFFBEB',
            border: '1px solid #FDE68A',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            boxShadow: 'var(--shadow-sm)',
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
              whiteSpace: 'nowrap',
            }}
          >
            Review Skipped
          </button>
        </div>
      )}

      {/* Main Flashcard */}
      {currentSentence && (
        <div
          className="card"
          style={{
            minHeight: '340px',
            borderRadius: 'var(--radius-xl)',
            padding: '32px 24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-md)',
            position: 'relative',
            border: currentSentence.status === 'LEARNED'
              ? '2px solid #10B981'
              : '1px solid var(--color-border)',
            backgroundColor: '#ffffff',
            transition: 'border-color 0.2s ease',
          }}
        >
          {/* Top badges & favorite */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
              {currentSentence.category && (
                <span className="badge" style={{ backgroundColor: 'var(--color-surface-muted)', color: 'var(--color-text-secondary)' }}>
                  {currentSentence.category.name}
                </span>
              )}
              <span className={`badge badge-${currentSentence.difficulty.toLowerCase()}`}>
                {currentSentence.difficulty}
              </span>
              {currentSentence.status === 'LEARNED' && (
                <span
                  className="badge"
                  style={{
                    backgroundColor: '#ECFDF5',
                    color: '#059669',
                    border: '1px solid #A7F3D0',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <CheckCircle size={12} />
                  Learned
                </span>
              )}
            </div>

            <button
              onClick={() => toggleFavMutation.mutate(currentSentence.sentenceId)}
              className="btn-icon btn-ghost"
              title={currentSentence.isFavorite ? 'Remove from favorites' : 'Save to favorites'}
            >
              <Bookmark
                size={22}
                fill={currentSentence.isFavorite ? '#4F46E5' : 'none'}
                color={currentSentence.isFavorite ? '#4F46E5' : 'var(--color-text-muted)'}
              />
            </button>
          </div>

          {/* Core Word & Sentence Presentation */}
          <div style={{ margin: '16px 0' }}>
            {/* New Word Feature Card */}
            {currentSentence.word && (
              <div
                style={{
                  backgroundColor: 'var(--color-surface-muted)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '20px 16px',
                  textAlign: 'center',
                  marginBottom: '20px',
                  border: '1px solid var(--color-border)',
                }}
              >
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    color: 'var(--color-primary)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    backgroundColor: '#EEF2FF',
                    padding: '3px 10px',
                    borderRadius: 'var(--radius-full)',
                    display: 'inline-block',
                    marginBottom: '8px',
                  }}
                >
                  New Word to Learn
                </span>

                <div
                  style={{
                    fontSize: '2rem',
                    fontWeight: 850,
                    color: 'var(--color-text-main)',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.2,
                  }}
                >
                  {currentSentence.word}
                </div>

                <div
                  className="font-ml"
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    color: 'var(--color-primary)',
                    marginTop: '6px',
                  }}
                >
                  {currentSentence.wordMeaning}
                </div>

                <button
                  onClick={handlePlayWordAudio}
                  className="btn btn-sm btn-subtle"
                  style={{
                    borderRadius: 'var(--radius-full)',
                    padding: '6px 14px',
                    margin: '12px auto 0',
                    fontSize: '0.82rem',
                  }}
                >
                  <Volume2
                    size={16}
                    color="var(--color-primary)"
                    className={isPlayingWordAudio ? 'pulse' : ''}
                  />
                  <span>{isPlayingWordAudio ? 'Playing...' : 'Pronounce Word'}</span>
                </button>
              </div>
            )}

            {/* Context Sentence Section */}
            <div style={{ textAlign: 'center', padding: '0 8px' }}>
              <div
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: '10px',
                }}
              >
                Usage in Sentence
              </div>

              {/* English Sentence */}
              <div
                style={{
                  fontSize: '1.35rem',
                  fontWeight: 700,
                  color: 'var(--color-text-main)',
                  lineHeight: 1.45,
                  marginBottom: '14px',
                }}
              >
                {renderSentenceWithHighlight(currentSentence.englishText, currentSentence.word)}
              </div>

              {/* Sentence Audio Button */}
              <button
                onClick={handlePlayAudio}
                className="btn btn-subtle"
                style={{
                  borderRadius: 'var(--radius-full)',
                  padding: '6px 16px',
                  margin: '0 auto 16px',
                  fontSize: '0.85rem',
                }}
              >
                <Volume2
                  size={18}
                  color="var(--color-primary)"
                  className={isPlayingAudio ? 'pulse' : ''}
                />
                <span>{isPlayingAudio ? 'Playing...' : 'Listen to Sentence'}</span>
              </button>

              {/* Divider */}
              <div style={{ height: '1px', backgroundColor: 'var(--color-border)', width: '60%', margin: '0 auto 16px' }} />

              {/* Malayalam Translation */}
              <div
                className="font-ml"
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 600,
                  color: 'var(--color-primary-dark)',
                  lineHeight: 1.6,
                }}
              >
                {currentSentence.malayalamMeaning}
              </div>

              {/* Optional usage example */}
              {currentSentence.usageExample && (
                <div
                  style={{
                    marginTop: '16px',
                    padding: '10px 14px',
                    backgroundColor: 'var(--color-surface-muted)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.85rem',
                    color: 'var(--color-text-secondary)',
                    fontStyle: 'italic',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontWeight: 600, fontStyle: 'normal' }}>Context Tip: </span>
                  "{currentSentence.usageExample}"
                </div>
              )}
            </div>
          </div>

          {/* Learned Status Stamp */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            {currentSentence.status === 'LEARNED' ? (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#059669',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  backgroundColor: '#ECFDF5',
                  padding: '6px 16px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid #A7F3D0',
                }}
              >
                <CheckCircle size={18} />
                <span>Marked as Learned</span>
              </div>
            ) : (
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                Tap 'Mark as Learned' when ready
              </span>
            )}
          </div>
        </div>
      )}

      {/* Navigation & Action Controls */}
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <button
          onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
          className="btn btn-secondary"
          style={{ width: '48px', height: '48px', padding: 0, borderRadius: 'var(--radius-md)' }}
          title="Previous Sentence"
        >
          <ChevronLeft size={24} />
        </button>

        {!isPastLesson && currentSentence?.status !== 'LEARNED' ? (
          <div style={{ display: 'flex', gap: '8px', flex: 1 }}>
            <button
              onClick={handleMarkLearned}
              disabled={markLearnedMutation.isPending}
              className="btn btn-primary btn-lg"
              style={{ flex: 1 }}
            >
              <CheckCircle size={20} />
              <span>{markLearnedMutation.isPending ? 'Saving...' : 'Mark as Learned'}</span>
            </button>

            {currentIndex === sentences.length - 1 && (
              <button
                type="button"
                onClick={handleReviewGoal}
                className="btn btn-secondary btn-lg"
                style={{
                  padding: '0 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                }}
                title="Review Goal"
              >
                <span>Review Goal</span>
              </button>
            )}
          </div>
        ) : (
          <button
            onClick={() => {
              if (currentIndex < sentences.length - 1) {
                setCurrentIndex((prev) => prev + 1);
              } else {
                handleReviewGoal();
              }
            }}
            className="btn btn-primary btn-block btn-lg"
            style={{ flex: 1 }}
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

        <button
          onClick={() => setCurrentIndex((prev) => Math.min(sentences.length - 1, prev + 1))}
          disabled={currentIndex === sentences.length - 1}
          className="btn btn-secondary"
          style={{ width: '48px', height: '48px', padding: 0, borderRadius: 'var(--radius-md)' }}
          title="Next Sentence"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {/* ========================================================
          Target Completion Dialog (Section 8 of Requirements)
         ======================================================== */}
      {showCompletionModal && (
        <div className="modal-overlay">
          <div className="modal-card">
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
                  backgroundColor: 'var(--color-primary-light)',
                  color: 'var(--color-primary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                }}
              >
                <Sparkles size={32} />
              </div>

              <h2 style={{ fontSize: '1.45rem', fontWeight: 800 }}>
                Today's learning target completed!
              </h2>
              <p style={{ color: 'var(--color-text-secondary)', marginTop: '8px', lineHeight: 1.5 }}>
                Great job! You've completed your daily English-learning goal.
              </p>
            </div>

            {/* Section 8: 30-Sentence Limit Check */}
            {lesson.learnedCount >= 30 ? (
              <div
                style={{
                  backgroundColor: 'var(--color-primary-subtle)',
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '20px',
                  textAlign: 'center',
                  border: '1px solid #A7F3D0',
                }}
              >
                <p style={{ fontWeight: 700, color: 'var(--color-primary-dark)', fontSize: '0.95rem' }}>
                  You've reached today's maximum of 30 sentences. Great work!
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                  You can revise previous lessons or take a quiz to reinforce retention.
                </p>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--color-text-main)', marginBottom: '12px', textAlign: 'center' }}>
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
                          border: '1px solid var(--color-border)',
                        }}
                      >
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>
                            Increase target to {nextTarget} sentences
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            Adds {nextTarget - lesson.targetCount} more new sentences for today
                          </div>
                        </div>
                        <ArrowRight size={18} color="var(--color-primary)" />
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
              >
                <span>Take Retention Quiz</span>
                <ArrowRight size={18} />
              </button>
              <button
                type="button"
                onClick={() => navigate('/app')}
                className="btn btn-ghost btn-block"
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
          <div className="modal-card" style={{ maxWidth: '480px' }}>
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

              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-text-main)' }}>
                Some Sentences Were Skipped!
              </h2>
              <p style={{ color: 'var(--color-text-secondary)', marginTop: '8px', fontSize: '0.9rem', lineHeight: 1.5 }}>
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
                  color: 'var(--color-text-muted)',
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
                      borderRadius: 'var(--radius-md)',
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
                      <div style={{ fontWeight: 750, fontSize: '0.92rem', color: 'var(--color-text-main)', marginTop: '3px' }}>
                        {item.word}{' '}
                        <span className="font-ml" style={{ fontWeight: 600, color: 'var(--color-primary-dark)', fontSize: '0.82rem' }}>
                          ({item.wordMeaning})
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn btn-sm"
                      style={{
                        backgroundColor: 'var(--color-primary)',
                        color: '#ffffff',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        padding: '4px 10px',
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
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <RotateCcw size={16} />
                  <span>Go to Sentence {firstUnlearnedIndex + 1}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowSkippedModal(false)}
                className="btn btn-ghost btn-block"
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
