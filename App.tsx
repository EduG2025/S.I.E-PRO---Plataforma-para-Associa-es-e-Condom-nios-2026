
import React, { useState, Suspense, lazy, useEffect, useMemo } from 'react';
import { MENU_ITEMS, DEFAULT_SYSTEM_INFO } from './constants';
import { SystemInfo, User, DualDesignSystem } from './types';
import {
    LogOut, Menu, Loader2, Shield, PanelLeftClose, PanelLeft,
    LayoutDashboard, Wallet, Users, Bell, ShieldAlert, Settings, ClipboardList,
    BarChart3, FileText, Gavel, Camera, Leaf, ShoppingBag,
    HelpCircle, Box, Brain, Fingerprint, Smartphone, UserCheck,
    ShieldCheck, Archive, CalendarClock, Lock, Terminal, Car
} from 'lucide-react';
import { systemService, authService, studioService, api } from './services/api';

import LoginScreen from './components/LoginScreen';
import ServerClock from './components/ServerClock';

const ICON_MAP: Record<string, any> = {
    LayoutDashboard, Wallet, Users, Bell, ShieldAlert, CalendarClock, Settings, ClipboardList,
    BarChart3, FileText, Gavel, Camera, Leaf, ShoppingBag, HelpCircle, Box, Brain, 
    Fingerprint, Smartphone, UserCheck, ShieldCheck, Archive, Terminal, Car
};

const Dashboard = lazy(() => import('./components/Dashboard'));
const ResidentDashboard = lazy(() => import('./components/ResidentDashboard'));
const SettingsComp = lazy(() => import('./components/Settings'));
const UserManagement = lazy(() => import('./components/UserManagement'));
const Operations = lazy(() => import('./components/Operations'));
const DemographicAnalysis = lazy(() => import('./components/DemographicAnalysis'));
const Finance = lazy(() => import('./components/Finance'));
const Communication = lazy(() => import('./components/Communication'));
const MarketPlace = lazy(() => import('./components/MarketPlace'));
const Reservations = lazy(() => import('./components/Reservations'));
const Sustainability = lazy(() => import('./components/Sustainability'));
const SuggestionBox = lazy(() => import('./components/SuggestionBox'));
const DigitalWatch = lazy(() => import('./components/DigitalWatch'));
const Surveys = lazy(() => import('./components/Surveys'));
const InternalIDSystem = lazy(() => import('./components/InternalIDSystem'));
const MessengerBridge = lazy(() => import('./components/MessengerBridge'));
const Concierge = lazy(() => import('./components/Concierge'));
const Assets = lazy(() => import('./components/Assets'));
const Timeline = lazy(() => import('./components/Timeline'));
const PublicSenso = lazy(() => import('./components/PublicSenso'));
const DocumentHub = lazy(() => import('./components/DocumentHub'));
const AssemblyManager = lazy(() => import('./components/AssemblyManager'));
const ChatAssistant = lazy(() => import('./components/ChatAssistant'));
const VehicleManagement = lazy(() => import('./components/VehicleManagement'));

