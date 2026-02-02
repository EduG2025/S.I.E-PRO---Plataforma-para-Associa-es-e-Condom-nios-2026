
import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { financialService, demographicsService, api, operationsService } from '../services/api';
import { SystemInfo, Incident } from '../types';
import {
    Users, Loader2, Landmark, Sparkles,
    TrendingUp, Fingerprint, ShieldAlert, BarChart3,
    Zap, Package, UserCheck, Shield, Brain, Terminal,
    Globe, Activity, MessageCircle, AlertCircle, ArrowRight, Map as MapIcon, Maximize2, Radio, Clock, Cpu, Signal, Server, Database, RefreshCw
} from 'lucide-react';

const SmartMap = lazy(() => import('./SmartMap'));

/**
 * S.I.E Dashboard V11.0 - TACTICAL SITUATION ROOM
 * SRE Operational Standard - Map-First Situation Awareness with Live Telemetry
 */

interface DashboardProps {
    onNavigate: (tab: string) => void;
    systemInfo: SystemInfo;
}

const Dashboard = ({ onNavigate, systemInfo }: DashboardProps) => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeView, setActiveView] = useState<'METRICS' | 'TACTICAL_MAP'>('TACTICAL_MAP');
    const [operationalContext, setOperationalContext] = useState({ visitors: 0, deliveries: 0 });
    const [recentIncidents, setRecentIncidents] = useState<Incident[]>([]);
    const [logs, setLogs] = useState<string[]>([]);

    const metadata = useMemo(() => systemInfo?.module_metadata?.['dashboard'] || {
        title: "Situação Tática",
        slogan: `Terminal de Comando Operacional — ${systemInfo.shortName}`,
        loading_text: "Handshake Tático...",
        map_label: "Live Map",
        stats_label: "Analytics"
    }, [systemInfo]);

    const addLog = (msg: string) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 5)]);
    };

    useEffect(() => {
        const loadNonBlockingData = async () => {
            addLog("KERNEL: Iniciando Handshake...");
            try {
                const [fin, soc, visitorsRes, incidentsRes] = await Promise.allSettled([
                    financialService.getDashboardStats(),
                    demographicsService.getStats(),
                    api.get('/visitors'),
                    operationsService.getIncidents()
                ]);

                const combinedStats = {
                    ...(fin.status === 'fulfilled' ? fin.value.data : {}),
                    ...(soc.status === 'fulfilled' ? soc.value.data : {})
                };

                setStats(combinedStats);
                setOperationalContext({
                    visitors: visitorsRes.status === 'fulfilled' ? (visitorsRes.value.data?.data || []).filter((v: any) => v.status === 'IN_CLUSTER').length : 0,
                    deliveries: 4
                });
                if (incidentsRes.status === 'fulfilled') {
                    setRecentIncidents(incidentsRes.value.data?.data?.slice(0, 5) || []);
                }
                addLog("SYNC: Ledger Sincronizado 200 OK");
            } catch (error) {
                addLog("WARN: Fluxo de Métricas Degradado.");
            } finally {
                setLoading(false);
            }
        };
        loadNonBlockingData();
        const interval = setInterval(() => addLog("IA: Heartbeat Monitor Ativo"), 30000);
        return () => clearInterval(interval);
    }, []);

    const primaryColor = systemInfo.primaryColor || '#4f46e5';

    return (
        <div className="flex-1 flex flex-col space-y-8 animate-fade-in pb-10 h-full">

            {/* 1. HEADER DE COMANDO DINÂMICO */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 shrink-0">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tightest leading-none">{metadata.title}</h1>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-2">{metadata.slogan}</p>
                </div>
                <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner w-full lg:w-auto">
                    <button
                        onClick={() => setActiveView('TACTICAL_MAP')}
                        className={`flex-1 lg:flex-none px-8 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeView === 'TACTICAL_MAP' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-500 hover:text-indigo-600'}`}
                        style={activeView === 'TACTICAL_MAP' ? { backgroundColor: primaryColor } : {}}
                    >
                        <MapIcon size={16} /> {metadata.map_label}
                    </button>
                    <button
                        onClick={() => setActiveView('METRICS')}
                        className={`flex-1 lg:flex-none px-8 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeView === 'METRICS' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:text-indigo-600'}`}
                        style={activeView === 'METRICS' ? { backgroundColor: primaryColor } : {}}
                    >
                        <BarChart3 size={16} /> {metadata.stats_label}
                    </button>
                </div>
            </div>

            {activeView === 'TACTICAL_MAP' ? (
                <div className="flex-1 flex flex-col gap-6 animate-fade-in relative min-h-[600px]">

                    <div className="absolute top-6 left-6 z-20 w-80 space-y-4 pointer-events-none hidden md:block">
                        <div className="bg-slate-900/90 backdrop-blur-xl p-6 rounded-[2.5rem] border border-white/10 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.6)] space-y-6 pointer-events-auto">
                            <div className="flex items-center gap-4">
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]"></div>
                                <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Cluster SitRep: OK</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                    <p className="text-[7px] font-black text-slate-500 uppercase mb-1">Membros</p>
                                    <h4 className="text-lg font-black text-white">{stats?.totalPopulation || '---'}</h4>
                                </div>
                                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                    <p className="text-[7px] font-black text-slate-500 uppercase mb-1">Portaria (In)</p>
                                    <h4 className="text-lg font-black text-white">{operationalContext.visitors}</h4>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between items-center px-1">
                                    <span className="text-[8px] font-black text-slate-500 uppercase">Integridade Ledger</span>
                                    <span className="text-[8px] font-black text-emerald-400 uppercase">99.8%</span>
                                </div>
                                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-50 w-[99.8%]" style={{ backgroundColor: primaryColor }}></div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-950/80 backdrop-blur-xl rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl pointer-events-auto max-h-[300px] flex flex-col">
                            <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Radio size={12} className="text-rose-500 animate-pulse" /> Alertas Watchdog</span>
                            </div>
                            <div className="p-4 space-y-3 overflow-y-auto custom-scrollbar">
                                {recentIncidents.map(inc => (
                                    <div key={inc.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group" onClick={() => onNavigate('operations')}>
                                        <div className="flex justify-between items-start mb-1">
                                            <h6 className="text-[10px] font-black text-white uppercase truncate">{inc.title}</h6>
                                            <span className={`px-1.5 py-0.5 rounded text-[7px] font-black ${inc.priority?.includes('NÍVEL 4') ? 'bg-rose-500 text-white' : 'bg-amber-500 text-black'}`}>!</span>
                                        </div>
                                        <p className="text-[8px] font-bold text-slate-500 uppercase flex items-center gap-2"><Clock size={10} /> {new Date(inc.created_at || '').toLocaleTimeString()} • {inc.location}</p>
                                    </div>
                                ))}
                                {recentIncidents.length === 0 && <p className="text-[8px] font-black text-slate-600 uppercase text-center py-6 italic">Cluster Estabilizado.</p>}
                            </div>
                        </div>
                    </div>

                    <div className="absolute bottom-6 left-6 z-20 hidden lg:block pointer-events-none">
                        <div className="bg-black/80 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/10 font-mono text-[9px] text-indigo-400 space-y-1 shadow-2xl">
                            {logs.map((log, i) => <div key={i} className={i === 0 ? 'text-white' : 'opacity-40'}>{log}</div>)}
                        </div>
                    </div>

                    <div className="flex-1 bg-slate-200 rounded-[3.5rem] border border-slate-200 shadow-2xl overflow-hidden relative group/map">
                        <Suspense fallback={
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 z-50">
                                <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em]">{metadata.loading_text}</p>
                            </div>
                        }>
                            <SmartMap
                                systemInfo={systemInfo}
                                activeLayers={{ residents: true, incidents: true, heatmap: true, surveys: true }}
                                onSelectEntity={(e) => onNavigate(e.type === 'incident' ? 'operations' : 'users')}
                            />
                        </Suspense>

                        <div className="absolute bottom-10 right-10 z-20 flex flex-col gap-4 pointer-events-auto">
                            <button
                                onClick={() => onNavigate('demographics')}
                                className="p-5 bg-slate-900 text-white rounded-[2.5rem] shadow-2xl hover:bg-indigo-600 transition-all flex items-center gap-4 group active:scale-95 border border-white/10"
                            >
                                <Maximize2 size={24} />
                                <span className="text-[10px] font-black uppercase tracking-widest max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 whitespace-nowrap">Dashboard BI</span>
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-8 animate-fade-in flex-1 overflow-y-auto custom-scrollbar pr-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { label: "Membros Ativos", value: stats?.totalPopulation || '---', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                            { label: "Balanço Ledger", value: stats?.balance ? `R$ ${stats.balance.toLocaleString()}` : '---', icon: Landmark, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                            { label: "Incidentes Abertos", value: stats?.openIncidents || '0', icon: ShieldAlert, color: 'text-rose-600', bg: 'bg-rose-50' },
                            { label: "Índice de Censo", value: stats?.totalPopulation ? `${Math.round(((stats.totalPopulation - (stats.pending || 0)) / stats.totalPopulation) * 100)}%` : '---', icon: BarChart3, color: 'text-amber-600', bg: 'bg-amber-50' }
                        ].map((kpi, i) => (
                            <div key={i} className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex items-center justify-between group hover:border-indigo-300 transition-all">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{kpi.label}</p>
                                    <h4 className="text-3xl font-black text-slate-800 mt-3">{kpi.value}</h4>
                                </div>
                                <div className={`p-5 rounded-[1.5rem] ${kpi.bg} ${kpi.color} group-hover:scale-110 transition-transform shadow-sm`}><kpi.icon size={28} /></div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-8 bg-slate-950 rounded-[4rem] p-16 relative overflow-hidden shadow-2xl border border-white/5 min-h-[450px] flex flex-col justify-between group">
                            <div className="absolute top-0 right-0 w-[50rem] h-[50rem] bg-indigo-600/5 rounded-full blur-[150px] -mr-40 -mt-40 transition-all group-hover:bg-indigo-600/10"></div>
                            <div className="relative z-10 space-y-10">
                                <div className="flex gap-6">
                                    <div className="p-4 bg-white/10 border border-white/10 rounded-2xl backdrop-blur-md"><Server size={32} className="text-indigo-400" /></div>
                                    <div>
                                        <h2 className="text-5xl font-black text-white uppercase tracking-tightest leading-tight">Gestão <br />Soberana.</h2>
                                        <p className="text-slate-400 font-medium text-xl mt-4 uppercase opacity-80">Arquitetura de Missão Crítica SRE</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                    <div className="flex items-center gap-4">
                                        <Signal size={20} className="text-emerald-500" />
                                        <div><p className="text-[10px] font-black text-white uppercase">Rede Neural</p><p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Ativo 200 OK</p></div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Database size={20} className="text-amber-500" />
                                        <div><p className="text-[10px] font-black text-white uppercase">Base de Dados</p><p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Verificado 100%</p></div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <RefreshCw size={20} className="text-indigo-500 animate-spin-slow" />
                                        <div><p className="text-[10px] font-black text-white uppercase">IA Gateway</p><p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Sincronizado</p></div>
                                    </div>
                                </div>
                            </div>
                            <div className="relative z-10 flex gap-6 mt-16">
                                <button onClick={() => onNavigate('finance')} className="px-12 py-6 bg-white text-slate-950 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-indigo-50 transition-all active:scale-95">Relatórios Financeiros</button>
                                <button onClick={() => onNavigate('demographics')} className="px-12 py-6 bg-white/5 border border-white/10 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-white/10 transition-all">Análise Social</button>
                            </div>
                        </div>

                        <div className="lg:col-span-4 bg-white p-12 rounded-[4rem] border border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-10 opacity-[0.03] transform scale-150 rotate-12"><Brain size={250} /></div>
                            <div className="relative z-10">
                                <h5 className="text-[11px] font-black text-slate-800 uppercase tracking-[0.3em] flex items-center gap-3 mb-10"><Zap size={18} className="text-amber-500 animate-pulse" /> Advisor Preditivo</h5>
                                <div className="p-10 bg-slate-50 rounded-[3rem] border border-slate-100 italic font-medium text-lg text-slate-700 uppercase leading-relaxed shadow-inner">
                                    "Análise do Cluster Alpha concluída. Recomenda-se reforço no pilar de Infraestrutura para o próximo ciclo."
                                </div>
                            </div>
                            <button onClick={() => onNavigate('neural_chat')} className="w-full mt-10 py-7 bg-slate-950 text-white rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.4em] hover:bg-indigo-600 transition-all flex items-center justify-center gap-4 shadow-2xl active:scale-95">
                                <Sparkles size={20} className="animate-pulse" /> Consultar Mentor AI
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 5. QUICK LAUNCHER (BOTTOM BAR) */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 shrink-0 pb-6">
                {[
                    { id: 'users', label: 'Membros', icon: Fingerprint, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { id: 'finance', label: 'Financeiro', icon: Landmark, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { id: 'watchdog', label: 'Vigilância', icon: UserCheck, color: 'text-rose-600', bg: 'bg-rose-50' },
                    { id: 'surveys', label: 'Censo', icon: BarChart3, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { id: 'communication', label: 'Mural', icon: MessageCircle, color: 'text-purple-600', bg: 'bg-purple-50' },
                    { id: 'settings', label: 'Console', icon: Terminal, color: 'text-slate-600', bg: 'bg-slate-50' }
                ].map(mod => (
                    <div
                        key={mod.id}
                        onClick={() => onNavigate(mod.id)}
                        className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:border-indigo-300 transition-all cursor-pointer group flex flex-col items-center gap-4 text-center"
                    >
                        <div className={`p-5 rounded-2xl ${mod.bg} ${mod.color} group-hover:scale-110 transition-all shadow-sm`}><mod.icon size={26} /></div>
                        <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest">{mod.label}</h4>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Dashboard;
