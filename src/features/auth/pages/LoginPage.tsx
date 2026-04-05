import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Guitar } from 'lucide-react';
import { loginRequest } from '../api/login';
import { authStore } from '@/stores/auth-store';
import { env } from '@/config/env';

export function LoginPage() {
  const navigate = useNavigate();
  const setSession = authStore((state) => state.setSession);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await loginRequest(email, password);
      setSession({
        token: data.access_token,
        user: data.user,
      });
      navigate('/app');
    } catch (err) {
      setError('No pude iniciar sesión. Revisa credenciales o endpoint.');
    } finally {
      setLoading(false);
    }
  }

  const isSubmitDisabled = loading || email.trim().length === 0 || password.length === 0;

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch lg:gap-8">
        <section className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-6 text-slate-100 shadow-2xl shadow-black/30 sm:p-8 lg:p-10">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-500/40 bg-amber-500/10 text-amber-300">
            <Guitar className="h-6 w-6" aria-hidden="true" />
          </div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.24em] text-amber-300/90">Staff Platform</p>
          <h1 className="mt-3 text-3xl font-semibold leading-tight text-white sm:text-4xl">{env.appName}</h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
            Opera tu taller con enfoque profesional: recepción ágil, seguimiento claro y menos fricción para el equipo de
            mostrador.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-slate-200">
            <li className="rounded-xl border border-slate-700/80 bg-slate-900/60 px-4 py-3">Gestión centralizada para staff.</li>
            <li className="rounded-xl border border-slate-700/80 bg-slate-900/60 px-4 py-3">Flujos rápidos para instrumentos y órdenes.</li>
            <li className="rounded-xl border border-slate-700/80 bg-slate-900/60 px-4 py-3">Interfaz clara para trabajar desde móvil o desktop.</li>
          </ul>
        </section>

        <section className="flex items-center justify-center">
          <form
            onSubmit={handleSubmit}
            className="w-full rounded-3xl border border-slate-800 bg-slate-900/95 p-6 shadow-2xl shadow-black/40 backdrop-blur sm:p-8"
            aria-busy={loading}
          >
            <h2 className="text-2xl font-semibold text-white">Iniciar sesión</h2>
            <p className="mt-2 text-sm text-slate-300">Usa tu cuenta del taller para continuar.</p>

            <div className="mt-6 space-y-4">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-200">
                  Correo
                </label>
                <input
                  id="email"
                  name="email"
                  autoComplete="username"
                  className="input border-slate-700 bg-slate-950 text-base text-slate-100 placeholder:text-slate-500 focus:border-amber-400 focus:ring-amber-500/20"
                  placeholder="tu@taller.com"
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-200">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    autoComplete="current-password"
                    className="input border-slate-700 bg-slate-950 pr-14 text-base text-slate-100 placeholder:text-slate-500 focus:border-amber-400 focus:ring-amber-500/20"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-1 right-1 inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-slate-300 transition hover:bg-slate-800 hover:text-slate-100"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
                  </button>
                </div>
              </div>

              {error ? (
                <div role="alert" className="rounded-xl border border-red-400/30 bg-red-950/30 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              ) : null}

              <button className="btn-primary w-full" type="submit" disabled={isSubmitDisabled}>
                {loading ? 'Entrando...' : 'Iniciar sesión'}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
