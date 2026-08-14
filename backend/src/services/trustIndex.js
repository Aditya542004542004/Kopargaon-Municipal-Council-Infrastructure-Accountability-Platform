// Governance Trust Index — server-side source of truth.
// Updated to count budget spent for submitted + verified milestones immediately.

const WEIGHTS = {
  verification: 0.35,
  documentation: 0.25,
  updateFrequency: 0.2,
  flagResolution: 0.2,
};

export function computeTrustIndex(milestones = []) {
  const total = milestones.length;

  if (total === 0) {
    return {
      score: 0,
      breakdown: [
        { label: 'Verification Rate', value: 0, weight: WEIGHTS.verification },
        { label: 'Documentation', value: 0, weight: WEIGHTS.documentation },
        { label: 'Update Frequency', value: 0, weight: WEIGHTS.updateFrequency },
        { label: 'Flag Resolution', value: 100, weight: WEIGHTS.flagResolution },
      ],
    };
  }

  // 1. Verification Rate (35%)
  const verifiedCount = milestones.filter((m) => m.status === 'verified').length;
  const verificationRate = Math.round((verifiedCount / total) * 100);

  // 2. Documentation Score (25%)
  const documented = milestones.filter((m) => m.note && m.note.trim().length > 0).length;
  const documentationScore = Math.round((documented / total) * 100);

  // 3. Update Frequency Score (20%)
  const latest = milestones.reduce((max, m) => {
    const timestamp = m.submittedAt || m.submitted_at;
    const t = timestamp ? new Date(timestamp).getTime() : 0;
    return t > max ? t : max;
  }, 0);

  const daysSinceUpdate = latest > 0 ? Math.max(0, (Date.now() - latest) / (1000 * 60 * 60 * 24)) : 0;
  const updateFrequencyScore = Math.max(0, Math.round(100 - daysSinceUpdate * 3));

  // 4. Dynamic Flag Resolution Score (20%)
  const unresolvedFlagsCount = milestones.reduce((sum, m) => {
    const flags = m.flags || [];
    const pendingFlags = flags.filter((f) => !f.status || f.status === 'pending').length;
    return sum + pendingFlags;
  }, 0);

  const flagResolutionScore = unresolvedFlagsCount === 0 
    ? 100 
    : Math.max(0, 100 - unresolvedFlagsCount * 20);

  // Weighted Trust Score Calculation
  const score = Math.round(
    verificationRate * WEIGHTS.verification +
      documentationScore * WEIGHTS.documentation +
      updateFrequencyScore * WEIGHTS.updateFrequency +
      flagResolutionScore * WEIGHTS.flagResolution
  );

  return {
    score,
    breakdown: [
      { label: 'Verification Rate', value: verificationRate, weight: WEIGHTS.verification },
      { label: 'Documentation', value: documentationScore, weight: WEIGHTS.documentation },
      { label: 'Update Frequency', value: updateFrequencyScore, weight: WEIGHTS.updateFrequency },
      { label: 'Flag Resolution', value: flagResolutionScore, weight: WEIGHTS.flagResolution },
    ],
  };
}

export function computeBudgetProgress(project, milestones = []) {
  // Count all active milestones (submitted or verified, ignoring rejected ones)
  const activeMilestones = milestones.filter((m) => m.status !== 'rejected');
  
  const milestoneSpentSum = activeMilestones.reduce(
    (sum, m) => sum + Number(m.budget_spent ?? m.budgetSpent ?? 0), 
    0
  );

  // Fallback to project.budget_spent if milestones don't have individual spent records
  const totalSpent = milestoneSpentSum > 0 
    ? milestoneSpentSum 
    : Number(project?.budget_spent ?? project?.budgetSpent ?? 0);

  const totalBudget = Number(project?.budget_total ?? project?.budget ?? 1);
  const spentPercent = Math.min(100, Math.round((totalSpent / totalBudget) * 100));

  // Physical progress from verified milestones (or max active progress)
  const verifiedMilestones = milestones.filter((m) => m.status === 'verified');
  const physicalPercent = verifiedMilestones.length > 0
    ? Math.round(
        verifiedMilestones.reduce(
          (sum, m) => sum + Number(m.progress_percent ?? m.progressPercent ?? 0), 
          0
        ) / verifiedMilestones.length
      )
    : Math.round(
        milestones.reduce(
          (sum, m) => sum + Number(m.progress_percent ?? m.progressPercent ?? 0), 
          0
        ) / (milestones.length || 1)
      );

  return { spentPercent, physicalPercent, totalSpent };
}