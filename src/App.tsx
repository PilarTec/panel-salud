import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import VerificacionPacientes from './pages/VerificacionPacientes';
import AdminHallazgos from './pages/AdminHallazgos';
import Hallazgos from './pages/Hallazgos';
import Examenes from './pages/Examenes';
import Layout from './components/shared/Layout';
import { DataProvider } from './context/DataContext';

import Login from './pages/Login';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/shared/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <BrowserRouter>
          <Routes>
            {/* Ruta pública */}
            <Route path="/login" element={<Login />} />
            
            {/* Rutas privadas */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/examenes" element={
              <ProtectedRoute>
                <Layout>
                  <Examenes />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/hallazgos" element={
              <ProtectedRoute>
                <Layout>
                  <Hallazgos />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Rutas de Administración (Privadas) */}
            <Route path="/admin" element={<Navigate to="/admin/carga" replace />} />
            <Route path="/admin/carga" element={
              <ProtectedRoute>
                <Layout>
                  <Admin />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/verificacion" element={
              <ProtectedRoute>
                <Layout>
                  <VerificacionPacientes />
                </Layout>
              </ProtectedRoute>
            } />
            <Route path="/admin/hallazgos" element={
              <ProtectedRoute>
                <Layout>
                  <AdminHallazgos />
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
