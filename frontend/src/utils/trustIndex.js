// The Trust Index and budget-progress formulas now live server-side
// (see backend/src/services/trustIndex.js) as the single source of truth.
// This file just keeps the shared display formatter.

export function formatRupees(amount) {
  return '₹' + Number(amount).toLocaleString('en-IN');
}
