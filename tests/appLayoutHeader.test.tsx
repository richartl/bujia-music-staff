import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { AppLayout } from '../src/layouts/AppLayout';

const authState = {
  user: { email: 'staff@bujia.com', role: 'ADMIN' },
  logout: vi.fn(),
};

const workshopBrandingState = {
  activeWorkshop: {
    id: 'w1',
    name: 'Bujía Music Shop',
    profileImageUrl: 'https://cdn.example.com/workshop-profile.jpg',
    logoUrl: null,
  },
};

vi.mock('../src/stores/auth-store', () => ({
  authStore: (selector: (state: typeof authState) => unknown) => selector(authState),
}));

vi.mock('../src/features/settings/hooks/useProfileBranding', () => ({
  useWorkshopBranding: () => workshopBrandingState,
}));

vi.mock('../src/components/AppShellNav', () => ({
  AppShellNav: () => <nav>mock-nav</nav>,
}));

vi.mock('../src/components/navigation/BottomNav', () => ({
  BottomNav: () => <div>mock-bottom-nav</div>,
}));

vi.mock('../src/features/workshops/components/WorkshopSwitcher', () => ({
  WorkshopSwitcher: () => <button type="button">switcher</button>,
}));

vi.mock('../src/components/avatars/UserAvatar', () => ({
  UserAvatar: () => <div>user-avatar</div>,
}));

describe('AppLayout header hierarchy', () => {
  it('muestra el branding del taller con avatar protagonista cuando hay imagen', () => {
    render(
      <MemoryRouter initialEntries={['/app/visits']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/app/visits" element={<div>contenido</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    const workshopImage = screen.getAllByAltText('Bujía Music Shop')[0];
    expect(workshopImage.className).toContain('h-16');
    expect(screen.getByText('Órdenes')).toBeTruthy();
    expect(screen.getByText('Panel de operación')).toBeTruthy();
  });

  it('usa fallback de iniciales y mantiene contexto útil cuando no hay imagen', () => {
    workshopBrandingState.activeWorkshop = {
      ...workshopBrandingState.activeWorkshop,
      profileImageUrl: null,
      logoUrl: null,
    };

    render(
      <MemoryRouter initialEntries={['/app/intakes']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/app/intakes" element={<div>contenido</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getAllByText('BM')[0]).toBeTruthy();
    expect(screen.getByText('Recepción')).toBeTruthy();
    expect(screen.getByText('Registro y control de entrada')).toBeTruthy();
    expect(screen.queryByText(/first mobile/i)).toBeNull();
  });
});
