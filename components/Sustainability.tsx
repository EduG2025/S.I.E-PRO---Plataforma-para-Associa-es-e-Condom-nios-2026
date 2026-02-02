
import React, { useState, useEffect } from 'react';
import { 
    Leaf, Droplets, Zap, Trash2, TrendingDown, ArrowUpRight, 
    Loader2, BarChart3, ShieldCheck, Sparkles, X, Printer, Download, Save, FileText, Globe, Activity
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, Cell } from 'recharts';
import { systemService } from '../services/api';
import { SystemInfo } from '../types';

interface SustainabilityProps {
    systemInfo: SystemInfo;
}

const Sustainability = ({ systemInfo }: SustainabilityProps) => {
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);
    const [error, setError] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        const loadStats = async () => {
            setIsLoading(true);
            setError(false);
            try {
                const res = await systemService.getSustainabilityStats();
                if (res.data) {
                    setStats(res.data);
                } else {
                    throw new Error("Empty Payload");
                }
            } catch (e) {
                console.error("[SRE ESG] Telemetria Offline.");
                setError(true);
            } finally {
                setIsLoading(false);
            }
        };
        loadStats();
    }, []);

    const handleGenerateReport = () => {
        setIsGenerating(true);
        setTimeout(() => {
            setIsGenerating(false);
            window.print();
        }, 2000);
    };

    const primaryColor = systemInfo.primaryColor || '#10b981';

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center h-[60vh]">
            <Loader2 className="animate-spin text-emerald-600 mb-4" size={48} style={{ color: primaryColor }} />
            <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest animate-pulse">Sincronizando Sensores ESG...</p>
        </div>
    );

    if (error || !stats) return (
        <div className="p-20 text-center bg-white rounded-[3rem] border border-slate-200 shadow-sm">
            <div className="p-6 bg-rose-50 text-rose-500 rounded-full w-fit mx-auto mb-6"><Leaf size={48}/></div>
            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Telemetria Indisponível</h3>
            <p className="text-slate-400 text-sm mt-2">O cluster não conseguiu processar os dados de consumo neste momento.</p>
            <button onClick={() => window.location.reload()} className="mt-8 px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 transition-all">Tentar Reconexão</button>
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in pb-12 h-full">
            <div className="bg-emerald-950 rounded-[3.5rem] p-12 text-white relative overflow-hidden shadow-2xl border border-white/5" style={{ backgroundColor: '#064e3b' }}>
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="space-y-6 max-w-2xl text-center md:text-left">
                        <div className="flex items-center gap-3 px-4 py-1.5 bg-white/10 rounded-full w-fit mx-auto md:mx-0 border border-white/10 backdrop-blur-md">
                            <Leaf size={16} className="text-emerald-400" style={{ color: primaryColor }}/>
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-200">Protocolo ESG Ativo</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight uppercase">Eficiência & <br/>Recursos.</h1>
                        <p className="text-emerald-100/70 text-base font-medium leading-relaxed">Painel estratégico para redução de custos operacionais e pegada ecológica da comunidade.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 shrink-0">
                        <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 text-center shadow-2xl">
                            <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest mb-2">Eco Score</p>
                            <h3 className="text-4xl font-black">A+</h3>
                        </div>
                        <div className="bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 text-center shadow-2xl">
                            <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest mb-2">Redução CO2</p>
                            <h3 className="text-4xl font-black">12%</h3>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col hover:shadow-xl transition-all">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl"><Zap size={32}/></div>
                        <div>
                            <h3 className="font-black text-slate-800 text-lg leading-none uppercase">Energia</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Consumo kWh</p>
                        </div>
                    </div>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.energy}>
                                <Area type="monotone" dataKey="value" stroke="#f59e0b" fill="#fef3c7" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-6 pt-6 border-t border-slate-50 flex justify-between items-center">
                        <span className="text-xs font-black text-slate-400 uppercase">Variação Mensal</span>
                        <span className="text-emerald-600 font-black flex items-center gap-1 text-sm"><TrendingDown size={14}/> -4.2%</span>
                    </div>
                </div>

                <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col hover:shadow-xl transition-all">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl"><Droplets size={32}/></div>
                        <div>
                            <h3 className="font-black text-slate-800 text-lg leading-none uppercase">Água</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Consumo m³</p>
                        </div>
                    </div>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats.water}>
                                <Area type="monotone" dataKey="value" stroke="#4f46e5" fill="#e0e7ff" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-6 pt-6 border-t border-slate-50 flex justify-between items-center">
                        <span className="text-xs font-black text-slate-400 uppercase">Meta do Cluster</span>
                        <span className="text-indigo-600 font-black text-sm uppercase">95 m³</span>
                    </div>
                </div>

                <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col hover:shadow-xl transition-all">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl"><Trash2 size={32}/></div>
                        <div>
                            <h3 className="font-black text-slate-800 text-lg leading-none uppercase">Resíduos</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Mix Seletivo</p>
                        </div>
                    </div>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.waste}>
                                <XAxis dataKey="name" hide />
                                <Tooltip cursor={{fill: 'transparent'}} />
                                <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                                    {stats.waste.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-6 pt-6 border-t border-slate-50 flex justify-between items-center">
                        <span className="text-xs font-black text-slate-400 uppercase">Reciclagem</span>
                        <span className="text-emerald-600 font-black text-sm uppercase">48%</span>
                    </div>
                </div>
            </div>

            <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-8 border border-white/5">
                <div className="flex items-center gap-6">
                    <div className="p-5 bg-emerald-500 rounded-[2rem] shadow-lg shadow-emerald-500/20 text-white" style={{ backgroundColor: primaryColor }}><ShieldCheck size={32}/></div>
                    <div>
                        <h4 className="text-xl font-black tracking-tight uppercase">Certificação S.I.E GREEN</h4>
                        <p className="text-slate-400 text-xs mt-1 font-medium">Relatórios de conformidade ESG auditados automaticamente pelo Kernel.</p>
                    </div>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="px-10 py-5 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-emerald-50 transition-all flex items-center gap-3 active:scale-95">
                    <BarChart3 size={20}/> Gerar Relatório ESG
                </button>
            </div>

            {isModalOpen && (
                <div className="sie-editor-overlay">
                    <div className="sie-modal-container">
                        <div className="h-20 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 shadow-2xl relative z-20 border-b border-white/5">
                            <div className="flex items-center gap-5">
                                <div className="p-3.5 bg-emerald-600 rounded-xl shadow-xl" style={{ backgroundColor: primaryColor }}><FileText size={22}/></div>
                                <div>
                                    <h3 className="font-black text-xl uppercase tracking-tighter leading-none">Relatório de Impacto</h3>
                                    <p className="text-indigo-400 text-[9px] font-black uppercase mt-1.5 tracking-widest opacity-80">SRE Environmental Audit V5.0</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button onClick={handleGenerateReport} disabled={isGenerating} className="px-10 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center gap-3 shadow-xl active:scale-95" style={{ backgroundColor: primaryColor }}>
                                    {isGenerating ? <Loader2 className="animate-spin" size={16}/> : <Printer size={16}/>} Imprimir Certificado
                                </button>
                                <button onClick={() => setIsModalOpen(false)} className="p-3.5 hover:bg-rose-500 hover:text-white text-slate-400 rounded-xl transition-all border border-white/5"><X size={24}/></button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-[#fdfdfe] relative flex flex-col items-center">
                            <div className="max-w-4xl w-full bg-white border border-slate-200 rounded-[3rem] shadow-2xl p-16 space-y-12 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none"><Globe size={200}/></div>
                                
                                <div className="text-center space-y-4">
                                    <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner border border-emerald-100"><ShieldCheck size={48} style={{ color: primaryColor }}/></div>
                                    <h2 className="text-4xl font-black text-slate-800 uppercase tracking-tightest">Certificado de Eficiência</h2>
                                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.4em]">Auditado pelo Kernel S.I.E PRO em {new Date().toLocaleDateString()}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Performance Energética</p>
                                        <h4 className="text-3xl font-black text-amber-600">92.4%</h4>
                                        <div className="w-full h-1.5 bg-slate-200 rounded-full mt-4 overflow-hidden"><div className="w-[92%] h-full bg-amber-500"></div></div>
                                    </div>
                                    <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Gestão Hídrica</p>
                                        <h4 className="text-3xl font-black text-indigo-600">88.1%</h4>
                                        <div className="w-full h-1.5 bg-slate-200 rounded-full mt-4 overflow-hidden"><div className="w-[88%] h-full bg-indigo-500" style={{ backgroundColor: primaryColor }}></div></div>
                                    </div>
                                </div>

                                <div className="p-10 bg-emerald-900/5 border border-emerald-100 rounded-[3rem] space-y-6">
                                    <h5 className="font-black text-emerald-900 uppercase tracking-widest flex items-center gap-3"><Activity size={18}/> Conclusão da Auditoria</h5>
                                    <p className="text-emerald-800 text-sm font-medium leading-relaxed uppercase italic">
                                        O cluster apresenta níveis de eficiência operacional compatíveis com o padrão Ouro de sustentabilidade residencial. 
                                        A redução de 12% na pegada de carbono foi atingida através da otimização neural de fluxos de manutenção e co-gestão ativa.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 border-t bg-slate-50 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-3"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocolo ESG Consolidado</span></div>
                            <button onClick={() => setIsModalOpen(false)} className="px-10 py-3.5 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors">Fechar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Sustainability;
