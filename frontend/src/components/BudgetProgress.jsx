import React from 'react';
import { formatRupees } from '../utils/trustIndex';

export default function BudgetProgress({ project, spentPercent = 0, physicalPercent = 0, spentAmount }) {
  const budgetTotal = Number(project.budgetTotal ?? project.budget_total ?? 0);
  
  // Calculate spent amount from spentAmount prop, project.budgetSpent, or spentPercent
  const actualSpent = spentAmount !== undefined && spentAmount !== null && spentAmount > 0
    ? Number(spentAmount)
    : (project.budgetSpent || project.budget_spent) && Number(project.budgetSpent || project.budget_spent) > 0
    ? Number(project.budgetSpent || project.budget_spent)
    : Math.round((budgetTotal * spentPercent) / 100);

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-6 space-y-4">
      <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-[var(--secondary,#008080)]">
        Budget vs. Physical Progress
      </h3>

      <div className="space-y-3">
        {/* Budget Spent Section */}
        <div>
          <div className="flex justify-between items-center text-xs text-[var(--muted)] mb-1">
            <span>Budget spent</span>
            <span className="font-semibold text-[var(--text-dark)]">
              {formatRupees(actualSpent)} of {formatRupees(budgetTotal)} ({spentPercent}%)
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-[var(--card-bg,#f3f4f6)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--secondary,#008080)] transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, spentPercent))}%` }}
            />
          </div>
        </div>

        {/* Physical Progress Section */}
        <div>
          <div className="flex justify-between items-center text-xs text-[var(--muted)] mb-1">
            <span>Verified physical progress</span>
            <span className="font-semibold text-[var(--text-dark)]">{physicalPercent}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-[var(--card-bg,#f3f4f6)] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--primary,#4f46e5)] transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, physicalPercent))}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}