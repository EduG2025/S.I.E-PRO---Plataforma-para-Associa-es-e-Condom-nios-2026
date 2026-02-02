
import React, { useState, useEffect, useMemo } from 'react';
import { Survey, SurveyQuestion, SystemInfo } from '../types';
import { surveyService, communicationService, api } from '../services/api';
import {
    Plus, X, Trash2, Edit2, Loader2, Save, Share2, Link, Eye, Brain, Database,
    Sparkles, ClipboardCheck, ChevronRight, AlertCircle, Info, Search, Layout,
    Settings, ListPlus, GitBranch, Table, Activity, Zap, Gauge, Wand2,
    BarChart3, ShieldCheck, Thermometer, Fingerprint, Upload, CheckCircle2,
    LayoutDashboard, Workflow, ChevronUp, ChevronDown, Video, Timer,
    PieChart, Target, BrainCircuit, AlignLeft, Hash, Sliders, Layers, MessageCircle, Send
} from 'lucide-react';

const SYSTEM_TEXTS = {
    TITLE_MAIN: "Censo & Inteligência 360º",
    SUBTITLE_MAIN: "Neural Architecture • Protocolo SRE V16.0",
    TITLE_MODAL: "Arquiteto Neural",
    SUBTITLE_MODAL: "Configuração Tática e Auditoria Heurística",
    BTN_NEW_PROTOCOL: "Novo Protocolo",
    BTN_SAVE_STRUCTURE: "Sincronizar Cluster",
    BTN_ADD_ATTRIBUTE: "Adicionar Campo",
    BTN_NEURAL_ARCHITECT: "Neural Architect",
    LBL_SAVING: "Gravando Ledger...",
    LBL_AI_WORKING: "IA Calculando Carga...",
    TITLE_WHATSAPP_MODAL: "Disparo de Convites WhatsApp",
    SUBTITLE_WHATSAPP_MODAL: "Gateway JennyAI • Comunicação Massiva",
    LBL_RECORDS: "Protocolos Mapeados"
};

