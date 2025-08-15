import React from 'react';

export default function ScoreBar({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const gradient = clamped >= 75
    ? 'from-emerald-400 to-emerald-600'
    : clamped >= 50
    ? 'from-yellow-400 to-orange-500'
    : 'from-red-500 to-pink-600';
  return (
    <div>
      <div className="flex justify-between items-end mb-2">
        <span className="font-semibold">ATS Score</span>
        <span className="text-sm text-gray-300">{clamped}/100</span>
      </div>
      <div className="w-full h-3 rounded bg-white/10 overflow-hidden">
        <div
          className={`h-3 rounded bg-gradient-to-r ${gradient} shadow-[0_0_20px_rgba(124,58,237,0.4)] transition-all`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
