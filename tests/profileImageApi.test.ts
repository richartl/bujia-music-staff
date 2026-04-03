import axios from 'axios';
import { describe, expect, it } from 'vitest';
import { getProfileImageErrorMessage } from '../src/features/settings/api/profile-images';

describe('getProfileImageErrorMessage', () => {
  it('mapea errores de permisos y media inválida', () => {
    expect(
      getProfileImageErrorMessage({
        isAxiosError: true,
        response: { status: 403 },
      } as unknown as axios.AxiosError),
    ).toContain('No tienes permisos');

    expect(
      getProfileImageErrorMessage({
        isAxiosError: true,
        response: { status: 422 },
      } as unknown as axios.AxiosError),
    ).toContain('no es válida');
  });

  it('mapea fallas de upload binario', () => {
    expect(getProfileImageErrorMessage(new Error('UPLOAD_HTTP_500'))).toContain('subida binaria');
    expect(getProfileImageErrorMessage(new Error('MEDIA_PROVIDER_ERROR'))).toContain('proveedor de medios');
  });
});
