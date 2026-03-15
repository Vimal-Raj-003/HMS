import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | undefined): string {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatCurrency(amount: number | undefined): string {
  if (amount === undefined) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
}

export function formatTime(time: string | Date | undefined): string {
  if (!time) return '';
  return new Date(time).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getInitials(name: string | undefined): string {
  if (!name) return '';
  return name.charAt(0).toUpperCase();
}

export function getFullName(firstName?: string, lastName?: string): string {
  return `${firstName || ''} ${lastName || ''}`.trim();
}

export function getRoleColor(role: string | undefined): string {
  switch (role) {
    case 'ADMIN':
      return 'bg-blue-100 text-blue-800';
    case 'DOCTOR':
      return 'bg-green-100 text-green-800';
    case 'NURSE':
      return 'bg-purple-100 text-purple-800';
    case 'PHARMACIST':
      return 'bg-orange-100 text-orange-800';
    case 'LAB_TECH':
      return 'bg-teal-100 text-teal-800';
    case 'RECEPTIONIST':
      return 'bg-gray-100 text-gray-800';
    case 'PATIENT':
      return 'bg-indigo-100 text-indigo-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
