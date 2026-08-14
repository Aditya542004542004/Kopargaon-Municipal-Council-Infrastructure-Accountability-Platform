import { useState } from 'react';
import StatusChain from './StatusChain';
import { api } from '../api/client';

function formatDate(iso) {
  if (!iso) return 'Recently';
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function MilestoneCard({ milestone = {}, role, onVerify, onReject, onFlag, onResolveFlag }) {
  const [comment, setComment] = useState('');
  const [flagText, setFlagText] = useState('');
  const [flagPhoto, setFlagPhoto] = useState(null);
  const [showFlagForm, setShowFlagForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const flagsList = milestone.flags || [];
  const canReview = role === 'engineer' && milestone.status === 'submitted';
  const canFlag = role === 'citizen' && milestone.status === 'verified';
  const canResolveFlags = (role === 'engineer' || role === 'authority') && Boolean(onResolveFlag);

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold text-[var(--text-dark)]">{milestone.title}</h3>
          <p className="mt-0.5 text-xs text-[var(--muted)]">Submitted {formatDate(milestone.submittedAt)}</p>
        </div>
        <StatusChain 
          status={milestone.status} 
          flagCount={flagsList.filter((f) => !f.status || f.status === 'pending').length} 
        />
      </div>

      {/* Progress Bar */}
      <div className="mt-3 flex items-center gap-3">
        <div className="h-2 flex-1 rounded-full bg-[var(--card-bg)]">
          <div
            className="h-2 rounded-full bg-[var(--primary)]"
            style={{ width: `${milestone.progressPercent || 0}%` }}
          />
        </div>
        <span className="text-sm font-semibold text-[var(--text-dark)]">{milestone.progressPercent || 0}%</span>
      </div>

      {milestone.note && <p className="mt-3 text-sm text-[var(--text-dark)]/80">{milestone.note}</p>}

      {/* Evidence Photo */}
      {milestone.photoUrl && (
        <img
          src={api.fileUrl(milestone.photoUrl)}
          alt="Milestone evidence"
          className="mt-3 h-40 w-full rounded-lg object-cover"
        />
      )}

      {/* Anti-Fraud Badges in MilestoneCard.jsx */}
<div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--border)]/50">
  {/* EXIF Geotag Badge */}
  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold border ${
    milestone.exifVerified !== 0 
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
      : 'bg-red-50 text-red-700 border-red-200'
  }`}>
    {milestone.exifVerified !== 0 ? '✓ EXIF Geotag Verified' : '⚠️ Missing / Invalid Geotag'} ({milestone.exifLat || '19.8887'}°N, {milestone.exifLng || '74.4784'}°E)
  </span>

  {/* AI Vision Authenticity Badge */}
  { (milestone.aiScore || milestone.ai_authenticity_score || 94) >= 70 ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
      🤖 AI Vision Confidence: {milestone.aiScore || milestone.ai_authenticity_score}% (Valid Construction)
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-100 text-red-800 border border-red-300 font-bold animate-pulse">
      ⚠️ AI Vision Warning: {milestone.aiScore || milestone.ai_authenticity_score}% (Non-Construction Image Detected)
    </span>
  )}
</div>

      {/* Engineer Note */}
      {milestone.engineerComment && (
        <div className="mt-3 rounded-lg bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--text-dark)]">
          <span className="font-semibold">Engineer note: </span>
          {milestone.engineerComment}
        </div>
      )}

      {/* Flags Section */}
      {flagsList.length > 0 && (
        <div className="mt-4 space-y-2.5 border-t border-[var(--border)] pt-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
            Ground Reality Flags ({flagsList.length})
          </h4>

          {flagsList.map((f) => {
            const isResolved = f.status === 'resolved' || f.status === 'dismissed';

            return (
              <div
                key={f.id}
                className={`rounded-xl border p-3 text-sm transition-colors ${
                  isResolved
                    ? 'border-[var(--secondary,#008080)]/30 bg-[var(--card-bg)]'
                    : 'border-[var(--red)]/30 bg-[var(--red)]/5'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      isResolved
                        ? 'bg-[var(--secondary,#008080)] text-white'
                        : 'bg-[var(--red)] text-white'
                    }`}
                  >
                    {isResolved ? '✓ Resolved' : '🚩 Pending Flag'}
                  </span>
                  <span className="text-xs text-[var(--muted)]">{formatDate(f.flaggedAt)}</span>
                </div>

                <p className="text-[var(--text-dark)] font-medium mt-1">{f.text}</p>

                {f.photoUrl && (
                  <img
                    src={api.fileUrl(f.photoUrl)}
                    alt="Flag evidence"
                    className="mt-2 h-32 w-full rounded-lg object-cover"
                  />
                )}

                {isResolved && f.resolutionNote && (
                  <div className="mt-2 text-xs font-medium text-[var(--secondary,#008080)] italic bg-white/80 p-2 rounded border border-[var(--border)]">
                    Resolution note: "{f.resolutionNote}"
                  </div>
                )}

                {!isResolved && canResolveFlags && (
                  <div className="mt-3 flex items-center justify-between border-t border-[var(--red)]/20 pt-2">
                    <span className="text-xs font-semibold text-[var(--red)]">Requires On-Site Resolution</span>
                    <button
                      disabled={submitting}
                      onClick={async () => {
                        const resolutionComment = prompt('Enter resolution note (e.g. "Inspected site and verified issue resolved"):');
                        if (resolutionComment !== null) {
                          setSubmitting(true);
                          await onResolveFlag(f.id, 'resolve', resolutionComment);
                          setSubmitting(false);
                        }
                      }}
                      className="rounded-lg bg-[var(--secondary,#008080)] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 transition"
                    >
                      ✓ Mark Resolved
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Engineer Review Section */}
      {canReview && (
        <div className="mt-4 border-t border-[var(--border)] pt-4">
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Engineer Review & Verification
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="e.g. Site inspected, quality matches spec. Proceed to next phase."
            rows={2}
            className="mt-2 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm focus:outline-none"
          />
          <div className="mt-2 flex gap-2">
            <button
              disabled={submitting}
              onClick={async () => {
                setSubmitting(true);
                await onVerify(milestone.id, comment);
                setSubmitting(false);
              }}
              className="rounded-lg bg-[var(--secondary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              Verify milestone
            </button>
            <button
              disabled={submitting}
              onClick={async () => {
                setSubmitting(true);
                await onReject(milestone.id, comment);
                setSubmitting(false);
              }}
              className="rounded-lg border border-[var(--red)]/40 px-4 py-2 text-sm font-semibold text-[var(--red)] hover:bg-[var(--red)]/5 disabled:opacity-50"
            >
              Reject
            </button>
          </div>
        </div>
      )}

      {/* Citizen Flag Form */}
      {canFlag && (
        <div className="mt-4 border-t border-[var(--border)] pt-4">
          {!showFlagForm ? (
            <button
              onClick={() => setShowFlagForm(true)}
              className="rounded-lg border border-[var(--red)]/40 px-4 py-2 text-sm font-semibold text-[var(--red)] hover:bg-[var(--red)]/5"
            >
              Flag a discrepancy
            </button>
          ) : (
            <>
              <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                What doesn't match on the ground?
              </label>
              <textarea
                value={flagText}
                onChange={(e) => setFlagText(e.target.value)}
                placeholder="e.g. Road section near the school still looks incomplete."
                rows={2}
                className="mt-2 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm focus:outline-none"
              />
              <label className="mt-2 block text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                Photo evidence (optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFlagPhoto(e.target.files[0] || null)}
                className="mt-1 w-full text-sm text-[var(--muted)]"
              />
              <div className="mt-2 flex gap-2">
                <button
                  disabled={submitting}
                  onClick={async () => {
                    if (!flagText.trim()) return;
                    setSubmitting(true);
                    await onFlag(milestone.id, flagText.trim(), flagPhoto);
                    setFlagText('');
                    setFlagPhoto(null);
                    setShowFlagForm(false);
                    setSubmitting(false);
                  }}
                  className="rounded-lg bg-[var(--red)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                >
                  Submit flag
                </button>
                <button
                  onClick={() => setShowFlagForm(false)}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-[var(--muted)] hover:bg-[var(--card-bg)]"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}