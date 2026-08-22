import React, { useState, useMemo } from 'react';
import { formatRupees } from '../utils/trustIndex';

function getTrustScoreColor(score) {
  if (score >= 80) return '#059669';
  if (score >= 60) return '#d97706';
  return '#dc2626';
}

export default function PerformanceScorecardModal({ projects = [], onClose }) {
  const [activeTab, setActiveTab] = useState('contractors'); // 'contractors' | 'engineers'

  // 1. Aggregate Contractor Performance
  const contractorStats = useMemo(() => {
    const map = {};

    projects.forEach((p) => {
      const name = p.contractor_name || p.contractor || 'Unassigned Contractor';
      if (!map[name]) {
        map[name] = {
          name,
          projectCount: 0,
          totalBudget: 0,
          totalSpent: 0,
          trustSum: 0,
          atRiskCount: 0,
          projects: []
        };
      }

      const budget = Number(p.budget_total ?? p.budgetTotal ?? 0);
      const spentPct = Number(p.budgetSpentPercent || 0);
      const progressPct = Number(p.physicalProgressPercent || 0);
      const spentRupees = Math.round((budget * spentPct) / 100);

      map[name].projectCount += 1;
      map[name].totalBudget += budget;
      map[name].totalSpent += spentRupees;
      map[name].trustSum += Number(p.trustScore || 100);
      if (spentPct - progressPct > 15) map[name].atRiskCount += 1;
      map[name].projects.push(p);
    });

    return Object.values(map).map((c) => ({
      ...c,
      avgTrustScore: Math.round(c.trustSum / (c.projectCount || 1)),
      spentPercent: c.totalBudget > 0 ? Math.round((c.totalSpent / c.totalBudget) * 100) : 0
    })).sort((a, b) => b.avgTrustScore - a.avgTrustScore);
  }, [projects]);

  // 2. Aggregate Field Engineer Performance
  const engineerStats = useMemo(() => {
    const map = {};

    projects.forEach((p) => {
      const name = p.authority_name || 'Er. Government Inspector';
      if (!map[name]) {
        map[name] = {
          name,
          projectCount: 0,
          totalMilestonesVerified: 0,
          totalBudgetSupervised: 0,
          wards: new Set(),
          projects: []
        };
      }

      const budget = Number(p.budget_total ?? p.budgetTotal ?? 0);
      map[name].projectCount += 1;
      map[name].totalBudgetSupervised += budget;
      map[name].totalMilestonesVerified += p.milestoneCount || 1;
      if (p.ward) map[name].wards.add(p.ward);
      map[name].projects.push(p);
    });

    return Object.values(map).map((e) => ({
      ...e,
      wardsList: Array.from(e.wards).join(', ') || 'Kopargaon Wards'
    }));
  }, [projects]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
              Governance Directory
            </span>
            <h3 className="font-display text-base font-bold text-slate-900 mt-0.5">
              Accountability Scorecard & Field Performance
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 font-bold flex items-center justify-center text-xs transition"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-100 bg-slate-50 px-4 pt-2 gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('contractors')}
            className={`px-3 py-2 rounded-t-lg transition border-b-2 ${
              activeTab === 'contractors'
                ? 'border-teal-700 text-teal-800 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            🏢 Contractors ({contractorStats.length} Firms)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('engineers')}
            className={`px-3 py-2 rounded-t-lg transition border-b-2 ${
              activeTab === 'engineers'
                ? 'border-teal-700 text-teal-800 bg-white shadow-2xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            👷 Field Engineers ({engineerStats.length} Officers)
          </button>
        </div>

        {/* Directory Content */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {activeTab === 'contractors' ? (
            /* CONTRACTORS TAB */
            <div className="space-y-3">
              {contractorStats.map((c) => (
                <div
                  key={c.name}
                  className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs hover:border-teal-600 transition space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs">🏢</span>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs leading-tight">{c.name}</h4>
                        <p className="text-[10px] text-slate-500 font-medium">
                          {c.projectCount} Municipal Project{c.projectCount !== 1 ? 's' : ''} Managed
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {c.atRiskCount > 0 && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          ⚠️ {c.atRiskCount} At-Risk
                        </span>
                      )}
                      <div className="text-right px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-sm font-extrabold" style={{ color: getTrustScoreColor(c.avgTrustScore) }}>
                          {c.avgTrustScore}
                        </span>
                        <span className="text-[8px] font-bold text-slate-400 block uppercase">Avg Trust</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] bg-slate-50/70 p-2 rounded-lg border border-slate-100">
                    <div>
                      <span className="block text-[8px] font-bold uppercase text-slate-400">Total Tender Capital</span>
                      <span className="font-extrabold text-slate-900">{formatRupees(c.totalBudget)}</span>
                    </div>
                    <div>
                      <span className="block text-[8px] font-bold uppercase text-slate-400">Total Capital Spent</span>
                      <span className="font-extrabold text-teal-800">{formatRupees(c.totalSpent)} ({c.spentPercent}%)</span>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <span className="block text-[8px] font-bold uppercase text-slate-400">Prequalification</span>
                      <span className={`font-bold text-[10px] ${c.avgTrustScore >= 80 ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {c.avgTrustScore >= 80 ? '🟢 Eligible for Tenders' : '🟡 Under High Surveillance'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* FIELD ENGINEERS TAB */
            <div className="space-y-3">
              {engineerStats.map((e) => (
                <div
                  key={e.name}
                  className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs hover:border-teal-600 transition space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="p-1.5 rounded-lg bg-teal-50 text-teal-700 text-xs font-bold">👷</span>
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs leading-tight">{e.name}</h4>
                        <p className="text-[10px] text-slate-500 font-medium">
                          Assigned Wards: {e.wardsList}
                        </p>
                      </div>
                    </div>

                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      ✓ Certified Field Inspector
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] bg-slate-50/70 p-2 rounded-lg border border-slate-100">
                    <div>
                      <span className="block text-[8px] font-bold uppercase text-slate-400">Projects Supervised</span>
                      <span className="font-extrabold text-slate-900">{e.projectCount} Projects</span>
                    </div>
                    <div>
                      <span className="block text-[8px] font-bold uppercase text-slate-400">Milestones Verified</span>
                      <span className="font-extrabold text-teal-800">{e.totalMilestonesVerified} Verified Inspections</span>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <span className="block text-[8px] font-bold uppercase text-slate-400">Public Capital Supervised</span>
                      <span className="font-extrabold text-slate-900">{formatRupees(e.totalBudgetSupervised)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50 flex justify-between items-center text-[11px] text-slate-500">
          <span>Official Kopargaon Municipal Council Performance Directory</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}