
import React, { useState, useEffect } from 'react';
import { Notice, SystemInfo, AutomationRule, Campaign, MessageTemplate, MessengerButton, User as UserType } from '../types';
import { communicationService, userService } from '../services/api';
// [SIE: ADICIONADO: "Info" aos imports de lucide-react]
import { 
    Megaphone, Plus, Search, Loader2, Trash2, Edit2, X, Save, 
    AlertTriangle, Bell, CheckCircle2, LayoutDashboard, 
    Zap, Send, Filter, BarChart3, Clock, Terminal, Globe, Workflow, Info
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';

interface CommunicationProps {
    systemInfo: SystemInfo;
    currentUser: UserType | null;
}

const Communication = ({ systemInfo, currentUser }: CommunicationProps) => {
    const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'NOTICES' | 'CAMPAIGNS' | 'RULES'>('DASHBOARD');

    const [notices, setNotices] = useState<Notice[]>([]);
    const [rules, setRules] = useState<AutomationRule[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [templates, setTemplates] = useState<MessageTemplate[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [editingRule, setEditingRule] = useState<Partial<AutomationRule> | null>(null);

    const isMaster = currentUser?.role === 'ADMIN';
    const primaryColor = systemInfo.primaryColor || '#4f46e5';

    useEffect(() => { loadAllData(); }, []);

    const loadAllData = async () => {
        setLoading(true);
        try {
            const [noticesRes, rulesRes, campsRes, tplsRes] = await Promise.all([
                communicationService.getNotices(),
                communicationService.getRules(),
                communicationService.getCampaigns(),
                communicationService.getTemplates()
            ]);
            setNotices(noticesRes.data?.data || []);
            setRules(rulesRes.data?.data || []);
            setCampaigns(campsRes.data?.data || []);
            setTemplates(tplsRes.data?.data || []);
        } catch (error) {
            console.error("Communication Hub Offline");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveRule = async () => {
        if (!editingRule?.title) return;
        setIsSaving(true);
        try {
            await communicationService.createRule(editingRule);
            setEditingRule(null);
            loadAllData();
        } finally { setIsSaving(false); }
    };

    const engagementData = [
        { name: 'Seg', sent: 120, open: 98 },
        { name: 'Ter', sent: 85, open: 76 },
        { name: 'Qua', sent: 140, open: 110 },
        { name: 'Qui', sent: 90, open: 85 },
        { name: 'Sex', sent: 60, open: 45 },
        { name: 'Sáb', sent: 30, open: 20 },
        { name: 'Dom', sent: 15, open: 10 },
    ];

    if (loading) return (
        <div className="h-full flex flex-col items-center justify-center p-20">
            <Loader2 size={56} className="animate-spin text-indigo-600 mb-6"/>
            <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.4em] animate-pulse">Sincronizando Mensageria Omni-Channel...</p>
        </div>
    );

    return (
        <div className="flex-1 flex flex-col h-full animate-fade-in bg-slate-50 gap-6 p-[var(--sie-viewport-padding)]">
            
            <header className="bg-slate-900 p-8 rounded-[var(--sie-radius)] text-white shadow-xl shrink-0 overflow-hidden relative flex flex-col md:flex-row justify-between items-center gap-6 border border-white/5">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="flex items-center gap-5 relative z-10">
                    <div className="p-4 bg-indigo-600 rounded-2xl shadow-xl" style={{ backgroundColor: primaryColor }}><Megaphone size={28}/></div>
                    <div>
                        <h2 className="text-2xl font-black tracking-tightest uppercase leading-none">Comunicação Unificada</h2>
                        <p className="text-indigo-400 text-[9px] font-black uppercase tracking-widest mt-2 opacity-80">SRE Omni-Channel Hub V11.0</p>
                    </div>
                </div>
                <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10 relative z-10 overflow-x-auto no-scrollbar">
                    {[
                        { id: 'DASHBOARD', label: 'Dashboard', icon: LayoutDashboard },
                        { id: 'NOTICES', label: 'Mural Tático', icon: Bell },
                        { id: 'CAMPAIGNS', label: 'Fluxos Ativos', icon: Zap },
                        { id: 'RULES', label: 'Automação', icon: Filter }
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 whitespace-nowrap ${activeTab === tab.id ? 'bg-white text-indigo-900 shadow-xl' : 'text-slate-400 hover:text-white'}`}>
                            <tab.icon size={16}/> {tab.label}
                        </button>
                    ))}
                </div>
            </header>

            <div className="flex-1 bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col relative">
                <div className="flex-1 overflow-y-auto custom-scrollbar">

                    {activeTab === 'DASHBOARD' && (
                        <div className="space-y-12 animate-fade-in pb-10">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                {[
                                    { label: 'Disparos Omni-Channel', value: '5.2K', color: 'text-indigo-600', icon: Send },
                                    { label: 'Informativos Mural', value: notices.length, color: 'text-emerald-600', icon: Bell },
                                    { label: 'Ativos de Mensageria', value: templates.length, color: 'text-purple-600', icon: Terminal },
                                    { label: 'Saúde de Rede', value: '98.5%', color: 'text-amber-500', icon: Globe }
                                ].map((stat, i) => (
                                    <div key={i} className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100 flex items-center justify-between group hover:border-indigo-300 transition-all shadow-inner">
                                        <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p><h3 className="text-3xl font-black text-slate-800 mt-2">{stat.value}</h3></div>
                                        <div className={`p-4 rounded-2xl bg-white shadow-md group-hover:scale-110 transition-all ${stat.color}`}><stat.icon size={24}/></div>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-slate-50 p-12 rounded-[3.5rem] border border-slate-100 shadow-inner h-[450px]">
                                <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-10 flex items-center gap-3"><BarChart3 size={20}/> Engajamento do Cluster (D-7)</h4>
                                <ResponsiveContainer width="100%" height="85%">
                                    <BarChart data={engagementData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0"/>
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} dy={15}/>
                                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}}/>
                                        <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)'}}/>
                                        <Bar dataKey="sent" fill={primaryColor} radius={[8, 8, 0, 0]} barSize={50}>
                                            {engagementData.map((_, index) => <Cell key={`cell-${index}`} fill={primaryColor} fillOpacity={0.6 + (index * 0.05)} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    {activeTab === 'RULES' && (
                        <div className="space-y-10 animate-fade-in pb-10">
                            <div className="flex justify-between items-center bg-indigo-50 p-12 rounded-[3.5rem] border border-indigo-100">
                                <div>
                                    <h3 className="text-3xl font-black uppercase text-indigo-950 tracking-tightest">Regras de Segmentação</h3>
                                    <p className="text-indigo-600 text-[11px] font-bold uppercase tracking-widest mt-2">Filtros dinâmicos para automação de fluxos massivos.</p>
                                </div>
                                <button onClick={() => setEditingRule({ title: 'NOVA REGRA TÁTICA', conditions: [] })} className="px-12 py-5 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl hover:bg-indigo-700 transition-all active:scale-95 flex items-center gap-3 shadow-indigo-500/30">
                                    <Plus size={22}/> Criar Regra
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                {rules.map(rule => (
                                    <div key={rule.id} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-between hover:border-indigo-300 transition-all group">
                                        <div>
                                            <div className="flex justify-between items-start mb-8">
                                                <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all"><Filter size={24}/></div>
                                                <button onClick={() => communicationService.deleteRule(rule.id).then(loadAllData)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={18}/></button>
                                            </div>
                                            <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">{rule.title}</h4>
                                            <div className="mt-6 space-y-3">
                                                {(typeof rule.conditions === 'string' ? JSON.parse(rule.conditions) : rule.conditions).map((c:any, i:number) => (
                                                    <div key={i} className="px-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px] font-black text-slate-500 uppercase flex items-center gap-2">
                                                        <Workflow size={12} className="text-indigo-400"/> {c.field} {c.operator} {c.value}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'CAMPAIGNS' && (
                        <div className="space-y-10 animate-fade-in pb-10">
                            <div className="grid grid-cols-1 gap-8">
                                {campaigns.map(camp => (
                                    <div key={camp.id} className="bg-white p-10 px-12 rounded-[3.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-10 group hover:border-indigo-300 transition-all">
                                        <div className="flex items-center gap-10">
                                            <div className={`p-8 rounded-[2rem] shadow-inner ${camp.status === 'RUNNING' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                                                <Zap size={36} className={camp.status === 'RUNNING' ? 'animate-pulse' : ''}/>
                                            </div>
                                            <div>
                                                <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tightest">{camp.title}</h4>
                                                <div className="flex gap-6 mt-3">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Alvos Mapeados: {camp.total_targets}</span>
                                                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em]">Enviados: {camp.sent_count}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-10 w-full md:w-auto">
                                            <div className="flex-1 md:w-80 h-4 bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-200/50">
                                                <div className="h-full bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.6)] transition-all duration-1000" style={{ width: `${(camp.sent_count / camp.total_targets) * 100}%` }}></div>
                                            </div>
                                            <span className="text-lg font-black text-slate-900 w-16 text-right font-mono">{Math.round((camp.sent_count / (camp.total_targets || 1)) * 100)}%</span>
                                        </div>
                                    </div>
                                ))}
                                {campaigns.length === 0 && (
                                    <div className="py-48 text-center opacity-20 flex flex-col items-center gap-8">
                                        <Zap size={80} />
                                        <p className="font-black uppercase text-base tracking-[0.5em]">Fila de Transmissão Vazia</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
            
            {/* Rule Creator Modal */}
            {editingRule && (
                <div className="sie-editor-overlay">
                    <div className="sie-modal-container !h-auto !max-w-2xl self-center border border-white/10 shadow-2xl">
                        <div className="h-24 px-10 bg-slate-900 text-white flex justify-between items-center rounded-t-[var(--sie-radius)]">
                            <h3 className="font-black text-xl uppercase tracking-tighter">Protocolar Automação</h3>
                            <button onClick={() => setEditingRule(null)} className="p-3.5 hover:bg-rose-500 rounded-2xl transition-all"><X size={28}/></button>
                        </div>
                        <div className="p-12 space-y-10 bg-white rounded-b-[var(--sie-radius)]">
                            <div className="space-y-4">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Título do Protocolo</label>
                                <input required className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-8 text-lg font-black uppercase outline-none focus:border-indigo-500 shadow-inner" value={editingRule.title} onChange={e => setEditingRule({...editingRule, title: e.target.value.toUpperCase()})} />
                            </div>
                            <div className="p-8 bg-indigo-50 rounded-[2.5rem] border border-indigo-100 flex items-center gap-6 shadow-sm">
                                <Info size={32} className="text-indigo-600 shrink-0"/>
                                <p className="text-[11px] font-bold text-indigo-900 uppercase leading-relaxed">As regras permitem o agrupamento tático de membros por critérios demográficos para automação total de disparos via Messenger Bridge.</p>
                            </div>
                            <button onClick={handleSaveRule} disabled={isSaving} className="w-full py-6 bg-slate-950 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50">
                                {isSaving ? <Loader2 className="animate-spin" size={24}/> : <Save size={24}/>} Commitar Regra de Fluxo
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Communication;
