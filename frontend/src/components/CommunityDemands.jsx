import { useEffect, useState } from 'react';
import { api } from '../api/client';

const CATEGORIES = ['Road Infrastructure', 'Water Supply', 'Drainage', 'Public Safety', 'Public Buildings', 'Other'];

function NewDemandForm({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [ward, setWard] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl border-2 border-dashed border-[var(--border)] py-4 text-sm font-semibold text-[var(--primary)] hover:bg-[var(--card-bg)]"
      >
        + Raise a local infrastructure issue
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
      <h3 className="font-display text-lg font-semibold">Raise a community need</h3>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Issue title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Damaged road near the market"
            className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm focus:outline-none" />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Ward</label>
          <input value={ward} onChange={(e) => setWard(e.target.value)} placeholder="e.g. Ward 5"
            className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm focus:outline-none" />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm focus:outline-none">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
            placeholder="What's the problem, and how does it affect residents?"
            className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm focus:outline-none" />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Photo (optional)</label>
          <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files[0] || null)}
            className="mt-1 w-full text-sm text-[var(--muted)]" />
        </div>
      </div>
      {error && <p className="mt-3 text-sm font-medium text-[var(--red)]">{error}</p>}
      <div className="mt-4 flex gap-2">
        <button
          disabled={!title.trim() || !ward.trim() || submitting}
          onClick={async () => {
            setSubmitting(true);
            setError('');
            try {
              await api.createDemand({ title: title.trim(), ward: ward.trim(), category, description: description.trim(), photoFile });
              setTitle(''); setWard(''); setDescription(''); setPhotoFile(null); setOpen(false);
              onCreated();
            } catch (err) {
              setError(err.message);
            } finally {
              setSubmitting(false);
            }
          }}
          className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40"
        >
          {submitting ? 'Posting…' : 'Post issue'}
        </button>
        <button onClick={() => setOpen(false)} className="rounded-lg px-4 py-2 text-sm font-semibold text-[var(--muted)] hover:bg-[var(--card-bg)]">
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function CommunityDemands({ role }) {
  const [demands, setDemands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(null);
  const [voteError, setVoteError] = useState('');

  function load() {
    setLoading(true);
    api.listDemands().then((d) => { setDemands(d); setLoading(false); }).catch(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function handleVote(id) {
    setVoting(id);
    setVoteError('');
    try {
      await api.voteDemand(id);
      load();
    } catch (err) {
      setVoteError(err.message);
    } finally {
      setVoting(null);
    }
  }

  return (
    <div>
      <div className="mb-2">
        <h2 className="font-display text-xl font-semibold text-[var(--text-dark)]">Community Need Identification</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Problems become projects here — ranked by citizen support, visible before any budget is allocated.
        </p>
      </div>

      <div className="my-5 space-y-3">
        {role === 'citizen' && <NewDemandForm onCreated={load} />}
        {voteError && <p className="text-sm font-medium text-[var(--red)]">{voteError}</p>}
      </div>

      <div className="space-y-3">
        {loading && <p className="text-sm text-[var(--muted)]">Loading…</p>}
        {!loading && demands.length === 0 && <p className="text-sm text-[var(--muted)]">No demands raised yet.</p>}
        {demands.map((d) => (
          <div key={d.id} className="rounded-2xl border border-[var(--border)] bg-white p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-base font-semibold text-[var(--text-dark)]">{d.title}</h3>
                  {d.status === 'linked' && (
                    <span className="rounded-full bg-[var(--secondary)]/15 px-2.5 py-0.5 text-xs font-semibold text-[var(--secondary)]">
                      Linked to a project
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-[var(--muted)]">{d.ward} · {d.category} · raised by {d.created_by_name}</p>
                {d.description && <p className="mt-2 text-sm text-[var(--text-dark)]/80">{d.description}</p>}
              </div>
              <div className="shrink-0 text-center">
                <div className="text-xl font-bold text-[var(--primary)]">{d.support_count}</div>
                <div className="text-[10px] uppercase tracking-wide text-[var(--muted)]">supporters</div>
              </div>
            </div>
            {role === 'citizen' && d.status === 'open' && (
              <button
                disabled={voting === d.id}
                onClick={() => handleVote(d.id)}
                className="mt-3 rounded-lg border border-[var(--primary)]/40 px-3 py-1.5 text-xs font-semibold text-[var(--primary)] hover:bg-[var(--primary)]/5 disabled:opacity-50"
              >
                {voting === d.id ? 'Voting…' : '+ Support this'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
