import React, { useState } from 'react';
import { api } from '../api/client';

export default function UserProvisioningModal({ onClose, onUserCreated }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('contractor');
  const [ward, setWard] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const newUser = await api.createUser({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
        ward: ward.trim()
      });

      setSuccess(`Successfully provisioned ${role.toUpperCase()} account for ${name}!`);
      setName('');
      setEmail('');
      setPassword('');
      if (onUserCreated) onUserCreated(newUser);
    } catch (err) {
      setError(err.message || 'Failed to create account.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-6 space-y-4 max-w-lg mx-auto shadow-md">
      <div className="flex justify-between items-center border-b pb-3">
        <div>
          <h3 className="font-display text-lg font-semibold text-gray-800">
            Institutional Account Provisioning
          </h3>
          <p className="text-xs text-gray-500">
            Create verified Contractor or Engineer credentials for Kopargaon projects.
          </p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold text-lg">
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 text-left">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="mt-1 w-full rounded-lg border p-2.5 text-sm focus:outline-none bg-gray-50 font-medium"
          >
            <option value="contractor">Contractor (Private Firm)</option>
            <option value="engineer">Field Engineer (Site Inspector)</option>
            <option value="authority">Municipal Officer / Authority</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Full Name / Firm Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Er. Rajesh Patil or ABC Infra Ltd"
            required
            className="mt-1 w-full rounded-lg border p-2.5 text-sm focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Official Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. rajesh.patil@kopargaon.gov.in"
            required
            className="mt-1 w-full rounded-lg border p-2.5 text-sm focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Temporary Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Assign temporary password"
            required
            className="mt-1 w-full rounded-lg border p-2.5 text-sm focus:outline-none"
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">Assigned Ward (Optional)</label>
          <input
            value={ward}
            onChange={(e) => setWard(e.target.value)}
            placeholder="e.g. Ward 3"
            className="mt-1 w-full rounded-lg border p-2.5 text-sm focus:outline-none"
          />
        </div>

        {error && <p className="text-xs font-semibold text-red-600 bg-red-50 p-2 rounded">{error}</p>}
        {success && <p className="text-xs font-semibold text-emerald-600 bg-emerald-50 p-2 rounded">{success}</p>}

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-lg transition"
          >
            {submitting ? 'Provisioning...' : 'Provision Account'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border text-gray-600 hover:bg-gray-50 font-semibold text-xs rounded-lg"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}