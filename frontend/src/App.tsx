import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './features/auth/AuthContext';
import { ToastProvider } from './components/ui/ToastProvider';
import ProtectedRoute from './features/auth/ProtectedRoute';

// Public pages
import LandingPage from './pages/public/LandingPage';
import LoginPage from './pages/public/LoginPage';
import RegisterPage from './pages/public/RegisterPage';
import ForgotPasswordPage from './pages/public/ForgotPasswordPage';
import NotFoundPage from './pages/public/NotFoundPage';
import AccessDeniedPage from './pages/public/AccessDeniedPage';

// Student pages
import StudentLayout from './layouts/StudentLayout';
import StudentDashboard from './pages/student/Dashboard';
import SubmitComplaint from './pages/student/SubmitComplaint';
import MyComplaints from './pages/student/MyComplaints';
import ComplaintDetailStudent from './pages/student/ComplaintDetail';

// Officer pages
import OfficerLayout from './layouts/OfficerLayout';
import OfficerDashboard from './pages/officer/Dashboard';
import ComplaintQueue from './pages/officer/ComplaintQueue';
import ComplaintWorkspace from './pages/officer/ComplaintWorkspace';

// Admin pages
import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import BureauMonitoring from './pages/admin/BureauMonitoring';
import UserManagement from './pages/admin/UserManagement';
import InstitutionManagement from './pages/admin/InstitutionManagement';
import Institution360 from './pages/admin/Institution360';
import AssignmentCenter from './pages/admin/AssignmentCenter';
import AnalyticsReports from './pages/admin/AnalyticsReports';
import AuditLogs from './pages/admin/AuditLogs';
import SystemSettings from './pages/admin/SystemSettings';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/access-denied" element={<AccessDeniedPage />} />
          <Route path="/404" element={<NotFoundPage />} />

          {/* Student portal */}
          <Route path="/student" element={<ProtectedRoute role="student"><StudentLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="submit" element={<SubmitComplaint />} />
            <Route path="complaints" element={<MyComplaints />} />
            <Route path="complaints/:id" element={<ComplaintDetailStudent />} />
          </Route>

          {/* Officer portal */}
          <Route path="/officer" element={<ProtectedRoute role="officer"><OfficerLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<OfficerDashboard />} />
            <Route path="queue" element={<ComplaintQueue />} />
            <Route path="complaints/:id" element={<ComplaintWorkspace />} />
          </Route>

          {/* Admin portal */}
          <Route path="/admin" element={<ProtectedRoute role="super_admin"><AdminLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="bureaus" element={<BureauMonitoring />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="institutions" element={<InstitutionManagement />} />
            <Route path="institutions/:id/360" element={<Institution360 />} />
            <Route path="assignments" element={<AssignmentCenter />} />
            <Route path="analytics" element={<AnalyticsReports />} />
            <Route path="audit-logs" element={<AuditLogs />} />
            <Route path="settings" element={<SystemSettings />} />
          </Route>

          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  );
}
