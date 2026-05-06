import { type ClassValue } from 'clsx';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getUserGradient(username: string): string {
  const gradients = [
    'from-red-500 to-orange-500',
    'from-orange-500 to-amber-500',
    'from-lime-500 to-green-500',
    'from-green-500 to-emerald-500',
    'from-emerald-500 to-teal-500',
    'from-cyan-500 to-blue-500',
    'from-blue-500 to-indigo-500',
    'from-indigo-500 to-violet-500',
    'from-violet-500 to-purple-500',
    'from-purple-500 to-fuchsia-500',
    'from-fuchsia-500 to-pink-500',
    'from-pink-500 to-rose-500',
  ];
  
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % gradients.length;
  return `bg-gradient-to-br ${gradients[index]}`;
}
