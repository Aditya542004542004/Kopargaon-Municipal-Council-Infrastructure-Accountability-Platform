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
  const [showAllFlags, setShowAllFlags] = useState(false); // 👈 COLLAPSIBLE FLAGS TOGGLE
  const [submitting, setSubmitting] = useState(false);
  const [lightboxImg, setLightboxImg] = useState(null);

  const flagsList = milestone.flags || [];
  const canReview = role === 'engineer' && milestone.status === 'submitted';
  const canFlag = role === 'citizen' && milestone.status === 'verified';
  const canResolveFlags = (role === 'engineer' || role === 'authority') && Boolean(onResolveFlag);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3.5 flex flex-col justify-between">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div>
            <h3 className="font-display text-base font-bold text-slate-900 leading-tight">{milestone.title}</h3>
            <p className="mt-0.5 text-[11px] font-medium text-slate-400">Submitted {formatDate(milestone.submittedAt)}</p>
          </div>
          <StatusChain 
            status={milestone.status} 
            flagCount={flagsList.filter((f) => !f.status || f.status === 'pending').length} 
          />
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between items-center text-[11px] font-semibold text-slate-600 mb-1">
            <span>Milestone Physical Progress</span>
            <span className="font-bold text-slate-900">{milestone.progressPercent || 0}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-teal-600 transition-all duration-500"
              style={{ width: `${milestone.progressPercent || 0}%` }}
            />
          </div>
        </div>

        {milestone.note && (
          <p className="text-xs text-slate-700 leading-relaxed font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            {milestone.note}
          </p>
        )}

        {/* 🖼️ CLICKABLE EVIDENCE PHOTO (Fullscreen Lightbox) */}
        {milestone.photoUrl && (
          <div
            onClick={() => setLightboxImg(api.fileUrl(milestone.photoUrl))}
            className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-slate-900/5 max-h-48"
          >
            <img
              src={api.fileUrl(milestone.photoUrl)}
              alt="Milestone evidence"
              className="h-44 w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
              <span>🔍 Click for Fullscreen</span>
            </div>
          </div>
        )}

        {/* Anti-Fraud Badges */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          {milestone.geoStatus === 'VERIFIED' && (
            <span className="px-2 py-0.5 rounded font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              🟢 Location Verified ({milestone.geoDistanceKm || 0} km)
            </span>
          )}
          {milestone.geoStatus === 'LOCATION_MISMATCH' && (
            <span className="px-2 py-0.5 rounded font-bold bg-red-100 text-red-800 border border-red-300">
              🚨 Location Mismatch ({milestone.geoDistanceKm} km)
            </span>
          )}
          {(!milestone.geoStatus || milestone.geoStatus === 'NO_METADATA') && (
            <span className="px-2 py-0.5 rounded font-medium bg-amber-50 text-amber-700 border border-amber-200">
              ⚠️ No GPS Metadata
            </span>
          )}

          {milestone.contentStatus === 'CONSTRUCTION_DETECTED' || !milestone.contentStatus ? (
            <span className="px-2 py-0.5 rounded font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
              🤖 AI Verified ({milestone.detectedLabels || 'structure'})
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded font-bold bg-red-100 text-red-800 border border-red-300 animate-pulse">
              🚨 AI Alert: Non-Construction Image
            </span>
          )}
        </div>

        {/* Engineer Note */}
        {milestone.engineerComment && (
          <div className="rounded-xl bg-slate-50 p-2.5 text-xs text-slate-800 border border-slate-100">
            <span className="font-bold text-slate-900">Engineer note: </span>
            {milestone.engineerComment}
          </div>
        )}

        {/* 🚩 SPACE-EFFICIENT FLAGS LIST (Collapsible / Scrollable) */}
        {flagsList.length > 0 && (
          <div className="space-y-2 border-t border-slate-100 pt-2.5">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Ground Reality Flags ({flagsList.length})
              </h4>
              {flagsList.length > 2 && (
                <button
                  type="button"
                  onClick={() => setShowAllFlags(!showAllFlags)}
                  className="text-[10px] font-bold text-teal-700 hover:underline"
                >
                  {showAllFlags ? 'Collapse ▲' : `View All (${flagsList.length}) ▼`}
                </button>
              )}
            </div>

            <div className={`space-y-2.5 ${flagsList.length > 2 && !showAllFlags ? 'max-h-56 overflow-y-auto pr-1' : ''}`}>
              {flagsList.map((f) => {
                const isResolved = f.status === 'resolved' || f.status === 'dismissed';

                return (
                  <div
                    key={f.id}
                    className={`rounded-xl border p-2.5 text-xs space-y-1.5 ${
                      isResolved
                        ? 'border-emerald-200 bg-emerald-50/50'
                        : 'border-red-200 bg-red-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                          isResolved ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                        }`}
                      >
                        {isResolved ? '✓ Resolved' : '🚩 Pending Flag'}
                      </span>
                      <span className="text-[10px] text-slate-400">{formatDate(f.flaggedAt)}</span>
                    </div>

                    <p className="text-slate-800 font-medium">{f.text}</p>

                    {f.photoUrl && (
                      <img
                        src={api.fileUrl(f.photoUrl)}
                        onClick={() => setLightboxImg(api.fileUrl(f.photoUrl))}
                        alt="Flag evidence"
                        className="h-24 w-full object-cover rounded-lg cursor-pointer hover:opacity-90"
                      />
                    )}

                    {!isResolved && canResolveFlags && (
                      <div className="flex items-center justify-between border-t border-red-200/60 pt-1.5 mt-1">
                        <span className="text-[10px] font-semibold text-red-700">Requires Fix</span>
                        <button
                          disabled={submitting}
                          onClick={async () => {
                            const comment = prompt('Enter resolution note:');
                            if (comment !== null) {
                              setSubmitting(true);
                              await onResolveFlag(f.id, 'resolve', comment);
                              setSubmitting(false);
                            }
                          }}
                          className="rounded-lg bg-teal-700 px-2.5 py-1 text-[10px] font-bold text-white"
                        >
                          ✓ Mark Resolved
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Engineer Review Section */}
      {canReview && (
        <div className="border-t border-slate-100 pt-3 space-y-2">
          <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Engineer Review
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="e.g. Quality matches spec."
            rows={2}
            className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs focus:outline-none bg-slate-50/50"
          />
          <div className="flex gap-2">
            <button
              disabled={submitting}
              onClick={async () => {
                setSubmitting(true);
                await onVerify(milestone.id, comment);
                setSubmitting(false);
              }}
              className="flex-1 rounded-lg bg-teal-700 py-1.5 text-xs font-bold text-white"
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
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700"
            >
              Reject
            </button>
          </div>
        </div>
      )}

      {/* Citizen Flag Form */}
      {canFlag && (
        <div className="border-t border-slate-100 pt-3">
          {!showFlagForm ? (
            <button
              onClick={() => setShowFlagForm(true)}
              className="w-full rounded-lg border border-red-200 bg-red-50 py-1.5 text-xs font-bold text-red-700"
            >
              Flag a discrepancy
            </button>
          ) : (
            <div className="space-y-2 bg-red-50/50 p-2.5 rounded-xl border border-red-200 text-xs">
              <textarea
                value={flagText}
                onChange={(e) => setFlagText(e.target.value)}
                placeholder="What doesn't match on the ground?"
                rows={2}
                className="w-full rounded-lg border border-red-200 px-2.5 py-1.5 text-xs focus:outline-none bg-white"
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFlagPhoto(e.target.files[0] || null)}
                className="text-[10px] text-slate-500"
              />
              <div className="flex gap-2">
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
                  className="flex-1 rounded-lg bg-red-600 py-1.5 text-xs font-bold text-white"
                >
                  Submit flag
                </button>
                <button
                  onClick={() => setShowFlagForm(false)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* FULLSCREEN LIGHTBOX MODAL */}
      {lightboxImg && (
        <div
          onClick={() => setLightboxImg(null)}
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
        >
          <div className="relative max-w-5xl max-h-[90vh]">
            <img
              src={lightboxImg}
              alt="Fullscreen evidence"
              className="max-h-[85vh] max-w-full rounded-2xl shadow-2xl object-contain mx-auto"
            />
            <button
              onClick={() => setLightboxImg(null)}
              className="absolute -top-10 right-0 text-white font-bold text-xs bg-white/20 hover:bg-white/40 px-3 py-1 rounded-full transition"
            >
              ✕ Close Fullscreen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}