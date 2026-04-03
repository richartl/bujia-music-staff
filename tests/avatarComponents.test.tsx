import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UserAvatar } from '../src/components/avatars/UserAvatar';
import { WorkshopAvatar } from '../src/components/avatars/WorkshopAvatar';
import { UserAvatarUploader } from '../src/features/settings/components/UserAvatarUploader';

vi.mock('../src/config/env', () => ({
  env: {
    enableProfileImageEditing: false,
  },
}));

describe('avatar components', () => {
  it('UserAvatar usa iniciales cuando no hay imagen', () => {
    render(<UserAvatar email="ricardo@bujia.com" />);
    expect(screen.getByText('RB')).toBeTruthy();
  });

  it('WorkshopAvatar prioriza profileImageUrl sobre logo', () => {
    render(
      <WorkshopAvatar
        name="Bujia Music"
        profileImageUrl="https://cdn/profile.jpg"
        logoUrl="https://cdn/logo.jpg"
      />,
    );

    const image = screen.getByAltText('Bujia Music') as HTMLImageElement;
    expect(image.src).toContain('profile.jpg');
  });

  it('UserAvatarUploader oculta acciones si feature flag está apagado', () => {
    render(<UserAvatarUploader email="staff@bujia.com" canEdit profileImageUrl={null} />);
    expect(screen.getByText(/Edición de foto disponible/)).toBeTruthy();
  });
});
