import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/api/client';
import { QuizData, QuizQuestion } from '@/types';
import confetti from 'canvas-confetti';
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  RotateCcw,
  Trophy,
  Sparkles,
  BookOpen,
} from 'lucide-react';

export const YesterdayQuizPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [wordChips, setWordChips] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<{
    submitted: boolean;
    isCorrect: boolean;
    correctAnswer?: string;
    explanation?: string;
  } | null>(null);
  const [completionResult, setCompletionResult] = useState<any | null>(null);

  // Fetch yesterday's quiz
  const { data: quiz, isLoading, error } = useQuery<QuizData>({
    queryKey: ['yesterday-quiz'],
    queryFn: () => apiClient.get('/quizzes/yesterday'),
  });

  // Submit answer mutation
  const submitAnswerMutation = useMutation({
    mutationFn: (payload: { attemptId: number; answerId: number; selectedAnswer: string }) =>
      apiClient.post('/quizzes/submit-answer', payload),
    onSuccess: (res: any) => {
      setFeedback({
        submitted: true,
        isCorrect: res.isCorrect,
        correctAnswer: res.correctAnswer,
        explanation: res.explanation,
      });
      if (res.isCorrect) {
        confetti({ particleCount: 30, spread: 45, origin: { y: 0.7 } });
      }
    },
  });

  // Complete attempt mutation
  const completeAttemptMutation = useMutation({
    mutationFn: (attemptId: number) =>
      apiClient.post('/quizzes/complete', { attemptId }),
    onSuccess: (res: any) => {
      setCompletionResult(res);
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['progress'] });
    },
  });

  const questions = quiz?.questions || [];
  const currentQ = questions[currentIndex] as QuizQuestion | undefined;

  const handleChipClick = (chip: string) => {
    if (feedback?.submitted) return;
    const newChips = [...wordChips, chip];
    setWordChips(newChips);
    setSelectedAnswer(newChips.join(' '));
  };

  const handleResetChips = () => {
    if (feedback?.submitted) return;
    setWordChips([]);
    setSelectedAnswer('');
  };

  const handleSubmit = () => {
    if (!quiz || !currentQ || !selectedAnswer || feedback?.submitted) return;
    submitAnswerMutation.mutate({
      attemptId: quiz.attemptId,
      answerId: currentQ.id,
      selectedAnswer,
    });
  };

  const handleNext = () => {
    setFeedback(null);
    setSelectedAnswer('');
    setWordChips([]);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else if (quiz) {
      completeAttemptMutation.mutate(quiz.attemptId);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingTop: '20px' }}>
        <div className="skeleton" style={{ height: '32px', width: '40%' }} />
        <div className="skeleton" style={{ height: '340px', width: '100%', borderRadius: '24px' }} />
      </div>
    );
  }

  // Friendly Empty State (Section 10)
  if (!quiz || !quiz.available) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '48px 24px', maxWidth: '520px', margin: '40px auto' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: 'var(--color-surface-muted)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px',
          }}
        >
          <HelpCircle size={32} color="var(--color-text-muted)" />
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Yesterday's Quiz Not Available</h2>
        <p className="font-ml" style={{ color: 'var(--color-text-secondary)', marginTop: '8px', lineHeight: 1.6 }}>
          ഇന്നലെ പൂർത്തിയാക്കിയ പാഠങ്ങൾ ലഭ്യമല്ലാത്തതിനാൽ ഇന്നലത്തെ ക്വിസ് തയ്യാറായിട്ടില്ല.
        </p>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: '6px', marginBottom: '24px' }}>
          Complete today’s lesson first to unlock tomorrow’s retention quiz!
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={() => navigate('/app/lesson')} className="btn btn-primary">
            <BookOpen size={18} />
            <span>Go to Today's Lesson</span>
          </button>
          <button onClick={() => navigate('/app/favorites')} className="btn btn-secondary">
            Revise Saved Sentences
          </button>
        </div>
      </div>
    );
  }

  // Quiz Completion Result Screen
  if (completionResult) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '20px auto', padding: '32px 24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              backgroundColor: '#FEF3C7',
              color: '#D97706',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
            }}
          >
            <Trophy size={36} />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Quiz Completed!</h1>
          <p className="font-ml" style={{ color: 'var(--color-text-secondary)', marginTop: '4px' }}>
            മികച്ച പ്രവർത്തനം! ക്വിസ് വിജയകരമായി പൂർത്തിയാക്കി.
          </p>
          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--color-primary)', marginTop: '12px' }}>
            {completionResult.score}%
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
            {completionResult.correctAnswers} of {completionResult.totalQuestions} questions correct
          </div>
        </div>

        {/* Detailed Question Review Breakdown */}
        <div style={{ marginBottom: '28px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '14px' }}>Answers Review</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {completionResult.breakdown?.map((item: any, idx: number) => (
              <div
                key={item.id}
                style={{
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: item.isCorrect ? 'var(--color-primary-subtle)' : 'var(--color-danger-subtle)',
                  border: item.isCorrect ? '1px solid #A7F3D0' : '1px solid #FECACA',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>
                    {idx + 1}. {item.englishText}
                  </div>
                  {item.isCorrect ? (
                    <CheckCircle2 size={18} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                  ) : (
                    <XCircle size={18} color="var(--color-danger)" style={{ flexShrink: 0 }} />
                  )}
                </div>
                <div style={{ fontSize: '0.85rem', marginTop: '6px' }}>
                  <div>
                    <span style={{ color: 'var(--color-text-muted)' }}>Your Answer: </span>
                    <span style={{ fontWeight: 600 }}>{item.selectedAnswer || 'Not answered'}</span>
                  </div>
                  {!item.isCorrect && (
                    <div style={{ color: 'var(--color-primary-dark)', marginTop: '2px' }}>
                      <span>Correct: </span>
                      <span style={{ fontWeight: 700 }}>{item.correctAnswer}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => {
              setCompletionResult(null);
              setCurrentIndex(0);
              queryClient.invalidateQueries({ queryKey: ['yesterday-quiz'] });
            }}
            className="btn btn-secondary"
            style={{ flex: 1 }}
          >
            <RotateCcw size={18} />
            <span>Retake</span>
          </button>
          <button
            onClick={() => navigate('/app')}
            className="btn btn-primary"
            style={{ flex: 2 }}
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-accent)', textTransform: 'uppercase' }}>
            Yesterday's Retention Quiz
          </span>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800 }}>
            Question {currentIndex + 1} of {questions.length}
          </h1>
        </div>
        <span className="badge" style={{ backgroundColor: 'var(--color-accent-light)', color: 'var(--color-accent)' }}>
          {currentQ?.questionType.replace('_', ' ')}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{ height: '6px', backgroundColor: 'var(--color-surface-hover)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${((currentIndex + 1) / questions.length) * 100}%`,
            backgroundColor: 'var(--color-accent)',
            borderRadius: 'var(--radius-full)',
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      {/* Question Card */}
      {currentQ && (
        <div className="card" style={{ padding: '28px 20px', borderRadius: 'var(--radius-xl)' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px' }}>
              {currentQ.question}
            </h2>
            {currentQ.meaning && (
              <div className="font-ml" style={{ fontSize: '1.1rem', color: 'var(--color-primary)' }}>
                {currentQ.meaning}
              </div>
            )}
          </div>

          {/* Option Type: Meaning MCQ or Fill Blank */}
          {currentQ.options && currentQ.options.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {currentQ.options.map((opt, i) => {
                const isSelected = selectedAnswer === opt;
                let optBorder = '1px solid var(--color-border)';
                let optBg = 'var(--color-surface)';

                if (feedback?.submitted) {
                  if (opt === feedback.correctAnswer) {
                    optBorder = '2px solid var(--color-primary)';
                    optBg = 'var(--color-primary-subtle)';
                  } else if (isSelected && !feedback.isCorrect) {
                    optBorder = '2px solid var(--color-danger)';
                    optBg = 'var(--color-danger-subtle)';
                  }
                } else if (isSelected) {
                  optBorder = '2px solid var(--color-accent)';
                  optBg = 'var(--color-accent-light)';
                }

                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => !feedback?.submitted && setSelectedAnswer(opt)}
                    style={{
                      padding: '16px 20px',
                      borderRadius: 'var(--radius-md)',
                      border: optBorder,
                      backgroundColor: optBg,
                      textAlign: 'left',
                      fontSize: '1rem',
                      fontWeight: isSelected ? 700 : 500,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease',
                      cursor: feedback?.submitted ? 'default' : 'pointer',
                    }}
                    className={!feedback?.submitted ? 'card-interactive' : ''}
                  >
                    <span className="font-ml">{opt}</span>
                    {feedback?.submitted && opt === feedback.correctAnswer && (
                      <CheckCircle2 size={20} color="var(--color-primary)" />
                    )}
                    {feedback?.submitted && isSelected && !feedback.isCorrect && (
                      <XCircle size={20} color="var(--color-danger)" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Option Type: Word Order Chips */}
          {currentQ.chips && currentQ.chips.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              {/* Assembled sentence preview */}
              <div
                style={{
                  minHeight: '60px',
                  padding: '14px',
                  backgroundColor: 'var(--color-surface-muted)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  color: selectedAnswer ? 'var(--color-text-main)' : 'var(--color-text-muted)',
                }}
              >
                {selectedAnswer || 'Tap words below in the correct order'}
              </div>

              {/* Chips pool */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
                {currentQ.chips.map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleChipClick(chip)}
                    disabled={feedback?.submitted}
                    className="btn btn-secondary"
                    style={{ padding: '8px 16px', borderRadius: 'var(--radius-full)', fontWeight: 600 }}
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {!feedback?.submitted && wordChips.length > 0 && (
                <div style={{ textAlign: 'center', marginTop: '12px' }}>
                  <button
                    type="button"
                    onClick={handleResetChips}
                    className="btn btn-sm btn-ghost"
                    style={{ fontSize: '0.8rem' }}
                  >
                    Reset Order
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Immediate Feedback Box (Section 10) */}
          {feedback && (
            <div
              style={{
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: feedback.isCorrect ? 'var(--color-primary-subtle)' : 'var(--color-danger-subtle)',
                border: feedback.isCorrect ? '1px solid #A7F3D0' : '1px solid #FECACA',
                marginBottom: '20px',
                animation: 'slideUp 0.2s ease-out',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: feedback.isCorrect ? 'var(--color-primary-dark)' : 'var(--color-danger)', fontSize: '1rem' }}>
                {feedback.isCorrect ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                <span>{feedback.isCorrect ? 'Correct! Well done.' : 'Incorrect'}</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)', marginTop: '4px' }}>
                {feedback.explanation}
              </p>
            </div>
          )}

          {/* Actions */}
          {!feedback?.submitted ? (
            <button
              onClick={handleSubmit}
              disabled={!selectedAnswer || submitAnswerMutation.isPending}
              className="btn btn-accent btn-block btn-lg"
            >
              <span>{submitAnswerMutation.isPending ? 'Checking...' : 'Check Answer'}</span>
              <ArrowRight size={20} />
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="btn btn-primary btn-block btn-lg"
            >
              <span>{currentIndex < questions.length - 1 ? 'Next Question' : 'Complete Quiz'}</span>
              <ArrowRight size={20} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
