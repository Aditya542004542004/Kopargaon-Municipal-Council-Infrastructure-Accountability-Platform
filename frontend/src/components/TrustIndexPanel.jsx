import React from 'react';

function getTrustScoreColor(score) {
  if (score >= 80) return '#059669';
  if (score >= 60) return '#d97706';
  return '#dc2626';
}

export default function TrustIndexPanel({ score = 100, breakdown = [] }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs h-full flex flex-col justify-between space-y-2.5">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800">
          Governance Trust Index
        </h3>
        <span className="text-[9px] font-bold text-slate-400">Live Score</span>
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-black leading-none" style={{ color: getTrustScoreColor(score) }}>
          {score}
        </span>
        <span className="text-xs font-bold text-slate-400">/ 100 Score</span>
      </div>

      {/* Breakdown Bars */}
      <div className="space-y-1.5">
        {breakdown.map((item, idx) => (
          <div key={idx}>
            <div className="flex justify-between text-[10px] font-medium text-slate-600 mb-0.5">
              <span>{item.label}</span>
              <span className="font-bold text-slate-800">{item.value}%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-teal-600 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, item.value))}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}