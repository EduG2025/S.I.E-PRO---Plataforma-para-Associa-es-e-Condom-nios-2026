
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
    MessageSquare, Smartphone, Zap, ShieldCheck, Activity,
    Settings as SettingsIcon, Code, Clock, Send, Trash2,
    Edit3, CheckCircle2, AlertCircle, RefreshCw, X, Save,
    Variable, Smartphone as PhoneIcon, Search, Eye, BarChart3,
    ArrowUpRight, ArrowDownLeft, Loader2, Signal, Plus,
    Image as ImageIcon, HelpCircle, ToggleRight, ToggleLeft, Bot,
    ShieldAlert, Terminal, MessageCircle, CheckCircle, AlertTriangle,
    Lock, Globe, Workflow, UserCheck, Layout, LayoutTemplate, Play,
    User, Fingerprint, ChevronRight, Video, Music, FileText, Link as LinkIcon,
    Upload, Pin, PhoneCall, Copy, MousePointer2, EyeOff
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell
} from 'recharts';
import { communicationService, api, systemService, userService, storageService } from '../services/api';
import { SystemInfo, MessageTemplate, ScheduledBroadcast, WhatsAppConfig, User as UserType, MessengerButton } from '../types';

/**
 * S.I.E MESSENGER BRIDGE HUB V21.0 (MASTER EDITION)
 * Protocolo SRE v38.0 / Messenger Bridge JennyAI Active Gateway V8.5
 * Módulo de Orquestração de Mensageria, Hardware e Automação de CRM.
 */