const App = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [systemInfo, setSystemInfo] = useState<SystemInfo>(DEFAULT_SYSTEM_INFO);
    const [activeTab, setActiveTab] = useState(window.location.hash.replace('#', '') || 'dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [dynamicPermissions, setDynamicPermissions] = useState<string[]>([]);
    const [designSystem, setDesignSystem] = useState<DualDesignSystem | null>(null);
    const [isMobileView, setIsMobileView] = useState(window.innerWidth < 1024);

    const isPublicCensus = window.location.pathname.startsWith('/census/');

    const t = useMemo(() => (term: string) => {
        const dict = systemInfo.dictionary || {};
        return dict[term.toUpperCase()] || term;
    }, [systemInfo.dictionary]);

    useEffect(() => {
        const handleResize = () => setIsMobileView(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const initKernel = async () => {
            const token = localStorage.getItem('sie_auth_token');
            try {
                const [infoRes, designRes] = await Promise.all([
                    systemService.getInfo(),
                    studioService.getTokens()
                ]);
                setSystemInfo(infoRes.data || DEFAULT_SYSTEM_INFO);
                setDesignSystem(designRes.data);
                if (!isPublicCensus && token) {
                    try {
                        const [userRes, permsRes] = await Promise.all([
                            authService.me(),
                            api.get('/settings/permissions/my')
                        ]);
                        setCurrentUser(userRes.data);
                        setDynamicPermissions(permsRes.data.data || []);
                        setIsAuthenticated(true);
                    } catch (authError) {
                        localStorage.removeItem('sie_auth_token');
                        setIsAuthenticated(false);
                    }
                }
            } catch (error) { console.error("Kernel Init Fail", error); } finally { setIsLoading(false); }
        };
        initKernel();
    }, [isPublicCensus]);

    useEffect(() => {
        if (!isLoading && isAuthenticated && activeTab !== 'dashboard') {
            const item = MENU_ITEMS.find(m => m.id === activeTab);
            if (item && !dynamicPermissions.includes('*') && !dynamicPermissions.includes(item.permissionId)) {
                setActiveTab('dashboard');
                window.location.hash = 'dashboard';
            }
        }
    }, [activeTab, dynamicPermissions, isLoading, isAuthenticated]);

    const handleLoginSuccess = (user: User, token: string) => {
        localStorage.setItem('sie_auth_token', token);
        window.location.reload();
    };

    const currentTokens = useMemo(() => {
        if (!designSystem) return null;
        return isMobileView ? designSystem.mobile : designSystem.desktop;
    }, [designSystem, isMobileView]);

    // SRE: INJEÇÃO DE TOKENS VISUAIS NO ROOT DO DOM (VDNA SOVEREIGNTY)
    useEffect(() => {
        if (!currentTokens) return;
        const root = document.documentElement;
        
        // Geometria Universal
        root.style.setProperty('--sie-radius', `${currentTokens.borderRadius}px`);
        root.style.setProperty('--sie-sidebar-width', sidebarCollapsed ? `${currentTokens.sidebarWidthCollapsed || 80}px` : `${currentTokens.sidebarWidth}px`);
        root.style.setProperty('--sie-viewport-padding', `${currentTokens.viewportPadding}px`);
        root.style.setProperty('--sie-padding-inner', `${currentTokens.containerPadding}px`);
        root.style.setProperty('--sie-border-spacing', `${currentTokens.borderSpacing}px`);
        root.style.setProperty('--sie-footer-h', `${currentTokens.footerHeight}px`);
        root.style.setProperty('--sie-font-base', `${currentTokens.fontSizeBase}px`);
        root.style.setProperty('--sie-font-scale', `${currentTokens.fontScale || 1.2}`);
        root.style.setProperty('--sie-form-overlap', `${currentTokens.formOverlapOffset}px`);
        root.style.setProperty('--sie-input-h', `${currentTokens.inputHeight || 56}px`);
        
        // SRE Master Typography & UI
        root.style.setProperty('--sie-font-weight-heading', `${currentTokens.fontWeightHeading || 900}`);
        root.style.setProperty('--sie-letter-spacing', `${(currentTokens.letterSpacingBase || 0) / 100}em`);
        root.style.setProperty('--sie-button-radius', `${currentTokens.buttonRadius ?? currentTokens.borderRadius}px`);
        root.style.setProperty('--sie-button-weight', `${currentTokens.buttonWeight || 900}`);
        root.style.setProperty('--sie-input-border-w', `${currentTokens.inputBorderWidth || 1}px`);
        root.style.setProperty('--sie-card-border-w', `${currentTokens.cardBorderWidth || 1}px`);
        root.style.setProperty('--sie-glass-opacity', `${(currentTokens.glassOpacity || 96) / 100}`);
        
        // SRE V90 Mobile Nav
        root.style.setProperty('--sie-mobile-menu-type', currentTokens.mobileMenuType || 'SIDEBAR');
        root.style.setProperty('--sie-mobile-menu-side', currentTokens.mobileMenuSide || 'left');

        // Cores e Superfícies
        root.style.setProperty('--sie-primary', currentTokens.primaryColor);
        root.style.setProperty('--sie-success', currentTokens.successColor || '#10b981');
        root.style.setProperty('--sie-danger', currentTokens.dangerColor || '#ef4444');
        root.style.setProperty('--sie-warning', currentTokens.warningColor || '#f59e0b');
        root.style.setProperty('--sie-surface', currentTokens.surfaceColor || '#f8fafc');
        root.style.setProperty('--sie-sidebar-bg', currentTokens.sidebarBg || '#020617');
        root.style.setProperty('--sie-sidebar-border', currentTokens.sidebarBorderColor || 'rgba(255,255,255,0.05)');
        root.style.setProperty('--sie-sidebar-text', currentTokens.sidebarTextColor || '#94a3b8');
        root.style.setProperty('--sie-sidebar-active', currentTokens.sidebarActiveColor || currentTokens.primaryColor);
        root.style.setProperty('--sie-sidebar-hover', currentTokens.sidebarHoverColor || 'rgba(255,255,255,0.05)');

        // Sombras
        const si = currentTokens.shadowIntensity || 0.1;
        const csi = currentTokens.cardShadowIntensity || si;
        root.style.setProperty('--sie-shadow-opacity', `${si}`);
        root.style.setProperty('--sie-shadow', `0 ${si * 10}px ${si * 15}px -3px rgba(0, 0, 0, ${si * 2})`);
        root.style.setProperty('--sie-shadow-lg', `0 ${csi * 20}px ${csi * 25}px -5px rgba(0, 0, 0, ${csi * 2})`);

        // Tipografia
        root.style.setProperty('--sie-title-align', currentTokens.centerTitle ? 'center' : 'left');
        root.style.setProperty('--sie-title-justify', currentTokens.centerTitle ? 'center' : 'flex-start');

    }, [currentTokens, sidebarCollapsed]);

    const sidebarManifest = useMemo(() => systemInfo.module_metadata?.sidebar || {}, [systemInfo]);

    const filteredMenu = useMemo(() => {
        if (!currentUser) return {};
        const isAllowed = (item: any) => currentUser.role === 'ADMIN' || dynamicPermissions.includes('*') || dynamicPermissions.includes(item.permissionId);
        const categories: Record<string, any[]> = {};
        MENU_ITEMS.forEach(item => {
            const manifest = sidebarManifest[item.id] || {};
            if (isAllowed(item) && manifest.visible !== false) {
                const cat = item.category || 'OUTROS';
                if (!categories[cat]) categories[cat] = [];
                categories[cat].push({
                    ...item,
                    label: t(manifest.label || item.label),
                    icon: manifest.icon ? ICON_MAP[manifest.icon] : item.icon
                });
            }
        });
        return categories;
    }, [currentUser, dynamicPermissions, sidebarManifest, t]);

    const renderContent = () => {
        if (!designSystem) return null;
        const props = { systemInfo, onNavigate: (tab: string) => { setActiveTab(tab); window.location.hash = tab; }, currentUser, permissions: dynamicPermissions, t, designSystem, setDesignSystem };
        switch (activeTab) {
            case 'dashboard': return currentUser?.role === 'RESIDENT' ? <ResidentDashboard {...props} /> : <Dashboard {...props} />;
            case 'settings': return <SettingsComp {...props} onUpdateSystemInfo={setSystemInfo} />;
            case 'users': return <UserManagement systemInfo={systemInfo} />;
            case 'operations': return <Operations systemInfo={systemInfo} />;
            case 'demographics': return <DemographicAnalysis {...props} />;
            case 'documents': return <DocumentHub {...props} sidebarCollapsed={sidebarCollapsed} />;
            case 'assemblies': return <AssemblyManager {...props} />;
            case 'neural_chat': return <ChatAssistant systemInfo={systemInfo} />;
            case 'finance': return <Finance systemInfo={systemInfo} />;
            case 'communication': return <Communication systemInfo={systemInfo} />;
            case 'marketplace': return <MarketPlace systemInfo={systemInfo} />;
            case 'reservations': return <Reservations systemInfo={systemInfo} />;
            case 'sustainability': return <Sustainability systemInfo={systemInfo} />;
            case 'suggestions': return <SuggestionBox systemInfo={systemInfo} />;
            case 'watchdog': return <DigitalWatch systemInfo={systemInfo} />;
            case 'surveys': return <Surveys systemInfo={systemInfo} />;
            case 'id_system': return <InternalIDSystem systemInfo={systemInfo} />;
            case 'messenger_bridge': return <MessengerBridge systemInfo={systemInfo} />;
            case 'concierge': return <Concierge systemInfo={systemInfo} />;
            case 'assets': return <Assets systemInfo={systemInfo} />;
            case 'timeline': return <Timeline systemInfo={systemInfo} />;
            case 'vehicles': return <VehicleManagement systemInfo={systemInfo} />;
            default: return <Dashboard {...props} />;
        }
    };

    if (isLoading) return <div className="h-screen w-screen flex items-center justify-center bg-[#020617]"><Loader2 className="animate-spin text-indigo-50" size={64} /></div>;
    if (isPublicCensus) return <div className="w-full h-screen overflow-y-auto bg-slate-50"><Suspense fallback={<div className="h-screen w-screen flex items-center justify-center bg-[#020617]"><Loader2 className="animate-spin text-indigo-500" size={64} /></div>}><PublicSenso /></Suspense></div>;
    if (!isAuthenticated) return <LoginScreen onLoginSuccess={handleLoginSuccess} systemInfo={systemInfo} />;

    return (
        <div className="flex h-screen w-full overflow-hidden bg-[var(--sie-surface)]">
            <aside className={`sidebar-glass flex flex-col ${sidebarOpen ? 'open' : ''} ${sidebarCollapsed ? 'w-20' : ''}`} style={{ width: 'var(--sie-sidebar-width)' }}>
                <div className="p-6 shrink-0 border-b" style={{ borderColor: 'var(--sie-sidebar-border)' }}>
                    <div className="flex items-center justify-between gap-4">
                        {!sidebarCollapsed && (
                            <div className="flex items-center gap-4 min-w-0">
                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center p-2 shadow-2xl" style={{ borderRadius: 'var(--sie-radius)' }}>
                                    {systemInfo.logoUrl ? <img src={systemInfo.logoUrl} className="w-full h-full object-contain" /> : <Shield size={20} className="text-indigo-600" />}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h1 className="text-xs font-black text-white tracking-tight leading-none truncate uppercase">{systemInfo.shortName}</h1>
                                    <p className="text-[7px] font-black uppercase text-indigo-400 mt-1">SRE KERNEL</p>
                                </div>
                            </div>
                        )}
                        <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2 text-slate-500 hover:text-white transition-colors rounded-lg hover:bg-[var(--sie-sidebar-hover)]">
                            {sidebarCollapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
                        </button>
                    </div>
                </div>
                
                <div className={`px-4 py-2 ${sidebarCollapsed ? 'hidden' : ''}`}>
                    <ServerClock />
                </div>

                <nav className="flex-1 overflow-y-auto custom-scrollbar px-3 py-4 space-y-6">
                    {Object.entries(filteredMenu).map(([category, items]) => (
                        <div key={category} className="space-y-1">
                            {!sidebarCollapsed && <h5 className="px-4 mb-2 text-[8px] font-black uppercase tracking-[0.4em] opacity-40 text-slate-400">{t(category)}</h5>}
                            <div className="space-y-0.5">
                                {items.map(item => (
                                    <button key={item.id} onClick={() => { setActiveTab(item.id); window.location.hash = item.id; if(isMobileView) setSidebarOpen(false); }} 
                                        className={`sidebar-item w-full flex items-center gap-4 px-4 py-2.5 rounded-xl transition-all ${activeTab === item.id ? 'shadow-xl text-white' : 'hover:bg-[var(--sie-sidebar-hover)]'}`}
                                        style={{ 
                                            borderRadius: 'var(--sie-radius)',
                                            backgroundColor: activeTab === item.id ? 'var(--sie-sidebar-active)' : 'transparent',
                                            color: activeTab === item.id ? '#ffffff' : 'var(--sie-sidebar-text)'
                                        }}
                                    >
                                        <item.icon size={18} className="shrink-0" />
                                        {!sidebarCollapsed && <span className="text-[10px] font-black uppercase tracking-widest truncate">{item.label}</span>}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>
                <div className="p-4 border-t bg-black/10" style={{ borderColor: 'var(--sie-sidebar-border)' }}>
                    <button onClick={() => { localStorage.removeItem('sie_auth_token'); window.location.reload(); }} className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-all font-black text-[9px] uppercase tracking-widest" style={{ borderRadius: 'var(--sie-radius)' }}>
                        <LogOut size={18} />
                        {!sidebarCollapsed && <span>Sair</span>}
                    </button>
                </div>
            </aside>
            <main className="flex-1 relative flex flex-col min-w-0 h-full">
                <div className="sie-viewport-content custom-scrollbar">
                    <Suspense fallback={<div className="flex-1 flex flex-col items-center justify-center p-20"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>}>{renderContent()}</Suspense>
                </div>
                <button onClick={() => setSidebarOpen(true)} className="lg:hidden fixed bottom-6 right-6 z-[100] p-5 bg-slate-900 text-white rounded-full shadow-2xl" style={{ borderRadius: 'var(--sie-radius)' }}><Menu size={24} /></button>
            </main>
        </div>
    );
};

export default App;
