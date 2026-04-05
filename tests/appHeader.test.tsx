import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AppHeader } from '../src/components/layout/AppHeader';

vi.mock('../src/features/workshops/components/WorkshopSwitcher', () => ({
  WorkshopSwitcher: () => <button type="button">switcher</button>,
}));

vi.mock('../src/components/avatars/UserAvatar', () => ({
  UserAvatar: () => <div>user-avatar</div>,
}));

describe('AppHeader mobile branding behavior', () => {
  it('renderiza imagen del taller centrada cuando existe', () => {
    render(
      <AppHeader
        title="Órdenes"
        subtitle="Seguimiento"
        workshopName="Bujía Music"
        workshopImageUrl="https://cdn.example.com/workshop.jpg"
        mobilePanelOpen={false}
        onToggleMobilePanel={vi.fn()}
        onLogout={vi.fn()}
      />,
    );

    const mobileContainer = document.querySelector('.relative.h-14');
    expect(mobileContainer).toBeTruthy();
    expect(screen.getByAltText('Bujía Music').className).toContain('h-9');
    expect(document.querySelector('.left-1\\/2.top-1\\/2.-translate-x-1\\/2.-translate-y-1\\/2')).toBeTruthy();
  });

  it('muestra placeholder consistente cuando no hay imagen', () => {
    render(
      <AppHeader
        title="Órdenes"
        subtitle="Seguimiento"
        workshopName="Taller Vintage"
        workshopImageUrl={null}
        workshopLogoUrl={null}
        mobilePanelOpen={false}
        onToggleMobilePanel={vi.fn()}
        onLogout={vi.fn()}
      />,
    );

    expect(screen.getByText('TV')).toBeTruthy();
  });

  it('mantiene centrado visual con botones laterales', () => {
    render(
      <AppHeader
        title="Órdenes"
        subtitle="Seguimiento"
        workshopName="Bujía Music"
        workshopImageUrl="https://cdn.example.com/workshop.jpg"
        mobilePanelOpen={false}
        onToggleMobilePanel={vi.fn()}
        onLogout={vi.fn()}
      />,
    );

    const centeredLogo = document.querySelector('.left-1\\/2.top-1\\/2.-translate-x-1\\/2.-translate-y-1\\/2');
    const rightAction = document.querySelector('.absolute.right-3.top-1\\/2.-translate-y-1\\/2');
    expect(centeredLogo).toBeTruthy();
    expect(rightAction).toBeTruthy();
  });
});
