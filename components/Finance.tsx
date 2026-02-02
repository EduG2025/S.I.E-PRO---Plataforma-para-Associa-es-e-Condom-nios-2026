
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FinancialRecord, SystemInfo } from '../types';
import { financialService, planService, api, systemService } from '../services/api';
import { FINANCIAL_CATEGORIES } from '../constants';
import {
    Plus, X, CreditCard,
    ArrowDownLeft, ArrowUpRight, Loader2, Save, Edit2, Wallet, Receipt, Shield,
    BarChart3, FileSpreadsheet, Printer, Download, Filter, RefreshCw, Heart, Calendar, Activity, TrendingUp, History,
    AlertCircle, Search, Eye, DollarSign, Clock, LayoutGrid, ToggleRight,
    FileDown, Landmark
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, CartesianGrid } from 'recharts';

/**
 * S.I.E PRO - FINANCIAL ENGINE V13.5 (SOVEREIGN PRINT & EXPORT)
 */

interface FinanceProps {
    systemInfo: SystemInfo;
}

const Finance = ({ systemInfo }: FinanceProps) => {
    const primaryColor = systemInfo.primaryColor || '#4f46e5';
    const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'RECEIVABLES' | 'PAYABLES' | 'PLANS' | 'AUDIT'>('DASHBOARD');
    const [records, setRecords] = useState<FinancialRecord[]>([]);
    const [plans, setPlans] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingRecord, setEditingRecord] = useState<any>(null);
    const [editingPlan, setEditingPlan] = useState<any>(null);
    const [stats, setStats] = useState({ income: 0, expense: 0, pending: 0, donations: 0 });

    useEffect(() => { loadData(); }, [activeTab]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            if (activeTab === 'PLANS') {
                const res = await planService.getAll();
                setPlans(res.data.data || []);
            } else {
                const res = await financialService.getAll({
                    type: activeTab === 'RECEIVABLES' ? 'INCOME' : activeTab === 'PAYABLES' ? 'EXPENSE' : undefined
                });
                const data = res.data.data || [];
                setRecords(data);

                const inc = data.reduce((acc: number, r: any) => r.type === 'INCOME' && r.status === 'PAID' ? acc + Number(r.amount) : acc, 0);
                const exp = data.reduce((acc: number, r: any) => r.type === 'EXPENSE' ? acc + Number(r.amount) : acc, 0);
                const pend = data.reduce((acc: number, r: any) => r.status !== 'PAID' ? acc + Number(r.amount) : acc, 0);
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

    const handleSavePlan = async (e: any) => {
        if (e) e.preventDefault();
        setIsSaving(true);
        try {
            if (editingPlan.id) await planService.update(editingPlan.id, editingPlan);
            else await planService.create(editingPlan);
            setIsPlanModalOpen(false);
            loadData();
        } finally { setIsSaving(false); }
    };

    const handleExportLedger = async () => {
        if (records.length === 0) return;
        
        await systemService.logTacticalExport({
            module: 'FINANCIAL_LEDGER',
            count: records.length,
            criteria: { tab: activeTab }
        });

        const headers = ["DATA", "DESCRICAO", "CATEGORIA", "TIPO", "STATUS", "VALOR"];
        const rows = records.map(r => [
            new Date(r.date).toLocaleDateString('pt-BR'),
            `"${r.description}"`, // Escape quotes
            r.category,
            r.type,
            r.status,
            r.amount
        ].join(","));

        // SRE FIX: Adiciona BOM (\uFEFF) para forçar Excel a ler como UTF-8
        const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `ledger_financeiro_${Date.now()}.csv`);
        link.click();
    };

    return (
        <div className="flex h-full flex-col space-y-4 animate-fade-in relative overflow-hidden print:overflow-visible">
            
            {/* CABEÇALHO DE IMPRESSÃO OCULTO (SÓ APARECE NO PAPEL) */}
            <div className="hidden print:flex flex-col border-b-2 border-black pb-4 mb-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        {systemInfo.logoUrl && <img src={systemInfo.logoUrl} className="h-16 w-auto object-contain" alt="Logo"/>}
                        <div>
                            <h1 className="text-xl font-black uppercase">{systemInfo.name}</h1>
                            <p className="text-xs uppercase">CNPJ: {systemInfo.cnpj}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-lg font-bold uppercase">Relatório Financeiro</h2>
                        <p className="text-xs">Emissão: {new Date().toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-row justify-between items-center bg-slate-900 p-6 rounded-[2.5rem] text-white shadow-xl shrink-0 overflow-hidden relative print:hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                <div className="flex items-center gap-4 relative z-10">
                    <div className="p-3 bg-indigo-600 rounded-2xl shadow-2xl" style={{ backgroundColor: primaryColor }}><Wallet size={24} /></div>
                    <div>
                        <h2 className="text-xl font-black uppercase leading-none tracking-tight">Tesouraria {systemInfo.shortName}</h2>
                        <p className="text-indigo-400 text-[9px] font-black uppercase tracking-[0.3em] mt-2 opacity-80">Gestão Ledger & Recorrência</p>
                    </div>
                </div>
                <div className="flex gap-3 relative z-10">
                    <button onClick={() => window.print()} className="px-4 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl transition-all" title="Imprimir Relatório"><Printer size={18}/></button>
                    <button onClick={handleExportLedger} className="px-4 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl transition-all" title="Exportar CSV"><FileDown size={18}/></button>
                    {activeTab === 'PLANS' ? (
                        <button onClick={() => { setEditingPlan({ name: '', price: 0, billing_cycle: 'monthly', active: 1 }); setIsPlanModalOpen(true); }} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-2xl flex items-center gap-3 transition-all" style={{ backgroundColor: primaryColor }}><Plus size={18} /> Novo Plano</button>
                    ) : (
                        <button onClick={() => { setEditingRecord({ description: '', amount: '', type: 'INCOME', category: 'CONDOMÍNIO', date: new Date().toISOString().slice(0, 10), status: 'PENDING' }); setIsModalOpen(true); }} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-2xl flex items-center gap-3 transition-all" style={{ backgroundColor: primaryColor }}><Plus size={18} /> Lançamento</button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm flex-1 overflow-hidden flex flex-col min-h-0 print:border-none print:shadow-none print:overflow-visible">
                <div className="flex bg-slate-50 p-2 border-b overflow-x-auto shrink-0 gap-2 print:hidden">
                    {['DASHBOARD', 'RECEIVABLES', 'PAYABLES', 'PLANS', 'AUDIT'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 min-w-[150px] py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-indigo-600 shadow-md border border-indigo-100' : 'text-slate-400 hover:text-slate-600'}`} style={activeTab === tab ? { color: primaryColor } : {}}>
                            {tab === 'PLANS' ? 'Recorrência' : tab}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar print:overflow-visible">
                    {activeTab === 'PLANS' ? (
                        <div className="p-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 print:block">
                            {plans.map(plan => (
                                <div key={plan.id} className="bg-slate-50 p-8 rounded-[3rem] border border-slate-200 flex flex-col group hover:shadow-xl transition-all print:border-black print:mb-4 print:break-inside-avoid">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="p-4 bg-white rounded-2xl shadow-sm print:hidden"><LayoutGrid size={24} className="text-indigo-600"/></div>
                                        <button onClick={() => { setEditingPlan(plan); setIsPlanModalOpen(true); }} className="p-2 text-slate-300 hover:text-indigo-600 print:hidden"><Edit2 size={16}/></button>
                                    </div>
                                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">{plan.name}</h3>
                                    <p className="text-xs text-slate-500 font-medium mb-8 flex-1">{plan.description || 'Sem descrição.'}</p>
                                    <div className="pt-6 border-t border-slate-200 flex justify-between items-end">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Valor Mensal</p>
                                            <p className="text-2xl font-black text-slate-900">R$ {Number(plan.price).toLocaleString('pt-BR')}</p>
                                        </div>
                                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[8px] font-black uppercase rounded-lg border border-emerald-100 print:border-black print:text-black">Ativo</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : activeTab === 'DASHBOARD' ? (
                        <div className="p-10 space-y-12 print:space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 print:grid-cols-2">
                                {[
                                    { label: 'Receita', value: stats.income, icon: ArrowUpRight, color: 'text-emerald-600' },
                                    { label: 'Despesa', value: stats.expense, icon: ArrowDownLeft, color: 'text-rose-600' },
                                    { label: 'Pendente', value: stats.pending, icon: AlertCircle, color: 'text-amber-600' },
                                    { label: 'Doações', value: stats.donations, icon: Heart, color: 'text-indigo-600' }
                                ].map((stat, i) => (
                                    <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between print:border-black print:rounded-xl">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                                            <h4 className="text-xl font-black text-slate-800 mt-2">R$ {stat.value.toLocaleString('pt-BR')}</h4>
                                        </div>
                                        <stat.icon className={`${stat.color} print:hidden`} size={24} />
                                    </div>
                                ))}
                            </div>
                            
                            <div className="print:hidden">
                                <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-6">Fluxo de Caixa Visual</h4>
                                <div className="h-64 w-full bg-slate-50 rounded-[2rem] border border-slate-100 p-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={[
                                            { name: 'Receita', value: stats.income, color: '#10b981' },
                                            { name: 'Despesa', value: stats.expense, color: '#ef4444' },
                                            { name: 'Pendente', value: stats.pending, color: '#f59e0b' }
                                        ]}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900}} />
                                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                                            <Tooltip cursor={{fill: 'transparent'}} />
                                            <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                                                {[0,1,2].map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={['#10b981', '#ef4444', '#f59e0b'][index]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto print:overflow-visible">
                            <table className="w-full text-left border-separate border-spacing-0 print:border-collapse">
                                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b sticky top-0 z-10 backdrop-blur-md print:static print:bg-white print:text-black">
                                    <tr className="bg-white/95 print:bg-white"><th className="p-8 border-b print:p-2">Descrição</th><th className="p-8 border-b text-center print:p-2">Vencimento</th><th className="p-8 border-b print:p-2">Categoria</th><th className="p-8 text-right border-b print:p-2">Montante</th><th className="p-8 text-right border-b print:hidden">Ações</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 print:divide-black">
                                    {records.map(r => (
                                        <tr key={r.id} className="hover:bg-slate-50 transition-colors group print:hover:bg-transparent">
                                            <td className="p-8 print:p-2">
                                                <div className="flex items-center gap-6 print:gap-2">
                                                    <div className={`p-4 rounded-2xl print:hidden ${r.type === 'INCOME' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                        {r.type === 'INCOME' ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                                                    </div>
                                                    <p className="font-black text-slate-800 text-base print:text-xs">{r.description} {r.is_recurring ? '🔄' : ''}</p>
                                                </div>
                                            </td>
                                            <td className="p-8 text-center text-sm font-bold text-slate-500 print:p-2 print:text-xs">{(r as any).due_date ? new Date((r as any).due_date).toLocaleDateString('pt-BR') : new Date(r.date).toLocaleDateString('pt-BR')}</td>
                                            <td className="p-8 print:p-2"><span className="px-4 py-1.5 text-[9px] font-black uppercase rounded-xl border bg-indigo-50 text-indigo-600 border-indigo-100 print:border-none print:bg-transparent print:text-black print:px-0">{r.category}</span></td>
                                            <td className={`p-8 text-right font-black text-lg print:p-2 print:text-xs ${r.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600 print:text-black'}`}>R$ {Number(r.amount).toLocaleString('pt-BR')}</td>
                                            <td className="p-8 text-right print:hidden"><button onClick={() => { setEditingRecord(r as any); setIsModalOpen(true); }} className="p-4 text-slate-300 hover:text-indigo-600 rounded-2xl transition-all border border-transparent hover:border-indigo-100"><Edit2 size={18} /></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL PLANO */}
            {isPlanModalOpen && editingPlan && (
                <div className="sie-editor-overlay">
                    <div className="sie-modal-container !h-auto !max-w-2xl self-center">
                        <div className="h-20 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-white/5">
                            <h3 className="font-black text-xl uppercase tracking-tighter">Molde de Assinatura</h3>
                            <button onClick={() => setIsPlanModalOpen(false)} className="p-3.5 hover:bg-rose-500 rounded-xl transition-all"><X size={24} /></button>
                        </div>
                        <div className="p-10 space-y-8 bg-white">
                            <form onSubmit={handleSavePlan} className="space-y-6">
                                <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Plano</label><input required className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6" value={editingPlan.name} onChange={e => setEditingPlan({...editingPlan, name: e.target.value.toUpperCase()})} /></div>
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor Mensal (R$)</label><input type="number" step="0.01" className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6" value={editingPlan.price} onChange={e => setEditingPlan({...editingPlan, price: e.target.value})} /></div>
                                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ciclo</label>
                                        <select className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 font-black uppercase" value={editingPlan.billing_cycle} onChange={e => setEditingPlan({...editingPlan, billing_cycle: e.target.value})}>
                                            <option value="monthly">Mensal</option>
                                            <option value="yearly">Anual</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição</label><textarea className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-6" value={editingPlan.description} onChange={e => setEditingPlan({...editingPlan, description: e.target.value})} /></div>
                                <button type="submit" disabled={isSaving} className="w-full py-6 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-emerald-600 transition-all">
                                    {isSaving ? <Loader2 className="animate-spin mx-auto" /> : 'Sincronizar Plano'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {isModalOpen && editingRecord && (
                <div className="sie-editor-overlay">
                    <div className="sie-modal-container">
                        <div className="h-20 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-white/5">
                            <h3 className="font-black text-xl uppercase tracking-tighter">Protocolo Financeiro</h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-3.5 hover:bg-rose-500 hover:text-white text-slate-400 rounded-xl transition-all"><X size={24} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-10 bg-white">
                            <form onSubmit={handleSave} className="max-w-3xl mx-auto space-y-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição do Lançamento</label>
                                    <input required className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-2xl px-8 text-xl focus:border-indigo-500 outline-none" value={editingRecord.description} onChange={e => setEditingRecord({ ...editingRecord, description: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor (R$)</label>
                                        <input type="number" step="0.01" className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-xl" value={editingRecord.amount} onChange={e => setEditingRecord({ ...editingRecord, amount: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data de Vencimento</label>
                                        <input type="date" className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-xl" value={editingRecord.due_date || editingRecord.date} onChange={e => setEditingRecord({ ...editingRecord, due_date: e.target.value })} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
                                        <select className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-sm uppercase appearance-none" value={editingRecord.category} onChange={e => setEditingRecord({ ...editingRecord, category: e.target.value })}>
                                            {FINANCIAL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo</label>
                                        <select className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-sm uppercase appearance-none" value={editingRecord.type} onChange={e => setEditingRecord({ ...editingRecord, type: e.target.value as any })}>
                                            <option value="INCOME">Receita</option>
                                            <option value="EXPENSE">Despesa</option>
                                        </select>
                                    </div>
                                </div>
                                <button type="submit" disabled={isSaving} className="w-full py-6 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all" style={{ backgroundColor: primaryColor }}>
                                    {isSaving ? <Loader2 className="animate-spin mx-auto" /> : 'Sincronizar Lançamento'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Finance;
