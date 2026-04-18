import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency,
  }).format(amount / 100);
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatMonth(date: string): string {
  return new Date(date).toLocaleDateString('it-IT', {
    month: 'long',
    year: 'numeric',
  });
}

export function getMonthYear(date: Date): { month: number; year: number } {
  return {
    month: date.getMonth() + 1,
    year: date.getFullYear(),
  };
}

export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}
