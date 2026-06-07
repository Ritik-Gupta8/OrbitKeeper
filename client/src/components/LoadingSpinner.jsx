import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../lib/utils.js';

export default function LoadingSpinner({ size = 16, className, text }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Loader2 size={size} className="animate-spin text-indigo-400" />
      {text && <span className="text-sm text-zinc-400">{text}</span>}
    </div>
  );
}

export function PageLoader({ text = 'Loading...' }) {
  return (
    <div className="flex-1 flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={28} className="animate-spin text-indigo-400" />
        <p className="text-sm text-zinc-500">{text}</p>
      </div>
    </div>
  );
}
