import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import InviteSignup from './pages/InviteSignup';
import Dashboard from './pages/Dashboard';
import PatientList from './pages/PatientList';
import PatientProfile from './pages/PatientProfile';
import AddVisit from './pages/AddVisit';
import AlertsPanel from './pages/AlertsPanel';
import Medications from './pages/Medications';
import Diagnostics from './pages/Diagnostics';
import UnauthorizedPage from './pages/UnauthorizedPage';
import SetupScreen from './pages/SetupScreen';
import { isSupabaseConfigured } from './lib/supabase';

function AuthRedirect({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="loading-container" style={{ minHeight: '100vh' }}>
        <div className="spinner" />
        <p className="loading-text">Loading ContinuumCare...</p>
      </div>
    );
  }
  if (user) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  // Show setup screen if Supabase is not configured
  if (!isSupabaseConfigured) {
    return <SetupScreen />;
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public: Login */}
          <Route
            path="/login"
            element={
              <AuthRedirect>
                <Login />
              </AuthRedirect>
            }
          />

          {/* Public: Invite Signup */}
          <Route path="/invite/:inviteCode" element={<InviteSignup />} />

          {/* Public: Unauthorized */}
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Protected: App Shell */}
          <Route
            element={
              <ProtectedRoute permission="dashboard">
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<ProtectedRoute permission="dashboard"><Dashboard /></ProtectedRoute>} />
            <Route path="patients" element={<ProtectedRoute permission="patients"><PatientList /></ProtectedRoute>} />
            <Route path="patients/:id" element={<ProtectedRoute permission="patient-profile"><PatientProfile /></ProtectedRoute>} />
            <Route
              path="visits/new"
              element={
                <ProtectedRoute permission="add-visit">
                  <AddVisit />
                </ProtectedRoute>
              }
            />
            <Route path="alerts" element={<ProtectedRoute permission="alerts"><AlertsPanel /></ProtectedRoute>} />
            <Route path="medications" element={<ProtectedRoute permission="medications"><Medications /></ProtectedRoute>} />
            <Route path="diagnostics" element={<ProtectedRoute permission="diagnostics"><Diagnostics /></ProtectedRoute>} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
