import React from 'react';
import { cn, STATUS_CONFIG } from '../lib/utils.js';

export default function StatusBadge({ status, size = 'sm' }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.saved;
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full font-medium',
      config.color,
      size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-3 py-1'
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />
      {config.label}
    </span>
  );
}
