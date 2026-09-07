// src/App.tsx
// ⭐ LIFE'S ART ERP
// ⭐ FIX: NESORINA NY ERRORBOUNDARY (DEBUG MODE)
// ⭐ Routes rehetra tsy misy ErrorBoundary mba hahitana ny fototry ny olana
// ============================================================

import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// ============================================================
// CONTEXTS
// ============================================================
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { CompanyProvider } from './contexts/CompanyContext';
import { LicenseProvider } from './contexts/LicenseContext';

// ============================================================
// COMPONENTS
// ============================================================
import StartupGate from './components/StartupGate';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// ============================================================
// PAGES
// ============================================================
import Login from './pages/Login';
import { Register } from './pages/Register';
import LicenseGateScreen from './pages/LicenseGateScreen';

// ============================================================
// PAGES PRINCIPALES
// ============================================================
import DashboardStock from './pages/DashboardStock';
import Produits from './pages/Produits';
import Categories from './pages/Categories';
import Fournisseurs from './pages/Fournisseurs';

// ============================================================
// PAGES OPERATIONNELLES
// ============================================================
import MouvementsStock from './pages/MouvementsStock';
import EntreesStock from './pages/EntreesStock'; // ⭐ FIX: Nampiana ny Entrées de stock
import Commandes from './pages/Commandes';
import Clients from './pages/Clients';
import Depenses from './pages/Depenses';
import Employes from './pages/Employes';
import Paiements from './pages/Paiements';
import Rapports from './pages/Rapports';
import Profile from './pages/Profile';
import Parametres from './pages/Parametres';

// ============================================================
// PAGES ACHATS & VENTES
// ============================================================
import Achats from './pages/Achats';
import Ventes from './pages/Ventes';

// ============================================================
// APP CONTENT
// ============================================================
const AppContent: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 transition-colors duration-300 dark:bg-gray-900">
      {/* TOASTER NOTIFICATIONS */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#333',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            borderRadius: '8px',
            padding: '16px',
          },
          success: {
            style: {
              border: '1px solid #10b981',
              borderLeft: '4px solid #10b981',
            },
          },
          error: {
            style: {
              border: '1px solid #ef4444',
              borderLeft: '4px solid #ef4444',
            },
          },
        }}
      />

      {/* ROUTES */}
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<StartupGate />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/license" element={<LicenseGateScreen />} />

        {/* PROTECTED ROUTES — ⭐ NESORINA NY ERRORBOUNDARY */}
        <Route path="/dashboard" element={<ProtectedRoute><Layout><DashboardStock /></Layout></ProtectedRoute>} />
        <Route path="/produits" element={<ProtectedRoute><Layout><Produits /></Layout></ProtectedRoute>} />
        <Route path="/categories" element={<ProtectedRoute><Layout><Categories /></Layout></ProtectedRoute>} />
        <Route path="/fournisseurs" element={<ProtectedRoute><Layout><Fournisseurs /></Layout></ProtectedRoute>} />
        <Route path="/achats" element={<ProtectedRoute><Layout><Achats /></Layout></ProtectedRoute>} />
        <Route path="/ventes" element={<ProtectedRoute><Layout><Ventes /></Layout></ProtectedRoute>} />
        <Route path="/mouvements" element={<ProtectedRoute><Layout><MouvementsStock /></Layout></ProtectedRoute>} />
        {/* ⭐ FIX: ROUTE VAOVAO HO AN'NY ENTREES DE STOCK */}
        <Route path="/entrees" element={<ProtectedRoute><Layout><EntreesStock /></Layout></ProtectedRoute>} />
        <Route path="/commandes" element={<ProtectedRoute><Layout><Commandes /></Layout></ProtectedRoute>} />
        <Route path="/clients" element={<ProtectedRoute><Layout><Clients /></Layout></ProtectedRoute>} />
        <Route path="/depenses" element={<ProtectedRoute><Layout><Depenses /></Layout></ProtectedRoute>} />
        <Route path="/employes" element={<ProtectedRoute><Layout><Employes /></Layout></ProtectedRoute>} />
        <Route path="/paiements" element={<ProtectedRoute><Layout><Paiements /></Layout></ProtectedRoute>} />
        <Route path="/rapports" element={<ProtectedRoute><Layout><Rapports /></Layout></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
        <Route path="/parametres" element={<ProtectedRoute><Layout><Parametres /></Layout></ProtectedRoute>} />

        {/* FALLBACK ROUTE */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

// ============================================================
// APP ROOT
// ============================================================
const App: React.FC = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <CompanyProvider>
          <LicenseProvider>
            <HashRouter>
              <AppContent />
            </HashRouter>
          </LicenseProvider>
        </CompanyProvider>
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;