const MessengerBridge = ({ systemInfo }: { systemInfo: SystemInfo }) => {
    // ESTADO CENTRAL DO MÓDULO
    const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'HARDWARE' | 'DESIGNER' | 'QUEUE' | 'PROTOCOLS'>('DASHBOARD');
    const [templates, setTemplates] = useState<MessageTemplate[]>([]);
    const [schedules, setSchedules] = useState<ScheduledBroadcast[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [showApiKey, setShowApiKey] = useState(false);

    // Refs
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Seletor de Usuário para Teste Real
    const [isUserSelectorOpen, setIsUserSelectorOpen] = useState(false);
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [allUsers, setAllUsers] = useState<UserType[]>([]);
    const [selectedTestUser, setSelectedTestUser] = useState<UserType | null>(null);

    // Configuração Local de Hardware (Sync com Kernel)
    const [waConfig, setWaConfig] = useState<WhatsAppConfig>(systemInfo.whatsapp_config || {
        api_key: '',
        sender: '',
        footer: 'S.I.E PRO',
        gateway_url: 'https://jennyai.space/send-media',
        webhook_url: '',
        billing_reminder_2d: true,
        billing_reminder_1d: true,
        late_reminder: true,
        welcome_msg: true,
        chatbot_enabled: true,
        chatbot_rag_wiki: true,
        chatbot_rag_rbac: true
    });

    // Designer State
    const [editingTemplate, setEditingTemplate] = useState<Partial<MessageTemplate> & { buttons?: MessengerButton[] } | null>(null);

    // Metadados do Módulo
    const meta = useMemo(() => systemInfo?.module_metadata?.['messenger_bridge'] || {
        title: "Messenger Hub",
        slogan: "Ponte Ativa de Comunicação Soberana"
    }, [systemInfo]);

    // Gatilhos de Sistema SRE
    const systemTriggers = [
        { id: 'WELCOME_MEMBER', label: 'Boas-Vindas (Novos Membros)', desc: 'Aciona quando um novo registro é criado no Censo.' },
        { id: 'BILLING_48H', label: 'Lembrete Financeiro (48h)', desc: 'Aciona 2 dias antes do vencimento.' },
        { id: 'BILLING_24H', label: 'Alerta de Proximidade (24h)', desc: 'Aciona 1 dia antes do vencimento.' },
        { id: 'BILLING_LATE', label: 'Aviso de Inadimplência', desc: 'Aciona 24h após a data de vencimento não paga.' },
        { id: 'SYSTEM_ALERT', label: 'Alerta de Segurança (Watchdog)', desc: 'Acionado manualmente para avisos de perímetro.' }
    ];

    // Sincronia Inicial e Atualizações de Contexto
    useEffect(() => { loadData(); }, [activeTab]);

    useEffect(() => {
        if (systemInfo.whatsapp_config) {
            setWaConfig(prev => ({ ...prev, ...systemInfo.whatsapp_config }));
        }
    }, [systemInfo.whatsapp_config]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [tplRes, schedRes, usersRes] = await Promise.all([
                communicationService.getTemplates(),
                communicationService.getSchedules(),
                userService.getAll(1, 1000)
            ]);
            setTemplates(tplRes.data?.data || []);
            setSchedules(schedRes.data?.data || []);
            setAllUsers(usersRes.data?.data || []);
        } catch (e) { console.error("Messenger Hub Offline"); }
        finally { setIsLoading(false); }
    };

    const handleSaveHardware = async () => {
        setIsSaving(true);
        try {
            await systemService.updateInfo({ ...systemInfo, whatsapp_config: waConfig });
            alert("✅ HARDWARE E PROTOCOLOS SINCRONIZADOS COM O KERNEL.");
        } catch (e) { alert("Falha na sincronia de hardware."); }
        finally { setIsSaving(false); }
    };

    const handleSaveTemplate = async () => {
        if (!editingTemplate?.name || !editingTemplate?.content) return alert("Preencha nome e conteúdo.");
        setIsSaving(true);
        try {
            await communicationService.saveTemplate(editingTemplate);
            setEditingTemplate(null);
            loadData();
        } catch (e: any) {
            alert(`❌ ERRO AO SALVAR: ${e.response?.data?.error || e.message}`);
        } finally { setIsSaving(false); }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !editingTemplate) return;

        setIsUploading(true);
        try {
            const response = await storageService.upload(file);
            if (response.data?.url) {
                setEditingTemplate({
                    ...editingTemplate,
                    media_url: response.data.url,
                    media_type: file.type.startsWith('image') ? 'image' :
                        file.type.startsWith('video') ? 'video' :
                            file.type.startsWith('audio') ? 'audio' : 'document'
                });
            }
        } catch (error: any) {
            alert(`❌ FALHA NO UPLOAD: ${error.response?.data?.error || "Erro de rede"}`);
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleApplyDefaultLogo = () => {
        if (!editingTemplate) return;
        const logoUrl = systemInfo.logoUrl || "https://admcacaria.jennyai.space/uploads/Logo.png";
        setEditingTemplate({ ...editingTemplate, media_url: logoUrl, media_type: 'image' });
    };

    // Gestão de Botões Interativos
    const handleAddButton = () => {
        const btns = editingTemplate?.buttons || [];
        if (btns.length >= 3) return alert("Máximo de 3 botões permitido pelo protocolo WhatsApp.");
        setEditingTemplate({
            ...editingTemplate,
            buttons: [...btns, { type: 'reply', displayText: 'Novo Botão' }]
        });
    };

    const updateButton = (idx: number, field: keyof MessengerButton, val: any) => {
        const btns = [...(editingTemplate?.buttons || [])];
        btns[idx] = { ...btns[idx], [field]: val };
        setEditingTemplate({ ...editingTemplate, buttons: btns });
    };

    const removeButton = (idx: number) => {
        if (!editingTemplate) return;
        const btns = editingTemplate.buttons?.filter((_btn: MessengerButton, i: number) => i !== idx);
        setEditingTemplate({ ...editingTemplate, buttons: btns });
    };

    // Protocolo de Disparo Real Seguro
    const handleExecuteRealTest = async () => {
        if (!editingTemplate?.content || !selectedTestUser) return;

        let rawPhone = selectedTestUser.whatsapp || selectedTestUser.phone || '';
        let targetPhone = rawPhone.replace(/\D/g, '');

        if (!targetPhone || targetPhone.length < 8) {
            return alert("❌ FALHA DE IDENTIDADE: Telefone inválido no cadastro.");
        }

        if (targetPhone.length >= 10 && !targetPhone.startsWith('55')) {
            targetPhone = '55' + targetPhone;
        }

        if (!confirm(`CONFIRMAR ENVIO REAL?\nDestinatário: ${selectedTestUser.name}\nNúmero: ${targetPhone}`)) {
            return;
        }

        setIsTesting(true);
        try {
            const personalized = resolvePreview(editingTemplate.content || "");
            const payload = {
                targetType: 'DIRECT',
                directNumber: targetPhone,
                mediaUrl: editingTemplate.media_url || '',
                mediaType: editingTemplate.media_type || 'image',
                message: personalized,
                buttons: editingTemplate.buttons,
                footer: waConfig.footer || systemInfo.shortName
            };
            
            await api.post('/communication/whatsapp-broadcast', payload);
            alert(`✅ COMANDO DE DISPARO ENVIADO PARA O GATEWAY.`);
            setIsUserSelectorOpen(false);
        } catch (e: any) {
            alert(`❌ ERRO NA PONTE: ${e.response?.data?.message || "Timeout de Gateway"}`);
        } finally {
            setIsTesting(false);
        }
    };

    const resolvePreview = (text: string) => {
        if (!text) return "";
        let resolved = text;
        const context = selectedTestUser ? {
            nome: selectedTestUser.name.split(' ')[0],
            unidade: selectedTestUser.unit || '---',
            sigla: systemInfo.shortName || 'S.I.E',
            cpf: selectedTestUser.cpf_cnpj,
            valor: '150,00',
            vencimento: '10/08/2025'
        } : {
            nome: '{nome}',
            unidade: '{unidade}',
            sigla: systemInfo.shortName || 'S.I.E',
            cpf: '{cpf}',
            valor: '{valor}',
            vencimento: '{vencimento}'
        };

        Object.entries(context).forEach(([key, val]) => {
            const regex = new RegExp(`\\{${key}\\}`, 'gi');
            resolved = resolved.replace(regex, val || '');
        });
        return resolved;
    };

    const filteredUsers = useMemo(() => {
        return allUsers.filter((u: UserType) =>
            u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
            (u.unit && u.unit.toLowerCase().includes(userSearchTerm.toLowerCase())) ||
            u.cpf_cnpj?.includes(userSearchTerm)
        ).slice(0, 10);
    }, [allUsers, userSearchTerm]);

    const primaryColor = systemInfo.primaryColor || '#4f46e5';

    const statsData = [
        { name: 'ENTREGUES', value: 94, color: '#10b981' },
        { name: 'FALHAS', value: 6, color: '#ef4444' }
    ];

    return (
        <div className="flex-1 flex flex-col h-full animate-fade-in space-y-6">

            <header className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl overflow-hidden relative shrink-0">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/5 rounded-full blur-[100px] -mr-40 -mt-40"></div>
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-indigo-600 rounded-[1.5rem] shadow-xl" style={{ backgroundColor: primaryColor }}><Smartphone size={28} /></div>
                        <div>
                            <h2 className="text-3xl font-black tracking-tighter uppercase leading-none">{meta.title}</h2>
                            <p className="text-indigo-400 text-[10px] font-black uppercase mt-2 tracking-widest opacity-80">{meta.slogan} v20.5</p>
                        </div>
                    </div>
                    <div className="flex bg-white/5 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 overflow-x-auto no-scrollbar">
                        {[
                            { id: 'DASHBOARD', label: 'Status', icon: Activity },
                            { id: 'PROTOCOLS', label: 'Automações', icon: Workflow },
                            { id: 'DESIGNER', label: 'Designer', icon: Code },
                            { id: 'QUEUE', label: 'Fila', icon: Clock },
                            { id: 'HARDWARE', label: 'Hardware', icon: SettingsIcon }
                        ].map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-lg' : 'text-slate-400 hover:text-white'}`} style={activeTab === tab.id ? { color: primaryColor } : {}}>
                                <tab.icon size={16} /> <span className="hidden lg:inline">{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">

                {activeTab === 'DASHBOARD' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in pb-10">
                        <div className="lg:col-span-8 space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[
                                    { label: 'Total Histórico', value: '5.120', color: 'text-indigo-600', icon: Send },
                                    { label: 'Saúde de Entrega', value: '99.1%', color: 'text-emerald-600', icon: ShieldCheck },
                                    { label: 'Fila Pendente', value: schedules.filter((s: ScheduledBroadcast) => s.status === 'PENDING').length, color: 'text-amber-600', icon: Clock }
                                ].map((stat, i) => (
                                    <div key={i} className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all">
                                        <div className="flex justify-between items-center mb-6">
                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{stat.label}</p>
                                            <stat.icon className={stat.color} size={18} />
                                        </div>
                                        <h3 className="text-4xl font-black text-slate-800 tracking-tightest">{stat.value}</h3>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-sm min-h-[400px]">
                                <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3 mb-10"><BarChart3 size={20} className="text-indigo-600" /> Monitor de Tráfego Bridge</h4>
                                <div className="h-[250px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={statsData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }} dy={10} />
                                            <YAxis hide />
                                            <Tooltip cursor={{ fill: '#f8fafc', radius: 12 }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                            <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={60}>
                                                {statsData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                        <div className="lg:col-span-4 space-y-8">
                            <div className="bg-slate-900 rounded-[3.5rem] p-10 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between h-full min-h-[400px]">
                                <div className="absolute top-0 right-0 p-8 opacity-5"><Signal size={120} /></div>
                                <div className="relative z-10">
                                    <h4 className="text-xl font-black uppercase tracking-widest flex items-center gap-3"><Terminal size={20} className="text-emerald-400" /> Hardware Monitor</h4>
                                    <div className="mt-8 space-y-4">
                                        <div className="p-5 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Handshake API</span>
                                            <span className="text-[10px] font-black text-emerald-400 uppercase">ACTIVE_SYNC</span>
                                        </div>
                                        <div className="p-5 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Instance ID</span>
                                            <span className="text-[10px] font-black text-indigo-400 uppercase truncate max-w-[120px]">{waConfig.sender || 'OFFLINE'}</span>
                                        </div>
                                    </div>
                                </div>
                                <button className="w-full mt-10 py-5 bg-white text-indigo-950 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all">
                                    <Zap size={16} className="text-amber-500 fill-amber-500" /> Testar Handshake Bridge
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'HARDWARE' && (
                    <div className="max-w-4xl mx-auto space-y-12 animate-fade-in pb-20">
                        <div className="bg-emerald-600 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-12">
                            <div className="absolute top-0 right-0 p-8 opacity-10"><Smartphone size={250} /></div>
                            <div className="relative z-10">
                                <h3 className="text-4xl font-black uppercase tracking-tightest leading-none">Configuração <br /> de Hardware</h3>
                                <p className="text-emerald-100 text-xs font-black uppercase mt-4 tracking-widest flex items-center gap-2"><Smartphone size={16} /> JennyAI Active Gateway V8.5</p>
                            </div>
                            <button onClick={handleSaveHardware} disabled={isSaving} className="relative z-10 px-10 py-5 bg-white text-emerald-950 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl flex items-center gap-3">
                                {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Sincronizar Hardware
                            </button>
                        </div>

                        <div className="bg-white p-12 rounded-[4rem] border border-slate-200 shadow-sm space-y-12">
                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-4 border-b pb-8"><MessageCircle size={24} className="text-emerald-600" /> Gateway & Webhook Hub</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-3 md:col-span-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">JennyAI API KEY (SRE Secret)</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                                        <input type={showApiKey ? "text" : "password"} placeholder="sk-jenny-xxxxxxxxxxxxxxxx" className="w-full font-mono h-16 bg-slate-50 border border-slate-200 rounded-3xl pl-16 pr-16 text-sm focus:border-emerald-500 outline-none shadow-inner" value={waConfig.api_key} onChange={e => setWaConfig({ ...waConfig, api_key: e.target.value })} />
                                        <button onClick={() => setShowApiKey(!showApiKey)} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600">
                                            {showApiKey ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Instance Sender ID</label>
                                    <input className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-3xl px-8 text-lg uppercase outline-none focus:border-emerald-500 shadow-sm" value={waConfig.sender} onChange={e => setWaConfig({ ...waConfig, sender: e.target.value })} />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Assinatura de Rodapé</label>
                                    <input className="w-full font-medium h-16 bg-slate-50 border border-slate-200 rounded-3xl px-8 text-sm uppercase outline-none focus:border-emerald-500 shadow-sm" value={waConfig.footer} onChange={e => setWaConfig({ ...waConfig, footer: e.target.value })} />
                                </div>
                                <div className="space-y-3 md:col-span-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Gateway API Endpoint (Outbound)</label>
                                    <div className="relative group">
                                        <Globe className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                                        <input className="w-full font-mono h-16 bg-slate-50 border border-slate-200 rounded-3xl pl-16 pr-8 text-sm focus:border-emerald-500 outline-none shadow-inner" value={waConfig.gateway_url} onChange={e => setWaConfig({ ...waConfig, gateway_url: e.target.value })} />
                                    </div>
                                </div>
                                <div className="space-y-3 md:col-span-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">URL de Webhook (Inbound / Feedback)</label>
                                    <div className="relative group">
                                        <Workflow className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                                        <input className="w-full font-mono h-16 bg-slate-50 border border-slate-200 rounded-3xl pl-16 pr-8 text-sm focus:border-emerald-500 outline-none shadow-inner" value={waConfig.webhook_url} onChange={e => setWaConfig({ ...waConfig, webhook_url: e.target.value })} placeholder="https://api.seusistema.com/webhook" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'PROTOCOLS' && (
                    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20">
                        <div className="bg-indigo-600 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-12">
                            <div className="absolute top-0 right-0 p-8 opacity-10"><Workflow size={250} /></div>
                            <div className="relative z-10">
                                <h3 className="text-4xl font-black uppercase tracking-tightest leading-none">Automações Ativas</h3>
                                <p className="text-indigo-200 text-xs font-black uppercase mt-4 tracking-widest flex items-center gap-2"><Bot size={16} /> SRE Automation Engine</p>
                            </div>
                            <button onClick={handleSaveHardware} disabled={isSaving} className="relative z-10 px-10 py-5 bg-white text-indigo-950 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl flex items-center gap-3">
                                {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Commitar Protocolos
                            </button>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            {[
                                { id: 'billing_reminder_2d', label: 'Lembrete Financeiro (48h)', detail: 'Disparo automático 48h antes do vencimento.', trigger: 'BILLING_48H', icon: Clock },
                                { id: 'billing_reminder_1d', label: 'Alerta de Proximidade (24h)', detail: 'Disparo automático 24h antes do vencimento.', trigger: 'BILLING_24H', icon: AlertCircle },
                                { id: 'late_reminder', label: 'Aviso de Inadimplência', detail: 'Disparo automático após 24h de atraso.', trigger: 'BILLING_LATE', icon: ShieldAlert },
                                { id: 'welcome_msg', label: 'Mensagem de Boas-Vindas', detail: 'Credenciais de acesso para novos membros via Censo.', trigger: 'WELCOME_MEMBER', icon: UserCheck }
                            ].map(proto => {
                                const hasTemplate = templates.some((t: MessageTemplate) => t.event_trigger === proto.trigger && t.is_active);
                                return (
                                    <div key={proto.id} className="bg-white p-10 rounded-[3.5rem] border border-slate-200 flex flex-col md:flex-row justify-between items-center group hover:border-indigo-300 transition-all shadow-sm">
                                        <div className="flex items-center gap-8">
                                            <div className={`p-6 rounded-[2rem] shadow-inner transition-colors ${waConfig[proto.id as keyof WhatsAppConfig] ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-300'}`}>
                                                <proto.icon size={32} />
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">{proto.label}</h4>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{proto.detail}</p>
                                                <div className="mt-4 flex items-center gap-4">
                                                    <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100 uppercase">Trigger: {proto.trigger}</span>
                                                    {hasTemplate ? (
                                                        <span className="flex items-center gap-1.5 text-[8px] font-black text-emerald-600 uppercase"><CheckCircle size={12} /> Configuração OK</span>
                                                    ) : (
                                                        <span className="flex items-center gap-1.5 text-[8px] font-black text-rose-500 uppercase"><AlertTriangle size={12} /> Template Não Localizado</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setWaConfig({ ...waConfig, [proto.id as keyof WhatsAppConfig]: !waConfig[proto.id as keyof WhatsAppConfig] })}
                                            className={`mt-6 md:mt-0 p-4 rounded-2xl transition-all shadow-lg ${waConfig[proto.id as keyof WhatsAppConfig] ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`}
                                            style={waConfig[proto.id as keyof WhatsAppConfig] ? { backgroundColor: primaryColor } : {}}
                                        >
                                            {waConfig[proto.id as keyof WhatsAppConfig] ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {activeTab === 'DESIGNER' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in h-[calc(100vh-280px)] min-h-[600px] pb-10">
                        <div className="lg:col-span-3 bg-white rounded-[3rem] border border-slate-200 overflow-hidden flex flex-col">
                            <div className="p-8 border-b bg-slate-50 flex justify-between items-center">
                                <h4 className="text-xs font-black uppercase text-slate-800 tracking-widest">Modelos</h4>
                                <button onClick={() => setEditingTemplate({ name: '', event_trigger: '', content: '', is_active: 1, media_type: 'image', buttons: [] })} className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 transition-all"><Plus size={16} /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                                {templates.map((tpl: MessageTemplate) => (
                                    <button key={tpl.id} onClick={() => {
                                        const btns = typeof tpl.buttons === 'string' ? JSON.parse(tpl.buttons) : (tpl.buttons || []);
                                        setEditingTemplate({ ...tpl, buttons: btns });
                                    }} className={`w-full p-6 rounded-[2.5rem] border text-left transition-all ${editingTemplate?.id === tpl.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl' : 'bg-slate-50 border-slate-100 hover:border-indigo-200'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${editingTemplate?.id === tpl.id ? 'bg-white/20' : 'bg-indigo-100 text-indigo-600'}`}>{tpl.event_trigger}</span>
                                            {tpl.media_url && <ImageIcon size={12} className={editingTemplate?.id === tpl.id ? 'text-emerald-200' : 'text-emerald-500'} />}
                                        </div>
                                        <p className="text-sm font-black uppercase truncate">{tpl.name}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="lg:col-span-9 flex flex-col md:flex-row gap-8 overflow-hidden">
                            <div className="flex-1 bg-white rounded-[3rem] border border-slate-200 flex flex-col overflow-hidden">
                                {editingTemplate ? (
                                    <>
                                        <div className="p-8 border-b flex justify-between items-center bg-slate-50/50 shrink-0">
                                            <h4 className="text-xs font-black uppercase text-slate-800 tracking-widest">Configuração do Protocolo</h4>
                                            <div className="flex gap-2">
                                                <button onClick={() => setIsUserSelectorOpen(true)} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase shadow-lg flex items-center gap-2 transition-all active:scale-95">
                                                    <Play size={12} /> Testar Fluxo Real
                                                </button>
                                                <button onClick={() => { setEditingTemplate(null); setSelectedTestUser(null); }} className="px-4 py-2 text-[10px] font-black uppercase text-slate-400 hover:text-rose-500">Descartar</button>
                                                <button onClick={handleSaveTemplate} disabled={isSaving} className="px-8 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase shadow-xl flex items-center gap-2">
                                                    {isSaving ? <Loader2 className="animate-spin" size={12} /> : <Save size={14} />} Commitar
                                                </button>
                                            </div>
                                        </div>
                                        <div className="p-10 space-y-10 flex-1 overflow-y-auto custom-scrollbar bg-[#fdfdfe]">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Rótulo do Template</label>
                                                    <input className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-sm font-black uppercase focus:bg-white transition-all outline-none" value={editingTemplate.name} onChange={e => setEditingTemplate({ ...editingTemplate, name: e.target.value })} placeholder="EX: BOAS_VINDAS_MIDIA" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Vínculo de Gatilho</label>
                                                    <select className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 font-black uppercase text-indigo-600 outline-none focus:bg-white" value={editingTemplate.event_trigger} onChange={e => setEditingTemplate({ ...editingTemplate, event_trigger: e.target.value })}>
                                                        <option value="">Escolha um Gatilho...</option>
                                                        {systemTriggers.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                                        <option value="CUSTOM">DISPARO MANUAL / CAMPANHA</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200 space-y-6">
                                                <div className="flex justify-between items-center">
                                                    <h5 className="text-[10px] font-black uppercase text-indigo-600 tracking-[0.2em] flex items-center gap-2"><ImageIcon size={14} /> Anexo de Mídia (SRE Bridge)</h5>
                                                    <div className="flex gap-2">
                                                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="image/*,video/*,audio/*,application/pdf" />
                                                        <button onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all shadow-sm flex items-center gap-2">
                                                            {isUploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />} Subir Arquivo
                                                        </button>
                                                        <button onClick={handleApplyDefaultLogo} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase shadow-lg flex items-center gap-2 transition-all hover:bg-indigo-700">
                                                            <Pin size={12} /> Usar Logo do Sistema
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                                                    <div className="lg:col-span-3 space-y-2">
                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">URL Direta do Arquivo</label>
                                                        <input className="w-full h-14 bg-white border border-slate-200 rounded-xl px-6 text-xs font-mono outline-none focus:border-indigo-500 shadow-sm" value={editingTemplate.media_url || ''} onChange={e => setEditingTemplate({ ...editingTemplate, media_url: e.target.value })} placeholder="https://site.com/arquivo.jpg" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo</label>
                                                        <select className="w-full h-14 bg-white border border-slate-200 rounded-xl px-4 text-[10px] font-black uppercase outline-none focus:border-indigo-500 shadow-sm appearance-none" value={editingTemplate.media_type} onChange={e => setEditingTemplate({ ...editingTemplate, media_type: e.target.value as any })}>
                                                            <option value="image">Imagem</option>
                                                            <option value="video">Vídeo</option>
                                                            <option value="audio">Áudio</option>
                                                            <option value="document">Documento (PDF)</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-slate-900 p-8 rounded-[2.5rem] border border-white/5 space-y-6 text-white shadow-xl">
                                                <div className="flex justify-between items-center">
                                                    <h5 className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em] flex items-center gap-2"><MousePointer2 size={14} /> Botões Interativos (Max 3)</h5>
                                                    <button onClick={handleAddButton} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase shadow-lg flex items-center gap-2 transition-all active:scale-95">
                                                        <Plus size={14} /> Adicionar Botão
                                                    </button>
                                                </div>
                                                <div className="space-y-4">
                                                    {(editingTemplate.buttons || []).map((btn: MessengerButton, bIdx: number) => (
                                                        <div key={bIdx} className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-4 animate-fade-in">
                                                            <div className="flex justify-between items-center border-b border-white/5 pb-4">
                                                                <div className="flex gap-2">
                                                                    {[
                                                                        { id: 'reply', label: 'Resposta', icon: MessageSquare },
                                                                        { id: 'call', label: 'Chamada', icon: PhoneCall },
                                                                        { id: 'url', label: 'Link', icon: LinkIcon },
                                                                        { id: 'copy', label: 'Copiar', icon: Copy }
                                                                    ].map(type => (
                                                                        <button key={type.id} onClick={() => updateButton(bIdx, 'type', type.id as any)} className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all flex items-center gap-2 ${btn.type === type.id ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}>
                                                                            <type.icon size={10} /> {type.label}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                                <button onClick={() => removeButton(bIdx)} className="p-2 text-slate-500 hover:text-rose-500"><Trash2 size={14} /></button>
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                <div className="space-y-2">
                                                                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Rótulo do Botão</label>
                                                                    <input className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-black uppercase outline-none focus:border-indigo-500" value={btn.displayText} onChange={e => updateButton(bIdx, 'displayText', e.target.value)} placeholder="EX: FALAR COM SUPORTE" />
                                                                </div>
                                                                {btn.type === 'url' && (
                                                                    <div className="space-y-2">
                                                                        <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">URL Destino</label>
                                                                        <input className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-mono outline-none focus:border-indigo-500" value={btn.url || ''} onChange={e => updateButton(bIdx, 'url', e.target.value)} placeholder="https://..." />
                                                                    </div>
                                                                )}
                                                                {btn.type === 'call' && (
                                                                    <div className="space-y-2">
                                                                        <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Número de Telefone</label>
                                                                        <input className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-black outline-none focus:border-indigo-500" value={btn.phoneNumber || ''} onChange={e => updateButton(bIdx, 'phoneNumber', e.target.value)} placeholder="5511..." />
                                                                    </div>
                                                                )}
                                                                {btn.type === 'copy' && (
                                                                    <div className="space-y-2">
                                                                        <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Código para Cópia</label>
                                                                        <input className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-black outline-none focus:border-indigo-500" value={btn.copyText || ''} onChange={e => updateButton(bIdx, 'copyText', e.target.value)} placeholder="CÓDIGO..." />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {(!editingTemplate.buttons || editingTemplate.buttons.length === 0) && (
                                                        <div className="py-6 text-center border-2 border-dashed border-white/10 rounded-2xl opacity-30">
                                                            <p className="text-[9px] font-black uppercase tracking-widest">Sem botões interativos vinculados.</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Corpo da Mensagem / Legenda</label>
                                                <textarea rows={6} className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] p-8 text-sm font-medium uppercase leading-relaxed outline-none focus:bg-white focus:border-indigo-500 transition-all shadow-inner" value={editingTemplate.content} onChange={e => setEditingTemplate({ ...editingTemplate, content: e.target.value })} placeholder="Olá {nome}, clique no botão abaixo..." />
                                            </div>

                                            <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-[2rem] flex flex-wrap gap-2">
                                                {['nome', 'unidade', 'sigla', 'valor', 'vencimento', 'cpf'].map(v => (
                                                    <button key={v} onClick={() => setEditingTemplate({ ...editingTemplate, content: (editingTemplate.content || '') + `{${v}}` })} className="px-4 py-2 bg-white border border-indigo-200 rounded-xl text-[9px] font-black text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm">+{'{' + v + '}'}</button>
                                                ))}
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center p-20 opacity-20 grayscale">
                                        <LayoutTemplate size={100} className="mb-6" />
                                        <p className="font-black uppercase text-sm tracking-[0.4em]">Selecione um modelo <br /> para configurar o dispatch.</p>
                                    </div>
                                )}
                            </div>

                            <div className="w-[360px] bg-slate-900 rounded-[4rem] p-5 shadow-[0_60px_120px_rgba(0,0,0,0.5)] border-[10px] border-slate-800 shrink-0 hidden xl:flex flex-col relative overflow-hidden">
                                <div className="w-1/3 h-7 bg-slate-800 rounded-full mx-auto mb-8 relative">
                                    <div className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-slate-950 rounded-full"></div>
                                </div>
                                <div className="flex-1 bg-[#e5ddd5] rounded-[3rem] overflow-hidden flex flex-col shadow-inner">
                                    <div className="bg-[#075e54] p-6 flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white font-black text-xs shadow-inner">AMC</div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-white text-xs font-black uppercase leading-none truncate">{selectedTestUser?.name || "Membro de Teste"}</p>
                                            <p className="text-[#98c2bc] text-[9px] font-bold mt-1">SRE Active Bridge</p>
                                        </div>
                                    </div>
                                    <div className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar relative">
                                        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "url('https://i.pinimg.com/736x/8c/98/99/8c98994518b575481e2b6c92d6e67e33.jpg')" }}></div>

                                        <div className="bg-white p-2 rounded-[1.5rem] rounded-tl-none shadow-md relative z-10 max-w-[95%] overflow-hidden">
                                            {editingTemplate?.media_url && (
                                                <div className="mb-2 rounded-xl overflow-hidden bg-slate-100 border border-slate-100">
                                                    {editingTemplate.media_type === 'image' && <img src={editingTemplate.media_url} className="w-full h-auto object-cover max-h-[180px]" alt="media" onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/300?text=BROKEN+URL')} />}
                                                    {editingTemplate.media_type === 'video' && <div className="p-10 flex items-center justify-center bg-slate-800 text-white"><Video size={32} /></div>}
                                                    {editingTemplate.media_type === 'audio' && <div className="p-10 flex items-center justify-center bg-slate-200 text-slate-500"><Music size={32} /></div>}
                                                    {editingTemplate.media_type === 'document' && <div className="p-10 flex items-center justify-center bg-rose-50 text-rose-500"><FileText size={32} /></div>}
                                                </div>
                                            )}
                                            <div className="px-3 py-2">
                                                <p className="text-[11px] text-slate-800 leading-relaxed uppercase whitespace-pre-wrap font-medium">
                                                    {editingTemplate?.content ? resolvePreview(editingTemplate.content) : "..."}
                                                </p>
                                                {waConfig.footer && (
                                                    <div className="mt-3 pt-3 border-t border-slate-100 opacity-50">
                                                        <p className="text-[9px] font-black text-slate-500 uppercase italic">-- {waConfig.footer}</p>
                                                    </div>
                                                )}
                                                <p className="text-[8px] text-slate-400 mt-2 text-right">SRE Bridge ✓✓</p>
                                            </div>

                                            {editingTemplate?.buttons && editingTemplate.buttons.length > 0 && (
                                                <div className="border-t border-slate-100 bg-slate-50/50">
                                                    {editingTemplate.buttons.map((btn: MessengerButton, idx: number) => (
                                                        <div key={idx} className="p-3 text-center border-b border-slate-100 last:border-b-0 flex items-center justify-center gap-3">
                                                            {btn.type === 'call' ? <PhoneCall size={12} className="text-indigo-600" /> : btn.type === 'url' ? <LinkIcon size={12} className="text-indigo-600" /> : btn.type === 'copy' ? <Copy size={12} className="text-indigo-600" /> : <MessageSquare size={12} className="text-indigo-600" />}
                                                            <span className="text-[10px] font-black text-indigo-600 uppercase truncate">{btn.displayText || 'Botão'}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'QUEUE' && (
                    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-20">
                        <div className="bg-slate-900 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-12">
                            <div className="absolute top-0 right-0 p-8 opacity-10"><Clock size={250} /></div>
                            <div className="relative z-10">
                                <h3 className="text-4xl font-black uppercase tracking-tightest leading-none">Fila de <br /> Transmissão</h3>
                                <p className="text-indigo-400 text-xs font-black uppercase mt-4 tracking-widest flex items-center gap-2"><Activity size={16} /> Heartbeat Monitor v10.0</p>
                            </div>
                        </div>

                        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                                    <tr>
                                        <th className="p-8">Destino</th>
                                        <th className="p-8">Mensagem (Amostra)</th>
                                        <th className="p-8">Execução</th>
                                        <th className="p-8">Estado</th>
                                        <th className="p-8 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {schedules.map(s => (
                                        <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                                            <td className="p-8">
                                                <span className="text-[10px] font-black text-slate-700 uppercase bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                                                    {s.target_type}: {s.target_value}
                                                </span>
                                            </td>
                                            <td className="p-8">
                                                <p className="text-xs text-slate-500 truncate max-w-xs font-medium uppercase">{s.message_body}</p>
                                            </td>
                                            <td className="p-8">
                                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter">
                                                    {new Date(s.scheduled_at).toLocaleString('pt-BR')}
                                                </p>
                                            </td>
                                            <td className="p-8">
                                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border shadow-sm ${s.status === 'SENT' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : s.status === 'FAILED' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                                    {s.status === 'PENDING' ? 'Em Fila' : s.status === 'SENT' ? 'Sincronizado' : 'Falha na Rota'}
                                                </span>
                                            </td>
                                            <td className="p-8 text-right">
                                                <button onClick={() => communicationService.deleteSchedule(s.id).then(loadData)} className="p-3 text-slate-300 hover:text-rose-600 transition-colors bg-white rounded-2xl shadow-sm border border-slate-100">
                                                    <Trash2 size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                    {schedules.length === 0 && (
                                        <tr><td colSpan={5} className="p-32 text-center text-slate-300 font-black uppercase text-[10px] tracking-[0.4em] italic">Fila de transmissão limpa.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {isUserSelectorOpen && (
                <div className="sie-editor-overlay">
                    <div className="sie-modal-container !h-[80vh] !max-w-2xl self-center">
                        <div className="h-24 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 shadow-2xl relative z-20 border-b border-white/5">
                            <div className="flex items-center gap-6">
                                <div className="p-4 bg-emerald-600 rounded-2xl shadow-xl"><UserCheck size={28} /></div>
                                <div>
                                    <h3 className="font-black text-xl uppercase tracking-tighter leading-none">Alvo para Teste Real</h3>
                                    <p className="text-emerald-400 text-[9px] font-black uppercase mt-1.5 tracking-widest opacity-80">Validação via Gateway (Auto-DDI 55)</p>
                                </div>
                            </div>
                            <button onClick={() => setIsUserSelectorOpen(false)} className="p-4 hover:bg-rose-500 hover:text-white text-slate-400 rounded-2xl transition-all border border-white/5"><X size={28} /></button>
                        </div>

                        <div className="p-8 border-b bg-slate-50 flex items-center gap-4 shrink-0">
                            <div className="relative flex-1">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input className="w-full pl-14 pr-6 h-14 bg-white border border-slate-200 rounded-2xl font-black uppercase text-sm shadow-sm outline-none focus:border-indigo-500 transition-all" placeholder="BUSCAR NOME OU UNIDADE..." value={userSearchTerm} onChange={e => setUserSearchTerm(e.target.value)} />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar bg-[#fdfdfe]">
                            {filteredUsers.map((u: UserType) => (
                                <button key={u.id} onClick={() => setSelectedTestUser(u)} className={`w-full p-6 rounded-[2.5rem] border text-left flex items-center justify-between transition-all ${selectedTestUser?.id === u.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xl scale-[1.02]' : 'bg-white border-slate-100 hover:border-indigo-200 hover:bg-slate-50'}`}>
                                    <div className="flex items-center gap-5">
                                        <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shadow-sm shrink-0">
                                            <img src={u.avatar_url || 'https://via.placeholder.com/100'} className="w-full h-full object-cover" alt={u.name} />
                                        </div>
                                        <div>
                                            <p className={`text-xs font-black uppercase ${selectedTestUser?.id === u.id ? 'text-white' : 'text-slate-800'}`}>{u.name}</p>
                                            <p className={`text-[8px] font-bold uppercase mt-1 ${selectedTestUser?.id === u.id ? 'text-indigo-200' : 'text-slate-400'}`}>Unid. {u.unit || '---'} • CPF: {u.cpf_cnpj}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-[8px] font-black uppercase ${selectedTestUser?.id === u.id ? 'text-white' : 'text-slate-500'}`}>Telefone</p>
                                        <p className={`text-[10px] font-bold ${selectedTestUser?.id === u.id ? 'text-emerald-200' : 'text-emerald-600'}`}>{u.whatsapp || u.phone || '---'}</p>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <div className="p-8 border-t bg-slate-900 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-4">
                                <div className={`w-3 h-3 rounded-full ${selectedTestUser ? 'bg-emerald-500 animate-pulse' : 'bg-slate-700'}`}></div>
                                <p className="text-[10px] font-black text-white uppercase tracking-widest">
                                    {selectedTestUser ? `ALVO: ${selectedTestUser.name}` : 'SELECIONE O ALVO'}
                                </p>
                            </div>
                            <button onClick={handleExecuteRealTest} disabled={!selectedTestUser || isTesting} className="px-12 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-emerald-50 transition-all flex items-center gap-3 disabled:opacity-50">
                                {isTesting ? <Loader2 size={18} className="animate-spin" /> : <MessageCircle size={18} />} Disparar Teste Real
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MessengerBridge;
