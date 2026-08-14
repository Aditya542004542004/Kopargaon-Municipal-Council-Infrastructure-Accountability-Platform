export default function TrustIndexPanel({ score, breakdown }) {
  return (
    <div className="rounded-2xl bg-[var(--dark-bg)] p-6 text-white">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
        Governance Trust Index
      </p>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="font-display text-6xl font-bold text-[var(--accent)]">{score}</span>
        <span className="text-lg text-white/50">/ 100</span>
      </div>
      <div className="mt-5 space-y-3">
        {breakdown.map((b) => (
          <div key={b.label}>
            <div className="flex items-center justify-between text-xs text-white/70">
              <span>{b.label}</span>
              <span className="font-semibold text-white">{b.value}</span>
            </div>
            <div className="mt-1 h-1.5 w-full rounded-full bg-white/15">
              <div
                className="h-1.5 rounded-full bg-[var(--secondary)]"
                style={{ width: `${b.value}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-5 text-[11px] leading-relaxed text-white/50">
        Computed from verification rate, documentation completeness, update frequency, and
        unresolved flags. Weights are fixed constants, visible in code — not a black box.
      </p>
    </div>
  );
}
