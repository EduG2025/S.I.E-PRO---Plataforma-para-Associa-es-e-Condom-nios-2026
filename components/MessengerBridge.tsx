
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
    Users, User, Fingerprint, ChevronRight, Video, Music, FileText, Link as LinkIcon,
    Upload, Pin, PhoneCall, Copy, MousePointer2, EyeOff
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Cell
} from 'recharts';
import { communicationService, api, systemService, userService } from '../services/api';
import { SystemInfo, MessageTemplate, ScheduledBroadcast, WhatsAppConfig, User as UserType, MessengerButton } from '../types';

/**
 * S.I.E MESSENGER BRIDGE HUB V23.0 (ID-PRECISION TARGETING)
 * Protocolo SRE v43.0 / Messenger Bridge JennyAI Active Gateway V8.6
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

    // --- FILA DE SEGMENTAÇÃO BI ---
    const [segmentedQueue, setSegmentedQueue] = useState<any[]>([]);
    const [segmentContext, setSegmentContext] = useState<string>('');

    // Refs
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Seletor de Usuário para Teste
    const [isUserSelectorOpen, setIsUserSelectorOpen] = useState(false);
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [allUsers, setAllUsers] = useState<UserType[]>([]);
    const [selectedTestUser, setSelectedTestUser] = useState<UserType | null>(null);

    // Config Local (Handshake com Kernel)
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

    // Designer State
    const [editingTemplate, setEditingTemplate] = useState<Partial<MessageTemplate> | null>(null);

    // Gatilhos Kernel
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

            // Check for BI Segmentation Queue
            const savedQueue = localStorage.getItem('sie_broadcast_queue');
            const savedContext = localStorage.getItem('sie_broadcast_context');
            if (savedQueue) {
                setSegmentedQueue(JSON.parse(savedQueue));
                setSegmentContext(savedContext || 'Segmentação Externa');
            }

        } catch (e) { console.error("Messenger Hub Offline"); }
        finally { setIsLoading(false); }
    };

    const handleClearQueue = () => {
        localStorage.removeItem('sie_broadcast_queue');
        localStorage.removeItem('sie_broadcast_context');
        setSegmentedQueue([]);
        setSegmentContext('');
    };

    const handleExecuteBroadcast = async () => {
        if (!editingTemplate?.content || segmentedQueue.length === 0) return;
        
        const userIds = segmentedQueue.map(u => u.id);

        if (!confirm(`CONFIRMAR DISPARO MASSIVO?\nAudiência: ${userIds.length} membros selecionados.\nContexto: ${segmentContext}`)) return;

        setIsSaving(true);
        try {
            // SRE CORE: Agora enviamos os IDs exatos da fila selecionada no BI/Radar
            await api.post('/communication/whatsapp-broadcast', {
                message: editingTemplate.content,
                targetType: 'SELECTED', 
                userIds: userIds,
                templateId: editingTemplate.id,
                footer: waConfig.footer
            });
            alert("✅ PROTOCOLO DE DISPARO MASSIVO ENVIADO AO GATEWAY.");
            handleClearQueue();
        } catch (e) { alert("Falha no disparo."); }
        finally { setIsSaving(false); }
    };

    const handleSaveHardware = async () => {
        setIsSaving(true);
        try {
            await systemService.updateInfo({ ...systemInfo, whatsapp_config: waConfig });
            alert("✅ HARDWARE SINCRONIZADO.");
        } catch (e) { alert("Falha na sincronia."); }
        finally { setIsSaving(false); }
    };

    const handleSaveTemplate = async () => {
        if (!editingTemplate?.name || !editingTemplate?.content) return;
        setIsSaving(true);
        try {
            await communicationService.saveTemplate(editingTemplate);
            setEditingTemplate(null);
            loadData();
        } catch (e: any) { alert("Erro ao salvar."); } 
        finally { setIsSaving(false); }
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
                    media_type: file.type.startsWith('image') ? 'image' : file.type.startsWith('video') ? 'video' : 'document'
                });
            }
        } catch (error) { alert("Falha no upload."); } 
        finally { setIsUploading(false); }
    };

    const resolvePreview = (text: string) => {
        if (!text) return "";
        let resolved = text;
        const context = { nome: 'Membro', unidade: 'HUB', sigla: systemInfo.shortName || 'S.I.E' };
        Object.entries(context).forEach(([key, val]) => {
            const regex = new RegExp(`\\{${key}\\}`, 'gi');
            resolved = resolved.replace(regex, val);
        });
        return resolved;
    };

    const primaryColor = systemInfo.primaryColor || '#4f46e5';

    return (
        <div className="flex-1 flex flex-col h-full animate-fade-in space-y-6">

            <header className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl overflow-hidden relative shrink-0">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/5 rounded-full blur-[100px] -mr-40 -mt-40"></div>
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-indigo-600 rounded-[1.5rem] shadow-xl" style={{ backgroundColor: primaryColor }}><Smartphone size={28} /></div>
                        <div>
                            <h2 className="text-3xl font-black tracking-tighter uppercase leading-none">Messenger Hub</h2>
                            <p className="text-indigo-400 text-[10px] font-black uppercase mt-2 tracking-widest opacity-80">JennyAI Active Bridge V8.5</p>
                        </div>
                    </div>
                    <div className="flex bg-white/5 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 overflow-x-auto no-scrollbar">
                        {['DASHBOARD', 'PROTOCOLS', 'DESIGNER', 'QUEUE', 'HARDWARE'].map(tab => (
                            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-indigo-600 shadow-lg' : 'text-slate-400 hover:text-white'}`} style={activeTab === tab ? { color: primaryColor } : {}}>
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                
                {/* HUD DE FILA SEGMENTADA */}
                {segmentedQueue.length > 0 && (
                    <div className="mb-8 p-8 bg-emerald-600 rounded-[3rem] text-white shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6 animate-slide-up">
                        <div className="flex items-center gap-6">
                            <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-md border border-white/10"><Users size={28}/></div>
                            <div>
                                <h4 className="text-xl font-black uppercase tracking-tight leading-none">Audiência Segmentada Ativa</h4>
                                <p className="text-emerald-100 text-[10px] font-bold uppercase mt-2 tracking-widest">{segmentContext} • {segmentedQueue.length} Moradores na Fila</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={handleClearQueue} className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Limpar Fila</button>
                            <button onClick={() => setActiveTab('DESIGNER')} className="px-8 py-3 bg-white text-emerald-700 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl">Selecionar Template e Disparar</button>
                        </div>
                    </div>
                )}

                {activeTab === 'DASHBOARD' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in pb-10">
                        {[
                            { label: 'Total Histórico', value: '5.120', color: 'text-indigo-600', icon: Send },
                            { label: 'Saúde de Entrega', value: '99.1%', color: 'text-emerald-600', icon: ShieldCheck },
                            { label: 'Fila Pendente', value: schedules.length, color: 'text-amber-600', icon: Clock }
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
                )}

                {activeTab === 'DESIGNER' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in pb-10">
                        <div className="lg:col-span-4 bg-white rounded-[3rem] border border-slate-200 overflow-hidden flex flex-col h-[600px]">
                            <div className="p-8 border-b bg-slate-50 flex justify-between items-center">
                                <h4 className="text-xs font-black uppercase text-slate-800 tracking-widest">Modelos Disponíveis</h4>
                                <button onClick={() => setEditingTemplate({ name: '', content: '', is_active: 1, media_type: 'image' })} className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg"><Plus size={16} /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                                {templates.map((tpl: MessageTemplate) => (
                                    <button key={tpl.id} onClick={() => setEditingTemplate(tpl)} className={`w-full p-6 rounded-[2.5rem] border text-left transition-all ${editingTemplate?.id === tpl.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl' : 'bg-white border-slate-100 hover:border-indigo-200'}`}>
                                        <p className="text-sm font-black uppercase truncate">{tpl.name}</p>
                                        <p className="text-[8px] font-bold uppercase mt-2 opacity-60">{tpl.event_trigger || 'MANUAL_SEND'}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="lg:col-span-8 bg-white rounded-[3rem] border border-slate-200 p-10 space-y-10 flex flex-col h-[600px] overflow-y-auto custom-scrollbar">
                            {editingTemplate ? (
                                <>
                                    <div className="flex justify-between items-center border-b pb-8">
                                        <h4 className="text-xl font-black uppercase text-slate-800 tracking-tight">{editingTemplate.id ? 'Editar Modelo' : 'Novo Protocolo'}</h4>
                                        <div className="flex gap-2">
                                            {segmentedQueue.length > 0 && (
                                                <button onClick={handleExecuteBroadcast} disabled={isSaving} className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-black text-[10px] uppercase shadow-xl flex items-center gap-2">
                                                    <Send size={14}/> Disparar para Fila
                                                </button>
                                            )}
                                            <button onClick={handleSaveTemplate} disabled={isSaving} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase shadow-xl flex items-center gap-2">
                                                <Save size={14} /> Salvar
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Template</label>
                                            <input className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-sm font-black uppercase" value={editingTemplate.name} onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Conteúdo da Mensagem</label>
                                            <textarea rows={8} className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] p-8 text-sm font-medium uppercase outline-none focus:bg-white" value={editingTemplate.content} onChange={e => setEditingTemplate({...editingTemplate, content: e.target.value})} />
                                        </div>
                                        <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-[2rem] flex flex-wrap gap-2">
                                            {['nome', 'unidade', 'sigla', 'valor'].map(v => (
                                                <button key={v} onClick={() => setEditingTemplate({...editingTemplate, content: (editingTemplate.content || '') + `{${v}}`})} className="px-4 py-2 bg-white border border-indigo-200 rounded-xl text-[9px] font-black text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all shadow-sm">+{'{' + v + '}'}</button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center opacity-10">
                                    <LayoutTemplate size={100} />
                                    <p className="font-black uppercase text-sm tracking-[0.4em] mt-6">Selecione um molde visual</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessengerBridge;
