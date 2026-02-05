
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
import { communicationService, api, systemService, userService } from '../services/api';
import { SystemInfo, MessageTemplate, ScheduledBroadcast, WhatsAppConfig, User as UserType, MessengerButton } from '../types';

/**
 * S.I.E MESSENGER BRIDGE HUB V21.0 (TACTICAL ACTION EDITION)
 */

const MessengerBridge = ({ systemInfo }: { systemInfo: SystemInfo }) => {
    const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'HARDWARE' | 'DESIGNER' | 'QUEUE' | 'PROTOCOLS'>('DASHBOARD');
    const [templates, setTemplates] = useState<MessageTemplate[]>([]);
    const [schedules, setSchedules] = useState<ScheduledBroadcast[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [showApiKey, setShowApiKey] = useState(false);

    // Designer State
    const [editingTemplate, setEditingTemplate] = useState<Partial<MessageTemplate> & { buttons?: MessengerButton[], targetIds?: number[] } | null>(null);

    // [SRE] MIDDLEWARE: RECEPTOR DE CAMPANHA TÁTICA
    useEffect(() => {
        const savedCampaign = sessionStorage.getItem('pending_tactical_campaign');
        if (savedCampaign) {
            try {
                const data = JSON.parse(savedCampaign);
                
                // Redireciona para o designer e preenche o rascunho
                setActiveTab('DESIGNER');
                setEditingTemplate({
                    name: data.name,
                    content: "Olá {nome}, informamos que...", // Template padrão de importação
                    event_trigger: 'CUSTOM',
                    is_active: 1,
                    media_type: 'image',
                    buttons: [],
                    targetIds: data.targetIds // Armazena alvos selecionados no rascunho
                });
                
                alert(`🚀 SRE BRIDGE: Recebidos ${data.targetIds.length} alvos táticos do mapa.`);
                sessionStorage.removeItem('pending_tactical_campaign');
            } catch (e) {
                console.error("Falha ao ingerir campanha tática.");
            }
        }
    }, []);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isUserSelectorOpen, setIsUserSelectorOpen] = useState(false);
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [allUsers, setAllUsers] = useState<UserType[]>([]);
    const [selectedTestUser, setSelectedTestUser] = useState<UserType | null>(null);

    const [waConfig, setWaConfig] = useState<WhatsAppConfig>(systemInfo.whatsapp_config || {
        api_key: '',
        sender: '',
        footer: 'S.I.E PRO',
        gateway_url: 'https://jennyai.space/send-media',
        webhook_url: '',
        billing_reminder_2d: true,
        billing_reminder_1d: true,
        late_reminder: true,
        welcome_msg: true
    });

    const meta = useMemo(() => systemInfo?.module_metadata?.['messenger_bridge'] || {
        title: "Messenger Hub",
        slogan: "Ponte Ativa de Comunicação Soberana"
    }, [systemInfo]);

    const systemTriggers = [
        { id: 'WELCOME_MEMBER', label: 'Boas-Vindas (Novos Membros)', desc: 'Aciona quando um novo registro é criado no Censo.' },
        { id: 'BILLING_48H', label: 'Lembrete Financeiro (48h)', desc: 'Aciona 2 dias antes do vencimento.' },
        { id: 'BILLING_24H', label: 'Alerta de Proximidade (24h)', desc: 'Aciona 1 dia antes do vencimento.' },
        { id: 'BILLING_LATE', label: 'Aviso de Inadimplência', desc: 'Aciona 24h após a data de vencimento não paga.' },
        { id: 'SYSTEM_ALERT', label: 'Alerta de Segurança (Watchdog)', desc: 'Acionado manualmente para avisos de perímetro.' }
    ];

    useEffect(() => { loadData(); }, [activeTab]);

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
        } catch (e) { alert("Falha na sincronia."); }
        finally { setIsSaving(false); }
    };

    const handleSaveTemplate = async () => {
        if (!editingTemplate?.name || !editingTemplate?.content) return;
        setIsSaving(true);
        try {
            // Se houver targetIds importados, oferece o disparo imediato
            if (editingTemplate.targetIds && editingTemplate.targetIds.length > 0) {
                if (confirm(`DESEJA DISPARAR ESTA MENSAGEM AGORA PARA OS ${editingTemplate.targetIds.length} ALVOS FILTRADOS?`)) {
                   await api.post('/communication/whatsapp-broadcast', {
                        message: editingTemplate.content,
                        targetType: 'SELECTED',
                        userIds: editingTemplate.targetIds,
                        mediaUrl: editingTemplate.media_url,
                        mediaType: editingTemplate.media_type,
                        buttons: editingTemplate.buttons,
                        footer: waConfig.footer
                   });
                   alert("✅ DISPARO MASSIVO PROTOCOLADO COM SUCESSO.");
                }
            }

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
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await api.post('/storage/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

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

    const handleAddButton = () => {
        const btns = editingTemplate?.buttons || [];
        if (btns.length >= 5) return alert("Máximo de 5 botões.");
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

    const handleExecuteRealTest = async () => {
        if (!editingTemplate?.content || !selectedTestUser) return;
        let rawPhone = selectedTestUser.whatsapp || selectedTestUser.phone || '';
        let targetPhone = rawPhone.replace(/\D/g, '');
        if (!targetPhone || targetPhone.length < 8) return alert("❌ TELEFONE INVÁLIDO.");
        if (targetPhone.length === 10 || targetPhone.length === 11) targetPhone = '55' + targetPhone;

        setIsTesting(true);
        try {
            const personalized = resolvePreview(editingTemplate.content || "");
            await api.post('/communication/whatsapp-broadcast', {
                targetType: 'DIRECT',
                directNumber: targetPhone,
                mediaUrl: editingTemplate.media_url || '',
                mediaType: editingTemplate.media_type || 'image',
                message: personalized,
                buttons: editingTemplate.buttons,
                footer: waConfig.footer || systemInfo.shortName
            });
            alert(`✅ COMANDO DE TESTE ENVIADO.`);
            setIsUserSelectorOpen(false);
        } catch (e: any) {
            alert(`❌ ERRO: ${e.response?.data?.message || "Timeout"}`);
        } finally { setIsTesting(false); }
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
        } : { nome: '{nome}', unidade: '{unidade}', sigla: systemInfo.shortName || 'S.I.E', cpf: '{cpf}', valor: '{valor}', vencimento: '{vencimento}' };

        Object.entries(context).forEach(([key, val]) => {
            const regex = new RegExp(`\\{${key}\\}`, 'gi');
            resolved = resolved.replace(regex, val);
        });
        return resolved;
    };

    const filteredUsers = useMemo(() => {
        return allUsers.filter((u: UserType) =>
            u.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
            (u.unit && u.unit.toLowerCase().includes(userSearchTerm.toLowerCase())) ||
            u.cpf_cnpj?.includes(userSearchTerm)
        );
    }, [allUsers, userSearchTerm]);

    const primaryColor = systemInfo.primaryColor || '#4f46e5';

    return (
        <div className="flex-1 flex flex-col h-full animate-fade-in space-y-6">

            <header className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl overflow-hidden relative shrink-0">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/5 rounded-full blur-[100px] -mr-40 -mt-40"></div>
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-indigo-600 rounded-[1.5rem] shadow-xl" style={{ backgroundColor: primaryColor }}><Smartphone size={28} /></div>
                        <div>
                            <h2 className="text-3xl font-black tracking-tighter uppercase leading-none">{meta.title}</h2>
                            <p className="text-indigo-400 text-[10px] font-black uppercase mt-2 tracking-widest opacity-80">{meta.slogan} v21.0</p>
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
                                        <BarChart data={[
                                            { name: 'ENTREGUES', value: 94, color: '#10b981' },
                                            { name: 'FALHAS', value: 6, color: '#ef4444' }
                                        ]}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }} dy={10} />
                                            <YAxis hide />
                                            <Tooltip cursor={{ fill: '#f8fafc', radius: 12 }} />
                                            <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={60}>
                                                {[0,1].map((entry, index) => <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#ef4444'} />)}
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
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">JennyAI API KEY</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                                        <input type={showApiKey ? "text" : "password"} placeholder="sk-jenny-xxxxxxxxxxxxxxxx" className="w-full font-mono h-16 bg-slate-50 border border-slate-200 rounded-3xl pl-16 pr-16 text-sm focus:border-emerald-500 outline-none shadow-inner" value={waConfig.api_key} onChange={e => setWaConfig({ ...waConfig, api_key: e.target.value })} />
                                        <button onClick={() => setShowApiKey(!showApiKey)} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-600">
                                            {showApiKey ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-3"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Sender ID</label><input className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-3xl px-8 text-lg uppercase outline-none focus:border-emerald-500 shadow-sm" value={waConfig.sender} onChange={e => setWaConfig({ ...waConfig, sender: e.target.value })} /></div>
                                <div className="space-y-3 md:col-span-2"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Gateway API Endpoint</label><input className="w-full font-mono h-16 bg-slate-50 border border-slate-200 rounded-3xl px-8 text-sm focus:border-emerald-500 outline-none shadow-inner" value={waConfig.gateway_url} onChange={e => setWaConfig({ ...waConfig, gateway_url: e.target.value })} /></div>
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
                                { id: 'billing_reminder_2d', label: 'Lembrete Financeiro (48h)', detail: 'Disparo automático 24h antes do vencimento.', trigger: 'BILLING_48H', icon: Clock },
                                { id: 'welcome_msg', label: 'Mensagem de Boas-Vindas', detail: 'Credenciais de acesso via Censo.', trigger: 'WELCOME_MEMBER', icon: UserCheck }
                            ].map(proto => (
                                <div key={proto.id} className="bg-white p-10 rounded-[3.5rem] border border-slate-200 flex flex-col md:flex-row justify-between items-center group hover:border-indigo-300 transition-all shadow-sm">
                                    <div className="flex items-center gap-8">
                                        <div className={`p-6 rounded-[2rem] shadow-inner transition-colors ${waConfig[proto.id as keyof WhatsAppConfig] ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-300'}`}><proto.icon size={32} /></div>
                                        <div><h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">{proto.label}</h4><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{proto.detail}</p></div>
                                    </div>
                                    <button onClick={() => setWaConfig({ ...waConfig, [proto.id as keyof WhatsAppConfig]: !waConfig[proto.id as keyof WhatsAppConfig] })} className={`mt-6 md:mt-0 p-4 rounded-2xl shadow-lg ${waConfig[proto.id as keyof WhatsAppConfig] ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-400'}`}>{waConfig[proto.id as keyof WhatsAppConfig] ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}</button>
                                </div>
                            ))}
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
                                    <button key={tpl.id} onClick={() => setEditingTemplate({ ...tpl, buttons: typeof tpl.buttons === 'string' ? JSON.parse(tpl.buttons) : (tpl.buttons || []) })} className={`w-full p-6 rounded-[2.5rem] border text-left transition-all ${editingTemplate?.id === tpl.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl' : 'bg-slate-50 border-slate-100 hover:border-indigo-200'}`}>
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${editingTemplate?.id === tpl.id ? 'bg-white/20' : 'bg-indigo-100 text-indigo-600'}`}>{tpl.event_trigger}</span>
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
                                                {editingTemplate.targetIds && <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-xl text-[9px] font-black uppercase flex items-center gap-2 animate-pulse"><AlertCircle size={10}/> Importado: {editingTemplate.targetIds.length} Alvos</span>}
                                                <button onClick={() => setIsUserSelectorOpen(true)} className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase shadow-lg flex items-center gap-2 transition-all active:scale-95">
                                                    <Play size={12} /> Testar Fluxo Real
                                                </button>
                                                <button onClick={handleSaveTemplate} disabled={isSaving} className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase shadow-xl flex items-center gap-2">
                                                    {isSaving ? <Loader2 className="animate-spin" size={12} /> : <Save size={14} />} {editingTemplate.targetIds ? 'Disparar Agora' : 'Commitar'}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="p-10 space-y-10 flex-1 overflow-y-auto custom-scrollbar bg-[#fdfdfe]">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="space-y-2"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Rótulo do Template</label><input className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-sm font-black uppercase outline-none focus:bg-white transition-all shadow-inner" value={editingTemplate.name} onChange={e => setEditingTemplate({ ...editingTemplate, name: e.target.value.toUpperCase() })} /></div>
                                                <div className="space-y-2"><label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Vínculo de Gatilho</label><select className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 font-black uppercase text-indigo-600 outline-none" value={editingTemplate.event_trigger} onChange={e => setEditingTemplate({ ...editingTemplate, event_trigger: e.target.value })}><option value="">Escolha...</option>{systemTriggers.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}<option value="CUSTOM">DISPARO MANUAL</option></select></div>
                                            </div>
                                            <div className="space-y-4">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Mensagem Base</label>
                                                <textarea rows={6} className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] p-8 text-sm font-medium uppercase leading-relaxed outline-none focus:bg-white focus:border-indigo-500 transition-all shadow-inner" value={editingTemplate.content} onChange={e => setEditingTemplate({ ...editingTemplate, content: e.target.value })} />
                                            </div>
                                            <div className="p-6 bg-slate-900 rounded-[2rem] border border-white/5 space-y-6 text-white shadow-xl">
                                                <div className="flex justify-between items-center"><h5 className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em] flex items-center gap-2"><MousePointer2 size={14} /> Botões Interativos</h5><button onClick={handleAddButton} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase shadow-lg flex items-center gap-2 transition-all active:scale-95"><Plus size={14} /> Adicionar</button></div>
                                                <div className="space-y-4">
                                                    {(editingTemplate.buttons || []).map((btn: MessengerButton, bIdx: number) => (
                                                        <div key={bIdx} className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-4 animate-fade-in">
                                                            <div className="flex justify-between items-center border-b border-white/5 pb-4">
                                                                <div className="flex gap-2">{['reply', 'call', 'url', 'copy'].map(type => (<button key={type} onClick={() => updateButton(bIdx, 'type', type as any)} className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all ${btn.type === type ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-400'}`}>{type}</button>))}</div>
                                                                <button onClick={() => removeButton(bIdx)} className="p-2 text-slate-500 hover:text-rose-500"><Trash2 size={14} /></button>
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="space-y-2"><label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Rótulo</label><input className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-black outline-none focus:border-indigo-500" value={btn.displayText} onChange={e => updateButton(bIdx, 'displayText', e.target.value)} /></div>{btn.type === 'url' && <div className="space-y-2"><label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">URL</label><input className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-mono outline-none" value={btn.url || ''} onChange={updateButton.bind(null, bIdx, 'url')} /></div>}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center p-20 opacity-20 grayscale"><LayoutTemplate size={100} className="mb-6"/><p className="font-black uppercase text-sm tracking-[0.4em]">Selecione um modelo</p></div>
                                )}
                            </div>

                            <div className="w-[360px] bg-slate-900 rounded-[4rem] p-5 shadow-2xl border-[10px] border-slate-800 shrink-0 hidden xl:flex flex-col relative overflow-hidden">
                                <div className="flex-1 bg-[#e5ddd5] rounded-[3rem] overflow-hidden flex flex-col shadow-inner">
                                    <div className="bg-[#075e54] p-6 flex items-center gap-3"><div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white font-black text-xs shadow-inner">AMC</div><div className="min-w-0 flex-1"><p className="text-white text-xs font-black uppercase leading-none truncate">{selectedTestUser?.name || "Visualização"}</p><p className="text-[#98c2bc] text-[9px] font-bold mt-1">SRE Active Bridge</p></div></div>
                                    <div className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar relative">
                                        <div className="bg-white p-2 rounded-[1.5rem] rounded-tl-none shadow-md relative z-10 max-w-[95%] overflow-hidden">
                                            <div className="px-3 py-2"><p className="text-[11px] text-slate-800 leading-relaxed uppercase whitespace-pre-wrap font-medium">{editingTemplate?.content ? resolvePreview(editingTemplate.content) : "..."}</p></div>
                                            {editingTemplate?.buttons && editingTemplate.buttons.length > 0 && (
                                                <div className="border-t border-slate-100 bg-slate-50/50">{editingTemplate.buttons.map((btn: MessengerButton, idx: number) => (<div key={idx} className="p-3 text-center border-b border-slate-100 last:border-b-0 flex items-center justify-center gap-3"><span className="text-[10px] font-black text-indigo-600 uppercase truncate">{btn.displayText || 'Botão'}</span></div>))}</div>
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
                            <div className="relative z-10"><h3 className="text-4xl font-black uppercase tracking-tightest leading-none">Fila de Transmissão</h3></div>
                        </div>
                        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b"><tr><th className="p-8">Destino</th><th className="p-8">Execução</th><th className="p-8">Estado</th><th className="p-8 text-right">Ações</th></tr></thead>
                                <tbody className="divide-y divide-slate-100">{schedules.map(s => (<tr key={s.id} className="hover:bg-slate-50/50 transition-colors group"><td className="p-8"><span className="text-[10px] font-black text-slate-700 uppercase bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">{s.target_type}: {s.target_value}</span></td><td className="p-8"><p className="text-[10px] font-black text-indigo-600 uppercase">{new Date(s.scheduled_at).toLocaleString('pt-BR')}</p></td><td className="p-8"><span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border shadow-sm ${s.status === 'SENT' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600'}`}>{s.status}</span></td><td className="p-8 text-right"><button onClick={() => communicationService.deleteSchedule(s.id).then(loadData)} className="p-3 text-slate-300 hover:text-rose-600 transition-colors bg-white rounded-2xl shadow-sm border border-slate-100"><Trash2 size={18} /></button></td></tr>))}</tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {isUserSelectorOpen && (
                <div className="sie-editor-overlay">
                    <div className="sie-modal-container !h-[80vh] !max-w-2xl self-center">
                        <div className="h-24 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-white/5">
                            <div className="flex items-center gap-6"><div className="p-4 bg-emerald-600 rounded-2xl shadow-xl"><UserCheck size={28} /></div><h3 className="font-black text-xl uppercase tracking-tighter">Alvo de Teste</h3></div>
                            <button onClick={() => setIsUserSelectorOpen(false)} className="p-4 hover:bg-rose-500 hover:text-white text-slate-400 rounded-2xl transition-all border border-white/5"><X size={28} /></button>
                        </div>
                        <div className="p-8 border-b bg-slate-50"><input className="w-full h-14 bg-white border border-slate-200 rounded-2xl font-black uppercase text-sm shadow-sm outline-none px-6" placeholder="BUSCAR..." value={userSearchTerm} onChange={e => setUserSearchTerm(e.target.value)} /></div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar bg-[#fdfdfe]">{filteredUsers.map((u: UserType) => (<button key={u.id} onClick={() => setSelectedTestUser(u)} className={`w-full p-6 rounded-[2.5rem] border text-left flex items-center justify-between transition-all ${selectedTestUser?.id === u.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xl scale-[1.02]' : 'bg-white border-slate-100 hover:bg-slate-50'}`}><div className="flex items-center gap-5"><div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0"><img src={u.avatar_url || 'https://via.placeholder.com/100'} className="w-full h-full object-cover" /></div><div><p className="text-xs font-black uppercase">{u.name}</p><p className="text-[8px] font-bold uppercase mt-1">Unid. {u.unit || '---'}</p></div></div></button>))}</div>
                        <div className="p-8 border-t bg-slate-900 flex justify-between items-center shrink-0">
                            <p className="text-[10px] font-black text-white uppercase">{selectedTestUser ? `ALVO: ${selectedTestUser.name}` : 'SELECIONE O ALVO'}</p>
                            <button onClick={handleExecuteRealTest} disabled={!selectedTestUser || isTesting} className="px-12 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase shadow-2xl hover:bg-emerald-50 transition-all flex items-center gap-3 disabled:opacity-50">{isTesting ? <Loader2 className="animate-spin" size={18} /> : <MessageCircle size={18} />} Disparar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MessengerBridge;
