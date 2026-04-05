import type { PropsWithChildren } from 'react';
import { Navigate } from 'react-router-dom';
import { authStore } from '@/stores/auth-store';
import { canAccessCatalogs } from '@/features/auth/utils/permissions';

export function CatalogAdminRoute({ children }: PropsWithChildren) {
  const userRole = authStore((state) => state.user?.role);
  if (!canAccessCatalogs(userRole)) {
    return <Navigate to="/app/intakes" replace />;
  }
  return <>{children}</>;
}
