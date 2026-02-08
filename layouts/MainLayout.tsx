
import React, { useState, useEffect, useMemo } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
    LayoutDashboard, Wallet, Users, Bell, ShieldAlert, CalendarClock, 
    Settings, ClipboardList, BarChart3, Shield, FileText, Gavel, 
    Camera, Leaf, ShoppingBag, HelpCircle, Box, Brain, 
    Fingerprint, Smartphone, UserCheck, ShieldCheck, Archive, Terminal, 
    Car, Menu, X, LogOut, PanelLeftClose, PanelLeft, MoreHorizontal, Activity,
    Zap, Signal, Globe, Palette, Home, MessageSquare, Calendar as CalendarIcon,
    Search, Command, Cpu, Radio, AlertCircle, Scale
} from 'lucide-react';
import { useSystem } from '../contexts/SystemContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import ServerClock from '../components/ServerClock';
import CommandPalette from '../components/CommandPalette';
import { MENU_ITEMS } from '../constants';

const ICON_MAP: Record<string, any> = {
    LayoutDashboard, Wallet, Users, Bell, ShieldAlert, CalendarClock, Settings, ClipboardList,
    BarChart3, FileText, Gavel, Camera, Leaf, ShoppingBag, HelpCircle, Box, Brain,
    Fingerprint, Smartphone, UserCheck, ShieldCheck, Archive, Terminal, Car, Palette, Scale
};

