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

  it('renderiza el formulario vacío y sin datos precargados', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    expect((screen.getByLabelText('Correo') as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText('Contraseña') as HTMLInputElement).value).toBe('');
    expect(screen.getByRole('button', { name: 'Iniciar sesión' })).toBeDisabled();
  });

  it('permite mostrar y ocultar la contraseña', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    const passwordInput = screen.getByLabelText('Contraseña') as HTMLInputElement;
    expect(passwordInput.type).toBe('password');

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }));
    expect(passwordInput.type).toBe('text');

    fireEvent.click(screen.getByRole('button', { name: 'Ocultar contraseña' }));
    expect(passwordInput.type).toBe('password');
  });

  it('marca email/password para preservar case en normalización global', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    const emailInput = screen.getByLabelText('Correo') as HTMLInputElement;
    const passwordInput = screen.getByLabelText('Contraseña') as HTMLInputElement;

    expect(emailInput.type).toBe('email');
    expect(emailInput.dataset.textNormalization).toBe('off');
    expect(passwordInput.dataset.textNormalization).toBe('off');
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

    const submitButton = screen.getByRole('button', { name: 'Iniciar sesión' });
    expect(submitButton).not.toBeDisabled();

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(loginRequest).toHaveBeenCalledWith('staff@taller.com', 'secreto-123');
      expect(setSessionMock).toHaveBeenCalledWith({
        token: 'token-123',
        user: { id: 'u1', email: 'staff@taller.com' },
      });
      expect(navigateMock).toHaveBeenCalledWith('/app');
    });
  });

  it('muestra el estado de loading durante el submit', async () => {
    let resolveLogin: ((value: { access_token: string; user: { id: string; email: string } }) => void) | null = null;
    vi.mocked(loginRequest).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveLogin = resolve;
        }) as never,
    );

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('Correo'), { target: { value: 'staff@taller.com' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'secreto-123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(screen.getByRole('button', { name: 'Entrando...' })).toBeDisabled();

    resolveLogin?.({ access_token: 'token-123', user: { id: 'u1', email: 'staff@taller.com' } });

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/app');
    });
  });

  it('muestra errores de autenticación', async () => {
    vi.mocked(loginRequest).mockRejectedValue(new Error('invalid credentials'));

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    fireEvent.change(screen.getByLabelText('Correo'), { target: { value: 'staff@taller.com' } });
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'bad-pass' } });
    fireEvent.click(screen.getByRole('button', { name: 'Iniciar sesión' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('No pude iniciar sesión. Revisa credenciales o endpoint.');
  });

  it('mantiene estructura mobile-first sin romper layout base', () => {
    const { container } = render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    const root = container.querySelector('main');
    expect(root?.className).toContain('min-h-screen');
    expect(root?.className).toContain('px-4');
    expect(root?.className).toContain('sm:px-6');
  });
});
