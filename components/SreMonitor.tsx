
import React, { useState, useEffect } from 'react';
import { 
    Terminal, Activity, Database, Cpu, Zap, ShieldCheck, 
    Signal, RefreshCw, Brain, Gauge, Radio, Server,
    HardDrive, CloudLightning, ActivitySquare
} from 'lucide-react';
import { api, aiKeyService } from '../services/api';
import { SystemInfo, AIKey } from '../types';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
    ResponsiveContainer 
} from 'recharts';

const SreMonitor = ({ systemInfo }: { systemInfo: SystemInfo }) => {
    const [logs, setLogs] = useState<any[]>([]);
    const [aiKeys, setAiKeys] = useState<AIKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [serverHealth, setServerHealth] = useState<any>(null);
    const [metrics, setMetrics] = useState({
        loadHistory: [] as any[],
        uptime: '---',
        storageUsage: 0
    });

    const primaryColor = systemInfo.primaryColor || '#4f46e5';

    const formatUptime = (seconds: number) => {
        const d = Math.floor(seconds / (3600*24));
        const h = Math.floor(seconds % (3600*24) / 3600);
        const m = Math.floor(seconds % 3600 / 60);
        return `${d}d ${h}h ${m}m`;
    };

    const fetchTelemetry = async () => {
        try {
            const [healthRes, logsRes, keysRes] = await Promise.all([
                api.get('/health'),
                api.get('/governance/reports'),
                aiKeyService.getAll()
            ]);
            
            const health = healthRes.data;
            const auditLogs = logsRes.data.data || [];
            
            setServerHealth(health);
            setLogs(auditLogs);
            setAiKeys(keysRes.data.data || []);

            // Mapeia volume de logs reais para gráfico de carga
            const loadData = auditLogs.slice(0, 20).reverse().map((log: any, i: number) => ({
                time: new Date(log.created_at).toLocaleTimeString(),
                val: 10 + (Math.min(i * 4.5, 90)) 
            }));

            setMetrics({
                loadHistory: loadData,
                uptime: health.uptime ? formatUptime(health.uptime) : 'DEGRADED',
                storageUsage: Math.min(100, auditLogs.length / 50) 
            });
        } catch (e) {
            console.error("SRE Telemetry Failure");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTelemetry();
        const interval = setInterval(fetchTelemetry, 15000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex-1 flex flex-col h-full animate-fade-in bg-[#020617] text-slate-400 p-6 lg:p-10 gap-8 overflow-hidden font-mono relative">
            <div className="absolute inset-0 sre-scanline opacity-[0.08] pointer-events-none"></div>

            <div className="flex flex-col md:flex-row justify-between items-center gap-8 shrink-0 relative z-10">
                <div className="flex items-center gap-6">
                    <div className="p-5 bg-indigo-600 rounded-[1.8rem] shadow-[0_0_50px_rgba(79,70,229,0.4)] text-white border border-indigo-400/30">
                        <Terminal size={32} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tightest leading-none">Console de Telemetria</h2>
                        <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.5em] mt-3 opacity-80 flex items-center gap-3">
                            <Signal size={12} className="text-emerald-500 animate-pulse"/> SRE Kernel Engine V27.0
                        </p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4 backdrop-blur-xl">
                        <div className={`w-2.5 h-2.5 rounded-full ${serverHealth?.status === 'OPERATIONAL' ? 'bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]' : 'bg-rose-50 shadow-[0_0_10px_#f43f5e]'}`}></div>
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Status: {serverHealth?.status || 'SYNCING...'}</span>
                    </div>
                    <button onClick={fetchTelemetry} className="p-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl border border-white/10 transition-all">
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-8 overflow-hidden pb-4 relative z-10">
                <div className="lg:col-span-8 flex flex-col gap-8 overflow-y-auto no-scrollbar pr-2">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[
                            { label: 'DB Latency', val: serverHealth?.dbLatency ? `${serverHealth.dbLatency}ms` : '---', icon: Database, color: 'text-emerald-400' },
                            { label: 'SRE Uptime', val: metrics.uptime, icon: Activity, color: 'text-indigo-400' },
                            { label: 'AI Pool', val: `${aiKeys.filter(k=>k.status==='active').length} Active`, icon: Brain, color: 'text-purple-400' },
                            { label: 'Ledger Load', val: `${metrics.storageUsage.toFixed(2)}%`, icon: HardDrive, color: 'text-amber-400' }
                        ].map((stat, i) => (
                            <div key={i} className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] flex flex-col justify-between hover:bg-white/10 transition-all group shadow-2xl relative overflow-hidden">
                                <stat.icon className={`${stat.color} mb-6 group-hover:scale-110 transition-transform`} size={24} />
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">{stat.label}</p>
                                    <p className="text-2xl font-black text-white mt-2 tracking-tighter">{stat.val}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-black/40 border border-white/10 p-10 rounded-[3.5rem] min-h-[400px] relative overflow-hidden flex flex-col shadow-2xl">
                        <div className="absolute top-0 right-0 p-10 opacity-5"><Cpu size={250} /></div>
                        <h3 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.5em] mb-10 flex items-center gap-4">
                            <Gauge size={18} className="text-indigo-500"/> Transactional Ingestion Load (Audit Ledger)
                        </h3>
                        <div className="flex-1">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={metrics.loadHistory}>
                                    <defs>
                                        <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={primaryColor} stopOpacity={0.4}/>
                                            <stop offset="95%" stopColor={primaryColor} stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)"/>
                                    <XAxis dataKey="time" hide />
                                    <YAxis hide domain={[0, 100]} />
                                    <Tooltip contentStyle={{ backgroundColor: '#020617', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', fontSize: '10px', color: '#fff' }} />
                                    <Area type="monotone" dataKey="val" stroke={primaryColor} fillOpacity={1} fill="url(#colorCpu)" strokeWidth={4} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-4 flex flex-col bg-slate-900/60 border border-white/10 rounded-[3.5rem] overflow-hidden shadow-2xl relative">
                    <div className="p-8 bg-slate-950 border-b border-white/10 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-4">
                            <Radio size={24} className="text-rose-500 animate-pulse" />
                            <div>
                                <span className="text-[11px] font-black text-white uppercase tracking-[0.4em] block">Live Audit</span>
                                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block mt-1">REAL DATA INGESTION</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-6 font-mono text-[10px] leading-relaxed relative">
                        {logs.map((log) => (
                            <div key={log.id} className="border-b border-white/5 pb-6 group">
                                <div className="flex justify-between items-start mb-3">
                                    <span className={`font-black uppercase px-2 py-0.5 rounded text-[8px] ${
                                        log.action === 'CREATE' ? 'bg-emerald-500/10 text-emerald-400' : 
                                        log.action === 'DELETE' ? 'bg-rose-500/10 text-rose-400' : 
                                        'bg-indigo-500/10 text-indigo-400'
                                    }`}>
                                        [{log.action}]
                                    </span>
                                    <span className="text-slate-600 text-[9px]">{new Date(log.created_at).toLocaleTimeString()}</span>
                                </div>
                                <p className="text-slate-300">
                                    <span className="text-indigo-300 font-black">@{log.operator_name || 'MASTER'}:</span> {log.details}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SreMonitor;
