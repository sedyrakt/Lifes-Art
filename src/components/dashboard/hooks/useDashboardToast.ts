// src/components/dashboard/hooks/useDashboardToast.ts
import { useEffect, useState } from 'react';

export interface ToastState {
  type: 'success' | 'error';
  message: string;
}

export const useDashboardToast = (duration = 3500) => {
  const [toast, setToast] = useState<ToastState | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), duration);
    return () => window.clearTimeout(t);
  }, [toast, duration]);

  return { toast, setToast };
};