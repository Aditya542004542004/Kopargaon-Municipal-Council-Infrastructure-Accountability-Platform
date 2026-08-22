import React, { useState, useMemo } from 'react';
import { formatRupees } from '../utils/trustIndex';
import ProjectMap from '../components/ProjectMap';
import PerformanceScorecardModal from './PerformanceScorecardModal';

const CATEGORIES = [
  'All Categories',
  'Road Works',
  'Water Supply',
  'Drainage & Sewage',
  'Electricity & Lighting',
  'Sanitation & Waste',
  'Buildings & Welfare'
];

function getTrustBadgeStyle(score) {
  if (score >= 80) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (score >= 60) return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-red-50 text-red-700 border-red-200';
}

function getTrustScoreColor(score) {
  if (score >= 80) return '#059669';
  if (score >= 60) return '#d97706';
  return '#dc2626';
}

export default function Dashboard({ projects = [], onSelect, onSelectProject }) {
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [showScorecard, setShowScorecard] = useState(false); // 👈 CONTRACTOR SCORECARD MODAL STATE

  const handleSelect = onSelect || onSelectProject;

  const totalProjects = projects.length;

  const avgTrustScore = useMemo(() => {
    if (totalProjects === 0) return 100;
    return Math.round(projects.reduce((sum, p) => sum + Number(p.trustScore || 0), 0) / totalProjects);
  }, [projects, totalProjects]);

  const totalBudget = useMemo(() => {
    return projects.reduce((sum, p) => sum + Number(p.budget_total ?? p.budgetTotal ?? 0), 0);
  }, [projects]);

  const atRiskCount = useMemo(() => {
    return projects.filter((p) => {
      const spent = Number(p.budgetSpentPercent || 0);
      const progress = Number(p.physicalProgressPercent || 0);
      return spent - progress > 15;
    }).length;
  }, [projects]);

  // Filtered Projects
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const term = searchQuery.toLowerCase();
      const name = (p.name || p.title || '').toLowerCase();
      const ward = (p.ward || '').toLowerCase();
      const contractor = (p.contractor_name || '').toLowerCase();
      const cat = (p.category || 'Road Works').toLowerCase();

      const matchesSearch = name.includes(term) || ward.includes(term) || contractor.includes(term);
      if (!matchesSearch) return false;

      if (selectedCategory !== 'All Categories' && cat !== selectedCategory.toLowerCase()) {
        return false;
      }

      if (filterMode === 'high_trust') return (p.trustScore || 0) >= 80;
      if (filterMode === 'at_risk') {
        const spent = Number(p.budgetSpentPercent || 0);
        const progress = Number(p.physicalProgressPercent || 0);
        return spent - progress > 15;
      }
      return true;
    });
  }, [projects, searchQuery, filterMode, selectedCategory]);

  return (
    <div className="space-y-5">
      {/* 1. EXECUTIVE KPI BAR */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Works</p>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">{totalProjects}</p>
            <p className="text-[10px] text-slate-500 font-medium">Kopargaon Wards</p>
          </div>
          <span className="p-2 rounded-lg bg-teal-50 text-teal-700 font-bold text-sm">🏗️</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Governance Index</p>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-extrabold" style={{ color: getTrustScoreColor(avgTrustScore) }}>
                {avgTrustScore}
              </span>
              <span className="text-[10px] font-bold text-slate-400">/ 100 Score</span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">Real-time Average</p>
          </div>
          <span className="p-2 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-sm">⭐</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Public Budget</p>
            <p className="text-lg font-extrabold text-slate-900 mt-0.5 truncate max-w-[140px]">
              {formatRupees(totalBudget)}
            </p>
            <p className="text-[10px] text-slate-500 font-medium">Total Capital Monitored</p>
          </div>
          <span className="p-2 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-sm">💳</span>
        </div>

        <div className={`rounded-xl border p-3.5 shadow-2xs flex items-center justify-between ${
          atRiskCount > 0 ? 'bg-amber-50/80 border-amber-200' : 'bg-white border-slate-200'
        }`}>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-900">Risk Radar</p>
            <p className="text-xl font-extrabold text-amber-950 mt-0.5">{atRiskCount} <span className="text-xs font-bold text-amber-800">At-Risk</span></p>
            <p className="text-[10px] text-amber-800 font-medium">
              {atRiskCount > 0 ? 'Budget leads progress by 15%+' : 'On-schedule'}
            </p>
          </div>
          <span className="p-2 rounded-lg bg-amber-100 text-amber-800 font-bold text-sm">⚠️</span>
        </div>
      </div>

      {/* 2. DOCKET BAR (Search + Category Filter + Scorecard Button + Status Filter + Map Switcher) */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex flex-1 items-center gap-2 w-full">
          {/* Search Bar */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search project name, ward, or contractor..."
              className="w-full pl-8 pr-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 focus:outline-none focus:border-teal-600 bg-slate-50/60 text-slate-800"
            />
            <span className="absolute left-2.5 top-2 text-xs text-slate-400">🔍</span>
          </div>

          {/* Category Filter Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="py-1.5 px-3 text-xs font-bold rounded-lg border border-slate-200 bg-slate-50 text-teal-800 focus:outline-none shrink-0"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 w-full lg:w-auto justify-between lg:justify-end shrink-0 flex-wrap">
          {/* 🏆 CONTRACTOR SCORECARD BUTTON */}
          <button
            type="button"
            onClick={() => setShowScorecard(true)}
            className="px-3 py-1.5 text-xs font-bold rounded-lg border border-teal-200 bg-teal-50 text-teal-800 hover:bg-teal-100 transition shadow-2xs shrink-0 flex items-center gap-1"
          >
            <span>🏆</span>
            <span>Performance Directory</span>
          </button>

          {/* Status Filter Pills */}
          <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-bold">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1 rounded-md transition ${
                filterMode === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All ({filteredProjects.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('high_trust')}
              className={`px-3 py-1 rounded-md transition ${
                filterMode === 'high_trust' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              🟢 High Trust
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('at_risk')}
              className={`px-3 py-1 rounded-md transition ${
                filterMode === 'at_risk' ? 'bg-amber-600 text-white shadow-2xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              ⚠️ At-Risk ({atRiskCount})
            </button>
          </div>

          {/* View Switcher */}
          <div className="flex bg-slate-900 p-0.5 rounded-lg text-xs font-bold text-white shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded-md transition ${
                viewMode === 'grid' ? 'bg-teal-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              📋 Grid
            </button>
            <button
              type="button"
              onClick={() => setViewMode('map')}
              className={`px-3 py-1 rounded-md transition ${
                viewMode === 'map' ? 'bg-teal-700 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              🗺️ Map
            </button>
          </div>
        </div>
      </div>

      {/* 3. CARDS GRID OR MAP */}
      {viewMode === 'map' ? (
        <ProjectMap projects={filteredProjects} onSelectProject={handleSelect} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((p) => {
            const spentPct = Number(p.budgetSpentPercent || 0);
            const progressPct = Number(p.physicalProgressPercent || 0);
            const isAtRisk = spentPct - progressPct > 15;
            const trustScore = p.trustScore ?? 100;
            const badgeStyle = getTrustBadgeStyle(trustScore);

            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelect && handleSelect(p.id)}
                className="group bg-white rounded-xl border border-slate-200 p-4 text-left hover:border-teal-600 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-100">
                          {p.ward || 'Kopargaon Ward'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {p.category || 'Road Works'}
                        </span>
                      </div>
                      <h3 className="font-display mt-1.5 text-base font-bold text-slate-900 group-hover:text-teal-700 transition-colors leading-snug line-clamp-1">
                        {p.name || p.title}
                      </h3>
                    </div>

                    <div className={`shrink-0 text-center px-2.5 py-1 rounded-lg border ${badgeStyle}`}>
                      <div className="text-lg font-black leading-none">{trustScore}</div>
                      <div className="text-[8px] font-bold uppercase tracking-wider opacity-75 mt-0.5">Trust</div>
                    </div>
                  </div>

                  <div className="space-y-2 my-3">
                    <div>
                      <div className="flex justify-between text-[11px] text-slate-500 mb-0.5">
                        <span>Budget spent</span>
                        <span className="font-bold text-slate-800">{spentPct}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(0, spentPct))}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-slate-500 mb-0.5">
                        <span>Verified physical progress</span>
                        <span className="font-bold text-slate-800">{progressPct}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-teal-600 transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {isAtRisk && (
                    <div className="mt-2.5 flex items-center justify-between gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-bold">
                      <span>⚠️ At-Risk: Cost Overrun</span>
                      <span className="text-[10px] text-amber-800 font-medium">
                        Spent {spentPct}% vs {progressPct}%
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
                  <span className="font-semibold text-slate-700 truncate max-w-[150px]">
                    🏢 {p.contractor_name || 'Assigned Contractor'}
                  </span>
                  <span className="font-bold text-slate-900">
                    {formatRupees(p.budget_total)} · {p.milestoneCount || 0} milestone{p.milestoneCount !== 1 ? 's' : ''}
                  </span>
                </div>
              </button>
            );
          })}

          {filteredProjects.length === 0 && (
            <div className="col-span-full bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
              <p className="text-sm font-bold text-slate-800">No projects found matching category or search query.</p>
            </div>
          )}
        </div>
      )}

      {/* CONTRACTOR SCORECARD MODAL */}
      {showScorecard && (
        <PerformanceScorecardModal projects={projects} onClose={() => setShowScorecard(false)} />
      )}
    </div>
  );
}