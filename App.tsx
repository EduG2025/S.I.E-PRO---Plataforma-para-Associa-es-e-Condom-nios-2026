
import React, { useState, Suspense, lazy, useEffect, useMemo } from 'react';
import { MENU_ITEMS, DEFAULT_SYSTEM_INFO } from './constants';
import { SystemInfo, User, DualDesignSystem } from './types';
import {
    LogOut, Menu, Loader2, Shield, PanelLeftClose, PanelLeft,
    LayoutDashboard, Wallet, Users, Bell, ShieldAlert, Settings, ClipboardList,
    BarChart3, FileText, Gavel, Camera, Leaf, ShoppingBag,
    HelpCircle, Box, Brain, Fingerprint, Smartphone, UserCheck,
    ShieldCheck, Archive, CalendarClock, Lock, Terminal, Car, X, MoreHorizontal
} from 'lucide-react';
import { systemService, authService, studioService, api } from './services/api';

import LoginScreen from './components/LoginScreen';
import ServerClock from './components/ServerClock';
import LockScreen from './components/LockScreen';

const ICON_MAP: Record<string, any> = {
    LayoutDashboard, Wallet, Users, Bell, ShieldAlert, CalendarClock, Settings, ClipboardList,
    BarChart3, FileText, Gavel, Camera, Leaf, ShoppingBag, HelpCircle, Box, Brain, 
    Fingerprint, Smartphone, UserCheck, ShieldCheck, Archive, Terminal, Car
};

