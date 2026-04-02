import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from './features/auth/pages/LoginPage';
import { AppLayout } from './layouts/AppLayout';
import { DashboardPage } from './features/dashboard/pages/DashboardPage';
import { IntakesPage } from './features/intakes/pages/IntakesPage';
import { VisitsBoardPage } from './features/visits/pages/VisitsBoardPage';
import { VisitDetailPage } from './features/visits/pages/VisitDetailPage';
import { CatalogsPage } from './features/catalogs/pages/CatalogsPage';
import { SettingsPage } from './features/settings/pages/SettingsPage';
import { ProtectedRoute } from './features/auth/components/ProtectedRoute';
import { PublicTrackingPage } from './features/tracking/pages/PublicTrackingPage';

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/app/intakes" replace /> },
  { path: '/login', element: <LoginPage /> },
  { path: '/tracking/:token', element: <PublicTrackingPage /> },
  {
    path: '/app',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/app/intakes" replace /> },
      { path: 'intakes', element: <IntakesPage /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'visits', element: <VisitsBoardPage /> },
      { path: 'visits/:visitId', element: <VisitDetailPage /> },
      { path: 'catalogs', element: <CatalogsPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
]);
