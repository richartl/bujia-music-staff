import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { CatalogAdminRoute } from '../src/features/auth/components/CatalogAdminRoute';
import { authStore } from '../src/stores/auth-store';

describe('CatalogAdminRoute', () => {
  afterEach(() => {
    authStore.setState({ user: null });
  });

  it('bloquea acceso por URL manual para no-admin', () => {
    authStore.setState({ user: { id: 'u1', email: 'x@x.com', role: 'TECH' } });
    render(
      <MemoryRouter initialEntries={['/app/catalogs']}>
        <Routes>
          <Route path="/app/intakes" element={<div>Recepción</div>} />
          <Route
            path="/app/catalogs"
            element={(
              <CatalogAdminRoute>
                <div>Catálogos internos</div>
              </CatalogAdminRoute>
            )}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Recepción')).toBeTruthy();
    expect(screen.queryByText('Catálogos internos')).toBeNull();
  });

  it('permite acceso a admin', () => {
    authStore.setState({ user: { id: 'u2', email: 'admin@x.com', role: 'ADMIN' } });
    render(
      <MemoryRouter initialEntries={['/app/catalogs']}>
        <Routes>
          <Route
            path="/app/catalogs"
            element={(
              <CatalogAdminRoute>
                <div>Catálogos internos</div>
              </CatalogAdminRoute>
            )}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Catálogos internos')).toBeTruthy();
  });
});
