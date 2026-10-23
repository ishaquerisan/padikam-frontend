export type UserRole = 'USER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  avatar_url?: string;
  auth_provider?: string;
  firebase_uid?: string;
  settings?: UserSettings;
}

export interface UserSettings {
  id: number;
  user_id: number;
  daily_target: number;
  timezone: string;
  notifications_enabled: boolean;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  status: 'ACTIVE' | 'INACTIVE';
  sort_order: number;
  sentenceCount?: number;
}

export type SentenceDifficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
export type SentenceStatus = 'ACTIVE' | 'INACTIVE';

export interface Sentence {
  id: number;
  category_id: number;
  word: string;
  word_meaning: string;
  english_text: string;
  malayalam_meaning: string;
  usage_example?: string;
  difficulty: SentenceDifficulty;
  audio_url?: string;
  status: SentenceStatus;
  category?: Category;
}

export interface DailyLessonItem {
  id: number;
  sentenceId: number;
  position: number;
  status: 'PENDING' | 'LEARNED';
  learnedAt?: string;
  word: string;
  wordMeaning: string;
  englishText: string;
  malayalamMeaning: string;
  usageExample?: string;
  difficulty: SentenceDifficulty;
  audioUrl?: string;
  category?: {
    id: number;
    name: string;
    slug: string;
    icon: string;
  };
  isFavorite: boolean;
}

export interface DailyLesson {
  id: number;
  date: string;
  status: 'IN_PROGRESS' | 'COMPLETED';
  targetCount: number;
  totalAssigned: number;
  learnedCount: number;
  remainingCount: number;
  isTargetCompleted: boolean;
  isDailyMaxReached: boolean;
  maxAllowedDaily: number;
  startedAt?: string;
  completedAt?: string;
  sentences: DailyLessonItem[];
}

export interface DashboardSummary {
  todayDate: string;
  hasTodayLesson: boolean;
  targetCount: number;
  learnedCount: number;
  totalAssigned: number;
  remainingCount: number;
  isTargetCompleted: boolean;
  isDailyMaxReached: boolean;
  currentStreak: number;
  longestStreak: number;
  yesterdayQuiz: {
    available: boolean;
    completed: boolean;
    score: number | null;
  };
  favoriteCount: number;
  categoryCount: number;
}

export interface QuizQuestion {
  id: number;
  questionType: 'MEANING_MCQ' | 'MATCHING' | 'FILL_BLANK' | 'WORD_ORDER';
  question: string;
  prompt: string;
  meaning?: string;
  options?: string[];
  chips?: string[];
  isAnswered: boolean;
  selectedAnswer?: string;
}

export interface QuizData {
  available: boolean;
  message?: string;
  attemptId: number;
  date: string;
  type: string;
  status: 'IN_PROGRESS' | 'COMPLETED';
  totalQuestions: number;
  questions: QuizQuestion[];
}

export interface FavoriteItem {
  favoriteId: number;
  savedAt: string;
  sentence: {
    id: number;
    word: string;
    wordMeaning: string;
    englishText: string;
    malayalamMeaning: string;
    usageExample?: string;
    difficulty: SentenceDifficulty;
    audioUrl?: string;
    category?: {
      id: number;
      name: string;
      slug: string;
      icon: string;
    };
  };
}

export interface LearnerProgress {
  currentStreak: number;
  longestStreak: number;
  totalUniqueSentencesLearned: number;
  totalLearningDays: number;
  completedTargetsCount: number;
  quizCount: number;
  averageQuizAccuracy: number;
  weeklyActivity: {
    date: string;
    dayOfWeek: string;
    sentencesLearned: number;
    isCompleted: boolean;
  }[];
  categoryBreakdown: {
    categoryId: number;
    name: string;
    slug: string;
    icon: string;
    totalSentences: number;
    learnedSentences: number;
    percentage: number;
  }[];
}

export interface LessonHistoryItem {
  id: number;
  date: string;
  targetCount: number;
  learnedCount: number;
  status: string;
  isCompleted: boolean;
  quizScore: number | null;
  hasQuizAttempt: boolean;
}
