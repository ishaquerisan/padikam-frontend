import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { AdminLayout } from '../layouts/AdminLayout';
import { useAuth } from '../providers/AuthProvider';

// Auth pages
import { LoginPage } from '@/features/auth/LoginPage';
import { RegisterPage } from '@/features/auth/RegisterPage';
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage';

// Learner pages
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { DailyLessonPage } from '@/features/daily-learning/DailyLessonPage';
import { YesterdayQuizPage } from '@/features/quizzes/YesterdayQuizPage';
import { FavoritesPage } from '@/features/favorites/FavoritesPage';
import { ProgressPage } from '@/features/progress/ProgressPage';
import { HistoryPage } from '@/features/history/HistoryPage';
import { PreferencesPage } from '@/features/preferences/PreferencesPage';
import { OnboardingPage } from '@/features/preferences/OnboardingPage';
import { ProfilePage } from '@/features/profile/ProfilePage';

// Admin pages
import { AdminDashboardPage } from '@/features/admin-analytics/AdminDashboardPage';
import { AdminUsersPage } from '@/features/admin-users/AdminUsersPage';
import { AdminCategoriesPage } from '@/features/admin-categories/AdminCategoriesPage';
import { AdminSentencesPage } from '@/features/admin-sentences/AdminSentencesPage';
import { AdminLessonsPage } from '@/features/admin-lessons/AdminLessonsPage';
import { AdminQuizzesPage } from '@/features/admin-quizzes/AdminQuizzesPage';
import { AdminActivityPage } from '@/features/admin-analytics/AdminActivityPage';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>Loading Padikam...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Admin Route Guard
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>Loading Console...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'ADMIN') {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
};

export const router = createBrowserRouter([
  // Root Redirect
  {
    path: '/',
    element: <Navigate to="/app" replace />,
  },

  // Public Auth Routes
  { path: '/login', element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },
  { path: '/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/reset-password', element: <ResetPasswordPage /> },

  // Learner Onboarding
  {
    path: '/onboarding',
    element: (
      <ProtectedRoute>
        <OnboardingPage />
      </ProtectedRoute>
    ),
  },

  // Protected Learner Experience Routes
  {
    path: '/app',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'lesson', element: <DailyLessonPage /> },
      { path: 'lesson/:date', element: <DailyLessonPage /> },
      { path: 'quiz', element: <YesterdayQuizPage /> },
      { path: 'favorites', element: <FavoritesPage /> },
      { path: 'progress', element: <ProgressPage /> },
      { path: 'history', element: <HistoryPage /> },
      { path: 'preferences', element: <PreferencesPage /> },
      { path: 'profile', element: <ProfilePage /> },
    ],
  },

  // Protected Admin Console Routes
  {
    path: '/admin',
    element: (
      <AdminRoute>
        <AdminLayout />
      </AdminRoute>
    ),
    children: [
      { index: true, element: <AdminDashboardPage /> },
      { path: 'users', element: <AdminUsersPage /> },
      { path: 'categories', element: <AdminCategoriesPage /> },
      { path: 'sentences', element: <AdminSentencesPage /> },
      { path: 'lessons', element: <AdminLessonsPage /> },
      { path: 'quizzes', element: <AdminQuizzesPage /> },
      { path: 'activity', element: <AdminActivityPage /> },
    ],
  },

  // Fallback
  {
    path: '*',
    element: <Navigate to="/app" replace />,
  },
]);
