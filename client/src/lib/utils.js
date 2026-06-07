import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, format, isPast } from 'date-fns';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const STATUS_CONFIG = {
  saved:        { label: 'Saved',          color: 'bg-zinc-700 text-zinc-200',        dot: 'bg-zinc-400' },
  applied:      { label: 'Applied',        color: 'bg-blue-900/60 text-blue-300',     dot: 'bg-blue-400' },
  phone_screen: { label: 'Phone Screen',   color: 'bg-purple-900/60 text-purple-300', dot: 'bg-purple-400' },
  technical:    { label: 'Technical',      color: 'bg-yellow-900/60 text-yellow-300', dot: 'bg-yellow-400' },
  interview:    { label: 'Interview',      color: 'bg-orange-900/60 text-orange-300', dot: 'bg-orange-400' },
  offer:        { label: 'Offer 🎉',       color: 'bg-green-900/60 text-green-300',   dot: 'bg-green-400' },
  rejected:     { label: 'Rejected',       color: 'bg-red-900/60 text-red-300',       dot: 'bg-red-400' },
  withdrawn:    { label: 'Withdrawn',      color: 'bg-zinc-800 text-zinc-400',        dot: 'bg-zinc-500' },
};

export const PRIORITY_CONFIG = {
  high:   { label: 'High',   color: 'text-red-400',    bg: 'bg-red-900/30' },
  medium: { label: 'Medium', color: 'text-yellow-400', bg: 'bg-yellow-900/30' },
  low:    { label: 'Low',    color: 'text-zinc-400',   bg: 'bg-zinc-800' },
};

export const getMatchColor = (score) => {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-yellow-400';
  if (score >= 40) return 'text-orange-400';
  return 'text-red-400';
};

export const getMatchBg = (score) => {
  if (score >= 80) return 'bg-green-500';
  if (score >= 60) return 'bg-yellow-500';
  if (score >= 40) return 'bg-orange-500';
  return 'bg-red-500';
};

export const formatDeadline = (deadline) => {
  if (!deadline) return null;
  const d = new Date(deadline);
  if (isPast(d)) return { label: 'Deadline passed', urgent: false, past: true };
  const dist = formatDistanceToNow(d, { addSuffix: true });
  const hours = (d - new Date()) / (1000 * 60 * 60);
  return {
    label: dist,
    formatted: format(d, 'MMM d, yyyy'),
    urgent: hours <= 24,
    past: false,
  };
};
