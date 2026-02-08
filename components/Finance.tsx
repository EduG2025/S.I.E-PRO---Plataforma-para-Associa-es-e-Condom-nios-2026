
import React, { useState, useEffect, useMemo } from 'react';
import { FinancialRecord, SystemInfo } from '../types';
import { financialService, api, systemService } from '../services/api';
import {
    Plus, X, ArrowDownLeft, ArrowUpRight, Loader2, Save, 
    Wallet, Landmark, PieChart as PieIcon, Activity, Printer, FileDown,
    AlertCircle, Search, Eye, TrendingUp, DollarSign, Clock, LayoutGrid
} from 'lucide-react';
import { 
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, 
    AreaChart, Area, CartesianGrid, XAxis, YAxis
} from 'recharts';

const Finance = ({ systemInfo }: { systemInfo: SystemInfo }) => {
    const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'RECEIVABLES' | 'PAYABLES' | 'AUDIT'>('DASHBOARD');
    const [records, setRecords] = useState<FinancialRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState<any>(null);
    const [stats, setStats] = useState({ income: 0, expense: 0, pending: 0, donations: 0 });

    const primaryColor = systemInfo.primaryColor || '#4f46e5';

    useEffect(() => { loadData(); }, [activeTab]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            if (activeTab === 'AUDIT') {
                const res = await api.get('/governance/reports');
                setRecords(res.data.data?.filter((l: any) => l.table_name === 'financials') || []);
            } else {
                const res = await financialService.getAll({
                    type: activeTab === 'RECEIVABLES' ? 'INCOME' : activeTab === 'PAYABLES' ? 'EXPENSE' : undefined
                });
                const data = res.data.data || [];
                setRecords(data);

                const inc = data.reduce((acc: number, r: any) => r.type === 'INCOME' && r.status === 'PAID' ? acc + Number(r.amount) : acc, 0);
                const exp = data.reduce((acc: number, r: any) => r.type === 'EXPENSE' && r.status === 'PAID' ? acc + Number(r.amount) : acc, 0);
                const pend = data.reduce((acc: number, r: any) => r.status === 'PENDING' ? acc + Number(r.amount) : acc, 0);
                const don = data.reduce((acc: number, r: any) => r.category === 'DOAÇÃO' ? acc + Number(r.amount) : acc, 0);
                setStats({ income: inc, expense: exp, pending: pend, donations: don });
            }
        } finally { setIsLoading(false); }
    };

    const handleSave = async (e: any) => {
        if (e) e.preventDefault();
        setIsSaving(true);
        try {
            if (editingRecord.id) await financialService.update(editingRecord.id, editingRecord);
            else await financialService.create(editingRecord);
            setIsModalOpen(false);
            loadData();
        } finally { setIsSaving(false); }
    };

    const handleExportLedger = async () => {
        if (records.length === 0) return;
        await systemService.logTacticalExport({ module: 'FINANCIAL_LEDGER', count: records.length });
        const headers = ["DATA", "DESCRICAO", "CATEGORIA", "TIPO", "STATUS", "VALOR"];
        const csvContent = "\uFEFF" + [headers.join(","), ...records.map(r => [new Date(r.date).toLocaleDateString('pt-BR'), `"${r.description}"`, r.category, r.type, r.status, r.amount].join(","))].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `ledger_sre_${Date.now()}.csv`;
        link.click();
    };

    if (isLoading && records.length === 0) return (
        <div className="flex-1 flex flex-col items-center justify-center p-20">
            <Loader2 className="animate-spin text-emerald-600 mb-6" size={56} />
            <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.4em] animate-pulse">Consultando Ledger Financeiro...</p>
        </div>
    );

    return (
        <div className="flex-1 flex flex-col h-full animate-fade-in bg-slate-50 gap-6 p-[var(--sie-viewport-padding)]">
            
            <header className="bg-slate-900 p-8 rounded-[var(--sie-radius)] text-white shadow-xl shrink-0 overflow-hidden relative flex flex-col md:flex-row justify-between items-center gap-6 border border-white/5">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="flex items-center gap-5 relative z-10">
                    <div className="p-4 bg-emerald-600 rounded-2xl shadow-xl" style={{ backgroundColor: primaryColor }}><Landmark size={28}/></div>
                    <div>
                        <h2 className="text-2xl font-black tracking-tightest uppercase leading-none">Ledger Financeiro</h2>
                        <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest mt-2 opacity-80">SRE Asset Management V14.0</p>
                    </div>
                </div>
                <div className="flex gap-4 relative z-10">
                    <button onClick={() => window.print()} className="p-3.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl transition-all shadow-sm"><Printer size={20}/></button>
                    <button onClick={handleExportLedger} className="p-3.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl transition-all shadow-sm"><FileDown size={20}/></button>
                    <button onClick={() => { setEditingRecord({ description: '', amount: '', type: 'INCOME', category: 'CONDOMÍNIO', date: new Date().toISOString().slice(0, 10), status: 'PENDING' }); setIsModalOpen(true); }} className="px-10 py-4 bg-white text-indigo-950 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-2xl flex items-center gap-3 hover:bg-indigo-50 transition-all active:scale-95">
                        <Plus size={20}/> Novo Lançamento
                    </button>
                </div>
            </header>

            <div className="flex-1 bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col relative">
                <div className="flex bg-slate-50 p-1.5 rounded-[1.75rem] border border-slate-200 mb-10 shrink-0 shadow-inner">
                    {['DASHBOARD', 'RECEIVABLES', 'PAYABLES', 'AUDIT'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-indigo-900 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`} style={activeTab === tab ? { color: primaryColor } : {}}>
                            {tab === 'RECEIVABLES' ? 'Fluxo de Entradas' : tab === 'PAYABLES' ? 'Fluxo de Saídas' : tab}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {activeTab === 'DASHBOARD' && (
                        <div className="space-y-12 animate-fade-in pb-10">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                {[
                                    { label: 'Realizado (Entradas)', value: stats.income, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: ArrowUpRight },
                                    { label: 'Realizado (Saídas)', value: stats.expense, color: 'text-rose-600', bg: 'bg-rose-50', icon: ArrowDownLeft },
                                    { label: 'Saldo de Cluster', value: stats.income - stats.expense, color: 'text-indigo-600', bg: 'bg-indigo-50', icon: Wallet },
                                    { label: 'Exposição Pendente', value: stats.pending, color: 'text-amber-600', bg: 'bg-amber-50', icon: AlertCircle }
                                ].map((kpi, i) => (
                                    <div key={i} className="p-10 rounded-[3rem] border border-slate-100 bg-slate-50 shadow-inner flex flex-col justify-between group hover:border-indigo-300 transition-all">
                                        <div className="flex justify-between items-center mb-8">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</p>
                                            <div className={`p-3 rounded-xl ${kpi.bg} ${kpi.color} shadow-sm`}><kpi.icon size={20}/></div>
                                        </div>
                                        <h3 className="text-3xl font-black text-slate-800 tracking-tightest">R$ {kpi.value.toLocaleString('pt-BR')}</h3>
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                                <div className="lg:col-span-8 bg-slate-50 p-12 rounded-[3.5rem] border border-slate-100 shadow-inner h-[450px]">
                                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-10 flex items-center gap-3"><Activity size={22}/> Evolução Histórica de Liquidez</h4>
                                    <ResponsiveContainer width="100%" height="85%">
                                        <AreaChart data={[{n:'Jan', v:400}, {n:'Fev', v:700}, {n:'Mar', v:600}, {n:'Abr', v:900}]}>
                                            <defs>
                                                <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={primaryColor} stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor={primaryColor} stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0"/>
                                            <XAxis dataKey="n" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} dy={10} />
                                            <Tooltip contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)'}} />
                                            <Area type="monotone" dataKey="v" stroke={primaryColor} fillOpacity={1} fill="url(#colorVal)" strokeWidth={5} />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="lg:col-span-4 bg-slate-50 p-12 rounded-[3.5rem] border border-slate-100 shadow-inner h-[450px] flex flex-col">
                                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-10 flex items-center gap-3"><PieIcon size={22}/> Mix de Receitas</h4>
                                    <div className="flex-1">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={[{n:'Taxas',v:80}, {n:'Doações',v:15}, {n:'Outros',v:5}]} innerRadius={70} outerRadius={100} paddingAngle={5} dataKey="v">
                                                    <Cell fill={primaryColor} />
                                                    <Cell fill="#10b981" />
                                                    <Cell fill="#cbd5e1" />
                                                </Pie>
                                                <Tooltip />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Finance;
