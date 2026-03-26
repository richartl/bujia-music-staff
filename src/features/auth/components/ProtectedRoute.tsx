import { Navigate } from 'react-router-dom';
import { authStore } from '@/stores/auth-store';
import type { PropsWithChildren } from 'react';

export function ProtectedRoute({ children }: PropsWithChildren) {
  const token = authStore((state) => state.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
