import React from 'react';
import { formatRupees } from '../utils/trustIndex';

function formatDate(dateStr) {
  if (!dateStr) return 'TBD';
  return new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

export default function PassportHeader({ project = {} }) {
  const budgetTotal = Number(project.budgetTotal ?? project.budget_total ?? 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3 h-full flex flex-col justify-between">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
            Passport
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
            {project.category || 'Road Works'}
          </span>
        </div>
        <span className="text-[10px] font-bold text-slate-400">
          Kopargaon Council
        </span>
      </div>

      <div>
        <h2 className="font-display text-xl font-extrabold text-slate-900 leading-tight">
          {project.name || project.title}
        </h2>
        <p className="text-[11px] text-slate-500 font-medium mt-0.5">
          🏢 {project.department || 'Municipal Works Dept'}
        </p>
      </div>

      {/* 2x2 Compact Metadata Grid */}
      <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs">
        <div>
          <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Ward</span>
          <span className="font-extrabold text-slate-800">{project.ward || 'Ward N/A'}</span>
        </div>
        <div>
          <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Total Budget</span>
          <span className="font-extrabold text-teal-800">{formatRupees(budgetTotal)}</span>
        </div>
        <div>
          <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Contractor</span>
          <span className="font-bold text-slate-800 truncate block max-w-[110px]" title={project.contractor}>
            {project.contractor || 'Assigned Firm'}
          </span>
        </div>
        <div>
          <span className="block text-[9px] font-bold uppercase tracking-wider text-slate-400">Timeline</span>
          <span className="font-bold text-slate-800 text-[11px]">
            {formatDate(project.startDate)} – {formatDate(project.endDate)}
          </span>
        </div>
      </div>
    </div>
  );
}