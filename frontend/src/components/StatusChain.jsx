const STEPS = ['submitted', 'verified'];

const STEP_LABEL = {
  submitted: 'Claimed',
  verified: 'Verified',
  rejected: 'Rejected',
};

export default function StatusChain({ status, flagCount }) {
  const isRejected = status === 'rejected';
  const activeIndex = isRejected ? 0 : STEPS.indexOf(status);

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center">
        {STEPS.map((step, i) => {
          const reached = isRejected ? i === 0 : i <= activeIndex;
          const isLast = i === STEPS.length - 1;
          return (
            <div key={step} className="flex items-center">
              <div
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                  reached
                    ? 'bg-[var(--secondary)] text-white'
                    : 'bg-[var(--card-bg)] text-[var(--muted)]'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${reached ? 'bg-white' : 'bg-[var(--muted)]'}`}
                />
                {STEP_LABEL[step]}
              </div>
              {!isLast && (
                <div className={`h-[2px] w-5 ${reached && i < activeIndex ? 'bg-[var(--secondary)]' : 'bg-[var(--border)]'}`} />
              )}
            </div>
          );
        })}
      </div>
      {isRejected && (
        <span className="rounded-full bg-[var(--red)]/10 px-3 py-1 text-xs font-semibold text-[var(--red)]">
          Rejected
        </span>
      )}
      {flagCount > 0 && (
        <span className="rounded-full bg-[var(--red)]/10 px-3 py-1 text-xs font-semibold text-[var(--red)]">
          {flagCount} flag{flagCount > 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
}
