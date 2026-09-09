import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

export type LicenseStatus = 'UNKNOWN' | 'VALID' | 'INVALID' | 'EXPIRED';

export interface LicenseState {
  status: LicenseStatus;
  isValid: boolean;
  isActive: boolean;
  packageType: string | null;
  packageName: string;
  licenseKey: string | null;
  daysRemaining: number;
  minutesRemaining: number | null;
  isTest: boolean;
  isLifetime: boolean;
  expirationDate: string | null;
  activatedAt: string | null;
  isLoading: boolean;
  error: string | null;
}

interface LicenseContextType extends LicenseState {
  refresh: () => Promise<void>;
  activateWithCode: (code: string) => Promise<{ success: boolean; message?: string; data?: any; }>;
  reset: () => Promise<void>;
  isLicenseValid: () => boolean;
}

const initialState: LicenseState = {
  status: 'UNKNOWN',
  isValid: false,
  isActive: false,
  packageType: null,
  packageName: 'Aucune licence',
  licenseKey: null,
  daysRemaining: 0,
  minutesRemaining: null,
  isTest: false,
  isLifetime: false,
  expirationDate: null,
  activatedAt: null,
  isLoading: true,
  error: null,
};

const LicenseContext = createContext<LicenseContextType | undefined>(undefined);

export const useLicense = (): LicenseContextType => {
  const context = useContext(LicenseContext);
  if (!context) {
    throw new Error('useLicense must be used within LicenseProvider');
  }
  return context;
};

function isPublicRoute(): boolean {
  const hash = window.location.hash || '';
  return hash.includes('/license') || hash.includes('/login') || hash.includes('/register') || hash === '' || hash === '#' || hash === '#/';
}

export const LicenseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<LicenseState>(initialState);
  const mountedRef = useRef(true);
  const requestIdRef = useRef(0);
  const initializedRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const buildStateFromResult = useCallback((result: any): LicenseState => {
    if (!result) {
      return { ...initialState, status: 'UNKNOWN', isLoading: false, error: 'Réponse licence vide' };
    }
    if (!result.exists) {
      return { ...initialState, status: 'UNKNOWN', isValid: false, isActive: false, isLoading: false, error: null };
    }
    if (!result.isValid) {
      const apiStatus = String(result.status || '').toLowerCase();
      const status: LicenseStatus = apiStatus === 'expired' ? 'EXPIRED' : 'INVALID';
      return {
        ...initialState,
        status,
        isValid: false,
        isActive: false,
        packageType: result.packageType || null,
        packageName: result.packageName || result.packageType || 'Licence invalide',
        licenseKey: result.licenseKey || null,
        daysRemaining: Number(result.daysRemaining) || 0,
        minutesRemaining: result.minutesRemaining != null ? Number(result.minutesRemaining) : null,
        isTest: Boolean(result.isTest),
        isLifetime: Boolean(result.isLifetime),
        expirationDate: result.expirationDate || null,
        activatedAt: result.activatedAt || null,
        isLoading: false,
        error: result.message || 'Licence invalide ou expirée',
      };
    }
    return {
      status: 'VALID',
      isValid: true,
      isActive: true,
      packageType: result.packageType || null,
      packageName: result.packageName || result.packageType || 'Licence',
      licenseKey: result.licenseKey || null,
      daysRemaining: Number(result.daysRemaining) || 0,
      minutesRemaining: result.minutesRemaining != null ? Number(result.minutesRemaining) : null,
      isTest: Boolean(result.isTest),
      isLifetime: Boolean(result.isLifetime),
      expirationDate: result.expirationDate || null,
      activatedAt: result.activatedAt || null,
      isLoading: false,
      error: null,
    };
  }, []);

  const checkLicenseStatus = useCallback(async (): Promise<LicenseState> => {
    try {
      if (!window.api?.license?.checkStatus) {
        return { ...initialState, status: 'UNKNOWN', isLoading: false, error: 'API license.checkStatus non disponible' };
      }
      const result = await window.api.license.checkStatus();
      return buildStateFromResult(result);
    } catch (error: any) {
      return { ...initialState, status: 'UNKNOWN', isLoading: false, error: error?.message || 'Erreur de vérification de la licence' };
    }
  }, [buildStateFromResult]);

  const refresh = useCallback(async (): Promise<void> => {
    const currentRequestId = ++requestIdRef.current;
    if (mountedRef.current) setState((prev) => ({ ...prev, isLoading: true }));
    const newState = await checkLicenseStatus();
    if (!mountedRef.current) return;
    if (currentRequestId !== requestIdRef.current) return;
    setState(newState);
    if (!newState.isValid || !newState.isActive) {
      const currentHash = window.location.hash || '';
      if (!currentHash.includes('/license')) {
        console.log('🚨 [LicenseContext] Licence invalide → /license');
        window.location.hash = '#/license';
      }
    }
  }, [checkLicenseStatus]);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    console.log('🚀 [LicenseContext] Initial license check');
    refresh();
  }, [refresh]);

  // ⭐ FIX: Novaina ho 15 MINITRA (15 * 60 * 1000 = 900,000 ms) fa tsy 30 segondra
  useEffect(() => {
    intervalRef.current = setInterval(() => { refresh(); }, 15 * 60 * 1000);
    const handleFocus = () => refresh();
    const handleVisibility = () => { if (document.visibilityState === 'visible') refresh(); };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [refresh]);

  const activateWithCode = useCallback(async (code: string) => {
    if (!code?.trim()) return { success: false, message: "Veuillez saisir le code d'activation" };
    if (!window.api?.license?.activateWithCode) return { success: false, message: 'API license.activateWithCode non disponible' };
    if (mountedRef.current) setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await window.api.license.activateWithCode(code.trim());
      if (!result?.success) {
        if (mountedRef.current) setState((prev) => ({ ...prev, isLoading: false, error: result?.message || "Code d'activation invalide" }));
        return { success: false, message: result?.message || "Code d'activation invalide", data: result?.data };
      }
      requestIdRef.current++;
      const newState = await checkLicenseStatus();
      if (!mountedRef.current) return { success: true, message: result.message || 'Licence activée avec succès', data: result.data };
      setState({ ...newState, isLoading: false });
      return { success: true, message: result.message || 'Licence activée avec succès', data: result.data };
    } catch (error: any) {
      if (mountedRef.current) setState((prev) => ({ ...prev, isLoading: false, error: error?.message || "Erreur lors de l'activation" }));
      return { success: false, message: error?.message || "Erreur lors de l'activation" };
    }
  }, [checkLicenseStatus]);

  const reset = useCallback(async (): Promise<void> => {
    if (!window.api?.license?.reset) return;
    if (mountedRef.current) setState((prev) => ({ ...prev, isLoading: true }));
    try {
      await window.api.license.reset();
      requestIdRef.current++;
      if (mountedRef.current) setState({ ...initialState, isLoading: false });
    } catch (error: any) {
      if (mountedRef.current) setState((prev) => ({ ...prev, isLoading: false, error: error?.message || 'Erreur lors du reset' }));
    }
  }, []);

  const isLicenseValid = useCallback((): boolean => {
    return state.status === 'VALID' && state.isValid === true && state.isActive === true;
  }, [state.status, state.isValid, state.isActive]);

  const contextValue: LicenseContextType = { ...state, refresh, activateWithCode, reset, isLicenseValid };

  return <LicenseContext.Provider value={contextValue}>{children}</LicenseContext.Provider>;
};

export default LicenseProvider;