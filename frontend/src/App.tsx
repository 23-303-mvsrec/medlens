import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import MedLensStudio from './pages/MedLensStudio';
import ReviewCenter from './pages/ReviewCenter';
import BiomarkerTrends from './pages/BiomarkerTrends';
import Patients from './pages/Patients';
import PatientDetail from './pages/PatientDetail';
import Documents from './pages/Documents';
import Settings from './pages/Settings';
import BackendDataInspector from './pages/BackendDataInspector';
import Login from './pages/Login';
import { useAuthStore } from './store';

const PrivateRoute = ({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) => {
  const { isAuthenticated, role } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (adminOnly && role?.toLowerCase() !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

export default function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
        
        <Route element={<PrivateRoute><MainLayout /></PrivateRoute>}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/doctor/dashboard" element={<Dashboard />} />
          <Route path="/medlens" element={<MedLensStudio />} />
          <Route path="/record" element={<MedLensStudio />} />
          <Route path="/review" element={<ReviewCenter />} />
          <Route path="/trends" element={<BiomarkerTrends />} />
          
          <Route path="/patients" element={<Patients />} />
          <Route path="/patients/:id" element={<PatientDetail />} />
          <Route path="/documents" element={<Documents />} />
          <Route path="/database" element={<BackendDataInspector />} />
          <Route path="/data-inspector" element={<BackendDataInspector />} />
          <Route path="/settings" element={<Settings />} />
          
          {/* Legacy route safe redirects */}
          <Route path="/legacy" element={<Navigate to="/dashboard" replace />} />
          <Route path="/departments" element={<Navigate to="/dashboard" replace />} />
          <Route path="/doctors" element={<Navigate to="/dashboard" replace />} />
          
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
