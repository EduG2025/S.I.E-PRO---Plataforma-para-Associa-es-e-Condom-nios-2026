import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Survey, SurveyQuestion, SystemInfo } from '../types';
import { surveyService, communicationService, storageService, api } from '../services/api';
import {
    Plus, X, Trash2, Edit2, Loader2, Save, Share2, Link, Eye, Brain, Database,
    Sparkles, ClipboardCheck, GraduationCap, HandHelping, ChevronRight, AlertCircle,
    Info, Search, Layout, Settings, ListPlus, GitBranch, Table, Activity, Zap,
    Gauge, Target, Users, Wand2, BarChart3, ShieldCheck, Thermometer, Fingerprint,
    Briefcase, Scale, Landmark, HardHat, HeartPulse, GraduationCap as School, Users2,
    ShieldAlert, TrendingUp, Lightbulb, GitMerge, ListTree, ArrowDownRight,
    MapPin, Bus, Leaf, ShoppingBag, Siren, Coins, LayoutDashboard, PieChart,
    ChevronUp, ChevronDown, Video, Image as ImageIcon, Music, Smartphone, Workflow,
    Upload, FileVideo, FileAudio, CheckCircle2, Timer, BrainCircuit, Hash, Layers, MessageCircle, Send,
    Plane, Heart, Gamepad, Stethoscope, Clock, Printer, RefreshCw,
    HelpCircle, LayoutGrid, Bot
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

/**
 * 🧠 DOUTRINA TÉCNICA: SISTEMA DE ARQUITETURA MULTISSETORIAL UNIFICADO
 * Versão: 19.0.0 - FUSION CORE (Neural Editor + SRE Analytics)
 */

const PILLAR_CONFIG: Record<string, { label: string, icon: any, color: string, bg: string }> = {
    '1': { label: 'Demografia', icon: Users2, color: 'text-blue-500', bg: 'bg-blue-50' },
    '2': { label: 'Saúde', icon: HeartPulse, color: 'text-rose-500', bg: 'bg-rose-50' },
    '3': { label: 'Assistência', icon: HelpCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    '4': { label: 'Educação', icon: GraduationCap, color: 'text-indigo-500', bg: 'bg-indigo-50' },
    '5': { label: 'Esporte/Lazer', icon: Activity, color: 'text-orange-500', bg: 'bg-orange-50' },
    '6': { label: 'Personalizado', icon: LayoutGrid, color: 'text-slate-500', bg: 'bg-slate-50' },
};

const SYSTEM_TEXTS = {
    TITLE_MAIN: "Censo & Inteligência 360º",
    SUBTITLE_MAIN: "Neural Architecture • Protocolo SRE V19.0 Fusion",
    TITLE_MODAL: "Arquiteto Neural",
    SUBTITLE_MODAL: "Configuração Tática e Auditoria Heurística",
    TAB_STRUCTURE: "Estrutura & Lógica",
    TAB_WORKFLOW: "Gatilhos & Fluxo",
    BTN_INJECT_MASTER: "Injetar Censo 360º",
    BTN_NEW_PROTOCOL: "Novo Protocolo",
    BTN_NEURAL_ARCHITECT: "Neural Architect",
    BTN_COMMIT_PROTOCOL: "Sincronizar Protocolo",
    BTN_ADD_ATTRIBUTE: "Adicionar Atributo",
    BTN_ADD_MEDIA_CARD: "Adicionar Card Multimídia",
    PLACEHOLDER_SEARCH: "Filtrar protocolos setoriais...",
    LBL_RECORDS_MAPPED: "Protocolos Ativos",
    LBL_ATTRIBUTES: "Atributos",
    CONFIRM_DELETE: "Remover protocolo permanentemente?",
    LBL_NO_TITLE: "Sem Título",
    LBL_FOOTER_STATUS: "SRE Neural Engine ONLINE • Analytics & Media Active",
    IA_SECTION_TITLE: "Orquestrador Neural",
    AUDIT_TITLE: "Auditoria Heurística",
    LBL_MEDIA_URL: "URL da Mídia / Caminho SRE",
    LBL_CONTENT_HTML: "Conteúdo Rico (HTML/Texto)",
    LBL_LOGIC_PARENT: "Mostrar apenas se a pergunta...",
    LBL_LOGIC_TRIGGER: "...tiver o valor:",
    LBL_LOGIC_NONE: "Sempre visível (Linear)",
    TITLE_WHATSAPP_MODAL: "Disparo de Convites WhatsApp",
    SUBTITLE_WHATSAPP_MODAL: "Gateway JennyAI • Comunicação Massiva",
    METRIC_LOW: "Baixa (Otimizado)",
    METRIC_MED: "Média (Atenção)",
    METRIC_HIGH: "Alta (Crítico)"
};

const CENSUS_360_DEF = [
    { text: 'Quantas pessoas residem neste domicílio?', type: 'number', tag: 'IDENTITY', slug: 'kpi_densidade_domiciliar', pilar: '1' },
    { text: 'Qual o tempo de residência no bairro?', type: 'select', options: ['Menos de 1 ano', '1 a 5 anos', '5 a 10 anos', 'Mais de 10 anos'], tag: 'IDENTITY', slug: 'kpi_raizes_locais', pilar: '1' },
    { text: 'Como avalia o atendimento no posto de saúde local?', type: 'select', options: ['Excelente', 'Bom', 'Regular', 'Ruim', 'Não Utilizo'], tag: 'SAUDE', slug: 'kpi_satisfacao_saude', pilar: '2' },
    { text: 'Há moradores com doenças crônicas ou deficiência?', type: 'boolean', tag: 'SAUDE', slug: 'kpi_vulnerabilidade_saude', pilar: '2' },
    { text: 'Qual a maior dificuldade de saúde hoje?', type: 'select', options: ['Marcar Consulta', 'Falta de Remédios', 'Falta de Especialistas', 'Transporte/Acesso', 'Nenhuma'], tag: 'SAUDE', logic_parent_slug: 'kpi_vulnerabilidade_saude', logic_trigger: 'true', slug: 'kpi_gargalo_saude', pilar: '2' },
    { text: 'Crianças/Jovens em idade escolar frequentam a escola?', type: 'select', options: ['Sim, todos', 'Alguns não', 'Não há crianças', 'Não'], tag: 'EDUCACAO', slug: 'kpi_evasao_escolar', pilar: '4' },
    { text: 'Qual a situação da pavimentação na sua rua?', type: 'select', options: ['Asfalto Bom', 'Asfalto Precário/Buracos', 'Paralelepípedo', 'Terra/Sem Pavimento'], tag: 'INFRAESTRUTURA', slug: 'kpi_pavimentacao', pilar: '6' },
    { text: 'Qual sua sensação de segurança no bairro à noite?', type: 'select', options: ['Seguro', 'Pouco Seguro', 'Inseguro', 'Pânico/Muito Inseguro'], tag: 'SEGURANCA', slug: 'kpi_sensacao_seguranca', pilar: '6' }
];

interface SurveysProps {
    systemInfo: SystemInfo;
}

const Surveys = ({ systemInfo }: SurveysProps) => {
    // --- STATE MANAGEMENT ---
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [templates, setTemplates] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingSurvey, setEditingSurvey] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'STRUCTURE' | 'WORKFLOW'>('STRUCTURE');
    const [activeView, setActiveView] = useState<'LIST' | 'RESULTS'>('LIST');
    const [selectedSurveyResults, setSelectedSurveyResults] = useState<any>(null);

    // Editor & Logic States
    const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
    const [isWAPanelOpen, setIsWAPanelOpen] = useState(false);
    const [isAILoading, setIsAILoading] = useState(false);
    const [isSendingWA, setIsSendingWA] = useState(false);
    const [waTargetRole, setWaTargetRole] = useState('RESIDENT');
    const [aiAudit, setAiAudit] = useState<any>(null);
    const [depth, setDepth] = useState<1 | 2 | 3>(1);
    const [maxQuestions, setMaxQuestions] = useState(10);
    const [parentSurveyId, setParentSurveyId] = useState<string>('');

    useEffect(() => {
        loadSurveys();
        loadTemplates();
    }, []);

    // --- MEMOS & HELPERS ---
    const safeQuestions = useMemo(() => {
        if (!editingSurvey) return [];
        if (Array.isArray(editingSurvey.questions)) return editingSurvey.questions;
        try {
            const parsed = typeof editingSurvey.questions === 'string' ? JSON.parse(editingSurvey.questions) : editingSurvey.questions;
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) { return []; }
    }, [editingSurvey?.questions]);

    const auditMetrics = useMemo(() => {
        const defaultMetrics = { score: 0, load: 0, coverage: 0, loadLabel: 'N/A', loadColor: 'text-slate-400', count: 0 };
        const qs = safeQuestions;
        const count = qs.length;
        if (count === 0) return defaultMetrics;

        let cognitiveLoadPoints = 0;
        qs.forEach((q: any) => {
            if (q.type === 'multimedia') cognitiveLoadPoints += 0;
            else if (q.type === 'text') cognitiveLoadPoints += 3;
            else if (q.type === 'repeater') cognitiveLoadPoints += 4;
            else cognitiveLoadPoints += 1;
        });

        const loadScore = Math.round((cognitiveLoadPoints / count) * 10);
        let loadLabel = SYSTEM_TEXTS.METRIC_LOW;
        let loadColor = 'text-emerald-500';
        if (loadScore > 15) { loadLabel = SYSTEM_TEXTS.METRIC_MED; loadColor = 'text-amber-500'; }
        if (loadScore > 25) { loadLabel = SYSTEM_TEXTS.METRIC_HIGH; loadColor = 'text-rose-500'; }

        const uniqueTags = new Set(qs.filter((q: any) => q.type !== 'multimedia').map((q: any) => q.mapping_tag));
        const coveragePct = Math.round((uniqueTags.size / 6) * 100);
        const qualityScore = Math.min(100, Math.round((coveragePct * 0.7) + ((100 - (loadScore * 2)) * 0.3)));

        return { score: qualityScore, load: cognitiveLoadPoints, coverage: coveragePct, loadLabel, loadColor, count };
    }, [safeQuestions]);

    // --- API CALLS ---
    const loadSurveys = async () => {
        setIsLoading(true);
        try {
            const res = await surveyService.getAll();
            setSurveys(Array.isArray(res.data?.data) ? res.data.data : []);
        } catch (err) {
            setSurveys([]);
        } finally { setIsLoading(false); }
    };

    const loadTemplates = async () => {
        try {
            const res = await communicationService.getTemplates();
            setTemplates(Array.isArray(res.data?.data) ? res.data.data : []);
        } catch (e) { }
    };

    const loadResults = async (survey: Survey) => {
        setIsLoading(true);
        setActiveView('RESULTS');
        try {
            const res = await api.get(`/surveys/${survey.id}/responses`);
            const responses = res.data.data || [];

            // Mock BI SRE based on pillars for demo
            const pilarStats = Object.keys(PILLAR_CONFIG).map(p => ({
                name: PILLAR_CONFIG[p].label,
                responses: responses.length,
                health: Math.floor(Math.random() * (100 - 60 + 1)) + 60,
                color: PILLAR_CONFIG[p].color.replace('text-', '#')
            }));

            setSelectedSurveyResults({
                survey,
                pilarStats,
                total: responses.length,
                responses
            });
        } catch (e) { alert("Erro ao carregar métricas BI."); }
        finally { setIsLoading(false); }
    };

    // --- ACTIONS ---
    const handleOpenEdit = (survey: Survey) => {
        const normalizedSurvey = {
            ...survey,
            questions: Array.isArray(survey.questions) ? survey.questions : []
        };
        setEditingSurvey(normalizedSurvey);
        setAiAudit(null);
        setActiveTab('STRUCTURE');
        setIsModalOpen(true);
    };

    const handleInjectCensus360 = () => {
        const timestamp = Date.now();
        const generatedQuestions = CENSUS_360_DEF.map((def, index) => {
            const qId = `q360_${timestamp}_${index}`;
            return {
                id: qId,
                text: def.text,
                type: def.type,
                options: (def as any).options || [],
                required: 1,
                mapping_tag: def.tag,
                pilar: (def as any).pilar || '6',
                filterable: true,
                slug: def.slug,
                logic_parent_id: '',
                logic_trigger_value: (def as any).logic_trigger || ''
            };
        });

        generatedQuestions.forEach(q => {
            const def = CENSUS_360_DEF.find(d => d.slug === q.slug);
            if (def && (def as any).logic_parent_slug) {
                const parent = generatedQuestions.find(p => p.slug === (def as any).logic_parent_slug);
                if (parent) { q.logic_parent_id = parent.id; }
            }
        });

        setEditingSurvey({
            title: 'Censo 360º Master',
            description: 'Mapeamento sistêmico integrado via Protocolo SRE.',
            type: 'GENERAL',
            status: 'ACTIVE',
            questions: generatedQuestions,
            whatsapp_trigger_enabled: false
        });
        setAiAudit(null);
        setIsModalOpen(true);
        setActiveTab('STRUCTURE');
    };

    const handleNeuralArchitect = async () => {
        if (!editingSurvey.title) return alert("Defina um título para o contexto neural.");
        setIsAILoading(true);
        try {
            const res = await surveyService.suggestQuestions({
                title: editingSurvey.title,
                description: editingSurvey.description,
                depth: depth,
                maxQuestions: maxQuestions,
                parentSurveyId: parentSurveyId
            });

            const payload = res.data.data;
            setAiAudit(payload.audit);

            const newQuestions = (payload.questions || []).map((q: any) => ({
                id: `ai_${Math.random().toString(36).substr(2, 9)}`,
                ...q,
                logic_parent_id: '',
                required: 1,
                pilar: '6' // Default to custom if not AI specified
            }));

            const currentQs = safeQuestions;
            setEditingSurvey({ ...editingSurvey, questions: [...currentQs, ...newQuestions] });
        } catch (e) {
            alert("Falha no Handshake Neural. Verifique conexão com orquestrador.");
        } finally {
            setIsAILoading(false);
        }
    };

    const handleSave = async () => {
        if (!editingSurvey?.title) return alert("Título do protocolo é obrigatório.");
        setIsSaving(true);
        try {
            const payload = {
                ...editingSurvey,
                questions: safeQuestions
            };
            if (payload.id && !String(payload.id).startsWith('temp_')) {
                await surveyService.update(payload.id, payload);
            } else {
                delete payload.id;
                await surveyService.create(payload);
            }
            setIsModalOpen(false);
            loadSurveys();
        } catch (err: any) { alert("Erro ao comitar estrutura no banco de dados."); }
        finally { setIsSaving(false); }
    };

    const handleDelete = async (id: any) => {
        if (!confirm(SYSTEM_TEXTS.CONFIRM_DELETE)) return;
        try {
            await surveyService.delete(id);
            loadSurveys();
        } catch (e) { alert("Erro ao excluir."); }
    };

    const handleSurveyBroadcast = async () => {
        if (!editingSurvey?.id) return;
        setIsSendingWA(true);
        try {
            await api.post('/communication/survey-broadcast', {
                surveyId: editingSurvey.id,
                targetRole: waTargetRole
            });
            alert("✅ Protocolo de disparo em massa iniciado pelo Gateway.");
            setIsWAPanelOpen(false);
        } catch (e) {
            alert("Erro ao disparar convites.");
        } finally {
            setIsSendingWA(false);
        }
    };

    // --- EDITOR HELPERS ---
    const updateQuestion = (index: number, field: string, value: any) => {
        const qs = [...safeQuestions];
        if (qs[index]) {
            qs[index] = { ...qs[index], [field]: value };
            setEditingSurvey({ ...editingSurvey, questions: qs });
        }
    };

    const moveQuestion = (index: number, direction: 'up' | 'down') => {
        const qs = [...safeQuestions];
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= qs.length) return;
        const temp = qs[index];
        qs[index] = qs[newIndex];
        qs[newIndex] = temp;
        setEditingSurvey({ ...editingSurvey, questions: qs });
    };

    const handleCardFileUpload = async (index: number, file: File) => {
        setUploadingIdx(index);
        try {
            const res = await storageService.upload(file);
            const url = res.data.url;
            let type: 'image' | 'video' | 'audio' = 'image';
            if (file.type.startsWith('video')) type = 'video';
            if (file.type.startsWith('audio')) type = 'audio';

            const qs = [...safeQuestions];
            qs[index] = { ...qs[index], media_url: url, media_type: type };
            setEditingSurvey({ ...editingSurvey, questions: qs });
        } catch (e) {
            alert("Falha no upload da mídia.");
        } finally {
            setUploadingIdx(null);
        }
    };

    const primaryColor = systemInfo.primaryColor || '#4f46e5';

    // --- ANALYTICS VIEW ---
    if (activeView === 'RESULTS' && selectedSurveyResults) {
        return (
            <div className="flex-1 flex flex-col h-full animate-fade-in space-y-6">
                <header className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-xl flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-6">
                        <button onClick={() => setActiveView('LIST')} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all"><RefreshCw size={20} /></button>
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tightest">{selectedSurveyResults.survey.title}</h2>
                            <p className="text-indigo-400 text-[9px] font-black uppercase tracking-widest mt-1">BI Multissetorial • {selectedSurveyResults.total} Snapshots Coletados</p>
                        </div>
                    </div>
                    <button onClick={() => window.print()} className="px-8 py-3 bg-white text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-xl"><Printer size={16} /> Relatório de Gestão</button>
                </header>

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-8 pb-20">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {selectedSurveyResults.pilarStats.slice(0, 3).map((p: any, i: number) => (
                            <div key={i} className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col justify-between group hover:shadow-xl transition-all">
                                <div className="flex justify-between items-start mb-6">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saúde do Eixo: {p.name}</p>
                                    <TrendingUp size={16} className="text-emerald-500" />
                                </div>
                                <div className="flex items-end gap-3">
                                    <h3 className="text-4xl font-black text-slate-800">{p.health}%</h3>
                                    <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 uppercase mb-1">Ótimo</span>
                                </div>
                                <div className="mt-6 w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div className="h-full transition-all duration-1000" style={{ width: `${p.health}%`, backgroundColor: p.color }}></div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-8 bg-white p-10 rounded-[4rem] border border-slate-200 shadow-sm">
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-10 flex items-center gap-3"><BarChart3 size={20} className="text-indigo-600" /> Comparativo de Ingestão por Pilar</h4>
                            <div className="h-[350px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={selectedSurveyResults.pilarStats}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }} dy={10} />
                                        <YAxis hide />
                                        <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                                        <Bar dataKey="health" radius={[10, 10, 0, 0]} barSize={40}>
                                            {selectedSurveyResults.pilarStats.map((entry: any, index: number) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div className="lg:col-span-4 bg-slate-900 p-10 rounded-[4rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-between">
                            <div className="absolute top-0 right-0 p-10 opacity-5"><Brain size={180} /></div>
                            <div className="relative z-10">
                                <h4 className="text-lg font-black uppercase tracking-tightest flex items-center gap-3"><Sparkles size={18} className="text-indigo-400" /> Diagnóstico de Eixos</h4>
                                <p className="mt-8 text-sm font-medium uppercase leading-relaxed italic text-indigo-100/70 border-l-2 border-indigo-500/30 pl-6">
                                    "A análise multissetorial indica estabilidade nos pilares 1 e 4. Recomenda-se reforço preventivo no eixo de Saúde (Pilar 2) devido ao volume de membros com doenças crônicas mapeados."
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- MAIN VIEW ---
    return (
        <div className="flex-1 flex flex-col min-h-0 space-y-6 animate-fade-in h-full relative font-sans">
            <header className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-xl shrink-0 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-indigo-600 rounded-2xl shadow-xl" style={{ backgroundColor: primaryColor }}><ClipboardCheck size={28} /></div>
                        <div>
                            <h2 className="text-3xl font-black tracking-tighter uppercase leading-none">{SYSTEM_TEXTS.TITLE_MAIN}</h2>
                            <p className="text-indigo-400 text-[10px] font-black uppercase mt-2 tracking-widest opacity-80">{SYSTEM_TEXTS.SUBTITLE_MAIN}</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={handleInjectCensus360} className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-3 shadow-lg shadow-emerald-500/20 active:scale-95 border border-emerald-400/50">
                            <PieChart size={20} /> {SYSTEM_TEXTS.BTN_INJECT_MASTER}
                        </button>
                        <button onClick={() => { setEditingSurvey({ title: '', description: '', type: 'GENERAL', questions: [], status: 'ACTIVE', whatsapp_trigger_enabled: false }); setAiAudit(null); setActiveTab('STRUCTURE'); setIsModalOpen(true); }} className="px-10 py-4 bg-white text-slate-900 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-2xl hover:bg-indigo-50 transition-all active:scale-95 flex items-center gap-3">
                            <Plus size={20} /> {SYSTEM_TEXTS.BTN_NEW_PROTOCOL}
                        </button>
                    </div>
                </div>
            </header>

            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm flex-1 overflow-hidden flex flex-col min-h-0">
                <div className="p-8 border-b bg-slate-50/30 flex justify-between items-center shrink-0">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-[11px] font-black uppercase focus:border-indigo-500 transition-all shadow-inner" placeholder={SYSTEM_TEXTS.PLACEHOLDER_SEARCH} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{surveys.length} {SYSTEM_TEXTS.LBL_RECORDS_MAPPED}</span>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                    {isLoading ? <div className="p-20 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={40} /></div> : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-10">
                            {surveys.filter(s => s.title.toLowerCase().includes(searchTerm.toLowerCase())).map(s => (
                                <div key={s.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 hover:border-indigo-200 shadow-sm hover:shadow-2xl transition-all group flex flex-col min-h-[300px] relative overflow-hidden">
                                    <div className="flex justify-between items-start mb-6">
                                        <div onClick={() => loadResults(s)} className="p-4 bg-slate-50 text-slate-400 rounded-2xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all shadow-inner cursor-pointer" title="Ver Analytics BI"><BarChart3 size={24} /></div>
                                        <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase border ${s.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400'}`}>{s.status}</span>
                                    </div>
                                    <h3 onClick={() => loadResults(s)} className="text-xl font-black text-slate-800 uppercase tracking-tight line-clamp-2 mb-4 cursor-pointer hover:text-indigo-600 transition-colors">{s.title || SYSTEM_TEXTS.LBL_NO_TITLE}</h3>
                                    <div className="flex-1 text-[10px] text-slate-400 font-bold uppercase space-y-2">
                                        <p className="flex items-center gap-2"><Target size={14} className="text-indigo-500" /> {Array.isArray(s.questions) ? s.questions.length : 0} {SYSTEM_TEXTS.LBL_ATTRIBUTES}</p>
                                        <p className="flex items-center gap-2"><Share2 size={14} className="text-indigo-500" /> /census/{s.id}</p>
                                    </div>
                                    <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-all">
                                        <button onClick={() => { setEditingSurvey(s); setIsWAPanelOpen(true); }} className="p-3 text-slate-400 hover:text-emerald-600 transition-colors" title="Broadcast WhatsApp"><MessageCircle size={20} /></button>
                                        <button onClick={() => handleOpenEdit(s)} className="p-3 text-slate-400 hover:text-indigo-600 transition-colors"><Edit2 size={20} /></button>
                                        <div className="flex gap-2">
                                            <button onClick={() => { const url = `${window.location.origin}/census/${s.id}`; navigator.clipboard.writeText(url); alert("Link copiado!"); }} className="p-3 text-slate-400 hover:text-indigo-600 transition-colors"><Link size={20} /></button>
                                            <button onClick={() => handleDelete(s.id)} className="p-3 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={20} /></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <footer className="h-14 bg-slate-900 border-t border-white/5 flex items-center justify-between px-10 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{SYSTEM_TEXTS.LBL_FOOTER_STATUS}</span>
                    </div>
                </footer>
            </div>

            {/* UNIFIED MODAL (Visual Painel 2 Features + Logic Painel 1) */}
            {isModalOpen && editingSurvey && (
                <div className="sie-editor-overlay">
                    <div className="sie-modal-container !max-w-7xl !h-[90vh]">
                        <div className="h-20 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-white/5 shadow-2xl relative z-20">
                            <div className="flex items-center gap-5">
                                <div className="p-3.5 bg-indigo-600 rounded-xl shadow-xl" style={{ backgroundColor: primaryColor }}><Brain size={22} /></div>
                                <div>
                                    <h3 className="font-black text-xl uppercase tracking-tighter">{SYSTEM_TEXTS.TITLE_MODAL}</h3>
                                    <p className="text-indigo-400 text-[9px] font-black uppercase tracking-widest opacity-80">{SYSTEM_TEXTS.SUBTITLE_MODAL}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button onClick={handleSave} disabled={isSaving} className="px-10 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center gap-3 shadow-xl">
                                    {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} {SYSTEM_TEXTS.BTN_COMMIT_PROTOCOL}
                                </button>
                                <button onClick={() => setIsModalOpen(false)} className="p-3.5 hover:bg-rose-500 rounded-xl transition-all border border-white/5"><X size={24} /></button>
                            </div>
                        </div>

                        <div className="flex-1 flex overflow-hidden bg-[#fdfdfe]">
                            <aside className="w-[380px] bg-slate-50 border-r p-10 flex flex-col gap-10 shrink-0 custom-scrollbar overflow-y-auto">
                                <div className="space-y-6">
                                    <h4 className="text-[11px] font-black uppercase text-slate-900 tracking-widest flex items-center gap-3"><Sparkles size={16} className="text-indigo-600" /> {SYSTEM_TEXTS.IA_SECTION_TITLE}</h4>
                                    <div className="space-y-4 p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nível de Profundidade</label>
                                            <div className="flex bg-slate-100 p-1 rounded-xl">
                                                {[1, 2, 3].map(d => (
                                                    <button key={d} onClick={() => setDepth(d as any)} className={`flex-1 py-2 rounded-lg text-[10px] font-black transition-all ${depth === d ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}>{d}</button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Volume: {maxQuestions}</label>
                                            <input type="range" min="5" max="50" value={maxQuestions} onChange={e => setMaxQuestions(parseInt(e.target.value))} className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-full appearance-none cursor-pointer" />
                                        </div>
                                        <button onClick={handleNeuralArchitect} disabled={isAILoading || !editingSurvey.title} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all">
                                            {isAILoading ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />} {SYSTEM_TEXTS.BTN_NEURAL_ARCHITECT}
                                        </button>
                                    </div>

                                    {/* AI Audit Visualization */}
                                    <div className="space-y-4 p-6 bg-white rounded-3xl border border-slate-200 shadow-sm">
                                        <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Gauge size={14} /> Score Heurístico</h4>
                                        <div className="flex items-center gap-4">
                                            <span className="text-4xl font-black text-slate-800">{aiAudit ? 'AI' : auditMetrics.score}</span>
                                            <div className="flex flex-col">
                                                <span className={`text-[9px] font-bold uppercase ${auditMetrics.loadColor}`}>{auditMetrics.loadLabel}</span>
                                            </div>
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div className={`h-full transition-all duration-1000 ${auditMetrics.score > 70 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${aiAudit ? 100 : auditMetrics.score}%` }}></div>
                                        </div>
                                    </div>

                                    {aiAudit && (
                                        <div className="p-8 bg-indigo-50 border-l-4 border-indigo-600 rounded-r-3xl space-y-6 animate-slide-up">
                                            <h5 className="text-[10px] font-black uppercase text-indigo-600 tracking-[0.2em]">{SYSTEM_TEXTS.AUDIT_TITLE}</h5>
                                            <div className="space-y-4">
                                                <div className="p-4 bg-white/60 rounded-xl italic text-[11px] text-indigo-800 leading-relaxed uppercase">"{aiAudit.strategy_summary}"</div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </aside>

                            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar space-y-12">
                                <div className="max-w-4xl mx-auto space-y-12">
                                    <div className="flex gap-4 border-b border-slate-100 pb-2 shrink-0 overflow-x-auto no-scrollbar">
                                        <button onClick={() => setActiveTab('STRUCTURE')} className={`px-8 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'STRUCTURE' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}>{SYSTEM_TEXTS.TAB_STRUCTURE}</button>
                                        <button onClick={() => setActiveTab('WORKFLOW')} className={`px-8 py-3 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === 'WORKFLOW' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400'}`}>{SYSTEM_TEXTS.TAB_WORKFLOW}</button>
                                    </div>

                                    {activeTab === 'STRUCTURE' ? (
                                        <div className="space-y-12 animate-fade-in">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Título Protocolo</label>
                                                    <input className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-sm font-black uppercase outline-none focus:bg-white focus:border-indigo-500 shadow-inner" value={editingSurvey.title} onChange={e => setEditingSurvey({ ...editingSurvey, title: e.target.value })} />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Estado Distribuição</label>
                                                    <select className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-[10px] font-black uppercase outline-none" value={editingSurvey.status} onChange={e => setEditingSurvey({ ...editingSurvey, status: e.target.value })}>
                                                        <option value="ACTIVE">ATIVO / PUBLICADO</option>
                                                        <option value="DRAFT">RASCUNHO / INTERNO</option>
                                                        <option value="ARCHIVED">ARQUIVADO</option>
                                                    </select>
                                                </div>
                                                <div className="md:col-span-2 space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Descrição Tática</label>
                                                    <textarea rows={2} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-6 text-xs font-medium uppercase outline-none focus:bg-white focus:border-indigo-500" value={editingSurvey.description} onChange={e => setEditingSurvey({ ...editingSurvey, description: e.target.value })} />
                                                </div>
                                            </div>

                                            <div className="space-y-8">
                                                <div className="flex justify-end gap-3">
                                                    <button onClick={() => setEditingSurvey({ ...editingSurvey, questions: [...safeQuestions, { id: `media_${Date.now()}`, text: 'MENSAGEM MULTIMÍDIA', type: 'multimedia', media_url: '', media_type: 'image', auto_play: true, content_html: '', required: 0, mapping_tag: 'IDENTITY', pilar: '6' }] })} className="px-6 py-3 bg-amber-50 text-amber-600 rounded-xl font-black text-[10px] uppercase tracking-widest border border-amber-200 hover:bg-amber-100 transition-all flex items-center gap-2 shadow-sm">
                                                        <Video size={16} /> {SYSTEM_TEXTS.BTN_ADD_MEDIA_CARD}
                                                    </button>
                                                </div>

                                                {safeQuestions.map((q: any, idx: number) => {
                                                    // Logic for Pillar Display
                                                    const pilar = PILLAR_CONFIG[q.pilar || '6'] || PILLAR_CONFIG['6'];
                                                    const PIcon = pilar.icon;
                                                    return (
                                                        <div key={idx} className={`p-10 bg-white border border-slate-200 rounded-[3rem] shadow-sm hover:border-indigo-300 transition-all space-y-8 relative group ${q.type === 'multimedia' ? 'bg-amber-50/30' : ''}`}>
                                                            <div className="absolute top-8 right-8 flex gap-2">
                                                                <div className="flex flex-col gap-1 mr-4 opacity-0 group-hover:opacity-100 transition-all">
                                                                    <button onClick={() => moveQuestion(idx, 'up')} className="p-2 bg-white rounded-full shadow-md text-slate-400 hover:text-indigo-600"><ChevronUp size={16} /></button>
                                                                    <button onClick={() => moveQuestion(idx, 'down')} className="p-2 bg-white rounded-full shadow-md text-slate-400 hover:text-indigo-600"><ChevronDown size={16} /></button>
                                                                </div>
                                                                <button onClick={() => { const qs = [...safeQuestions]; qs.splice(idx, 1); setEditingSurvey({ ...editingSurvey, questions: qs }); }} className="p-3 text-slate-300 hover:text-rose-600 transition-colors"><Trash2 size={18} /></button>
                                                            </div>

                                                            <div className="flex gap-6 items-start">
                                                                <span className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 ${q.type === 'multimedia' ? 'bg-amber-500 text-white' : 'bg-slate-900 text-white'}`}>
                                                                    {q.type === 'multimedia' ? <Video size={20} /> : (idx + 1)}
                                                                </span>

                                                                <div className="flex-1 space-y-6">
                                                                    {q.type === 'multimedia' ? (
                                                                        <div className="space-y-4">
                                                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{SYSTEM_TEXTS.LBL_MEDIA_URL}</label>
                                                                            <div className="flex flex-col sm:flex-row gap-4">
                                                                                <input className="flex-1 h-14 bg-white border border-slate-200 rounded-xl px-6 text-sm outline-none focus:border-indigo-500 transition-all" value={q.media_url} onChange={e => updateQuestion(idx, 'media_url', e.target.value)} placeholder="https://..." />
                                                                                <div className="flex gap-2 shrink-0">
                                                                                    <select className="w-32 h-14 bg-white border border-slate-200 rounded-xl px-2 text-[10px] font-black uppercase" value={q.media_type} onChange={e => updateQuestion(idx, 'media_type', e.target.value)}>
                                                                                        <option value="image">Imagem</option><option value="video">Vídeo</option><option value="audio">Áudio</option>
                                                                                    </select>
                                                                                    <label className="h-14 px-6 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase flex items-center gap-2 cursor-pointer hover:bg-indigo-600 transition-all">
                                                                                        {uploadingIdx === idx ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                                                                                        <input type="file" className="hidden" accept="image/*,video/*,audio/*" onChange={e => { const f = e.target.files?.[0]; if (f) handleCardFileUpload(idx, f); }} />
                                                                                    </label>
                                                                                </div>
                                                                            </div>
                                                                            <textarea rows={3} className="w-full bg-white border border-slate-200 rounded-2xl p-6 text-sm outline-none focus:border-indigo-500" value={q.content_html} onChange={e => updateQuestion(idx, 'content_html', e.target.value)} placeholder={SYSTEM_TEXTS.LBL_CONTENT_HTML} />
                                                                        </div>
                                                                    ) : (
                                                                        <>
                                                                            <div className="flex items-center gap-2">
                                                                                <div className={`p-1.5 rounded-md ${pilar.bg} ${pilar.color}`}><PIcon size={12} /></div>
                                                                                <span className={`text-[9px] font-black uppercase tracking-widest ${pilar.color}`}>Eixo {q.pilar || '6'}</span>
                                                                            </div>
                                                                            <input className="w-full font-black text-xl text-slate-800 uppercase outline-none bg-transparent placeholder:text-slate-200" value={q.text} onChange={e => updateQuestion(idx, 'text', e.target.value)} placeholder="Pergunta Atributo..." />
                                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                                <div className="space-y-1">
                                                                                    <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Tipo Resposta</label>
                                                                                    <select className="w-full h-11 bg-slate-50 border border-slate-200 rounded-lg px-4 text-[9px] font-black uppercase outline-none" value={q.type} onChange={e => updateQuestion(idx, 'type', e.target.value)}>
                                                                                        <option value="text">TEXTO LIVRE</option>
                                                                                        <option value="select">SELEÇÃO ÚNICA</option>
                                                                                        <option value="boolean">SIM / NÃO</option>
                                                                                        <option value="number">NUMÉRICO</option>
                                                                                    </select>
                                                                                </div>
                                                                                <div className="space-y-1">
                                                                                    <label className="text-[8px] font-black text-slate-400 uppercase ml-1">Pilar Estratégico (Analytics)</label>
                                                                                    <select className="w-full h-11 bg-slate-50 border border-slate-200 rounded-lg px-4 text-[9px] font-black uppercase outline-none" value={q.pilar || '6'} onChange={e => updateQuestion(idx, 'pilar', e.target.value)}>
                                                                                        {Object.keys(PILLAR_CONFIG).map(k => <option key={k} value={k}>{k} - {PILLAR_CONFIG[k].label}</option>)}
                                                                                    </select>
                                                                                </div>
                                                                            </div>

                                                                            {q.type === 'select' && (
                                                                                <div className="md:col-span-12 space-y-2 animate-fade-in">
                                                                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Opções (Separadas por vírgula)</label>
                                                                                    <input className="w-full font-bold h-12 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-xs uppercase outline-none focus:bg-white focus:border-indigo-500"
                                                                                        placeholder="Opção 1, Opção 2..."
                                                                                        value={Array.isArray(q.options) ? q.options.join(', ') : q.options}
                                                                                        onChange={e => updateQuestion(idx, 'options', e.target.value.split(',').map((s: string) => s.trim()))}
                                                                                    />
                                                                                </div>
                                                                            )}

                                                                            <div className="pt-6 border-t border-slate-100">
                                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                                                    <div className="space-y-1">
                                                                                        <label className="text-[8px] font-black text-slate-400 uppercase flex items-center gap-2"><ListTree size={10} /> {SYSTEM_TEXTS.LBL_LOGIC_PARENT}</label>
                                                                                        <select className="w-full h-10 bg-white border border-slate-200 rounded-lg px-2 text-[9px] uppercase outline-none" value={q.logic_parent_id || ''} onChange={e => updateQuestion(idx, 'logic_parent_id', e.target.value)}>
                                                                                            <option value="">{SYSTEM_TEXTS.LBL_LOGIC_NONE}</option>
                                                                                            {safeQuestions.filter((_: any, i: number) => i < idx).map((parent: any) => (<option key={parent.id} value={parent.id}>{parent.text}</option>))}
                                                                                        </select>
                                                                                    </div>
                                                                                    {q.logic_parent_id && (
                                                                                        <div className="space-y-1">
                                                                                            <label className="text-[8px] font-black text-slate-400 uppercase">{SYSTEM_TEXTS.LBL_LOGIC_TRIGGER}</label>
                                                                                            <input className="w-full h-10 bg-white border border-slate-200 rounded-lg px-4 text-[9px] uppercase outline-none" value={q.logic_trigger_value || ''} onChange={e => updateQuestion(idx, 'logic_trigger_value', e.target.value)} placeholder="Valor exato..." />
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                })}

                                                <button onClick={() => {
                                                    const qs = [...safeQuestions, { id: `q-${Date.now()}`, text: '', type: 'text', mapping_tag: 'OTHER', pilar: '6', required: 1 }];
                                                    setEditingSurvey({ ...editingSurvey, questions: qs });
                                                }} className="w-full py-6 border-2 border-dashed border-slate-200 rounded-[3rem] text-slate-400 font-black text-[10px] uppercase tracking-widest hover:border-indigo-600 hover:text-indigo-600 transition-all flex items-center justify-center gap-3">
                                                    <Plus size={18} /> {SYSTEM_TEXTS.BTN_ADD_ATTRIBUTE}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-12 animate-fade-in">
                                            <div className="bg-slate-50 p-10 rounded-[4rem] border border-slate-200 space-y-10">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                                    <div className="space-y-4">
                                                        <label className="flex items-center gap-3 cursor-pointer group">
                                                            <input type="checkbox" className="w-6 h-6 rounded-lg border-slate-300 text-indigo-600" checked={editingSurvey.whatsapp_trigger_enabled} onChange={e => setEditingSurvey({ ...editingSurvey, whatsapp_trigger_enabled: e.target.checked })} />
                                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-indigo-600">Disparar WhatsApp ao Finalizar</span>
                                                        </label>
                                                        {editingSurvey.whatsapp_trigger_enabled && (
                                                            <div className="space-y-2 animate-fade-in">
                                                                <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Template de Disparo</label>
                                                                <select className="w-full h-14 bg-white border border-slate-200 rounded-xl px-6 text-[10px] font-black uppercase outline-none focus:border-indigo-500 shadow-sm" value={editingSurvey.whatsapp_template_id} onChange={e => setEditingSurvey({ ...editingSurvey, whatsapp_template_id: e.target.value })}>
                                                                    <option value="">NENHUM TEMPLATE SELECIONADO</option>
                                                                    {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                                                </select>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="space-y-4">
                                                        <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Próximo Protocolo (Encadeamento)</label>
                                                        <select className="w-full h-14 bg-white border border-slate-200 rounded-xl px-6 text-[10px] font-black uppercase outline-none focus:border-indigo-500 shadow-sm" value={editingSurvey.next_survey_id} onChange={e => setEditingSurvey({ ...editingSurvey, next_survey_id: e.target.value })}>
                                                            <option value="">FLUXO LINEAR (FINALIZAR)</option>
                                                            {surveys.filter(s => s.id !== editingSurvey.id).map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* WHATSAPP BROADCAST MODAL */}
            {isWAPanelOpen && editingSurvey && (
                <div className="sie-editor-overlay">
                    <div className="sie-modal-container !h-auto !max-w-2xl self-center">
                        <div className="h-24 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-white/5 rounded-t-[3rem]">
                            <div className="flex items-center gap-6">
                                <div className="p-4 bg-emerald-600 rounded-2xl shadow-xl animate-pulse"><MessageCircle size={28} /></div>
                                <div>
                                    <h3 className="font-black text-xl uppercase tracking-tighter leading-none">{SYSTEM_TEXTS.TITLE_WHATSAPP_MODAL}</h3>
                                    <p className="text-emerald-400 text-[9px] font-black uppercase mt-1.5 tracking-widest opacity-80">{SYSTEM_TEXTS.SUBTITLE_WHATSAPP_MODAL}</p>
                                </div>
                            </div>
                            <button onClick={() => setIsWAPanelOpen(false)} className="p-4 hover:bg-rose-500 rounded-2xl transition-all border border-white/5"><X size={32} /></button>
                        </div>
                        <div className="p-12 space-y-10 bg-white rounded-b-[3rem]">
                            <div className="p-8 bg-indigo-50 border border-indigo-100 rounded-[2rem] space-y-4">
                                <h4 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest flex items-center gap-2"><Sparkles size={14} /> Convite Estruturado</h4>
                                <p className="text-xs font-medium text-indigo-800 leading-relaxed uppercase">
                                    A IA GERARÁ UM LINK PÚBLICO ÚNICO PARA A PESQUISA: <br />
                                    <strong className="text-indigo-950">"{editingSurvey.title}"</strong>
                                </p>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Segmentação de Destino</label>
                                <select className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-sm font-black uppercase outline-none focus:bg-white focus:border-emerald-500" value={waTargetRole} onChange={e => setWaTargetRole(e.target.value)}>
                                    <option value="RESIDENT">APENAS MORADORES (TITULARES)</option>
                                    <option value="ALL">TODOS OS MEMBROS DO CLUSTER</option>
                                    <option value="ADMIN">APENAS ADMINISTRADORES (TESTE)</option>
                                </select>
                            </div>

                            <button onClick={handleSurveyBroadcast} disabled={isSendingWA} className="w-full py-6 bg-slate-950 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-emerald-600 transition-all active:scale-95 flex items-center justify-center gap-4">
                                {isSendingWA ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                                {isSendingWA ? 'FILANDO DISPAROS...' : 'INICIAR DISPARO MASSIVO'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Surveys;