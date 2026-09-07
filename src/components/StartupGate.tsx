

import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLicense } from '../contexts/LicenseContext';
import { Loader2 } from 'lucide-react';

const StartupGate: React.FC = () => {
  const navigate = useNavigate();

  const { user, isLoading: authLoading } = useAuth();

  const {
    status: licenseStatus,
    isValid: licenseIsValid,
    isLoading: licenseLoading,
  } = useLicense();

  const redirectedRef = useRef(false);

  useEffect(() => {
  
    if (redirectedRef.current) return;

  
    if (licenseLoading || authLoading) return;

    redirectedRef.current = true;


    if (licenseStatus !== 'VALID' || !licenseIsValid) {
      console.log('🔐 [StartupGate] Licence invalide → /license');
      navigate('/license', { replace: true });
      return;
    }


    if (!user) {
      console.log('🔑 [StartupGate] Licence OK → /login');
      navigate('/login', { replace: true });
      return;
    }


    console.log('🚀 [StartupGate] Licence + Auth OK → /dashboard');
    navigate('/dashboard', { replace: true });
  }, [
    licenseLoading,
    licenseStatus,
    licenseIsValid,
    authLoading,
    user,
    navigate,
  ]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-indigo-500" />
        <p className="mt-2 text-sm font-medium text-gray-500 dark:text-gray-400">
          Vérification de la licence...
        </p>
      </div>
    </div>
  );
};

export default StartupGate;