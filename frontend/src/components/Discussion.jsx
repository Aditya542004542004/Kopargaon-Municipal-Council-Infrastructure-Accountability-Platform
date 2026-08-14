import { useEffect, useState } from 'react';
import { api } from '../api/client';

const CATEGORIES = ['general', 'technical', 'budget', 'suggestion'];
const CATEGORY_LABEL = { general: 'General', technical: 'Technical', budget: 'Budget', suggestion: 'Suggestion' };
const CATEGORY_COLOR = {
  general: 'var(--muted)',
  technical: 'var(--primary)',
  budget: 'var(--amber, #B8791A)',
  suggestion: 'var(--secondary)',
};

function formatDateTime(iso) {
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function SummaryPanel({ projectId }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getDiscussionSummary(projectId).then((s) => { setSummary(s); setLoading(false); }).catch(() => setLoading(false));
  }, [projectId]);

  if (loading) return null;
  if (!summary || !summary.mostDiscussedConcern) return null;

  return (
    <div className="rounded-2xl bg-[var(--dark-bg)] p-5 text-white">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">AI Discussion Analysis</p>
        <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/60">
          {summary.source === 'claude' ? 'Claude' : 'Rule-based'}
        </span>
      </div>
      <p className="mt-2 text-sm font-semibold">{summary.mostDiscussedConcern}</p>
      {summary.affectedCount > 0 && (
        <p className="mt-1 text-xs text-white/60">{summary.affectedCount} flag{summary.affectedCount > 1 ? 's' : ''} raised</p>
      )}
      <p className="mt-3 text-sm text-[var(--accent)]">→ {summary.suggestedAction}</p>
    </div>
  );
}

export default function Discussion({ projectId }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const [posting, setPosting] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setLoading(true);
    api.listDiscussion(projectId).then((d) => { setPosts(d); setLoading(false); }).catch(() => setLoading(false));
  }, [projectId, refreshKey]);

  async function handlePost() {
    if (!content.trim()) return;
    setPosting(true);
    try {
      await api.postDiscussion(projectId, { content: content.trim(), category });
      setContent('');
      setRefreshKey((k) => k + 1);
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="space-y-4">
      <SummaryPanel projectId={projectId} key={refreshKey} />

      <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className="rounded-full px-3 py-1 text-xs font-semibold"
              style={{
                backgroundColor: category === c ? CATEGORY_COLOR[c] : 'var(--card-bg)',
                color: category === c ? 'white' : 'var(--muted)',
              }}
            >
              {CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
          placeholder="Ask a question, raise a concern, or share an update…"
          className="mt-3 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm focus:outline-none"
        />
        <button
          disabled={posting || !content.trim()}
          onClick={handlePost}
          className="mt-2 rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40"
        >
          {posting ? 'Posting…' : 'Post'}
        </button>
      </div>

      <div className="space-y-3">
        {loading && <p className="text-sm text-[var(--muted)]">Loading…</p>}
        {!loading && posts.length === 0 && <p className="text-sm text-[var(--muted)]">No discussion yet — be the first to post.</p>}
        {posts.map((p) => (
          <div key={p.id} className="rounded-xl border border-[var(--border)] bg-white p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white"
                style={{ backgroundColor: CATEGORY_COLOR[p.category] }}
              >
                {CATEGORY_LABEL[p.category]}
              </span>
              <span className="text-sm font-semibold text-[var(--text-dark)]">{p.author_name}</span>
              <span className="text-xs capitalize text-[var(--muted)]">({p.author_role})</span>
              <span className="text-xs text-[var(--muted)]">{formatDateTime(p.created_at)}</span>
            </div>
            <p className="mt-1.5 text-sm text-[var(--text-dark)]/85">{p.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
