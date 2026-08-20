import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';

function formatDate(iso) {
  if (!iso) return 'Recently';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Discussion({ projectId }) {
  const [posts, setPosts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('general');
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const postsData = await api.listDiscussion(projectId);
      setPosts(postsData || []);
    } catch (err) {
      console.error(err);
    }
  }, [projectId]);

  const loadSummary = useCallback(async () => {
    setLoadingSummary(true);
    try {
      const summaryData = await api.getDiscussionSummary(projectId);
      setSummary(summaryData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSummary(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadData();
    loadSummary();
  }, [loadData, loadSummary]);

  async function handlePost(e) {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      await api.postDiscussion(projectId, { content: content.trim(), category });
      setContent('');
      await loadData();
      await loadSummary(); // Re-evaluates AI summary with the new post
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* AI Summary Banner */}
      <div className="rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-display text-base font-semibold text-[var(--text-dark)] flex items-center gap-2">
            <span>✨ Discussion Summary</span>
          </h3>
          {summary && !loadingSummary && (
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                summary.source === 'gemini'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-gray-100 text-gray-600 border border-gray-200'
              }`}
            >
              {summary.source === 'gemini' ? '✨ Gemini AI' : 'Rule-based'}
            </span>
          )}
        </div>

        {/* LOADING SKELETON (Prevents Flash of Rule-Based Summary!) */}
        {loadingSummary ? (
          <div className="space-y-2 py-3 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="flex items-center gap-2 pt-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="text-xs text-gray-400 font-medium">
                Analyzing citizen discussion with Gemini AI...
              </span>
            </div>
          </div>
        ) : summary?.mostDiscussedConcern ? (
          <div className="space-y-2 text-sm text-[var(--text-dark)]">
            <p>
              <span className="font-semibold text-gray-700">Primary Concern: </span>
              {summary.mostDiscussedConcern}
            </p>
            {summary.suggestedAction && (
              <p className="text-xs text-[var(--secondary,#008080)] font-medium bg-[var(--card-bg)] p-2.5 rounded-lg border border-[var(--border)]">
                💡 <span className="font-semibold">Suggested Action: </span>
                {summary.suggestedAction}
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs text-[var(--muted)]">
            No discussion posts yet. Start the conversation below!
          </p>
        )}
      </div>

      {/* New Post Form */}
      <form onSubmit={handlePost} className="rounded-2xl border border-[var(--border)] bg-white p-5 space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
          Join the Discussion
        </h4>
        <div className="flex gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs font-semibold focus:outline-none bg-gray-50"
          >
            <option value="general">General</option>
            <option value="quality">Quality Concern</option>
            <option value="delay">Schedule Delay</option>
            <option value="safety">Safety Hazard</option>
          </select>
          <input
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share feedback or ask a question about this project..."
            className="flex-1 rounded-lg border border-[var(--border)] px-3 py-2 text-sm focus:outline-none"
            required
          />
        </div>
        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="rounded-lg bg-[var(--primary,#008080)] px-4 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-40"
        >
          {submitting ? 'Posting...' : 'Post Message'}
        </button>
      </form>

      {/* Discussion Posts Feed */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
          Discussion Feed ({posts.length})
        </h4>
        {posts.length === 0 ? (
          <p className="text-xs text-[var(--muted)]">No discussion posts yet.</p>
        ) : (
          posts.map((p) => (
            <div key={p.id} className="rounded-xl border border-[var(--border)] bg-white p-4 text-sm space-y-1">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-[var(--text-dark)]">{p.author_name || p.user_name || 'Citizen'}</span>
                <span className="text-[var(--muted)]">{formatDate(p.created_at)}</span>
              </div>
              <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-gray-100 text-gray-600">
                {p.category}
              </span>
              <p className="text-gray-800 pt-1">{p.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}