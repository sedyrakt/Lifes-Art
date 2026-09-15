// src/pages/produits/helpers.ts
import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

export const getStockLevel = (stock: number, minimum: number) => {
  const s = Number(stock) || 0;
  const m = Number(minimum) || 0;
  const ratio = m > 0 ? s / m : 999;
  if (ratio <= 1) return { level: 'critique', color: 'text-danger-500', bg: 'bg-danger-500' };
  if (ratio <= 2) return { level: 'faible', color: 'text-warning-500', bg: 'bg-warning-500' };
  if (ratio <= 5) return { level: 'moyen', color: 'text-brand-500', bg: 'bg-brand-500' };
  return { level: 'élevé', color: 'text-success-500', bg: 'bg-success-500' };
};

export const getStatusColor = (status: string) =>
  status === 'actif'
    ? 'bg-success-50 dark:bg-success-900/30 text-success-800 dark:text-success-300 border border-success-200 dark:border-success-800'
    : 'bg-danger-50 dark:bg-danger-900/30 text-danger-800 dark:text-danger-300 border border-danger-200 dark:border-danger-800';

export const getStatusIcon = (status: string) =>
  status === 'actif'
    ? React.createElement(CheckCircle, { className: 'h-4 w-4 text-success-600 dark:text-success-400' })
    : React.createElement(XCircle, { className: 'h-4 w-4 text-danger-600 dark:text-danger-400' });