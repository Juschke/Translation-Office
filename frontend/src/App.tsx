import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import Dashboard from './pages/Dashboard';

import Projects from './pages/Projects';
import Requests from './pages/Requests';
import Quotes from './pages/Quotes';
import ProjectDetail from './pages/ProjectDetail';
import NewProject from './pages/NewProject';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import Partners from './pages/Partners';
import PartnerDetail from './pages/PartnerDetail';
import Invoices from './pages/Invoices';
import NewInvoice from './pages/NewInvoice';
import GuestProjectView from './pages/GuestProjectView';

import Inbox from './pages/Inbox';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Billing from './pages/Billing';

import Auth from './pages/auth/Auth';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Onboarding from './pages/auth/Onboarding';
import VerifyEmail from './pages/VerifyEmail';

import Notifications from './pages/Notifications';
import Team from './pages/Team';
import Calendar from './pages/Calendar';
import Interpreting from './pages/Interpreting';
import Documents from './pages/Documents';
import EmailSendPage from './pages/EmailSendPage';



import { AuthProvider } from './context/AuthContext';
import { PortalProvider } from './context/PortalContext';
import { ProtectedRoute, PublicRoute, RoleGuard } from './components/auth/AuthGuard';
import { Toaster } from 'react-hot-toast';
import { ConfigProvider } from 'antd';
import deDE from 'antd/locale/de_DE';
import { antdTheme } from './lib/antd-theme';

import PortalLayout from './layouts/PortalLayout';
import PortalLogin from './pages/portal/PortalLogin';
import PortalVerify from './pages/portal/PortalVerify';
import PortalDashboard from './pages/portal/PortalDashboard';
import PortalProjects from './pages/portal/PortalProjects';
import PortalProjectDetail from './pages/portal/PortalProjectDetail';
import PortalInvoices from './pages/portal/PortalInvoices';
import PortalNewRequest from './pages/portal/PortalNewRequest';
import PortalProfile from './pages/portal/PortalProfile';



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
                        <Route path="/auth" element={<PublicRoute><Auth /></PublicRoute>} />
                        <Route path="/login" element={<Navigate to="/auth" replace />} />
                        <Route path="/register" element={<Navigate to="/auth" replace />} />
                        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
                        <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />

                        <Route path="/onboarding" element={
                            <ProtectedRoute>
                                <Onboarding />
                            </ProtectedRoute>
                        } />

                        <Route path="/email/send" element={
                            <ProtectedRoute>
                                <EmailSendPage />
                            </ProtectedRoute>
                        } />

                        {/* Protected Routes (Authenticated & Tenant) */}
                        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/requests" element={<Requests />} />
                            <Route path="/quotes" element={<Quotes />} />
                            <Route path="/projects" element={<Projects />} />
                            <Route path="/projects/new" element={<NewProject />} />
                            <Route path="/projects/:id/edit" element={<NewProject />} />
                            <Route path="/projects/:id" element={<ProjectDetail />} />
                            <Route path="/calendar" element={<Calendar />} />
                            <Route path="/interpreting" element={<Interpreting />} />
                            <Route path="/documents" element={<Documents />} />

                            <Route path="/customers" element={<Customers />} />
                            <Route path="/customers/:id" element={<CustomerDetail />} />
                            <Route path="/partners" element={<Partners />} />
                            <Route path="/partners/:id" element={<PartnerDetail />} />
                            <Route path="/invoices" element={<RoleGuard minRole="manager"><Invoices /></RoleGuard>} />
                            <Route path="/invoices/new" element={<RoleGuard minRole="manager"><NewInvoice /></RoleGuard>} />
                            <Route path="/invoices/:id/edit" element={<RoleGuard minRole="manager"><NewInvoice /></RoleGuard>} />
                            <Route path="/inbox" element={<RoleGuard minRole="manager"><Inbox /></RoleGuard>} />
                            <Route path="/reports" element={<RoleGuard minRole="manager"><Reports /></RoleGuard>} />
                            <Route path="/notifications" element={<Notifications />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/settings/*" element={<RoleGuard minRole="manager"><Settings /></RoleGuard>} />
                            <Route path="/billing" element={<RoleGuard minRole="owner"><Billing /></RoleGuard>} />
                            <Route path="/team" element={<RoleGuard minRole="owner"><Team /></RoleGuard>} />

                        </Route>

                        {/* Portal Routes — public */}
                        <Route path="/portal/login" element={<PortalLogin />} />
                        <Route path="/portal/verify" element={
                            <PortalProvider>
                                <PortalVerify />
                            </PortalProvider>
                        } />

                        {/* Portal Routes — authenticated */}
                        <Route path="/portal/*" element={
                            <PortalProvider>
                                <Routes>
                                    <Route element={<PortalLayout />}>
                                        <Route index element={<PortalDashboard />} />
                                        <Route path="projects" element={<PortalProjects />} />
                                        <Route path="projects/:id" element={<PortalProjectDetail />} />
                                        <Route path="invoices" element={<PortalInvoices />} />
                                        <Route path="new-request" element={<PortalNewRequest />} />
                                        <Route path="profile" element={<PortalProfile />} />
                                    </Route>
                                </Routes>
                            </PortalProvider>
                        } />

                        {/* Catch all */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Router>
            </AuthProvider>
        </ConfigProvider>
    )
}

export default App
