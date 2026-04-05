import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginPage } from '../src/features/auth/pages/LoginPage';
import { loginRequest } from '../src/features/auth/api/login';

const navigateMock = vi.fn();
const setSessionMock = vi.fn();

vi.mock('../src/features/auth/api/login', () => ({
  loginRequest: vi.fn(),
}));

vi.mock('../src/stores/auth-store', () => ({
  authStore: (selector: (state: { setSession: typeof setSessionMock }) => unknown) =>
    selector({ setSession: setSessionMock }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza el formulario vacío', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    expect((screen.getByLabelText('Correo') as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText('Contraseña') as HTMLInputElement).value).toBe('');
  });

  it('no tiene valor por defecto en email/usuario', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    expect((screen.getByLabelText('Correo') as HTMLInputElement).value).toBe('');
  });

  it('no tiene valor por defecto en password', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    expect((screen.getByLabelText('Contraseña') as HTMLInputElement).value).toBe('');
  });

  it('submit sigue funcionando correctamente', async () => {
    vi.mocked(loginRequest).mockResolvedValue({
      access_token: 'token-123',
      user: { id: 'u1', email: 'staff@taller.com' },
    } as never);

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('Correo'), { target: { value: 'staff@taller.com' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'secreto-123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    await waitFor(() => {
      expect(loginRequest).toHaveBeenCalledWith('staff@taller.com', 'secreto-123');
      expect(setSessionMock).toHaveBeenCalledWith({
        token: 'token-123',
        user: { id: 'u1', email: 'staff@taller.com' },
      });
      expect(navigateMock).toHaveBeenCalledWith('/app');
    });
  });
});
