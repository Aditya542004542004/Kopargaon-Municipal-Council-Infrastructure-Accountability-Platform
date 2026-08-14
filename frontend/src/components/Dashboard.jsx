import React, { useState } from 'react';
import { formatRupees } from '../utils/trustIndex';
import ProjectMap from '../components/ProjectMap';

function scoreColor(score) {
  if (score >= 80) return 'var(--secondary)';
  if (score >= 60) return 'var(--amber, #B8791A)';
  return 'var(--red)';
}

export default function Dashboard({ projects = [], onSelect, onSelectProject }) {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'map'

  // Handle either prop name passed to Dashboard
  const handleSelect = onSelect || onSelectProject;

  return (
    <div>
      {/* Header Bar with Title and Map/Grid Toggle */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-semibold text-[var(--text-dark)]">
            All Kopargaon Projects
          </h2>
          <span className="text-sm text-[var(--muted)]">
            {projects.length} project{projects.length !== 1 ? 's' : ''} total
          </span>
        </div>

        {/* View Switcher Toggle */}
        <div className="flex bg-[var(--card-bg, #f3f4f6)] p-1 rounded-xl border border-[var(--border,#e5e7eb)] shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              viewMode === 'grid'
                ? 'bg-white text-[var(--text-dark)] shadow-sm'
                : 'text-[var(--muted)] hover:text-[var(--text-dark)]'
            }`}
          >
            📋 Grid View
          </button>
          <button
            type="button"
            onClick={() => setViewMode('map')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              viewMode === 'map'
                ? 'bg-[var(--secondary,#4f46e5)] text-white shadow-sm'
                : 'text-[var(--muted)] hover:text-[var(--text-dark)]'
            }`}
          >
            🗺️ GIS Map View
          </button>
        </div>
      </div>

      {/* Main View Area */}
      {viewMode === 'map' ? (
        <ProjectMap projects={projects} onSelectProject={handleSelect} />
      ) : (
        /* Original Grid Cards View */
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => handleSelect && handleSelect(p.id)}
              className="rounded-2xl border border-[var(--border)] bg-white p-5 text-left hover:border-[var(--secondary)] hover:shadow-sm transition"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--secondary)]">
                    {p.ward}
                  </p>
                  <h3 className="font-display mt-0.5 text-lg font-semibold text-[var(--text-dark)]">
                    {p.name || p.title}
                  </h3>
                </div>
                <div className="shrink-0 text-right">
                  <div
                    className="text-2xl font-bold"
                    style={{ color: scoreColor(p.trustScore) }}
                  >
                    {p.trustScore}
                  </div>
                  <div className="text-[10px] uppercase tracking-wide text-[var(--muted)]">
                    Trust Index
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                <div>
                  <div className="flex justify-between text-xs text-[var(--muted)]">
                    <span>Budget spent</span>
                    <span>{p.budgetSpentPercent}%</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-[var(--card-bg)]">
                    <div
                      className="h-1.5 rounded-full bg-[var(--primary)]"
                      style={{ width: `${p.budgetSpentPercent}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs text-[var(--muted)]">
                    <span>Verified progress</span>
                    <span>{p.physicalProgressPercent}%</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full rounded-full bg-[var(--card-bg)]">
                    <div
                      className="h-1.5 rounded-full bg-[var(--secondary)]"
                      style={{ width: `${p.physicalProgressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs text-[var(--muted)]">
                <span>{p.contractor_name}</span>
                <span>
                  {formatRupees(p.budget_total)} · {p.milestoneCount} milestone
                  {p.milestoneCount !== 1 ? 's' : ''}
                </span>
              </div>
            </button>
          ))}

          {projects.length === 0 && (
            <p className="text-sm text-[var(--muted)] col-span-full">No projects yet.</p>
          )}
        </div>
      )}
    </div>
  );
}