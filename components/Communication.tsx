
import React, { useState, useEffect, useMemo } from 'react';
import { Notice, SystemInfo, AutomationRule, Campaign, MessageTemplate } from '../types';
import { communicationService, aiService } from '../services/api';
import { 
    Megaphone, Plus, Search, Loader2, Trash2, Edit2, X, Save, 
    AlertTriangle, Info, Bell, CheckCircle2, LayoutDashboard, 
    Zap, Send, FileText, Filter, Play, Pause, BarChart3,
    Users, Clock, MousePointer2, Target, Calendar, MessageSquare,
    Sparkles, Copy, RefreshCw, FileCode
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from 'recharts';

interface CommunicationProps {
    systemInfo: SystemInfo;
}

const safeParseConditions = (rule: any) => {
    if (!rule || !rule.conditions) return [];
    if (Array.isArray(rule.conditions)) return rule.conditions;
    try {
        const parsed = typeof rule.conditions === 'string' ? JSON.parse(rule.conditions) : rule.conditions;
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

const Communication = ({ systemInfo }: CommunicationProps) => {
    // --- TABS & NAVIGATION ---
    const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'NOTICES' | 'TEMPLATES' | 'CAMPAIGNS' | 'RULES'>('DASHBOARD');

    // --- DATA STORES ---
    const [notices, setNotices] = useState<Notice[]>([]);
    const [rules, setRules] = useState<AutomationRule[]>([]);
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [templates, setTemplates] = useState<MessageTemplate[]>([]);
    
    // --- UI STATES ---
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // --- MODAL STATES ---
    const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
    const [editingNotice, setEditingNotice] = useState<Partial<Notice>>({ title: '', content: '', urgency: 'LOW' });

    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<Partial<MessageTemplate>>({ name: '', content: '', event_trigger: 'MANUAL', media_type: 'image' });

    const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<Partial<AutomationRule>>({ title: '', conditions: [] });

    const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
    const [newCampaign, setNewCampaign] = useState<any>({ title: '', rule_id: '', template_id: '' });

    // AI Prompt State
    const [aiPrompt, setAiPrompt] = useState('');
    const [showAiInput, setShowAiInput] = useState(false);

    useEffect(() => {
        loadAllData();
    }, []);

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

    // --- AI GHOSTWRITER ENGINE ---
    const handleGenerateContent = async (target: 'NOTICE' | 'TEMPLATE') => {
        if (!aiPrompt.trim()) return;
        setIsGeneratingAI(true);
        try {
            const context = target === 'NOTICE' 
                ? "Contexto: Aviso para moradores de condomínio/associação. Tom: Formal e Respeitoso." 
                : "Contexto: Mensagem curta para WhatsApp (Template). Variáveis disponíveis: {nome}, {unidade}. Tom: Direto e Amigável.";
            
            const res = await aiService.generateDocument(aiPrompt, context);
            const text = res.data.text.replace(/<[^>]*>?/gm, ''); // Remove HTML tags for plain text inputs

            if (target === 'NOTICE') {
                setEditingNotice(prev => ({ ...prev, content: text }));
            } else {
                setEditingTemplate(prev => ({ ...prev, content: text }));
            }
            setShowAiInput(false);
            setAiPrompt('');
        } catch (e) {
            alert("Falha na geração neural. Tente novamente.");
        } finally {
            setIsGeneratingAI(false);
        }
    };

    // --- HANDLERS: NOTICES ---
    const handleSaveNotice = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (editingNotice.id) await communicationService.updateNotice(editingNotice.id, editingNotice);
            else await communicationService.sendNotice(editingNotice);
            setIsNoticeModalOpen(false);
            loadAllData();
        } catch (e) { alert("Erro ao salvar aviso."); }
        finally { setIsSaving(false); }
    };

    const handleDeleteNotice = async (id: number) => {
        if (!confirm("Remover este aviso?")) return;
        try { await communicationService.deleteNotice(id); loadAllData(); } catch(e){ alert("Erro ao remover."); }
    };

    // --- HANDLERS: TEMPLATES ---
    const handleSaveTemplate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await communicationService.saveTemplate(editingTemplate);
            setIsTemplateModalOpen(false);
            loadAllData();
        } catch (e) { alert("Erro ao salvar template."); }
        finally { setIsSaving(false); }
    };

    const handleDeleteTemplate = async (id: number) => {
        if (!confirm("Excluir este template?")) return;
        try { await communicationService.deleteTemplate(id); loadAllData(); } catch(e){ alert("Erro ao remover template."); }
    };

    // --- HANDLERS: RULES ---
    const handleSaveRule = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const payload = {
                ...editingRule,
                conditions: Array.isArray(editingRule.conditions) ? editingRule.conditions : []
            };
            await communicationService.createRule(payload);
            setIsRuleModalOpen(false);
            loadAllData();
        } catch (e) { alert("Erro ao salvar regra."); }
        finally { setIsSaving(false); }
    };

    const handleDeleteRule = async (id: number) => {
        if (!confirm("Remover regra de automação?")) return;
        try { await communicationService.deleteRule(id); loadAllData(); } catch(e){ alert("Erro ao remover regra."); }
    };

    // --- HANDLERS: CAMPAIGNS ---
    const handleExecuteCampaign = async () => {
        if (!newCampaign.rule_id || !newCampaign.template_id) return alert("Selecione Regra e Template.");
        setIsSaving(true);
        try {
            const res = await communicationService.executeCampaign({
                title: newCampaign.title,
                ruleId: newCampaign.rule_id,
                templateId: newCampaign.template_id
            });
            alert(`Campanha iniciada! ${res.data.targets} alvos processados.`);
            setIsCampaignModalOpen(false);
            loadAllData();
        } catch (e) { alert("Falha ao iniciar campanha."); }
        finally { setIsSaving(false); }
    };

    const primaryColor = systemInfo.primaryColor || '#4f46e5';

    // Mock Data for Charts
    const engagementData = [
        { name: 'Seg', sent: 120, open: 98 },
        { name: 'Ter', sent: 85, open: 76 },
        { name: 'Qua', sent: 140, open: 110 },
        { name: 'Qui', sent: 90, open: 85 },
        { name: 'Sex', sent: 60, open: 45 },
        { name: 'Sáb', sent: 30, open: 20 },
        { name: 'Dom', sent: 15, open: 10 },
    ];

    if (loading) return <div className="h-full flex items-center justify-center"><Loader2 size={48} className="animate-spin text-indigo-600"/></div>;

    return (
        <div className="flex-1 flex flex-col min-h-0 space-y-6 animate-fade-in h-full relative">
            
            {/* HEADER MASTER */}
            <header className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-xl shrink-0 overflow-hidden relative flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="flex items-center gap-5 relative z-10">
                    <div className="p-4 bg-indigo-600 rounded-2xl shadow-xl" style={{ backgroundColor: primaryColor }}><Megaphone size={28}/></div>
                    <div>
                        <h2 className="text-2xl font-black tracking-tightest uppercase leading-none">Central de Comunicação</h2>
                        <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mt-2 opacity-80">CRM & Automação SRE</p>
                    </div>
                </div>
                <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10 relative z-10 overflow-x-auto no-scrollbar">
                    {[
                        { id: 'DASHBOARD', label: 'Visão Geral', icon: LayoutDashboard },
                        { id: 'NOTICES', label: 'Mural Avisos', icon: Bell },
                        { id: 'TEMPLATES', label: 'Templates', icon: FileCode },
                        { id: 'CAMPAIGNS', label: 'Campanhas', icon: Zap },
                        { id: 'RULES', label: 'Automação', icon: Filter }
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`} style={activeTab === tab.id ? { backgroundColor: primaryColor } : {}}>
                            <tab.icon size={14}/> {tab.label}
                        </button>
                    ))}
                </div>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                
                {/* DASHBOARD VIEW */}
                {activeTab === 'DASHBOARD' && (
                    <div className="space-y-8 animate-fade-in pb-10">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {[
                                { label: 'Mensagens Enviadas', value: campaigns.reduce((acc, c) => acc + (c.sent_count || 0), 0), color: 'text-indigo-600', icon: Send },
                                { label: 'Avisos Ativos', value: notices.length, color: 'text-emerald-600', icon: Bell },
                                { label: 'Templates Prontos', value: templates.length, color: 'text-purple-600', icon: FileCode },
                                { label: 'Campanhas Rodando', value: campaigns.filter(c => c.status === 'RUNNING').length, color: 'text-amber-500', icon: Zap }
                            ].map((stat, i) => (
                                <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex items-center justify-between group hover:shadow-lg transition-all">
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                                        <h3 className="text-3xl font-black text-slate-800 mt-2">{stat.value}</h3>
                                    </div>
                                    <div className={`p-4 rounded-2xl bg-slate-50 group-hover:bg-white group-hover:shadow-md transition-all ${stat.color}`}>
                                        <stat.icon size={24}/>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm h-[400px]">
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8 flex items-center gap-2"><BarChart3 size={18}/> Engajamento da Semana</h4>
                            <ResponsiveContainer width="100%" height="80%">
                                <BarChart data={engagementData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} dy={10}/>
                                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8'}}/>
                                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)'}}/>
                                    <Bar dataKey="sent" fill={primaryColor} radius={[6, 6, 0, 0]} barSize={40}>
                                        {engagementData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={primaryColor} fillOpacity={0.6 + (index * 0.05)} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* NOTICES VIEW */}
                {activeTab === 'NOTICES' && (
                    <div className="space-y-6 animate-fade-in pb-10">
                        <div className="flex justify-between items-center">
                            <div className="relative max-w-md w-full">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                                <input className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-[11px] font-black uppercase outline-none focus:border-indigo-500 shadow-sm transition-all" placeholder="BUSCAR AVISOS..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                            </div>
                            <button onClick={() => { setEditingNotice({ title: '', content: '', urgency: 'LOW' }); setIsNoticeModalOpen(true); }} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-2 transition-all hover:bg-indigo-600">
                                <Plus size={16}/> Novo Aviso
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {notices.filter(n => n.title.toLowerCase().includes(searchTerm.toLowerCase())).map(notice => (
                                <div key={notice.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col justify-between">
                                    <div className={`absolute top-0 left-0 w-2 h-full ${notice.urgency === 'HIGH' ? 'bg-rose-500' : notice.urgency === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
                                    <div className="flex justify-between items-start mb-6 pl-4">
                                        <div className={`p-3 rounded-2xl ${notice.urgency === 'HIGH' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
                                            {notice.urgency === 'HIGH' ? <AlertTriangle size={24}/> : <Bell size={24}/>}
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                            <button onClick={() => { setEditingNotice(notice); setIsNoticeModalOpen(true); }} className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl"><Edit2 size={16}/></button>
                                            <button onClick={() => handleDeleteNotice(Number(notice.id))} className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl"><Trash2 size={16}/></button>
                                        </div>
                                    </div>
                                    <div className="pl-4">
                                        <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-2 leading-tight">{notice.title}</h3>
                                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed mb-6 line-clamp-3 uppercase">{notice.content}</p>
                                        <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{new Date(notice.date || '').toLocaleDateString()}</span>
                                            <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase border ${notice.urgency === 'HIGH' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>{notice.urgency}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {notices.length === 0 && (
                                <div className="col-span-full py-20 text-center opacity-30">
                                    <Bell size={48} className="mx-auto mb-4"/>
                                    <p className="text-[10px] font-black uppercase">Nenhum aviso publicado</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* TEMPLATES VIEW (NEW) */}
                {activeTab === 'TEMPLATES' && (
                    <div className="space-y-6 animate-fade-in pb-10">
                        <div className="flex justify-end">
                            <button onClick={() => { setEditingTemplate({ name: '', content: '', event_trigger: 'MANUAL', media_type: 'image' }); setIsTemplateModalOpen(true); }} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-2 transition-all hover:bg-indigo-600">
                                <Plus size={16}/> Novo Template
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {templates.map(tpl => (
                                <div key={tpl.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-lg transition-all flex flex-col justify-between">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl"><MessageSquare size={20}/></div>
                                            <div>
                                                <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{tpl.name}</h4>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{tpl.event_trigger}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <button onClick={() => { setEditingTemplate(tpl); setIsTemplateModalOpen(true); }} className="p-2 text-slate-300 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all"><Edit2 size={16}/></button>
                                            <button onClick={() => handleDeleteTemplate(Number(tpl.id))} className="p-2 text-slate-300 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-all"><Trash2 size={16}/></button>
                                        </div>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4 h-24 overflow-hidden">
                                        <p className="text-[10px] text-slate-600 font-medium italic">"{tpl.content}"</p>
                                    </div>
                                    <div className="flex gap-2">
                                        {['{nome}', '{unidade}'].map(tag => (
                                            <span key={tag} className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-[8px] font-mono font-bold">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {templates.length === 0 && (
                                <div className="col-span-full py-20 text-center opacity-30">
                                    <FileCode size={48} className="mx-auto mb-4"/>
                                    <p className="text-[10px] font-black uppercase">Nenhum template cadastrado</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* RULES VIEW */}
                {activeTab === 'RULES' && (
                    <div className="space-y-6 animate-fade-in pb-10">
                        <div className="flex justify-end">
                            <button onClick={() => { setEditingRule({ title: '', conditions: [] }); setIsRuleModalOpen(true); }} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-2 hover:bg-indigo-600 transition-all">
                                <Plus size={16}/> Nova Regra
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {rules.map(rule => (
                                <div key={rule.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-lg transition-all">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Filter size={20}/></div>
                                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{rule.title}</h4>
                                        </div>
                                        <button onClick={() => handleDeleteRule(Number(rule.id))} className="text-slate-300 hover:text-rose-600 p-2 rounded-lg hover:bg-rose-50 transition-all"><Trash2 size={16}/></button>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Target size={14}/> Condições Lógicas</p>
                                        <div className="flex flex-wrap gap-2">
                                            {safeParseConditions(rule).map((c: any, i: number) => (
                                                <span key={i} className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[9px] font-mono text-indigo-600 uppercase shadow-sm">
                                                    {c.field} <span className="text-slate-400 mx-1">{c.operator === 'EQUALS' ? '=' : c.operator}</span> {c.value}
                                                </span>
                                            ))}
                                            {safeParseConditions(rule).length === 0 && <span className="text-[9px] text-slate-400 italic">Nenhuma condição definida.</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {rules.length === 0 && (
                                <div className="col-span-full py-20 text-center opacity-30">
                                    <Filter size={48} className="mx-auto mb-4"/>
                                    <p className="text-[10px] font-black uppercase">Nenhuma regra de automação</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* CAMPAIGNS VIEW */}
                {activeTab === 'CAMPAIGNS' && (
                    <div className="space-y-6 animate-fade-in pb-10">
                        <div className="flex justify-end">
                            <button onClick={() => { setNewCampaign({ title: '', rule_id: '', template_id: '' }); setIsCampaignModalOpen(true); }} className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-2 hover:bg-emerald-500 transition-all">
                                <Zap size={16}/> Executar Campanha
                            </button>
                        </div>
                        <div className="overflow-hidden bg-white rounded-[2.5rem] border border-slate-200 shadow-sm">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                    <tr>
                                        <th className="p-6 pl-8">Campanha</th>
                                        <th className="p-6">Status</th>
                                        <th className="p-6">Alvos</th>
                                        <th className="p-6 text-right pr-8">Progresso</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {campaigns.map(camp => (
                                        <tr key={camp.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-6 pl-8">
                                                <p className="text-sm font-black text-slate-800 uppercase">{camp.title}</p>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase mt-1 flex items-center gap-2"><Clock size={10}/> {new Date(camp.created_at || '').toLocaleDateString()}</p>
                                            </td>
                                            <td className="p-6"><span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase border ${camp.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>{camp.status}</span></td>
                                            <td className="p-6 text-sm font-black text-slate-600">{camp.total_targets}</td>
                                            <td className="p-6 pr-8 text-right">
                                                <div className="flex items-center justify-end gap-3">
                                                    <span className="text-[10px] font-black text-indigo-600">{camp.sent_count} / {camp.total_targets}</span>
                                                    <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                        <div className="h-full bg-indigo-600" style={{ width: `${camp.total_targets > 0 ? (camp.sent_count / camp.total_targets) * 100 : 0}%` }}></div>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {campaigns.length === 0 && (
                                        <tr><td colSpan={4} className="p-20 text-center text-slate-300 font-black uppercase text-[10px] tracking-widest italic">Nenhuma campanha registrada.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* MODALS */}
            
            {/* NOTICE MODAL */}
            {isNoticeModalOpen && (
                <div className="sie-editor-overlay">
                    <div className="sie-modal-container !h-auto !max-w-2xl self-center">
                        <form onSubmit={handleSaveNotice}>
                            <div className="h-20 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-white/5 rounded-t-[3rem]">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-indigo-600 rounded-lg shadow-lg"><Megaphone size={20}/></div>
                                    <h3 className="font-black text-xl uppercase tracking-tighter">Editor de Aviso</h3>
                                </div>
                                <button type="button" onClick={() => setIsNoticeModalOpen(false)} className="p-3 hover:bg-rose-500 rounded-xl transition-all border border-white/5"><X size={24}/></button>
                            </div>
                            <div className="p-10 space-y-6 bg-white rounded-b-[3rem]">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Título do Comunicado</label>
                                    <input required className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-sm font-black uppercase outline-none focus:border-indigo-500 transition-all" value={editingNotice.title} onChange={e => setEditingNotice({...editingNotice, title: e.target.value.toUpperCase()})} placeholder="EX: MANUTENÇÃO PREVENTIVA" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Urgência Visual</label>
                                    <select 
                                        className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-[10px] font-black uppercase outline-none focus:border-indigo-500 transition-all cursor-pointer" 
                                        value={editingNotice.urgency} 
                                        onChange={e => setEditingNotice({...editingNotice, urgency: e.target.value as 'LOW' | 'MEDIUM' | 'HIGH'})}
                                    >
                                        <option value="LOW">Baixa (Informativo)</option>
                                        <option value="MEDIUM">Média (Importante)</option>
                                        <option value="HIGH">Crítica (Urgente)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Conteúdo do Texto</label>
                                        <button type="button" onClick={() => { setShowAiInput(!showAiInput); setAiPrompt(''); }} className="text-[9px] font-black text-indigo-600 uppercase flex items-center gap-1 hover:text-indigo-800 transition-colors"><Sparkles size={12}/> {showAiInput ? 'Fechar IA' : 'Ghostwriter AI'}</button>
                                    </div>
                                    {showAiInput && (
                                        <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 mb-2 animate-slide-down">
                                            <input className="w-full h-10 bg-white border border-indigo-200 rounded-xl px-4 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20" placeholder="Descreva o aviso para a IA (ex: Aviso sobre corte de água amanhã)..." value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleGenerateContent('NOTICE'))} />
                                            <div className="flex justify-end mt-2">
                                                <button type="button" onClick={() => handleGenerateContent('NOTICE')} disabled={isGeneratingAI} className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase hover:bg-indigo-700 transition-all flex items-center gap-2">
                                                    {isGeneratingAI ? <Loader2 size={10} className="animate-spin"/> : <Sparkles size={10}/>} Gerar Texto
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    <textarea required rows={6} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-6 text-sm font-medium uppercase outline-none focus:border-indigo-500 resize-none transition-all shadow-inner" value={editingNotice.content} onChange={e => setEditingNotice({...editingNotice, content: e.target.value})} placeholder="Digite os detalhes..." />
                                </div>
                                <button type="submit" disabled={isSaving} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 active:scale-95">
                                    {isSaving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} Publicar no Mural
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* TEMPLATE MODAL (NEW) */}
            {isTemplateModalOpen && (
                <div className="sie-editor-overlay">
                    <div className="sie-modal-container !h-auto !max-w-2xl self-center">
                        <form onSubmit={handleSaveTemplate}>
                            <div className="h-20 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-white/5 rounded-t-[3rem]">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-purple-600 rounded-lg shadow-lg"><FileCode size={20}/></div>
                                    <h3 className="font-black text-xl uppercase tracking-tighter">Editor de Template</h3>
                                </div>
                                <button type="button" onClick={() => setIsTemplateModalOpen(false)} className="p-3 hover:bg-rose-500 rounded-xl transition-all border border-white/5"><X size={24}/></button>
                            </div>
                            <div className="p-10 space-y-6 bg-white rounded-b-[3rem]">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nome do Modelo</label>
                                    <input required className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-sm font-black uppercase outline-none focus:border-purple-500 transition-all" value={editingTemplate.name} onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value.toUpperCase()})} placeholder="EX: COBRANÇA AMIGÁVEL" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Gatilho de Evento (Opcional)</label>
                                    <select className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-[10px] font-black uppercase outline-none focus:border-purple-500 transition-all cursor-pointer" value={editingTemplate.event_trigger} onChange={e => setEditingTemplate({...editingTemplate, event_trigger: e.target.value})}>
                                        <option value="MANUAL">Disparo Manual</option>
                                        <option value="WELCOME_CENSUS">Boas-Vindas (Censo)</option>
                                        <option value="BILLING_REMINDER">Lembrete Financeiro</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-end">
                                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Corpo da Mensagem (WhatsApp)</label>
                                        <button type="button" onClick={() => { setShowAiInput(!showAiInput); setAiPrompt(''); }} className="text-[9px] font-black text-purple-600 uppercase flex items-center gap-1 hover:text-purple-800 transition-colors"><Sparkles size={12}/> {showAiInput ? 'Fechar IA' : 'Ghostwriter AI'}</button>
                                    </div>
                                    {showAiInput && (
                                        <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 mb-2 animate-slide-down">
                                            <input className="w-full h-10 bg-white border border-purple-200 rounded-xl px-4 text-xs outline-none focus:ring-2 focus:ring-purple-500/20" placeholder="Descreva a mensagem para a IA..." value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleGenerateContent('TEMPLATE'))} />
                                            <div className="flex justify-end mt-2">
                                                <button type="button" onClick={() => handleGenerateContent('TEMPLATE')} disabled={isGeneratingAI} className="px-4 py-1.5 bg-purple-600 text-white rounded-lg text-[9px] font-black uppercase hover:bg-purple-700 transition-all flex items-center gap-2">
                                                    {isGeneratingAI ? <Loader2 size={10} className="animate-spin"/> : <Sparkles size={10}/>} Gerar Texto
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    <textarea required rows={6} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-6 text-sm font-medium outline-none focus:border-purple-500 resize-none transition-all shadow-inner" value={editingTemplate.content} onChange={e => setEditingTemplate({...editingTemplate, content: e.target.value})} placeholder="Olá {nome}, sua unidade {unidade}..." />
                                    <div className="flex gap-2">
                                        {['{nome}', '{unidade}', '{valor}', '{vencimento}'].map(tag => (
                                            <button key={tag} type="button" onClick={() => setEditingTemplate({...editingTemplate, content: (editingTemplate.content || '') + tag})} className="px-2 py-1 bg-slate-100 border border-slate-200 rounded text-[9px] font-bold text-slate-500 hover:bg-white hover:border-purple-300 transition-all">{tag}</button>
                                        ))}
                                    </div>
                                </div>
                                <button type="submit" disabled={isSaving} className="w-full py-5 bg-purple-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-purple-700 transition-all flex items-center justify-center gap-3 active:scale-95">
                                    {isSaving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} Salvar Template
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isCampaignModalOpen && (
                <div className="sie-editor-overlay">
                    <div className="sie-modal-container !h-auto !max-w-2xl self-center">
                        <div className="h-20 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-white/5 rounded-t-[3rem]">
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-emerald-600 rounded-lg shadow-lg"><Zap size={20}/></div>
                                <h3 className="font-black text-xl uppercase tracking-tighter">Lançar Campanha</h3>
                            </div>
                            <button onClick={() => setIsCampaignModalOpen(false)} className="p-3 hover:bg-rose-500 rounded-xl transition-all border border-white/5"><X size={24}/></button>
                        </div>
                        <div className="p-10 space-y-6 bg-white rounded-b-[3rem]">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Título Interno</label>
                                <input className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-sm font-black uppercase outline-none focus:border-emerald-500 transition-all" value={newCampaign.title} onChange={e => setNewCampaign({...newCampaign, title: e.target.value})} placeholder="EX: AVISO DE COBRANÇA DEZ/24" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Regra de Seleção (Audiência)</label>
                                <select className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-[10px] font-black uppercase outline-none focus:border-emerald-500 transition-all cursor-pointer" value={newCampaign.rule_id} onChange={e => setNewCampaign({...newCampaign, rule_id: e.target.value})}>
                                    <option value="">Selecione uma regra...</option>
                                    {rules.map(r => <option key={r.id} value={r.id}>{r.title}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Template de Mensagem</label>
                                <select className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-[10px] font-black uppercase outline-none focus:border-emerald-500 transition-all cursor-pointer" value={newCampaign.template_id} onChange={e => setNewCampaign({...newCampaign, template_id: e.target.value})}>
                                    <option value="">Selecione um template...</option>
                                    {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            </div>
                            <button onClick={handleExecuteCampaign} disabled={isSaving} className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-emerald-500 transition-all flex items-center justify-center gap-3 active:scale-95">
                                {isSaving ? <Loader2 className="animate-spin" size={18}/> : <Zap size={18}/>} Iniciar Disparo em Massa
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* RULE MODAL */}
            {isRuleModalOpen && (
                <div className="sie-editor-overlay">
                    <div className="sie-modal-container !h-auto !max-w-2xl self-center">
                        <form onSubmit={handleSaveRule}>
                            <div className="h-20 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-white/5 rounded-t-[3rem]">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-indigo-600 rounded-lg shadow-lg"><Filter size={20}/></div>
                                    <h3 className="font-black text-xl uppercase tracking-tighter">Regra de Automação</h3>
                                </div>
                                <button type="button" onClick={() => setIsRuleModalOpen(false)} className="p-3 hover:bg-rose-500 rounded-xl transition-all border border-white/5"><X size={24}/></button>
                            </div>
                            <div className="p-10 space-y-6 bg-white rounded-b-[3rem]">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nome da Regra</label>
                                    <input required className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-sm font-black uppercase outline-none focus:border-indigo-500 transition-all" value={editingRule.title} onChange={e => setEditingRule({...editingRule, title: e.target.value})} placeholder="EX: MORADORES DO BLOCO A" />
                                </div>
                                <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-2xl">
                                    <p className="text-[10px] font-black text-indigo-700 uppercase tracking-widest mb-4 flex items-center gap-2"><Target size={14}/> Condições Lógicas</p>
                                    
                                    <div className="space-y-3 max-h-[200px] overflow-y-auto custom-scrollbar pr-2 mb-4">
                                        {(Array.isArray(editingRule.conditions) ? editingRule.conditions : []).map((c: any, i: number) => (
                                            <div key={i} className="flex gap-2 items-center bg-white p-2 rounded-xl border border-indigo-100 shadow-sm animate-fade-in">
                                                <select className="flex-1 h-10 bg-slate-50 border border-slate-200 rounded-lg text-[9px] font-bold uppercase px-2 outline-none" value={c.field} onChange={e => {
                                                    const newC = [...(editingRule.conditions as any[])]; newC[i].field = e.target.value; setEditingRule({...editingRule, conditions: newC});
                                                }}>
                                                    <option value="role">Cargo</option><option value="status">Status</option><option value="unit">Unidade</option><option value="resident_type">Tipo Residente</option>
                                                </select>
                                                <select className="w-24 h-10 bg-slate-50 border border-slate-200 rounded-lg text-[9px] font-bold uppercase px-2 outline-none" value={c.operator} onChange={e => {
                                                    const newC = [...(editingRule.conditions as any[])]; newC[i].operator = e.target.value; setEditingRule({...editingRule, conditions: newC});
                                                }}>
                                                    <option value="EQUALS">IGUAL</option><option value="NOT_EQUALS">DIFERENTE</option><option value="CONTAINS">CONTÉM</option>
                                                </select>
                                                <input className="flex-1 h-10 bg-slate-50 border border-slate-200 rounded-lg text-[9px] font-bold uppercase px-3 outline-none" value={c.value} onChange={e => {
                                                    const newC = [...(editingRule.conditions as any[])]; newC[i].value = e.target.value; setEditingRule({...editingRule, conditions: newC});
                                                }} placeholder="VALOR" />
                                                <button type="button" onClick={() => {
                                                    const newC = (editingRule.conditions as any[]).filter((_: any, idx: number) => idx !== i);
                                                    setEditingRule({...editingRule, conditions: newC});
                                                }} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={14}/></button>
                                            </div>
                                        ))}
                                    </div>
                                    <button type="button" onClick={() => {
                                        const newCond = { field: 'role', operator: 'EQUALS', value: 'RESIDENT' };
                                        setEditingRule({...editingRule, conditions: [...(editingRule.conditions as any[] || []), newCond]});
                                    }} className="w-full py-3 bg-white text-indigo-600 text-[9px] font-black uppercase rounded-xl border-2 border-dashed border-indigo-200 hover:border-indigo-400 hover:text-indigo-800 transition-all flex items-center justify-center gap-2">
                                        <Plus size={14}/> Adicionar Condição
                                    </button>
                                </div>
                                <button type="submit" disabled={isSaving} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all active:scale-95 flex items-center justify-center gap-3">
                                    {isSaving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} Salvar Regra
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Communication;
