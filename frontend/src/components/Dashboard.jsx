import React, { useState } from 'react';
import { formatRupees } from '../utils/trustIndex';
import ProjectMap from '../components/ProjectMap';

function scoreColor(score) {
  if (score >= 80) return '#10b981'; // Emerald Green
  if (score >= 60) return '#f59e0b'; // Amber
  return '#ef4444'; // Red
}

export default function Dashboard({ projects = [], onSelect, onSelectProject }) {
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSelect = onSelect || onSelectProject;

  // ----------------------------------------------------
  // DYNAMIC ANALYTICS CALCULATIONS (From Existing Projects)
  // ----------------------------------------------------
  const totalProjects = projects.length;
  
  const avgTrustScore = totalProjects > 0
    ? Math.round(projects.reduce((sum, p) => sum + Number(p.trustScore || 0), 0) / totalProjects)
    : 100;

  const totalBudget = projects.reduce(
    (sum, p) => sum + Number(p.budget_total ?? p.budgetTotal ?? 0), 
    0
  );

  const atRiskProjectsCount = projects.filter((p) => {
    const spent = Number(p.budgetSpentPercent || 0);
    const progress = Number(p.physicalProgressPercent || 0);
    return (spent - progress) > 15;
  }).length;

  // Filter projects by search query
  const filteredProjects = projects.filter((p) => {
    const term = searchQuery.toLowerCase();
    const name = (p.name || p.title || '').toLowerCase();
    const ward = (p.ward || '').toLowerCase();
    const contractor = (p.contractor_name || '').toLowerCase();
    return name.includes(term) || ward.includes(term) || contractor.includes(term);
  });

  return (
    <div className="space-y-8">
      {/* ----------------------------------------------------
          1. EXECUTIVE ANALYTICS SUMMARY LAYER (NEW)
         ---------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Projects */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Projects</span>
            <span className="p-2 rounded-xl bg-teal-50 text-teal-600 text-lg">🏗️</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">{totalProjects}</div>
          <p className="text-[11px] text-gray-400 mt-1">Across Kopargaon Wards</p>
        </div>

        {/* KPI 2: Governance Health */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Governance Health</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 text-lg">⭐</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold" style={{ color: scoreColor(avgTrustScore) }}>
              {avgTrustScore}
            </span>
            <span className="text-xs text-gray-400 font-semibold">/ 100 Avg Trust</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Real-time civic score</p>
        </div>

        {/* KPI 3: Total Allocation */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Budget</span>
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 text-lg">💰</span>
          </div>
          <div className="text-xl font-bold text-gray-900 truncate">
            {formatRupees(totalBudget)}
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Public funds monitored</p>
        </div>

        {/* KPI 4: Risk Warning */}
        <div className={`rounded-2xl border p-5 transition shadow-sm ${
          atRiskProjectsCount > 0 
            ? 'bg-amber-50/60 border-amber-200' 
            : 'bg-white border-gray-100'
        }`}>
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-900">
              Risk Monitoring
            </span>
            <span className="p-2 rounded-xl bg-amber-100 text-amber-700 text-lg">⚠️</span>
          </div>
          <div className="text-2xl font-bold text-amber-900">{atRiskProjectsCount}</div>
          <p className="text-[11px] text-amber-800/80 mt-1">
            {atRiskProjectsCount > 0 ? 'Project(s) with budget variance' : 'All projects on budget'}
          </p>
        </div>
      </div>

      {/* ----------------------------------------------------
          2. SEARCH & VIEW SWITCHER CONTROLS
         ---------------------------------------------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search project name, ward, or contractor..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-gray-200 focus:outline-none focus:border-teal-600 bg-gray-50/50"
          />
          <span className="absolute left-3 top-2.5 text-xs text-gray-400">🔍</span>
        </div>

        {/* View Switcher Toggle */}
        <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              viewMode === 'grid'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            📋 Grid View
          </button>
          <button
            type="button"
            onClick={() => setViewMode('map')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              viewMode === 'map'
                ? 'bg-teal-700 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            🗺️ GIS Map View
          </button>
        </div>
      </div>

      {/* ----------------------------------------------------
          3. MAIN VIEW AREA (GRID OR MAP)
         ---------------------------------------------------- */}
      {viewMode === 'map' ? (
        <ProjectMap projects={filteredProjects} onSelectProject={handleSelect} />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2">
          {filteredProjects.map((p) => {
            const spentPct = Number(p.budgetSpentPercent || 0);
            const progressPct = Number(p.physicalProgressPercent || 0);
            const isAtRisk = (spentPct - progressPct) > 15;

            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelect && handleSelect(p.id)}
                className="group bg-white rounded-2xl border border-gray-100 p-6 text-left hover:border-teal-600 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                        {p.ward || 'Kopargaon Ward'}
                      </span>
                      <h3 className="font-display mt-2 text-lg font-bold text-gray-900 group-hover:text-teal-700 transition-colors">
                        {p.name || p.title}
                      </h3>
                    </div>

                    {/* Trust Index Score Badge */}
                    <div className="shrink-0 text-right bg-gray-50 p-2 rounded-xl border border-gray-100">
                      <div
                        className="text-2xl font-bold leading-none"
                        style={{ color: scoreColor(p.trustScore) }}
                      >
                        {p.trustScore ?? 100}
                      </div>
                      <div className="text-[9px] uppercase font-bold tracking-wider text-gray-400 mt-1">
                        Trust Index
                      </div>
                    </div>
                  </div>

                  {/* Progress Bars */}
                  <div className="space-y-3 my-4">
                    <div>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Budget spent</span>
                        <span className="font-semibold text-gray-800">{spentPct}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(0, spentPct))}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Verified physical progress</span>
                        <span className="font-semibold text-gray-800">{progressPct}%</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-teal-600 transition-all duration-500"
                          style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* At-Risk Warning Badge */}
                  {isAtRisk && (
                    <div className="mt-3 flex items-center justify-between gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
                      <span className="flex items-center gap-1">
                        <span>⚠️ At-Risk: Cost Overrun</span>
                      </span>
                      <span className="text-[10px] text-amber-800 font-medium">
                        Spent {spentPct}% vs {progressPct}% Progress
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="mt-5 flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-3">
                  <span className="font-medium text-gray-700 truncate max-w-[180px]">
                    🏢 {p.contractor_name || 'Assigned Contractor'}
                  </span>
                  <span className="font-semibold text-gray-800">
                    {formatRupees(p.budget_total)} · {p.milestoneCount || 0} milestone{p.milestoneCount !== 1 ? 's' : ''}
                  </span>
                </div>
              </button>
            );
          })}

          {filteredProjects.length === 0 && (
            <div className="col-span-full bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-500">
              <p className="text-base font-semibold">No projects found matching "{searchQuery}"</p>
              <p className="text-xs text-gray-400 mt-1">Try searching for a different ward or project name.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}