// Lazy Imports
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
    // 1. STATE HOOKS (ALWAYS CALL)
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
    const [isSuspended, setIsSuspended] = useState(false);

    const isPublicCensus = window.location.pathname.startsWith('/census/');

    // 2. MEMO HOOKS (ALWAYS CALL)
    const t = useMemo(() => (term: string) => {
        const dict = systemInfo.dictionary || {};
        return dict[term.toUpperCase()] || term;
    }, [systemInfo.dictionary]);

    const currentTokens = useMemo(() => {
        if (!designSystem) return null;
        return isMobileView ? designSystem.mobile : designSystem.desktop;
    }, [designSystem, isMobileView]);

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

    const bottomNavItems = useMemo(() => {
        const allItems = Object.values(filteredMenu).flat();
        const priorityIds = ['dashboard', 'communication', 'neural_chat', 'settings'];
        return priorityIds.map(id => allItems.find(i => i.id === id)).filter(Boolean);
    }, [filteredMenu]);

    // 3. EFFECT HOOKS (ALWAYS CALL)
    useEffect(() => {
        const handleResize = () => setIsMobileView(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const initKernel = async () => {
            const token = localStorage.getItem('sie_auth_token');
            try {
                // Tenta carregar informações do sistema (Público)
                const infoRes = await api.get('/public/system-info');
                
                // Checagem de Suspensão SRE (Baseada na resposta da API)
                if (infoRes.data.license_status === 'SUSPENDED') {
                    setSystemInfo(infoRes.data);
                    setIsSuspended(true);
                    setIsLoading(false);
                    return; // Interrompe o carregamento do resto
                }

                const designRes = await studioService.getTokens();
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
            } catch (error) { 
                console.error("Kernel Init Fail", error);
            } finally { 
                setIsLoading(false); 
            }
        };
        initKernel();
    }, [isPublicCensus]);

    // ... (Restante dos hooks e efeitos visuais)

    useEffect(() => {
        if (!isLoading && isAuthenticated && activeTab !== 'dashboard') {
            const item = MENU_ITEMS.find(m => m.id === activeTab);
            if (item && !dynamicPermissions.includes('*') && !dynamicPermissions.includes(item.permissionId)) {
                setActiveTab('dashboard');
                window.location.hash = 'dashboard';
            }
        }
    }, [activeTab, dynamicPermissions, isLoading, isAuthenticated]);

    // SRE: INJEÇÃO DE TOKENS VISUAIS NO ROOT DO DOM
    useEffect(() => {
        if (!currentTokens) return;
        const root = document.documentElement;
        
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
        
        root.style.setProperty('--sie-font-weight-heading', `${currentTokens.fontWeightHeading || 900}`);
        root.style.setProperty('--sie-letter-spacing', `${(currentTokens.letterSpacingBase || 0) / 100}em`);
        root.style.setProperty('--sie-button-radius', `${currentTokens.buttonRadius ?? currentTokens.borderRadius}px`);
        root.style.setProperty('--sie-button-weight', `${currentTokens.buttonWeight || 900}`);
        root.style.setProperty('--sie-input-border-w', `${currentTokens.inputBorderWidth || 1}px`);
        root.style.setProperty('--sie-card-border-w', `${currentTokens.cardBorderWidth || 1}px`);
        root.style.setProperty('--sie-glass-opacity', `${(currentTokens.glassOpacity || 96) / 100}`);
        
        root.style.setProperty('--sie-mobile-menu-type', currentTokens.mobileMenuType || 'SIDEBAR');
        root.style.setProperty('--sie-mobile-menu-side', currentTokens.mobileMenuSide || 'left');

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

        const si = currentTokens.shadowIntensity || 0.1;
        const csi = currentTokens.cardShadowIntensity || si;
        root.style.setProperty('--sie-shadow-opacity', `${si}`);
        root.style.setProperty('--sie-shadow', `0 ${si * 10}px ${si * 15}px -3px rgba(0, 0, 0, ${si * 2})`);
        root.style.setProperty('--sie-shadow-lg', `0 ${csi * 20}px ${csi * 25}px -5px rgba(0, 0, 0, ${csi * 2})`);

        root.style.setProperty('--sie-title-align', currentTokens.centerTitle ? 'center' : 'left');
        root.style.setProperty('--sie-title-justify', currentTokens.centerTitle ? 'center' : 'flex-start');

    }, [currentTokens, sidebarCollapsed]);

    // 4. CONDITIONAL RENDERING (MUST BE AFTER ALL HOOKS)
    const handleLoginSuccess = (user: User, token: string) => {
        localStorage.setItem('sie_auth_token', token);
        // SRE: Reload para aplicar permissões limpas
        window.location.reload();
    };

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
    
    // SRE: Bloqueio Financeiro (Kill Switch UI)
    // Permite login de ADMIN para desbloqueio, mas bloqueia UI normal para outros
    if (isSuspended && (!isAuthenticated || (currentUser?.role !== 'ADMIN'))) {
        return (
            <>
                {!isAuthenticated ? (
                    <div className="relative">
                        <LockScreen systemInfo={systemInfo} />
                        {/* Botão discreto para login de Admin (Recuperação) */}
                        <div className="absolute top-4 right-4 z-50">
                            <button onClick={() => setIsSuspended(false)} className="text-[10px] text-slate-700 hover:text-white uppercase font-black tracking-widest opacity-20 hover:opacity-100 transition-all">SRE LOGIN</button>
                        </div>
                    </div>
                ) : (
                    // Se estiver logado mas não for ADMIN, mostra bloqueio
                    <LockScreen systemInfo={systemInfo} />
                )}
            </>
        );
    }

    if (isPublicCensus) return <div className="w-full h-screen overflow-y-auto bg-slate-50"><Suspense fallback={<div className="h-screen w-screen flex items-center justify-center bg-[#020617]"><Loader2 className="animate-spin text-indigo-500" size={64} /></div>}><PublicSenso /></Suspense></div>;
    if (!isAuthenticated) return <LoginScreen onLoginSuccess={handleLoginSuccess} systemInfo={systemInfo} />;

    // SRE Mobile Architecture Logic
    const mobileMenuType = currentTokens?.mobileMenuType || 'SIDEBAR';
    const mobileMenuSide = currentTokens?.mobileMenuSide || 'left';
    const shouldShowSidebar = !isMobileView || (mobileMenuType !== 'BOTTOM_NAV');
    
    const sidebarContainerClass = isMobileView 
        ? mobileMenuType === 'DRAWER_TOP'
            ? `fixed top-0 left-0 w-full max-h-[85vh] z-[200] border-b border-white/10 transition-transform duration-500 ease-out ${sidebarOpen ? 'translate-y-0 shadow-2xl' : '-translate-y-full'}`
            : `fixed inset-y-0 ${mobileMenuSide === 'right' ? 'right-0 border-l' : 'left-0 border-r'} w-[85%] z-[200] transition-transform duration-300 ${sidebarOpen ? 'translate-x-0 shadow-2xl' : (mobileMenuSide === 'right' ? 'translate-x-full' : '-translate-x-full')}`
        : `relative h-full transition-all duration-300 ${sidebarCollapsed ? 'w-20' : 'w-[var(--sie-sidebar-width)]'} border-r border-[var(--sie-sidebar-border)]`;

    return (
        <div className="flex h-screen w-full overflow-hidden bg-[var(--sie-surface)]">
            
            {/* BACKDROP FOR MOBILE SIDEBAR/DRAWER */}
            {isMobileView && sidebarOpen && (
                <div 
                    className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[190] animate-fade-in" 
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* SIDEBAR / DRAWER CORE */}
            {shouldShowSidebar && (
                <aside className={`sidebar-glass flex flex-col ${sidebarContainerClass}`} style={!isMobileView ? { width: 'var(--sie-sidebar-width)' } : {}}>
                    {/* Header */}
                    <div className="p-6 shrink-0 border-b flex items-center justify-between" style={{ borderColor: 'var(--sie-sidebar-border)' }}>
                        <div className="flex items-center gap-4 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center p-2 shadow-2xl shrink-0" style={{ borderRadius: 'var(--sie-radius)' }}>
                                {systemInfo.logoUrl ? <img src={systemInfo.logoUrl} className="w-full h-full object-contain" /> : <Shield size={20} className="text-indigo-600" />}
                            </div>
                            {!sidebarCollapsed && (
                                <div className="min-w-0 flex-1">
                                    <h1 className="text-xs font-black text-white tracking-tight leading-none truncate uppercase">{systemInfo.shortName}</h1>
                                    <p className="text-[7px] font-black uppercase text-indigo-400 mt-1">SRE KERNEL</p>
                                </div>
                            )}
                        </div>
                        
                        {/* Mobile Close Button */}
                        {isMobileView && (
                            <button onClick={() => setSidebarOpen(false)} className="p-2 text-white/50 hover:text-white"><X size={24}/></button>
                        )}

                        {/* Desktop Collapse Button */}
                        {!isMobileView && (
                            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2 text-slate-500 hover:text-white transition-colors rounded-lg hover:bg-[var(--sie-sidebar-hover)]">
                                {sidebarCollapsed ? <PanelLeft size={16} /> : <PanelLeftClose size={16} />}
                            </button>
                        )}
                    </div>
                    
                    {/* Clock (Desktop Only) */}
                    {!isMobileView && (
                        <div className={`px-4 py-2 ${sidebarCollapsed ? 'hidden' : ''}`}>
                            <ServerClock />
                        </div>
                    )}

                    {/* Navigation Items */}
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

                    {/* Footer / Logout */}
                    <div className="p-4 border-t bg-black/10" style={{ borderColor: 'var(--sie-sidebar-border)' }}>
                        <button onClick={() => { localStorage.removeItem('sie_auth_token'); window.location.reload(); }} className="w-full flex items-center gap-4 px-4 py-3 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-all font-black text-[9px] uppercase tracking-widest" style={{ borderRadius: 'var(--sie-radius)' }}>
                            <LogOut size={18} />
                            {!sidebarCollapsed && <span>Sair</span>}
                        </button>
                    </div>
                </aside>
            )}

            <main className="flex-1 relative flex flex-col min-w-0 h-full overflow-hidden">
                {/* SRE ADMIN UNLOCK BANNER */}
                {isSuspended && currentUser?.role === 'ADMIN' && (
                    <div className="bg-rose-600 text-white p-2 text-center text-[10px] font-black uppercase tracking-widest flex justify-between items-center px-4">
                        <span>⚠️ MODO DE SEGURANÇA: SISTEMA SUSPENSO. ACESSO RESTRITO AO ADMINISTRADOR.</span>
                        <button onClick={async () => {
                            if(confirm('Reativar licença do sistema?')) {
                                await api.post('/settings/toggle-license', { status: 'ACTIVE' });
                                window.location.reload();
                            }
                        }} className="bg-white text-rose-600 px-3 py-1 rounded hover:bg-rose-50">REATIVAR AGORA</button>
                    </div>
                )}

                <div className="sie-viewport-content custom-scrollbar pb-24 lg:pb-0">
                    <Suspense fallback={<div className="flex-1 flex flex-col items-center justify-center p-20"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>}>{renderContent()}</Suspense>
                </div>
                
                {/* MOBILE TRIGGER */}
                {isMobileView && mobileMenuType !== 'BOTTOM_NAV' && (
                    <button 
                        onClick={() => setSidebarOpen(true)} 
                        className={`lg:hidden fixed bottom-6 z-[100] p-4 bg-slate-900 text-white rounded-full shadow-2xl transition-all active:scale-95 ${mobileMenuSide === 'right' ? 'right-6' : 'left-6'}`} 
                        style={{ borderRadius: 'var(--sie-radius)' }}
                    >
                        <Menu size={24} />
                    </button>
                )}

                {/* BOTTOM NAVIGATION BAR */}
                {isMobileView && mobileMenuType === 'BOTTOM_NAV' && (
                    <div className="fixed bottom-0 left-0 w-full h-20 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.1)] flex items-center justify-around z-[150] pb-2">
                        {bottomNavItems.map((item: any) => (
                            <button 
                                key={item.id} 
                                onClick={() => { setActiveTab(item.id); window.location.hash = item.id; }}
                                className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all ${activeTab === item.id ? 'text-indigo-600' : 'text-slate-400'}`}
                            >
                                <div className={`p-1.5 rounded-xl ${activeTab === item.id ? 'bg-indigo-50' : 'bg-transparent'}`}>
                                    <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 2} />
                                </div>
                                <span className="text-[9px] font-black uppercase tracking-tight">{item.label.split(' ')[0]}</span>
                            </button>
                        ))}
                        <button 
                            onClick={() => setSidebarOpen(true)} 
                            className="flex flex-col items-center justify-center gap-1 p-2 text-slate-400"
                        >
                            <MoreHorizontal size={24} />
                            <span className="text-[9px] font-black uppercase tracking-tight">Mais</span>
                        </button>
                    </div>
                )}

                {/* BOTTOM NAV EXPANDED MENU */}
                {isMobileView && mobileMenuType === 'BOTTOM_NAV' && sidebarOpen && (
                     <div className="fixed inset-0 z-[200] flex flex-col justify-end">
                        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)}></div>
                        <div className="bg-white rounded-t-[2.5rem] p-6 max-h-[80vh] overflow-y-auto relative animate-slide-up shadow-2xl">
                            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8"></div>
                            <div className="grid grid-cols-4 gap-4 mb-8">
                                {Object.values(filteredMenu).flat().map((item: any) => (
                                    <button 
                                        key={item.id} 
                                        onClick={() => { setActiveTab(item.id); window.location.hash = item.id; setSidebarOpen(false); }}
                                        className={`flex flex-col items-center gap-2 p-3 rounded-2xl border ${activeTab === item.id ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-slate-50 border-slate-100 text-slate-500'}`}
                                    >
                                        <item.icon size={24}/>
                                        <span className="text-[8px] font-black uppercase text-center leading-tight">{item.label}</span>
                                    </button>
                                ))}
                            </div>
                            <button onClick={() => { localStorage.removeItem('sie_auth_token'); window.location.reload(); }} className="w-full py-4 bg-slate-100 text-rose-500 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                                <LogOut size={16}/> Encerrar Sessão
                            </button>
                        </div>
                     </div>
                )}
            </main>
        </div>
    );
};

export default App;
