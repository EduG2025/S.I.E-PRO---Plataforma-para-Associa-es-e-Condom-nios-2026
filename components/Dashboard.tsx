import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { financialService, demographicsService, api, operationsService, aiService } from '../services/api';
import { SystemInfo, Incident } from '../types';
import {
    Users, Loader2, Landmark, Sparkles,
    TrendingUp, ShieldAlert, BarChart3,
    Zap, Map as MapIcon, Radio, Signal, Server, Activity,
    Shield, ChevronRight, Brain, UserCheck, ShieldCheck,
    Wallet, Scale, ArrowRight, Gauge
} from 'lucide-react';

const SmartMap = lazy(() => import('./SmartMap'));

interface DashboardProps {
    onNavigate: (tab: string) => void;
    systemInfo: SystemInfo;
}

const Dashboard = ({ onNavigate, systemInfo }: DashboardProps) => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiInsight, setAiInsight] = useState<string>('');
    const [logs, setLogs] = useState<any[]>([]);
    const [recentIncidents, setRecentIncidents] = useState<Incident[]>([]);

    const primaryColor = systemInfo.primaryColor || '#4f46e5';

    const loadDashboardData = async () => {
        try {
            const [fin, soc, inc, reports] = await Promise.allSettled([
                financialService.getDashboardStats(),
                demographicsService.getStats(),
                operationsService.getIncidents(),
                api.get('/governance/reports')
            ]);

            setStats({
                ...(fin.status === 'fulfilled' ? (fin.value as any).data : {}),
                ...(soc.status === 'fulfilled' ? (soc.value as any).data : {})
            });

            if (inc.status === 'fulfilled') {
                setRecentIncidents((inc.value as any).data?.data?.slice(0, 5) || []);
            }

            if (reports.status === 'fulfilled') {
                setLogs((reports.value as any).data?.data?.slice(0, 8) || []);
            }
            
            setLoading(false);
        } catch (error) {
            console.error("Dashboard Data Failure");
        }
    };

    useEffect(() => {
        loadDashboardData();
        const interval = setInterval(loadDashboardData, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleRunAIAnalysis = async () => {
        setIsAnalyzing(true);
        try {
            const context = {
                finances: stats?.balance,
                population: stats?.totalPopulation,
                incidents: recentIncidents.length,
                pending: stats?.pending,
                shortName: systemInfo.shortName
            };
            const prompt = `ATUE COMO: Advisor Estratégico S.I.E PRO. 
            CONTEXTO REAL: ${JSON.stringify(context)}. 
            OBJETIVO: Gere um diagnóstico tático de 2 frases curtas EM CAIXA ALTA sobre o estado do cluster hoje. Foco em estabilidade e prevenção.`;
            
            const res = await aiService.chat(prompt);
            setAiInsight(res.data.text);
        } catch (e) {
            setAiInsight("SINAL NEURAL INSTÁVEL NO CLUSTER ALPHA.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    if (loading) return (
        <div className="flex-1 flex flex-col items-center justify-center p-20 bg-slate-950/5 rounded-[4rem]">
            <div className="relative">
                <div className="w-24 h-24 border-8 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
                <Zap className="absolute inset-0 m-auto text-indigo-600 animate-pulse" size={32} />
            </div>
            <p className="mt-8 text-slate-400 font-black uppercase text-[11px] tracking-[0.5em] animate-pulse">Sincronizando Comando Central...</p>
        </div>
    );

    return (
        <div className="flex-1 flex flex-col space-y-8 animate-fade-in h-full relative font-sans">
            <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden flex flex-col lg:flex-row items-center gap-10 border border-white/10 group animate-pulse-soft">
                <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-indigo-600/10 rounded-full blur-[120px] -mr-40 -mt-60 pointer-events-none group-hover:bg-indigo-600/20 transition-all duration-1000"></div>
                <div className="absolute inset-0 sre-scanline opacity-[0.03]"></div>
                
                <div className="flex items-center gap-6 shrink-0 relative z-10">
                    <div className="p-6 bg-indigo-600 rounded-[2.2rem] shadow-[0_0_40px_rgba(79,70,229,0.5)] border border-indigo-400/30" style={{ backgroundColor: primaryColor }}>
                        <Brain size={36}/>
                    </div>
                    <div className="hidden xl:block">
                        <p className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.4em] leading-none">Neural Hub</p>
                        <div className="flex items-center gap-2 mt-2">
                             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                             <p className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">SRE Active Link</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 relative z-10">
                    {aiInsight ? (
                        <div className="space-y-3">
                             <p className="text-xl font-black tracking-tightest leading-tight uppercase italic text-indigo-50 border-l-4 border-indigo-500 pl-6 py-1">"{aiInsight}"</p>
                             <div className="flex items-center gap-2 text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em] ml-6 opacity-70">
                                <Sparkles size={12}/> DIAGNÓSTICO SINCRONIZADO VIA GEMINI 3 PRO
                             </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            <p className="text-sm font-black text-slate-400 uppercase tracking-[0.3em] animate-pulse">Aguardando comando de síntese neural para análise de perímetro operacional...</p>
                        </div>
                    )}
                </div>

                <button 
                    onClick={handleRunAIAnalysis}
                    disabled={isAnalyzing}
                    className="px-12 py-5 bg-white text-indigo-950 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all flex items-center gap-4 active:scale-95 disabled:opacity-50 shrink-0 relative z-10 shadow-2xl hover:bg-indigo-50 hover:scale-[1.02]"
                >
                    {isAnalyzing ? <Loader2 size={18} className="animate-spin"/> : <Zap size={18} className="fill-indigo-950"/>}
                    {aiInsight ? 'Recalcular' : 'Gerar Diagnóstico'}
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                    { label: "População Ativa", value: stats?.totalPopulation || '---', icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50', id: 'users', trend: 'Auditado OK' },
                    { label: "Balanço Ledger", value: stats?.balance ? `R$ ${Number(stats.balance).toLocaleString('pt-BR')}` : '---', icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50', id: 'finance', trend: 'Sincronizado' },
                    { label: "Pleitos Coletivos", value: stats?.activeDecisions || '0', icon: Scale, color: 'text-amber-600', bg: 'bg-amber-50', id: 'collective_decisions', trend: 'Sessão Ativa' },
                    { label: "Watchdog Alerts", value: stats?.openIncidents || '0', icon: ShieldAlert, color: 'text-rose-600', bg: 'bg-rose-50', id: 'operations', trend: recentIncidents.length > 0 ? 'Resposta Ativa' : 'Seguro' }
                ].map((kpi, i) => (
                    <div key={i} onClick={() => onNavigate(kpi.id)} className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-indigo-400 hover:shadow-xl transition-all cursor-pointer relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                        <div className="flex justify-between items-start mb-10 relative z-10">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">{kpi.label}</p>
                                <h4 className="text-4xl font-black text-slate-900 mt-2 tracking-tightest leading-none">{kpi.value}</h4>
                            </div>
                            <div className={`p-5 rounded-[1.8rem] ${kpi.bg} ${kpi.color} shadow-inner group-hover:rotate-12 transition-all duration-500`}><kpi.icon size={28} /></div>
                        </div>
                        <div className="flex items-center gap-2 relative z-10">
                            <div className={`w-1.5 h-1.5 rounded-full ${kpi.color} animate-pulse`}></div>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{kpi.trend}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex-1 bg-white rounded-[4rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col relative min-h-[600px]">
                <div className="absolute top-10 left-10 z-20 w-80 space-y-6 pointer-events-none hidden xl:block">
                    <div className="bg-slate-900/98 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl pointer-events-auto space-y-6 animate-slide-in-left">
                        <div className="flex items-center justify-between border-b border-white/5 pb-4">
                            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.5em]">Live Audit Stream</span>
                            <Activity size={16} className="text-emerald-500 animate-pulse"/>
                        </div>
                        <div className="space-y-3 font-mono text-[9px]">
                            {logs.map((log, i) => (
                                <div key={i} className={`flex gap-3 ${i === 0 ? 'text-white font-bold' : 'text-slate-500 opacity-60'}`}>
                                    <span className="text-indigo-500 shrink-0">&gt;</span>
                                    <span className="break-all uppercase tracking-tighter">[{log.action}] @{log.operator_name || 'KERN'}: {log.details.slice(0, 40)}...</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="bg-white/95 backdrop-blur-2xl rounded-[2.5rem] border border-slate-200 shadow-2xl pointer-events-auto overflow-hidden animate-slide-in-left" style={{ animationDelay: '0.2s' }}>
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-3">
                                <Radio size={14} className="text-rose-500 animate-pulse"/> Alertas Watchdog
                            </span>
                            <span className="text-[9px] font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">REAL</span>
                        </div>
                        <div className="p-6 space-y-4">
                            {recentIncidents.map(inc => (
                                <div key={inc.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group cursor-pointer hover:bg-white hover:border-rose-300 transition-all shadow-sm" onClick={() => onNavigate('operations')}>
                                    <div className="min-w-0">
                                        <h6 className="text-[11px] font-black text-slate-800 uppercase truncate leading-none">{inc.title}</h6>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-2 flex items-center gap-1.5"><MapIcon size={10}/> {inc.location}</p>
                                    </div>
                                    <ChevronRight size={16} className="text-slate-300 group-hover:text-rose-500 transition-colors" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex-1 relative bg-slate-100">
                    <Suspense fallback={<div className="absolute inset-0 flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>}>
                        <SmartMap 
                            systemInfo={systemInfo} 
                            activeLayers={{ residents: true, incidents: true, heatmap: true, surveys: false }} 
                            onSelectEntity={(e) => onNavigate(e.type === 'incident' ? 'operations' : 'users')}
                        />
                    </Suspense>
                </div>

                <div className="h-28 border-t border-slate-100 bg-white px-12 flex items-center justify-between shrink-0 z-20">
                    <div className="flex gap-12">
                        <button onClick={() => onNavigate('finance')} className="text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-all flex items-center gap-4 group">
                            <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-indigo-50 transition-colors shadow-inner"><Wallet size={20}/></div>
                            Audit Ledger
                        </button>
                    </div>
                    <div className="flex items-center gap-10">
                         <div className="hidden lg:flex items-center gap-4 text-slate-400 border-r pr-10 border-slate-200">
                             <Server size={18} className="text-emerald-500 animate-pulse"/>
                             <div className="text-left">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] block leading-none text-slate-900">SRE ALPHA NODE</span>
                                <span className="text-[8px] font-bold uppercase tracking-widest block mt-1 text-emerald-600">Sync: Real Data</span>
                             </div>
                         </div>
                        <button onClick={() => onNavigate('sre_monitor')} className="px-12 py-5 bg-slate-950 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.3em] shadow-xl flex items-center gap-4 hover:bg-indigo-600 active:scale-95 transition-all group">
                            Monitor de Telemetria <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform"/>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;