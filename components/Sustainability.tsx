
import React, { useState, useEffect, useCallback } from 'react';
import { 
    Leaf, Droplets, Zap, Trash2, TrendingDown, ArrowUpRight, 
    Loader2, BarChart3, ShieldCheck, Sparkles, X, Printer, Download, Save, FileText, Globe, Activity,
    Brain, Play, MessageSquare, Radio, Signal, Gauge
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Cell } from 'recharts';
import { systemService, aiService } from '../services/api';
import { SystemInfo } from '../types';

const Sustainability = ({ systemInfo }: { systemInfo: SystemInfo }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [liveTelemetry, setLiveTelemetry] = useState({ energy: 0, water: 0 });
    const [aiInsight, setAiInsight] = useState<string>('');
    const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);

    // IOT HEARTBEAT ENGINE
    const updateHeartbeat = useCallback(() => {
        if (!stats) return;
        const lastEnergy = stats.energy[stats.energy.length - 1].value;
        const lastWater = stats.water[stats.water.length - 1].value;
        
        // Simula flutuação de consumo em tempo real (±2% a cada ciclo)
        const fluctuation = () => (Math.random() - 0.5) * 4;
        setLiveTelemetry({
            energy: lastEnergy + fluctuation(),
            water: lastWater + (fluctuation() / 5)
        });
    }, [stats]);

    useEffect(() => {
        const loadStats = async () => {
            try {
                const res = await systemService.getSustainabilityStats();
                setStats(res.data);
                setIsLoading(false);
            } catch (e) { console.error("ESG Offline"); }
        };
        loadStats();
    }, []);

    useEffect(() => {
        const interval = setInterval(updateHeartbeat, 2000);
        return () => clearInterval(interval);
    }, [updateHeartbeat]);

    const handleRunNeuralEsg = async () => {
        setIsAiAnalyzing(true);
        try {
            const prompt = `Analise consumo: ${liveTelemetry.energy}kWh e ${liveTelemetry.water}m³. Gere insight técnico de 2 frases em CAIXA ALTA.`;
            const res = await aiService.chat(prompt);
            setAiInsight(res.data.text);
        } catch (e) { setAiInsight("SINAL NEURAL INSTÁVEL."); }
        finally { setIsAiAnalyzing(false); }
    };

    const primaryColor = systemInfo.primaryColor || '#10b981';

    if (isLoading) return <div className="flex flex-col items-center justify-center h-[60vh]"><Loader2 className="animate-spin text-emerald-600" size={48} /></div>;

    return (
        <div className="flex-1 flex flex-col h-full animate-fade-in bg-slate-50 gap-6 p-[var(--sie-viewport-padding)]">
            
            {/* HUD IOT HEARTBEAT */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 shrink-0">
                <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden flex items-center justify-between group border border-white/5">
                    <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform"><Zap size={200}/></div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
                             <Radio size={14} className="text-emerald-500 animate-pulse"/> Live IoT Telemetry
                        </p>
                        <div className="flex items-baseline gap-4">
                            <h3 className="text-6xl font-black text-white tracking-tightest">{liveTelemetry.energy.toFixed(1)}</h3>
                            <span className="text-xl font-black text-slate-500 uppercase tracking-widest">kWh / s</span>
                        </div>
                    </div>
                    <div className="h-20 w-40 relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={new Array(10).fill(0).map((_,i)=>({v: 200 + Math.random()*20}))}>
                                <Area type="monotone" dataKey="v" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden flex items-center justify-between group border border-white/5">
                    <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform"><Droplets size={200}/></div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
                             <Signal size={14} className="text-blue-500 animate-pulse"/> Hydric Pressure Hub
                        </p>
                        <div className="flex items-baseline gap-4">
                            <h3 className="text-6xl font-black text-white tracking-tightest">{liveTelemetry.water.toFixed(2)}</h3>
                            <span className="text-xl font-black text-slate-500 uppercase tracking-widest">m³ / m</span>
                        </div>
                    </div>
                    <div className="h-20 w-40 relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={new Array(10).fill(0).map((_,i)=>({v: 50 + Math.random()*5}))}>
                                <Area type="monotone" dataKey="v" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* ADVISOR SECTION */}
            <div className="bg-emerald-950 rounded-[3rem] p-10 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center gap-10 border border-white/5">
                <div className="flex items-center gap-6 shrink-0 relative z-10">
                    <div className="p-5 bg-emerald-600 rounded-[2rem] shadow-2xl animate-pulse"><Brain size={32}/></div>
                    <div>
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">SRE ESG Advisor</p>
                        <h4 className="text-xl font-black text-emerald-200 uppercase tracking-tightest">Análise Preditiva</h4>
                    </div>
                </div>
                <div className="flex-1 relative z-10">
                    {aiInsight ? (
                        <p className="text-lg font-black tracking-tight leading-relaxed uppercase italic text-emerald-50">"{aiInsight}"</p>
                    ) : (
                        <p className="text-xs font-medium text-emerald-400/60 uppercase tracking-widest">O Advisor Neural está processando a volumetria de consumo do cluster...</p>
                    )}
                </div>
                <button onClick={handleRunNeuralEsg} disabled={isAiAnalyzing} className="px-10 py-5 bg-white text-emerald-950 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:scale-105 active:scale-95 transition-all flex items-center gap-4 disabled:opacity-50 relative z-10 shadow-2xl">
                    {isAiAnalyzing ? <Loader2 size={18} className="animate-spin"/> : <Sparkles size={18}/>} Analisar Telemetria
                </button>
            </div>

            <div className="bg-white rounded-[4rem] p-12 border border-slate-200 shadow-sm flex flex-col items-center justify-between gap-12 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-[0.02]"><Leaf size={200}/></div>
                <div className="flex items-center gap-10">
                    <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-[2.5rem] flex items-center justify-center shadow-inner border border-emerald-100"><ShieldCheck size={48}/></div>
                    <div>
                        <h4 className="text-3xl font-black text-slate-900 uppercase tracking-tightest leading-none">Certificação S.I.E Green 2025</h4>
                        <p className="text-slate-400 text-sm mt-3 font-medium uppercase tracking-widest leading-relaxed max-w-2xl">Relatório de eficiência hídrica e energética gerado via telemetria SRE para conformidade ESG em clusters coletivos.</p>
                    </div>
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <button onClick={() => window.print()} className="flex-1 md:flex-none px-12 py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-4 active:scale-95">
                        <Download size={20}/> Emitir Auditoria ESG
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Sustainability;
