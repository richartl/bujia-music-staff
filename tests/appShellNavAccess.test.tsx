import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { AppShellNav } from '../src/components/AppShellNav';
import { authStore } from '../src/stores/auth-store';

describe('AppShellNav catalogs access', () => {
  afterEach(() => {
    authStore.setState({ user: null });
  });

  it('solo admin/owner ve Catálogos y Resumen ya no aparece', () => {
    authStore.setState({ user: { id: 'u1', email: 'admin@x.com', role: 'ADMIN' } });
    render(
      <MemoryRouter>
        <AppShellNav />
      </MemoryRouter>,
    );

    expect(screen.getByText('Catálogos')).toBeTruthy();
    expect(screen.queryByText('Resumen')).toBeNull();
  });

  it('usuario no admin no ve Catálogos', () => {
    authStore.setState({ user: { id: 'u2', email: 'tech@x.com', role: 'TECH' } });
    render(
      <MemoryRouter>
        <AppShellNav />
      </MemoryRouter>,
    );

    expect(screen.queryByText('Catálogos')).toBeNull();
  });
});
