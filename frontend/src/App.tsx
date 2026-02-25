import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import AuthLayout from './layouts/AuthLayout';
import Dashboard from './pages/Dashboard';

import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import Partners from './pages/Partners';
import PartnerDetail from './pages/PartnerDetail';
import Invoices from './pages/Invoices';
import GuestProjectView from './pages/GuestProjectView';

import Inbox from './pages/Inbox';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Billing from './pages/Billing';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Onboarding from './pages/auth/Onboarding';
import VerifyEmail from './pages/VerifyEmail';

import Notifications from './pages/Notifications';
import Team from './pages/Team';
import Calendar from './pages/Calendar';

import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, PublicRoute, RoleGuard } from './components/auth/AuthGuard';
import { Toaster } from 'react-hot-toast';
import { ConfigProvider } from 'antd';
import deDE from 'antd/locale/de_DE';
import { antdTheme } from './lib/antd-theme';



function App() {
    return (
        <ConfigProvider locale={deDE} theme={antdTheme}>
            <AuthProvider>
                <Toaster position="top-right" toastOptions={{ style: { fontSize: '13px' } }} />
                <Router>
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/guest/project/:token" element={<GuestProjectView />} />
                        <Route path="/verify-email" element={<VerifyEmail />} />
                        <Route element={<PublicRoute><AuthLayout /></PublicRoute>}>
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/forgot-password" element={<ForgotPassword />} />
                            <Route path="/reset-password" element={<ResetPassword />} />
                        </Route>

                        {/* Onboarding (Authenticated but no Tenant) */}
                        <Route path="/onboarding" element={
                            <ProtectedRoute>
                                <Onboarding />
                            </ProtectedRoute>
                        } />

                        {/* Protected Routes (Authenticated & Tenant) */}
                        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/projects" element={<Projects />} />
                            <Route path="/projects/:id" element={<ProjectDetail />} />
                            <Route path="/calendar" element={<Calendar />} />
                            <Route path="/customers" element={<Customers />} />
                            <Route path="/customers/:id" element={<CustomerDetail />} />
                            <Route path="/partners" element={<Partners />} />
                            <Route path="/partners/:id" element={<PartnerDetail />} />
                            <Route path="/invoices" element={<RoleGuard minRole="manager"><Invoices /></RoleGuard>} />
                            <Route path="/inbox" element={<RoleGuard minRole="manager"><Inbox /></RoleGuard>} />
                            <Route path="/reports" element={<RoleGuard minRole="manager"><Reports /></RoleGuard>} />
                            <Route path="/notifications" element={<Notifications />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/settings/*" element={<RoleGuard minRole="manager"><Settings /></RoleGuard>} />
                            <Route path="/billing" element={<RoleGuard minRole="owner"><Billing /></RoleGuard>} />
                            <Route path="/team" element={<RoleGuard minRole="owner"><Team /></RoleGuard>} />
                        </Route>

                        {/* Catch all */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Router>
            </AuthProvider>
        </ConfigProvider>
    )
}

export default App
