
import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useSystem } from './contexts/SystemContext';
import { useTheme } from './contexts/ThemeContext';
import { Loader2 } from 'lucide-react';
import { DualDesignSystem } from './types';

import LoginScreen from './components/LoginScreen';
import LockScreen from './components/LockScreen';
import MainLayout from './layouts/MainLayout';
import LandingPage from './components/LandingPage';

// Lazy Components - SRE Performance Strategy
const Dashboard = lazy(() => import('./components/Dashboard'));
const ResidentDashboard = lazy(() => import('./components/ResidentDashboard'));
const SettingsComp = lazy(() => import('./components/Settings'));
const UserManagement = lazy(() => import('./components/UserManagement'));
const Operations = lazy(() => import('./components/Operations'));
const DemographicAnalysis = lazy(() => import('./components/DemographicAnalysis'));
const Finance = lazy(() => import('./components/Finance'));
const Communication = lazy(() => import('./components/Communication'));
const MessengerBridge = lazy(() => import('./components/MessengerBridge'));
const MarketPlace = lazy(() => import('./components/MarketPlace'));
const Reservations = lazy(() => import('./components/Reservations'));
const Sustainability = lazy(() => import('./components/Sustainability'));
const SuggestionBox = lazy(() => import('./components/SuggestionBox'));
const DigitalWatch = lazy(() => import('./components/DigitalWatch'));
const Surveys = lazy(() => import('./components/Surveys'));
const InternalIDSystem = lazy(() => import('./components/InternalIDSystem'));
const Concierge = lazy(() => import('./components/Concierge'));
const Assets = lazy(() => import('./components/Assets'));
const Timeline = lazy(() => import('./components/Timeline'));
const PublicSenso = lazy(() => import('./components/PublicSenso'));
const DocumentHub = lazy(() => import('./components/DocumentHub'));
const AssemblyManager = lazy(() => import('./components/AssemblyManager'));
const ChatAssistant = lazy(() => import('./components/ChatAssistant'));
const VehicleManagement = lazy(() => import('./components/VehicleManagement'));
const StudioLab = lazy(() => import('./components/StudioLab'));
const CollectiveDecisions = lazy(() => import('./components/CollectiveDecisions'));
const DigitalWallet = lazy(() => import('./components/DigitalWallet'));
const SreMonitor = lazy(() => import('./components/SreMonitor'));
const ProjectManagement = lazy(() => import('./components/ProjectManagement'));

const Loading = () => (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#020617] gap-6">
        <Loader2 className="animate-spin text-indigo-500" size={64} />
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em]">Sincronizando Kernel S.I.E</p>
    </div>
);

const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) => {
    const { isAuthenticated, isLoading, user } = useAuth();
    const { isSuspended } = useSystem();
    const location = useLocation();

    if (isLoading) return <Loading />;

    if (!isAuthenticated) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    if (isSuspended && user?.role !== 'ADMIN') {
        return <Navigate to="/lock" replace />;
    }

    if (adminOnly && user?.role !== 'ADMIN') {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

const AppRoutes = () => {
    const { systemInfo, updateSystemInfo, t } = useSystem();
    const { user, login, permissions, isAuthenticated, isLoading: authLoading } = useAuth();
    const { designSystem, setDesignSystem, isLoading: themeLoading } = useTheme();
    const navigate = useNavigate();

    if (authLoading || themeLoading || !designSystem) return <Loading />;

    const sharedProps = { 
        systemInfo, 
        onNavigate: (path: string) => navigate(path.startsWith('/') ? path : `/terminal/${path === 'dashboard' ? '' : path}`), 
        currentUser: user, 
        permissions, 
        t, 
        designSystem: designSystem as DualDesignSystem, 
        setDesignSystem 
    };

    return (
        <Suspense fallback={<Loading />}>
            <Routes>
                {/* PUBLIC GATEWAYS */}
                <Route path="/" element={<LandingPage systemInfo={systemInfo} />} />
                <Route 
                    path="/login" 
                    element={
                        isAuthenticated ? (
                            <Navigate to="/terminal" replace />
                        ) : (
                            <LoginScreen onLoginSuccess={(u, t) => login(t, u)} systemInfo={systemInfo} />
                        )
                    } 
                />
                <Route path="/lock" element={<LockScreen systemInfo={systemInfo} />} />
                <Route path="/census/:id" element={<PublicSenso />} />

                {/* STANDALONE STUDIO LAB (Root Route - Admin Only) */}
                <Route path="/studio_lab" element={<ProtectedRoute adminOnly children={<StudioLab {...sharedProps} />} />} />

                {/* MASTER TERMINAL CLUSTER */}
                <Route path="/terminal" element={<ProtectedRoute children={<MainLayout />} />}>
                    <Route index element={user?.role === 'RESIDENT' ? <ResidentDashboard {...sharedProps} /> : <Dashboard {...sharedProps} />} />
                    <Route path="settings" element={<SettingsComp {...sharedProps} onUpdateSystemInfo={updateSystemInfo} />} />
                    <Route path="users" element={<UserManagement systemInfo={systemInfo} />} />
                    <Route path="demographics" element={<DemographicAnalysis {...sharedProps} />} />
                    <Route path="documents" element={<DocumentHub {...sharedProps} />} />
                    <Route path="operations" element={<Operations systemInfo={systemInfo} />} />
                    <Route path="watchdog" element={<DigitalWatch systemInfo={systemInfo} />} />
                    <Route path="concierge" element={<Concierge systemInfo={systemInfo} />} />
                    <Route path="assets" element={<Assets systemInfo={systemInfo} />} />
                    <Route path="vehicles" element={<VehicleManagement systemInfo={systemInfo} />} />
                    <Route path="projects" element={<ProjectManagement systemInfo={systemInfo} />} />
                    <Route path="assemblies" element={<AssemblyManager {...sharedProps} />} />
                    <Route path="collective_decisions" element={<CollectiveDecisions {...sharedProps} />} />
                    <Route path="surveys" element={<Surveys systemInfo={systemInfo} />} />
                    <Route path="id_system" element={<InternalIDSystem systemInfo={systemInfo} />} />
                    <Route path="neural_chat" element={<ChatAssistant systemInfo={systemInfo} />} />
                    <Route path="finance" element={<Finance systemInfo={systemInfo} />} />
                    <Route path="communication" element={<Communication {...sharedProps} />} />
                    <Route path="messenger_bridge" element={<MessengerBridge {...sharedProps} />} />
                    <Route path="marketplace" element={<MarketPlace systemInfo={systemInfo} />} />
                    <Route path="reservations" element={<Reservations systemInfo={systemInfo} />} />
                    <Route path="sustainability" element={<Sustainability systemInfo={systemInfo} />} />
                    <Route path="suggestions" element={<SuggestionBox systemInfo={systemInfo} />} />
                    <Route path="wallet" element={<DigitalWallet systemInfo={systemInfo} />} />
                    <Route path="timeline" element={<Timeline systemInfo={systemInfo} />} />
                    <Route path="sre_monitor" element={<SreMonitor {...sharedProps} />} />
                </Route>

                <Route path="/dashboard" element={<Navigate to="/terminal" replace />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Suspense>
    );
};

export default AppRoutes;