const MainLayout = () => {
    const { systemInfo, t } = useSystem();
    const { user, permissions, logout } = useAuth();
    const { currentTokens } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isMobileView, setIsMobileView] = useState(window.innerWidth < 1024);
    const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
    
    useEffect(() => {
        const handleResize = () => setIsMobileView(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);

        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsCommandPaletteOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const moduleMetadata = useMemo(() => systemInfo.module_metadata || {}, [systemInfo]);

    const filteredMenu: Record<string, any[]> = useMemo(() => {
        if (!user) return {};
        const isAllowed = (item: any) => user.role === 'ADMIN' || permissions.includes('*') || permissions.includes(item.permissionId);
        const categories: Record<string, any[]> = {};
        
        MENU_ITEMS.forEach(item => {
            if (isAllowed(item)) {
                const metadata = moduleMetadata[item.id] || {};
                const cat = item.category || 'OUTROS';
                if (!categories[cat]) categories[cat] = [];
                categories[cat].push({
                    ...item,
                    label: metadata.title || item.label
                });
            }
        });
        return categories;
    }, [user, permissions, moduleMetadata]);

    const activeTab = useMemo(() => {
        const path = location.pathname;
        if (path === '/terminal' || path === '/terminal/') return 'dashboard';
        return path.split('/').pop() || 'dashboard';
    }, [location.pathname]);

    const handleNavigate = (id: string) => {
        if (id === 'menu_toggle') {
            setSidebarOpen(true);
            return;
        }
        if (id === 'studio_lab') {
            navigate('/studio_lab');
        } else if (id === 'dashboard') {
            navigate('/terminal');
        } else {
            navigate(`/terminal/${id}`);
        }
        if (isMobileView) setSidebarOpen(false);
    };

    const pageMetadata = useMemo(() => {
        const currentModule = MENU_ITEMS.find(m => m.id === activeTab) || MENU_ITEMS[0];
        const customMeta = moduleMetadata[activeTab] || {};
        return {
            title: customMeta.title || t(currentModule.label),
            slogan: customMeta.slogan || `ORQUESTRAÇÃO DE ${t(currentModule.category)}`
        };
    }, [activeTab, moduleMetadata, t]);

    const primaryColor = systemInfo.primaryColor || '#4f46e5';

    return (
        <div className="flex h-screen w-full overflow-hidden bg-[#f8fafc] font-sans selection:bg-indigo-600 selection:text-white">
            <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} />
            
            {/* SIDEBAR / MOBILE DRAWER */}
            <aside 
                className={`sidebar-glass shrink-0 transition-all duration-500 border-white/5 flex flex-col bg-slate-950 text-slate-400 shadow-[20px_0_60px_rgba(0,0,0,0.4)] relative z-[150] ${isMobileView ? (sidebarOpen ? 'fixed inset-y-0 left-0 border-r rounded-r-[3rem] animate-slide-in-left' : 'w-0 overflow-hidden opacity-0 pointer-events-none') : (sidebarCollapsed ? 'w-24 border-r' : 'w-80 border-r')}`}
                style={{ 
                    width: isMobileView ? (sidebarOpen ? '85%' : '0') : (sidebarCollapsed ? `${currentTokens?.sidebarWidthCollapsed || 96}px` : `${currentTokens?.sidebarWidth || 320}px`),
                    backgroundColor: currentTokens?.sidebarBg || '#020617'
                }}
            >
                <div className="p-8 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 bg-indigo-600 rounded-[1.8rem] flex items-center justify-center text-white shadow-[0_10px_30px_rgba(79,70,229,0.3)] transition-all hover:scale-105 border border-indigo-400/20" style={{ backgroundColor: primaryColor }}>
                            <Fingerprint size={32} />
                        </div>
                        {(!sidebarCollapsed || isMobileView) && (
                            <div className="min-w-0 animate-fade-in">
                                <span className="font-black text-white text-base tracking-tightest uppercase truncate block leading-none">{systemInfo.shortName}</span>
                                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.5em] mt-2 block opacity-70">Alpha Node</span>
                            </div>
                        )}
                    </div>
                    {isMobileView && (
                        <button onClick={() => setSidebarOpen(false)} className="p-3 bg-white/5 rounded-xl text-slate-400">
                            <X size={20}/>
                        </button>
                    )}
                </div>

                <nav className="flex-1 overflow-y-auto p-6 space-y-12 custom-scrollbar">
                    {Object.entries(filteredMenu).map(([category, items]) => (
                        <div key={category} className="space-y-3">
                            {(!sidebarCollapsed || isMobileView) && <h5 className="px-5 mb-4 text-[9px] font-black uppercase tracking-[0.5em] text-slate-600 opacity-60 border-l border-indigo-500/30 ml-2">{t(category)}</h5>}
                            {items.map(item => (
                                <button 
                                    key={item.id} 
                                    onClick={() => handleNavigate(item.id)}
                                    className={`w-full flex items-center gap-5 px-5 py-4 rounded-[1.5rem] transition-all group relative ${activeTab === item.id ? 'bg-white/10 text-white shadow-xl border border-white/5' : 'hover:bg-white/5 hover:text-slate-200'}`}
                                >
                                    {activeTab === item.id && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500 rounded-r-full shadow-[0_0_15px_#6366f1] animate-pulse" style={{ backgroundColor: primaryColor }}></div>}
                                    <item.icon size={currentTokens?.sidebarIconSize || 20} className={activeTab === item.id ? 'text-indigo-400' : 'text-slate-500 group-hover:text-indigo-300'} style={activeTab === item.id ? { color: currentTokens?.sidebarActiveColor || primaryColor } : {}} />
                                    {(!sidebarCollapsed || isMobileView) && <span className={`text-[11px] font-black uppercase tracking-widest truncate ${activeTab === item.id ? 'text-white' : 'text-slate-400'}`} style={activeTab === item.id ? { color: currentTokens?.sidebarTextColor || '#fff' } : {}}>{t(item.label)}</span>}
                                </button>
                            ))}
                        </div>
                    ))}
                </nav>

                <div className="p-8 border-t border-white/5 space-y-8 bg-black/20">
                    <button onClick={logout} className="w-full flex items-center gap-5 px-5 py-5 text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all font-black text-[11px] uppercase tracking-widest group active:scale-95 border border-transparent hover:border-rose-500/20">
                        <LogOut size={22} className="group-hover:-translate-x-1 transition-transform" />
                        {(!sidebarCollapsed || isMobileView) && <span>Encerrar Sessão</span>}
                    </button>
                </div>
            </aside>

            <main className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] relative overflow-hidden">
                <div className="h-28 px-6 lg:px-12 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 z-50 shadow-sm relative overflow-hidden">
                    <div className="absolute inset-0 sre-scanline opacity-[0.01] pointer-events-none"></div>
                    <div className={`flex items-center gap-8 relative z-10 w-full ${currentTokens?.centerTitle ? 'justify-center' : 'justify-start'}`}>
                        {isMobileView && !currentTokens?.centerTitle && (
                            <button onClick={() => setSidebarOpen(true)} className="p-4 bg-slate-900 text-white rounded-[1.5rem] shadow-xl active:scale-95 transition-all border border-white/10"><Menu size={24}/></button>
                        )}
                        <div className={`space-y-2 ${currentTokens?.centerTitle ? 'text-center' : ''}`}>
                            <h2 className="text-2xl lg:text-4xl font-black text-slate-900 uppercase tracking-tightest leading-none truncate max-w-[220px] lg:max-w-none">{pageMetadata.title}</h2>
                            <div className={`flex items-center gap-6 ${currentTokens?.centerTitle ? 'justify-center' : ''}`}>
                                <div className={`flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-100 rounded-lg text-emerald-500`}>
                                    <ShieldCheck size={12} className="animate-pulse" />
                                    <span className="text-[9px] font-black uppercase tracking-widest">SAFE LEVEL</span>
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:flex items-center gap-2">
                                    <Radio size={14} className="text-indigo-500 animate-pulse" /> {pageMetadata.slogan}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="hidden lg:flex items-center gap-8 relative z-10">
                        <button 
                            onClick={() => setIsCommandPaletteOpen(true)}
                            className="flex items-center gap-5 px-8 py-4 bg-slate-50 border border-slate-200 rounded-[1.5rem] text-slate-500 hover:border-indigo-500 hover:text-indigo-600 hover:bg-white transition-all group shadow-inner"
                        >
                            <Search size={18} className="group-hover:scale-110 transition-transform" />
                            <span className="text-[11px] font-black uppercase tracking-widest">Busca Tática</span>
                            <div className="flex items-center gap-1.5 ml-4 px-3 py-1 bg-white border border-slate-200 rounded-xl shadow-sm">
                                <Command size={12} /> <span className="text-[11px] font-black text-slate-900">K</span>
                            </div>
                        </button>
                        <ServerClock />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-12 relative bg-[#f1f5f9]/50">
                    <Outlet />
                </div>

                {/* BOTTOM NAV INTELIGENTE (Mobile Only) */}
                {isMobileView && (
                    <div className="bg-white/95 backdrop-blur-2xl border-t border-slate-200 h-24 px-8 flex justify-between items-center z-[110] shadow-[0_-15px_50px_rgba(0,0,0,0.15)] rounded-t-[3.5rem] shrink-0">
                        {[
                            { id: 'dashboard', icon: Home, label: 'Painel' },
                            { id: 'communication', icon: Bell, label: 'Mural' },
                            { id: 'wallet', icon: Smartphone, label: 'ID Pass' },
                            { id: 'reservations', icon: CalendarIcon, label: 'Reservas' },
                            { id: 'menu_toggle', icon: Menu, label: 'Mais' },
                        ].map(item => (
                            <button 
                                key={item.id} 
                                onClick={() => handleNavigate(item.id)}
                                className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all ${activeTab === item.id ? 'text-indigo-600 scale-110 font-bold' : 'text-slate-400'}`}
                            >
                                <item.icon size={24} className={activeTab === item.id ? 'fill-indigo-600/10' : ''} />
                                <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
                            </button>
                        ))}
                    </div>
                )}
            </main>

            {/* OVERLAY PARA SIDEBAR MOBILE */}
            {isMobileView && sidebarOpen && (
                <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[140] animate-fade-in" onClick={() => setSidebarOpen(false)} />
            )}
        </div>
    );
};

export default MainLayout;