const Surveys = ({ systemInfo }: { systemInfo: SystemInfo }) => {
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isWAPanelOpen, setIsWAPanelOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isAILoading, setIsAILoading] = useState(false);
    const [isSendingWA, setIsSendingWA] = useState(false);
    const [editingSurvey, setEditingSurvey] = useState<any>(null);
    const [aiAudit, setAiAudit] = useState<any>(null);

    // Tactical States
    const [depth, setDepth] = useState<1 | 2 | 3>(1);
    const [maxQuestions, setMaxQuestions] = useState(10);
    const [parentSurveyId, setParentSurveyId] = useState<string>('');
    const [waTargetRole, setWaTargetRole] = useState('RESIDENT');

    useEffect(() => { loadSurveys(); }, []);

    const loadSurveys = async () => {
        setIsLoading(true);
        try {
            const res = await surveyService.getAll();
            setSurveys(res.data?.data || []);
        } catch (err) { setSurveys([]); }
        finally { setIsLoading(false); }
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
                ...q,
                id: `ai_${Math.random().toString(36).substr(2, 9)}`
            }));
            
            setEditingSurvey({ ...editingSurvey, questions: newQuestions });
        } catch (e) {
            alert("Falha no Handshake Neural.");
        } finally {
            setIsAILoading(false);
        }
    };

    const handleSave = async () => {
        if (!editingSurvey?.title) return alert("Título obrigatório.");
        setIsSaving(true);
        try {
            if (editingSurvey.id && !String(editingSurvey.id).startsWith('temp_')) {
                await surveyService.update(editingSurvey.id, editingSurvey);
            } else {
                const { id, ...payload } = editingSurvey;
                await surveyService.create(payload);
            }
            setIsModalOpen(false);
            loadSurveys();
        } catch (err) { alert("Erro de persistência."); }
        finally { setIsSaving(false); }
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

    return (
        <div className="flex-1 flex flex-col min-h-0 animate-fade-in h-full relative" style={{ gap: 'var(--sie-border-spacing)' }}>
            
            {/* HEADER HUB */}
            <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900 text-white shadow-xl shrink-0 overflow-hidden relative" style={{ padding: 'var(--sie-padding-inner)', borderRadius: 'var(--sie-radius)', justifyContent: 'var(--sie-title-justify)' }}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="flex items-center gap-6 relative z-10" style={{ justifyContent: 'var(--sie-title-justify)', width: '100%' }}>
                    <div className="p-5 bg-indigo-600 shadow-2xl" style={{ backgroundColor: 'var(--sie-primary)', borderRadius: 'calc(var(--sie-radius) * 0.7)' }}><Database size={28} /></div>
                    <div style={{ textAlign: 'var(--sie-title-align)' as any }}>
                        <h2 className="sie-header-title">{SYSTEM_TEXTS.TITLE_MAIN}</h2>
                        <p className="sie-header-slogan">{SYSTEM_TEXTS.SUBTITLE_MAIN}</p>
                    </div>
                </div>
                <button onClick={() => { setEditingSurvey({ title: '', description: '', questions: [], status: 'ACTIVE' }); setAiAudit(null); setIsModalOpen(true); }} className="sie-button sie-button-primary relative z-10 whitespace-nowrap">
                    <Plus size={22} /> {SYSTEM_TEXTS.BTN_NEW_PROTOCOL}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pb-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4" style={{ gap: 'var(--sie-border-spacing)' }}>
                    {surveys.map(s => (
                        <div key={s.id} className="sie-card group flex flex-col min-h-[300px] relative overflow-hidden m-0">
                            <div className="flex justify-between items-start mb-8">
                                <div className="p-4 bg-slate-50 text-slate-400 rounded-2xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors shadow-inner" style={{ borderRadius: 'calc(var(--sie-radius) * 0.5)' }}><ClipboardCheck size={24} /></div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                    <button onClick={() => { setEditingSurvey(s); setIsWAPanelOpen(true); }} className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-emerald-600 shadow-sm" style={{ borderRadius: 'calc(var(--sie-radius) * 0.4)' }}><MessageCircle size={18} /></button>
                                    <button onClick={() => { setEditingSurvey(s); setIsModalOpen(true); }} className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-amber-600 shadow-sm" style={{ borderRadius: 'calc(var(--sie-radius) * 0.4)' }}><Edit2 size={18} /></button>
                                    <button onClick={() => { if(confirm("Expurgar registro?")) surveyService.delete(s.id).then(loadSurveys); }} className="p-3 bg-white border border-slate-100 text-slate-300 hover:text-rose-600 shadow-sm" style={{ borderRadius: 'calc(var(--sie-radius) * 0.4)' }}><Trash2 size={18} /></button>
                                </div>
                            </div>
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-4 flex-1 leading-tight">{s.title}</h3>
                            <div className="pt-6 border-t border-slate-50 flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <Timer size={12} className="text-slate-300" />
                                    <span className="text-[9px] font-black text-slate-400 uppercase">Auditado: SRE Core</span>
                                </div>
                                <span className="text-[9px] font-black text-indigo-600 uppercase" style={{ color: 'var(--sie-primary)' }}>{Array.isArray(s.questions) ? s.questions.length : 0} Atributos</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* MODAL ARQUITETO NEURAL */}
            {isModalOpen && editingSurvey && (
                <div className="sie-editor-overlay">
                    <div className="sie-modal-container bg-[#fdfdfe] flex flex-col h-full w-full">
                        
                        {/* MODAL HEADER */}
                        <div className="h-24 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-white/5 shadow-2xl relative z-20">
                            <div className="flex items-center gap-6">
                                <div className="p-4 bg-indigo-600 shadow-xl animate-pulse" style={{ backgroundColor: 'var(--sie-primary)', borderRadius: 'calc(var(--sie-radius) * 0.6)' }}><Brain size={28} /></div>
                                <div>
                                    <h3 className="font-black text-2xl uppercase tracking-tighter leading-none">{editingSurvey.title || SYSTEM_TEXTS.TITLE_MODAL}</h3>
                                    <p className="text-indigo-400 text-[10px] font-black uppercase mt-2 tracking-widest opacity-80">{SYSTEM_TEXTS.SUBTITLE_MODAL}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button onClick={handleNeuralArchitect} disabled={isAILoading} className="sie-button bg-slate-800 hover:bg-slate-700 text-indigo-300 transition-all border border-white/5 shadow-xl">
                                    {isAILoading ? <Loader2 size={18} className="animate-spin" /> : <Wand2 size={18}/>} {SYSTEM_TEXTS.BTN_NEURAL_ARCHITECT}
                                </button>
                                <button onClick={handleSave} disabled={isSaving} className="sie-button sie-button-primary">
                                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} {SYSTEM_TEXTS.BTN_SAVE_STRUCTURE}
                                </button>
                                <button onClick={() => setIsModalOpen(false)} className="p-4 hover:bg-rose-500 hover:text-white text-slate-400 transition-all border border-white/5 ml-4" style={{ borderRadius: 'calc(var(--sie-radius) * 0.5)' }}><X size={32} /></button>
                            </div>
                        </div>

                        <div className="flex-1 flex overflow-hidden">
                            <div className="w-[450px] border-r bg-slate-50 flex flex-col shrink-0 overflow-y-auto custom-scrollbar p-10 space-y-10">
                                    <div className="space-y-4">
                                        <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-2"><Target size={16} className="text-indigo-600"/> Profundidade Analítica</h4>
                                        <div className="grid grid-cols-3 gap-2">
                                            {[
                                                { v: 1, l: 'Básico', d: 'Essencial' },
                                                { v: 2, l: 'Interm.', d: 'Operacional' },
                                                { v: 3, l: 'Profundo', d: 'Estratégico' }
                                            ].map(opt => (
                                                <button key={opt.v} onClick={() => setDepth(opt.v as any)} className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${depth === opt.v ? 'bg-white border-indigo-600 text-indigo-600 shadow-lg scale-105' : 'bg-slate-100 border-transparent text-slate-400 hover:bg-white'}`} style={depth === opt.v ? { borderColor: 'var(--sie-primary)', color: 'var(--sie-primary)', borderRadius: 'calc(var(--sie-radius) * 0.5)' } : { borderRadius: 'calc(var(--sie-radius) * 0.5)' }}>
                                                    <span className="text-[10px] font-black uppercase">{opt.l}</span>
                                                    <span className="text-[8px] font-bold opacity-60 uppercase">{opt.d}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center">
                                            <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-2"><Hash size={16} className="text-indigo-600"/> Volume de Atributos</h4>
                                            <span className="text-xl font-black text-indigo-600 bg-white px-4 py-1 border border-indigo-50" style={{ borderRadius: 'calc(var(--sie-radius) * 0.4)', color: 'var(--sie-primary)' }}>{maxQuestions}</span>
                                        </div>
                                        <input type="range" min="5" max="50" step="5" value={maxQuestions} onChange={e => setMaxQuestions(parseInt(e.target.value))} className="w-full accent-indigo-600" style={{ accentColor: 'var(--sie-primary)' }} />
                                    </div>

                                    {aiAudit && (
                                        <div className="pt-10 border-t border-slate-200 space-y-8 animate-fade-in">
                                            <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-2"><ShieldCheck size={16} className="text-emerald-600"/> Auditoria Heurística</h4>
                                            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-6" style={{ borderRadius: 'var(--sie-radius)' }}>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Carga Cognitiva Estimada</span>
                                                    <BrainCircuit size={16} className="text-slate-300"/>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase ${aiAudit.cognitive_load === 'HIGH' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                                                        {aiAudit.cognitive_load}
                                                    </div>
                                                    <span className="text-xs font-bold text-slate-700">{aiAudit.estimated_minutes} MIN</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div className={`h-full transition-all duration-1000 ${aiAudit.cognitive_load === 'HIGH' ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: aiAudit.cognitive_load === 'HIGH' ? '90%' : aiAudit.cognitive_load === 'MEDIUM' ? '50%' : '20%' }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                            </div>

                            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-slate-50/50">
                                <div className="max-w-4xl mx-auto space-y-12 pb-20">
                                    <div className="sie-card m-0 space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-3">
                                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Título do Protocolo</label>
                                                <input className="sie-input w-full" value={editingSurvey.title} onChange={e => setEditingSurvey({ ...editingSurvey, title: e.target.value })} />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Status do Fluxo</label>
                                                <select className="sie-input w-full appearance-none" value={editingSurvey.status} onChange={e => setEditingSurvey({ ...editingSurvey, status: e.target.value })}>
                                                    <option value="ACTIVE">ATIVO / PRODUÇÃO</option>
                                                    <option value="INACTIVE">INATIVO / BACKUP</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3"><ListPlus size={24} className="text-indigo-600" style={{ color: 'var(--sie-primary)' }} /> Malha de Atributos</h4>
                                            <button onClick={() => setEditingSurvey({ ...editingSurvey, questions: [...(editingSurvey.questions || []), { id: `q_${Date.now()}`, text: 'NOVA PERGUNTA', type: 'text', required: 1, mapping_tag: 'OUTROS' }] })} className="sie-button sie-button-primary h-12">
                                                <Plus size={16}/> {SYSTEM_TEXTS.BTN_ADD_ATTRIBUTE}
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 gap-6">
                                            {(editingSurvey.questions || []).map((q: any, qIdx: number) => (
                                                <div key={q.id} className="sie-card m-0 group relative">
                                                    <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-50">
                                                        <div className="p-3 bg-slate-100 text-slate-400 rounded-xl font-black text-[10px]" style={{ borderRadius: 'calc(var(--sie-radius) * 0.4)' }}>{qIdx + 1}</div>
                                                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Protocolo Neural ID: <code className="text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded">{q.id}</code></span>
                                                        <button onClick={() => { const qs = [...editingSurvey.questions]; qs.splice(qIdx, 1); setEditingSurvey({ ...editingSurvey, questions: qs }); }} className="ml-auto p-2 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={20} /></button>
                                                    </div>
                                                    
                                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                                                        <div className="md:col-span-12 space-y-2">
                                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Pergunta do Atributo</label>
                                                            <input className="sie-input w-full h-12" value={q.text} onChange={e => {
                                                                const qs = [...editingSurvey.questions];
                                                                qs[qIdx].text = e.target.value;
                                                                setEditingSurvey({...editingSurvey, questions: qs});
                                                            }} />
                                                        </div>
                                                        <div className="md:col-span-4 space-y-2">
                                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Dado</label>
                                                            <select className="sie-input w-full h-12" value={q.type} onChange={e => {
                                                                const qs = [...editingSurvey.questions];
                                                                qs[qIdx].type = e.target.value;
                                                                setEditingSurvey({...editingSurvey, questions: qs});
                                                            }}>
                                                                <option value="text">TEXTO LIVRE</option>
                                                                <option value="boolean">SIM / NÃO</option>
                                                                <option value="select">SELEÇÃO ÚNICA</option>
                                                            </select>
                                                        </div>
                                                        <div className="md:col-span-4 flex items-end pb-3">
                                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                                <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-indigo-600" checked={!!q.required} onChange={e => {
                                                                    const qs = [...editingSurvey.questions];
                                                                    qs[qIdx].required = e.target.checked ? 1 : 0;
                                                                    setEditingSurvey({...editingSurvey, questions: qs});
                                                                }} />
                                                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest group-hover:text-indigo-600">Obrigatório</span>
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            
                                            {(!editingSurvey.questions || editingSurvey.questions.length === 0) && (
                                                <div onClick={handleNeuralArchitect} className="py-20 bg-slate-50 border-2 border-dashed border-slate-200 text-center cursor-pointer group hover:bg-indigo-50 transition-all flex flex-col items-center justify-center gap-4" style={{ borderRadius: 'var(--sie-radius)' }}>
                                                    <Wand2 size={48} className="text-slate-200 group-hover:text-indigo-400 transition-colors" />
                                                    <p className="font-black uppercase text-[10px] text-slate-400 group-hover:text-indigo-600 tracking-[0.4em]">Protocolo Vazio. Acione o Neural Architect.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 border-t bg-white flex justify-between items-center shrink-0 shadow-inner">
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SRE Neural Engine ONLINE</span>
                                </div>
                            </div>
                            <button onClick={handleSave} className="sie-button bg-slate-950 text-white hover:bg-indigo-600 transition-all border border-white/10">Commitar Mudanças Master</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DISPARO WHATSAPP */}
            {isWAPanelOpen && editingSurvey && (
                <div className="sie-editor-overlay">
                    <div className="sie-modal-container !h-auto !max-w-2xl self-center">
                        <div className="h-24 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-white/5">
                             <div className="flex items-center gap-6">
                                <div className="p-4 bg-emerald-600 rounded-2xl shadow-xl animate-pulse"><MessageCircle size={28} /></div>
                                <div>
                                    <h3 className="font-black text-xl uppercase tracking-tighter leading-none">{SYSTEM_TEXTS.TITLE_WHATSAPP_MODAL}</h3>
                                    <p className="text-emerald-400 text-[9px] font-black uppercase mt-1.5 tracking-widest opacity-80">{SYSTEM_TEXTS.SUBTITLE_WHATSAPP_MODAL}</p>
                                </div>
                            </div>
                            <button onClick={() => setIsWAPanelOpen(false)} className="p-4 hover:bg-rose-500 rounded-2xl transition-all border border-white/5"><X size={32} /></button>
                        </div>
                        <div className="p-12 space-y-10 bg-white">
                            <div className="p-8 bg-indigo-50 border border-indigo-100 rounded-[2rem] space-y-4" style={{ borderRadius: 'var(--sie-radius)' }}>
                                <h4 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest flex items-center gap-2"><Sparkles size={14}/> Convite Estruturado</h4>
                                <p className="text-xs font-medium text-indigo-800 leading-relaxed uppercase">
                                    A IA GERARÁ UM LINK PÚBLICO ÚNICO PARA A PESQUISA: <br/>
                                    <strong className="text-indigo-950">"{editingSurvey.title}"</strong>
                                </p>
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Segmentação de Destino</label>
                                <select className="sie-input w-full" value={waTargetRole} onChange={e => setWaTargetRole(e.target.value)}>
                                    <option value="RESIDENT">APENAS MORADORES (TITULARES)</option>
                                    <option value="ALL">TODOS OS MEMBROS DO CLUSTER</option>
                                    <option value="ADMIN">APENAS ADMINISTRADORES (TESTE)</option>
                                </select>
                            </div>

                            <div className="p-6 border-l-4 border-amber-400 bg-amber-50 rounded-r-2xl">
                                <p className="text-[9px] font-bold text-amber-800 leading-relaxed uppercase">
                                    <strong>AVISO SRE:</strong> O DISPARO SERÁ EXECUTADO EM FILA PARA EVITAR BLOQUEIOS. CERTIFIQUE-SE DE QUE O GATEWAY JENNYAI ESTÁ ONLINE NAS CONFIGURAÇÕES.
                                </p>
                            </div>

                            <button onClick={handleSurveyBroadcast} disabled={isSendingWA} className="sie-button sie-button-primary w-full h-16 text-xs tracking-[0.3em] shadow-2xl">
                                {isSendingWA ? <Loader2 className="animate-spin" size={20}/> : <Send size={20}/>}
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
