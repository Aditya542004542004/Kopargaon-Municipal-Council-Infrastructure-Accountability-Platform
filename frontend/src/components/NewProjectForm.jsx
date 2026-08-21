import { useState, useEffect } from 'react';
import { api } from '../api/client';
import LocationPickerMap from './LocationPickerMap';

const CATEGORIES = [
  'Road Works',
  'Water Supply',
  'Drainage & Sewage',
  'Electricity & Lighting',
  'Sanitation & Waste',
  'Buildings & Welfare'
];

export default function NewProjectForm({ onCreate, onClose }) {
  const [name, setName] = useState('');
  const [ward, setWard] = useState('');
  const [department, setDepartment] = useState('');
  const [category, setCategory] = useState('Road Works'); // 👈 NEW CATEGORY STATE
  const [budget, setBudget] = useState('');
  const [contractorId, setContractorId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [latitude, setLatitude] = useState(19.8887);
  const [longitude, setLongitude] = useState(74.4784);
  const [contractors, setContractors] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.listUsers('contractor').then(setContractors).catch(() => setContractors([]));
  }, []);

  const canSubmit = name.trim() && ward.trim() && department.trim() && budget && contractorId && startDate && endDate;

  async function handleSubmit() {
    setError('');
    setSubmitting(true);
    try {
      const project = await api.createProject({
        name: name.trim(),
        ward: ward.trim(),
        department: department.trim(),
        category, // 👈 PASS CATEGORY
        budgetTotal: Number(budget),
        contractorId,
        startDate,
        endDate,
        latitude,
        longitude,
      });
      onCreate(project.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-6">
      <h3 className="font-display text-lg font-semibold">Create project passport</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Project name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Station Road Drainage Repair"
            className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm focus:outline-none" />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Ward</label>
          <input value={ward} onChange={(e) => setWard(e.target.value)} placeholder="e.g. Ward 3"
            className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm focus:outline-none" />
        </div>

        {/* NEW CATEGORY DROPDOWN */}
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Project Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm focus:outline-none bg-gray-50 font-medium">
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Department</label>
          <input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g. Municipal Roads Department"
            className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm focus:outline-none" />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Budget (₹)</label>
          <input type="number" value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="e.g. 5000000"
            className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm focus:outline-none" />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Contractor</label>
          <select value={contractorId} onChange={(e) => setContractorId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm focus:outline-none">
            <option value="">Select a contractor…</option>
            {contractors.map((c) => (
              <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:col-span-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Start date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm focus:outline-none" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">End date</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm focus:outline-none" />
          </div>
        </div>

        {/* Location Picker Map */}
        <div className="sm:col-span-2 mt-2">
          <LocationPickerMap
            location={{ lat: latitude, lng: longitude }}
            onChangeLocation={({ lat, lng }) => {
              setLatitude(lat);
              setLongitude(lng);
            }}
          />
        </div>
      </div>
      {error && <p className="mt-3 text-sm font-medium text-[var(--red)]">{error}</p>}
      <div className="mt-4 flex gap-2">
        <button disabled={!canSubmit || submitting} onClick={handleSubmit}
          className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40">
          {submitting ? 'Creating…' : 'Create passport'}
        </button>
        <button onClick={onClose} className="rounded-lg px-4 py-2 text-sm font-semibold text-[var(--muted)] hover:bg-[var(--card-bg)]">
          Cancel
        </button>
      </div>
    </div>
  );
}