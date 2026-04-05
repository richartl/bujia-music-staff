import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoginPage } from './features/auth/pages/LoginPage';
import { AppLayout } from './layouts/AppLayout';
import { IntakesPage } from './features/intakes/pages/IntakesPage';
import { VisitsBoardPage } from './features/visits/pages/VisitsBoardPage';
import { VisitDetailPage } from './features/visits/pages/VisitDetailPage';
import { CatalogsPage } from './features/catalogs/pages/CatalogsPage';
import { SettingsPage } from './features/settings/pages/SettingsPage';
import { ProtectedRoute } from './features/auth/components/ProtectedRoute';
import { CatalogAdminRoute } from './features/auth/components/CatalogAdminRoute';
import { PublicTrackingPage } from './features/tracking/pages/PublicTrackingPage';
import { RouteErrorFallback } from './components/RouteErrorFallback';

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to="/app/intakes" replace />, errorElement: <RouteErrorFallback /> },
  { path: '/login', element: <LoginPage />, errorElement: <RouteErrorFallback /> },
  { path: '/tracking/:token', element: <PublicTrackingPage />, errorElement: <RouteErrorFallback /> },
  {
    path: '/app',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    errorElement: <RouteErrorFallback />,
    children: [
      { index: true, element: <Navigate to="/app/intakes" replace /> },
      { path: 'intakes', element: <IntakesPage /> },
      { path: 'dashboard', element: <Navigate to="/app/intakes" replace /> },
      { path: 'visits', element: <VisitsBoardPage /> },
      { path: 'visits/:visitId', element: <VisitDetailPage /> },
      {
        path: 'catalogs',
        element: (
          <CatalogAdminRoute>
            <CatalogsPage />
          </CatalogAdminRoute>
        ),
      },
      {
        path: 'catalogs/:catalogKey',
        element: (
          <CatalogAdminRoute>
            <CatalogsPage />
          </CatalogAdminRoute>
        ),
      },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
]);
