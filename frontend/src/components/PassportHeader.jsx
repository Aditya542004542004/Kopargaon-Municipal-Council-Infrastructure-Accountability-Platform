import { formatRupees } from '../utils/trustIndex';

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

export default function PassportHeader({ project }) {
  return (
    <div className="rounded-2xl bg-[var(--dark-bg)] p-6 text-white">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
        Digital Project Passport
      </p>
      <h2 className="font-display mt-2 text-2xl font-semibold">{project.name}</h2>
      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
        <div>
          <p className="text-white/50">Ward</p>
          <p className="font-semibold">{project.ward}</p>
        </div>
        <div>
          <p className="text-white/50">Budget</p>
          <p className="font-semibold">{formatRupees(project.budgetTotal)}</p>
        </div>
        <div>
          <p className="text-white/50">Contractor</p>
          <p className="font-semibold">{project.contractor}</p>
        </div>
        <div>
          <p className="text-white/50">Timeline</p>
          <p className="font-semibold">
            {formatDate(project.startDate)} – {formatDate(project.endDate)}
          </p>
        </div>
      </div>
    </div>
  );
}
