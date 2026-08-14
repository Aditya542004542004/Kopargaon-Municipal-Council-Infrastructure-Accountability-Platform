import { useState } from 'react';
import { api } from '../api/client';

export default function NewMilestoneForm({ projectId, onSubmit, onCreated, onClose }) {
  const [title, setTitle] = useState('');
  const [progressPercent, setProgressPercent] = useState(50);
  const [budgetSpent, setBudgetSpent] = useState('');
  const [note, setNote] = useState('');
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const payload = {
        title: title.trim(),
        progressPercent: Number(progressPercent),
        budgetSpent: Number(budgetSpent) || 0,
        note: note.trim(),
        photoFile: file,
      };

      if (onSubmit) {
        // Called when rendered from App.jsx (<NewMilestoneForm onSubmit={handleSubmitMilestone} />)
        await onSubmit(payload);
      } else {
        // Direct fallback if used as a standalone component
        const targetId = projectId;
        if (!targetId) throw new Error('Project ID is missing.');
        const res = await api.submitMilestone(targetId, payload);
        if (onCreated) onCreated(res?.id || targetId);
      }

      // Reset form fields after successful submit
      setTitle('');
      setBudgetSpent('');
      setNote('');
      setFile(null);
      if (onClose) onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit milestone update.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-[var(--border)] bg-white p-6 space-y-4">
      <h3 className="font-display text-lg font-semibold">New milestone update</h3>

      {/* Title */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Milestone Title</label>
        <input 
          value={title} 
          onChange={(e) => setTitle(e.target.value)} 
          placeholder="e.g. Pump house roofing"
          required
          className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm focus:outline-none" 
        />
      </div>

      {/* Progress & Budget Spent in 2 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Progress Slider */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Progress — {progressPercent}%
          </label>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={progressPercent} 
            onChange={(e) => setProgressPercent(Number(e.target.value))}
            className="mt-2 w-full accent-[var(--primary,#008080)]" 
          />
        </div>

        {/* Budget Spent Field */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
            Budget Spent in this update (₹)
          </label>
          <input 
            type="number" 
            min="0" 
            value={budgetSpent} 
            onChange={(e) => setBudgetSpent(e.target.value)} 
            placeholder="e.g. 250000"
            required
            className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm focus:outline-none" 
          />
        </div>
      </div>

      {/* Evidence Photo */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Evidence Photo</label>
        <input 
          type="file" 
          accept="image/*" 
          onChange={(e) => setFile(e.target.files[0])}
          className="mt-1 block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[var(--card-bg)] hover:file:bg-gray-200" 
        />
      </div>

      {/* Note */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Note</label>
        <textarea 
          value={note} 
          onChange={(e) => setNote(e.target.value)} 
          placeholder="What was completed in this update?" 
          rows={3}
          className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm focus:outline-none" 
        />
      </div>

      {error && <p className="text-sm font-medium text-[var(--red)]">{error}</p>}

      <div className="flex items-center gap-3">
        <button 
          type="submit" 
          disabled={submitting || !title} 
          className="rounded-lg bg-[var(--primary,#008080)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40"
        >
          {submitting ? 'Submitting…' : 'Submit for verification'}
        </button>
        {onClose && (
          <button 
            type="button" 
            onClick={onClose} 
            className="rounded-lg px-4 py-2 text-sm font-semibold text-[var(--muted)] hover:bg-[var(--card-bg)]"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}