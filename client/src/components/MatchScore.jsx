import React from 'react';
import { cn, getMatchColor, getMatchBg } from '../lib/utils.js';

export default function MatchScore({ score, showBar = false, size = 'md' }) {
  const color = getMatchColor(score);
  const bg = getMatchBg(score);
  const label = score >= 80 ? 'Strong' : score >= 60 ? 'Good' : score >= 40 ? 'Moderate' : 'Weak';

  if (size === 'lg') {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className={cn('text-4xl font-black', color)}>{score}</div>
        <div className="text-xs text-zinc-500 uppercase tracking-wide">Match Score</div>
        <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full', color, 'bg-zinc-800')}>
          {label} Match
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className={cn('font-semibold tabular-nums', color, size === 'sm' ? 'text-sm' : 'text-base')}>
        {score}%
      </span>
      {showBar && (
        <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden min-w-16">
          <div
            className={cn('h-full rounded-full transition-all', bg)}
            style={{ width: `${score}%` }}
          />
        </div>
      )}
    </div>
  );
}
