import { useState } from 'react';
import { api, setToken, setStoredUser } from '../api/client';

const DEMO_ACCOUNTS = [
  { role: 'Authority', email: 'authority@kopargaon.demo' },
  { role: 'Contractor', email: 'contractor@kopargaon.demo' },
  { role: 'Engineer', email: 'engineer@kopargaon.demo' },
  { role: 'Citizen', email: 'citizen@kopargaon.demo' },
];

export default function Login({ onLoggedIn }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user } = await api.login(email, password);
      setToken(token);
      setStoredUser(user);
      onLoggedIn(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--light-bg)] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--secondary)]">
            Kopargaon Municipal Council
          </p>
          <h1 className="font-display mt-1 text-2xl font-semibold text-[var(--text-dark)]">
            Infrastructure Accountability Platform
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-[var(--border)] bg-white p-6">
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@kopargaon.demo"
            className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm focus:outline-none"
          />
          <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm focus:outline-none"
          />
          {error && <p className="mt-3 text-sm font-medium text-[var(--red)]">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded-lg bg-[var(--dark-bg)] py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="mt-5 rounded-xl bg-[var(--card-bg)] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Demo accounts</p>
          <p className="mt-1 text-xs text-[var(--muted)]">Password for all: demo1234</p>
          <div className="mt-2 space-y-1">
            {DEMO_ACCOUNTS.map((a) => (
              <button
                key={a.email}
                onClick={() => {
                  setEmail(a.email);
                  setPassword('demo1234');
                }}
                className="block w-full rounded-md px-2 py-1 text-left text-xs text-[var(--text-dark)] hover:bg-white"
              >
                <span className="font-semibold">{a.role}</span> — {a.email}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
