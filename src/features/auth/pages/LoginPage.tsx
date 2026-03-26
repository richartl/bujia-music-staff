import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginRequest } from '../api/login';
import { authStore } from '@/stores/auth-store';
import { Guitar } from 'lucide-react';
import { env } from '@/config/env';

export function LoginPage() {
  const navigate = useNavigate();
  const setSession = authStore((state) => state.setSession);
  const [email, setEmail] = useState('ricardo@bujia.com');
  const [password, setPassword] = useState('12345678');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  return (
    <main className="min-h-screen grid lg:grid-cols-2">
      <section className="hidden lg:flex bg-brand items-center justify-center p-10 text-white">
        <div className="max-w-md">
          <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
            <Guitar className="h-7 w-7" />
          </div>
          <h1 className="text-4xl font-bold">{env.appName}</h1>
          <p className="mt-4 text-white/80">
            Frontend para staff del taller. Pensado para recibir instrumentos, mover órdenes rápido y no perder tiempo en mostrador.
          </p>
        </div>
      </section>

      <section className="flex items-center justify-center p-6">
        <form onSubmit={handleSubmit} className="card w-full max-w-md p-6 md:p-8">
          <h2 className="text-2xl font-bold">Entrar</h2>
          <p className="mt-2 text-sm text-slate-500">Usa tu cuenta del taller.</p>

          <div className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Correo</label>
              <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Contraseña</label>
              <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            {error ? <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

            <button className="btn-primary w-full" type="submit" disabled={loading}>
              {loading ? 'Entrando...' : 'Iniciar sesión'}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
