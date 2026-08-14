import { useEffect, useState } from 'react';
import { api } from '../api/client';

function formatDateTime(iso) {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

const EVENT_STYLES = {
  project_created: { label: 'Project created', dot: 'bg-[var(--primary)]' },
  milestone_submitted: { label: 'Milestone claimed', dot: 'bg-[var(--muted)]' },
  milestone_verified: { label: 'Engineer verified', dot: 'bg-[var(--secondary)]' },
  milestone_rejected: { label: 'Engineer rejected', dot: 'bg-[var(--red)]' },
  flag_raised: { label: 'Ground reality flag', dot: 'bg-[var(--red)]' },
};

function describeEvent(e) {
  const d = typeof e.detail === 'string' ? JSON.parse(e.detail) : e.detail;
  switch (e.event_type) {
    case 'project_created':
      return `"${d.name}" passport created — budget ₹${Number(d.budgetTotal).toLocaleString('en-IN')}`;
    case 'milestone_submitted':
      return `"${d.title}" submitted at ${d.progressPercent}% progress`;
    case 'milestone_verified':
      return `Milestone verified${d.comment ? ' — "' + d.comment + '"' : ''}`;
    case 'milestone_rejected':
      return `Milestone rejected${d.comment ? ' — "' + d.comment + '"' : ''}`;
    case 'flag_raised':
      return `Flagged — "${d.text}"`;
    default:
      return '';
  }
}

export default function AuditTrail({ projectId, refreshKey }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getAuditTrail(projectId).then((data) => {
      setEvents(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [projectId, refreshKey]);

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-6">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-lg font-semibold text-[var(--text-dark)]">Audit Trail</h2>
        <span className="text-xs text-[var(--muted)]">{events.length} recorded events</span>
      </div>
      <p className="mt-1 text-xs text-[var(--muted)]">
        Fetched live from the database — append-only at the DB privilege level, not just in application code.
      </p>
      <div className="mt-4 space-y-0">
        {loading && <p className="text-sm text-[var(--muted)]">Loading…</p>}
        {!loading && events.length === 0 && <p className="text-sm text-[var(--muted)]">No events recorded yet.</p>}
        {events.map((e, i) => {
          const style = EVENT_STYLES[e.event_type] || { label: e.event_type, dot: 'bg-[var(--muted)]' };
          return (
            <div key={e.id} className="flex gap-3 pb-4 last:pb-0">
              <div className="flex flex-col items-center">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${style.dot}`} />
                {i < events.length - 1 && <span className="w-px flex-1 bg-[var(--border)]" />}
              </div>
              <div className="pb-1">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-sm font-semibold text-[var(--text-dark)]">{style.label}</span>
                  <span className="text-xs text-[var(--muted)]">{formatDateTime(e.created_at)}</span>
                  <span className="text-xs text-[var(--muted)]">by {e.actor_name}</span>
                </div>
                <p className="mt-0.5 text-sm text-[var(--text-dark)]/75">{describeEvent(e)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
