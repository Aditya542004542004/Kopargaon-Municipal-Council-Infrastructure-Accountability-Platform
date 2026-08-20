import { useState } from 'react';
import { api, setToken, setStoredUser } from '../api/client';

const DEMO_ACCOUNTS = [
  { role: 'Authority', email: 'authority@kopargaon.demo' },
  { role: 'Contractor', email: 'contractor@kopargaon.demo' },
  { role: 'Engineer', email: 'engineer@kopargaon.demo' },
  { role: 'Citizen', email: 'citizen@kopargaon.demo' },
];

export default function Login({ onLoggedIn }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [ward, setWard] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegistering) {
        // Public Citizen Self-Registration
        const data = await api.register({
          name: name.trim(),
          email: email.trim(),
          password,
          role: 'citizen',
          ward: ward.trim() || null
        });
        setToken(data.token);
        setStoredUser(data.user);
        onLoggedIn(data.user);
      } else {
        // Sign In for All Roles
        const { token, user } = await api.login(email.trim(), password);
        setToken(token);
        setStoredUser(user);
        onLoggedIn(user);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
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

        {/* Mode Switcher Tabs */}
        <div className="mb-4 flex rounded-xl border border-[var(--border)] bg-[var(--card-bg)] p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setIsRegistering(false); setError(''); }}
            className={`flex-1 rounded-lg py-2 transition ${
              !isRegistering 
                ? 'bg-white text-[var(--text-dark)] shadow-sm' 
                : 'text-[var(--muted)] hover:text-[var(--text-dark)]'
            }`}
          >
            🔑 Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsRegistering(true); setError(''); }}
            className={`flex-1 rounded-lg py-2 transition ${
              isRegistering 
                ? 'bg-[var(--primary,#008080)] text-white shadow-sm' 
                : 'text-[var(--muted)] hover:text-[var(--text-dark)]'
            }`}
          >
            👤 Citizen Self-Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-[var(--border)] bg-white p-6">
          {isRegistering && (
            <div className="mb-3">
              <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Kale"
                required
                className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm focus:outline-none"
              />
            </div>
          )}

          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@kopargaon.demo"
            required
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
            required
            className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm focus:outline-none"
          />

          {isRegistering && (
            <div className="mt-3">
              <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Ward (Optional)</label>
              <input
                type="text"
                value={ward}
                onChange={(e) => setWard(e.target.value)}
                placeholder="e.g. Ward 3"
                className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm focus:outline-none"
              />
            </div>
          )}

          {error && <p className="mt-3 text-sm font-medium text-[var(--red)]">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded-lg bg-[var(--dark-bg)] py-2.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
          >
            {loading ? 'Processing…' : isRegistering ? 'Create Citizen Account' : 'Sign in'}
          </button>
        </form>

        {/* Demo Accounts Quick-Fill Box */}
        {!isRegistering && (
          <div className="mt-5 rounded-xl bg-[var(--card-bg)] p-4 border border-[var(--border)]">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Demo accounts</p>
            <p className="mt-1 text-xs text-[var(--muted)]">Password for all: demo1234</p>
            <div className="mt-2 space-y-1">
              {DEMO_ACCOUNTS.map((a) => (
                <button
                  key={a.email}
                  type="button"
                  onClick={() => {
                    setEmail(a.email);
                    setPassword('demo1234');
                  }}
                  className="block w-full rounded-md px-2 py-1 text-left text-xs text-[var(--text-dark)] hover:bg-white transition"
                >
                  <span className="font-semibold">{a.role}</span> — {a.email}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}