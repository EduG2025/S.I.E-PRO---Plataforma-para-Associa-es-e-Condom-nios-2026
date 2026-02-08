
import React, { useState, useEffect } from 'react';
import { 
    Terminal, Search, Filter, Clock, User, 
    Database, ShieldCheck, RefreshCw, FileText, 
    ArrowRight, AlertCircle, Download, History,
    Shield, Activity, Zap, Loader2
} from 'lucide-react';
import { api, systemService } from '../services/api';
import { SystemInfo } from '../types';

const AuditLogs = ({ systemInfo }: { systemInfo: SystemInfo }) => {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeFilter, setActiveFilter] = useState('ALL');

    useEffect(() => { loadLogs(); }, []);

    const loadLogs = async () => {
        setLoading(true);
        try {
            // SRE: Busca logs de auditoria via endpoint de governança
            const res = await api.get('/governance/reports');
            setLogs(res.data.data || []);
        } catch (e) {
            console.error("FALHA AO SINCRONIZAR LOGS FORENSES");
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        await systemService.logTacticalExport({ module: 'AUDIT_FORENSICS', count: logs.length });
        window.print();
    };

    const filteredLogs = logs.filter(log => {
        const matchesSearch = log.details?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             log.operator_name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = activeFilter === 'ALL' || log.action === activeFilter;
        return matchesSearch && matchesFilter;
    });

    const primaryColor = systemInfo.primaryColor || '#4f46e5';

    return (
        <div className="flex-1 flex flex-col h-full animate-fade-in bg-slate-50 gap-6 p-[var(--sie-viewport-padding)]">
            
            <header className="bg-slate-900 p-8 rounded-[var(--sie-radius)] text-white shadow-xl shrink-0 overflow-hidden relative flex flex-col md:flex-row justify-between items-center gap-6 border border-white/5">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="flex items-center gap-5 relative z-10">
                    <div className="p-4 bg-indigo-600 rounded-2xl shadow-xl" style={{ backgroundColor: primaryColor }}><Terminal size={28}/></div>
                    <div>
                        <h2 className="text-2xl font-black tracking-tightest uppercase leading-none">Auditoria Forense</h2>
                        <p className="text-indigo-400 text-[9px] font-black uppercase tracking-widest mt-2 opacity-80">SRE Traceability Ledger V11.0</p>
                    </div>
                </div>
                <div className="flex gap-4 relative z-10">
                    <button onClick={loadLogs} className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 transition-all"><RefreshCw size={20}/></button>
                    <button onClick={handleExport} className="px-10 py-4 bg-white text-indigo-950 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-2xl flex items-center gap-3 hover:bg-indigo-50 transition-all active:scale-95">
                        <Download size={18}/> Exportar Ledger
                    </button>
                </div>
            </header>

            <div className="bg-white rounded-[3rem] shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col relative">
                <div className="p-6 border-b border-slate-100 bg-white sticky top-0 z-20 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18}/>
                        <input className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-black uppercase focus:bg-white focus:border-indigo-500 transition-all outline-none" placeholder="FILTRAR EVENTO..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
                    </div>
                    <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 overflow-x-auto no-scrollbar max-w-full">
                        {['ALL', 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'EXPORT_REPORT'].map(f => (
                            <button key={f} onClick={() => setActiveFilter(f)} className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeFilter === f ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
                                {f === 'ALL' ? 'Todos' : f}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    {loading ? <div className="p-20 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={40}/></div> : (
                        <div className="space-y-4">
                            {filteredLogs.map(log => (
                                <div key={log.id} className="bg-white border border-slate-100 p-6 rounded-[2rem] flex flex-col md:flex-row items-center gap-8 group hover:shadow-xl transition-all hover:border-indigo-300">
                                    <div className="flex items-center gap-6 flex-1 w-full">
                                        <div className={`p-4 rounded-2xl shadow-inner ${log.action === 'DELETE' ? 'bg-rose-50 text-rose-500' : log.action === 'CREATE' ? 'bg-emerald-50 text-emerald-500' : 'bg-indigo-50 text-indigo-500'}`}>
                                            <Shield size={24}/>
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-3 mb-1">
                                                <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase ${log.action === 'DELETE' ? 'bg-rose-100 text-rose-700' : log.action === 'CREATE' ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-100 text-indigo-700'}`}>
                                                    [{log.action}]
                                                </span>
                                                <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight truncate">
                                                    {log.details}
                                                </h4>
                                            </div>
                                            <div className="flex items-center gap-4 text-slate-400">
                                                <p className="text-[9px] font-bold uppercase flex items-center gap-1.5"><User size={12}/> {log.operator_name || 'KERN'}</p>
                                                <p className="text-[9px] font-bold uppercase flex items-center gap-1.5"><Database size={12}/> SRC: {log.table_name}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6 shrink-0 w-full md:w-auto justify-end border-t md:border-t-0 pt-4 md:pt-0">
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-slate-800 uppercase leading-none">{new Date(log.created_at).toLocaleTimeString()}</p>
                                            <p className="text-[8px] font-bold text-slate-400 uppercase mt-1.5">{new Date(log.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <div className="p-3 bg-slate-50 rounded-xl text-slate-300 group-hover:text-indigo-600 transition-colors">
                                            <ArrowRight size={16}/>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {filteredLogs.length === 0 && (
                                <div className="py-40 text-center opacity-20">
                                    <History size={80} className="mx-auto mb-6"/>
                                    <p className="font-black uppercase text-xl tracking-[0.4em]">Ledger Limpo</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuditLogs;
