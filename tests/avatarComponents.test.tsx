import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { UserAvatar } from '../src/components/avatars/UserAvatar';
import { WorkshopAvatar } from '../src/components/avatars/WorkshopAvatar';
import { UserAvatarUploader } from '../src/features/settings/components/UserAvatarUploader';

describe('avatar components', () => {
  it('UserAvatar usa iniciales cuando no hay imagen', () => {
    render(<UserAvatar email="ricardo@bujia.com" />);
    expect(screen.getByText('RB')).toBeTruthy();
  });

  it('WorkshopAvatar prioriza profileImageUrl sobre logo y mejora visibilidad', () => {
    render(
      <WorkshopAvatar
        name="Bujia Music"
        profileImageUrl="https://cdn/profile.jpg"
        logoUrl="https://cdn/logo.jpg"
      />,
    );

    const image = screen.getByAltText('Bujia Music') as HTMLImageElement;
    expect(image.src).toContain('profile.jpg');
    expect(image.className).toContain('ring-2');
  });

  it('WorkshopAvatar fallback muestra iniciales cuando no hay imagen', () => {
    render(<WorkshopAvatar name="Taller Vintage" profileImageUrl={null} logoUrl={null} />);
    expect(screen.getByText('TV')).toBeTruthy();
  });

  it('UserAvatarUploader muestra acciones cuando hay permisos', () => {
    render(<UserAvatarUploader userId="u1" email="staff@bujia.com" canEdit profileImageUrl={null} />);
    expect(screen.getByText('Subir imagen')).toBeTruthy();
    expect(screen.getByText('Guardar cambios')).toBeTruthy();
  });
});
