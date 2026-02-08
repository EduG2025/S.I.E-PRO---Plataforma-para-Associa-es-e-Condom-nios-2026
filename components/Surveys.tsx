
import React, { useState, useEffect, useMemo } from 'react';
import { Survey, SurveyQuestion, SystemInfo } from '../types';
import { surveyService, communicationService, api } from '../services/api';
import {
    Plus, X, Trash2, Edit2, Loader2, Save, Link, BarChart3,
    CheckCircle2, ClipboardCheck, RefreshCw, Tag
} from 'lucide-react';

/**
 * 🧠 DOUTRINA TÉCNICA: SISTEMA DE ARQUITETURA MULTISSETORIAL UNIFICADO
 * Versão: 19.3.0 - SRE PATCH (Implicit Any Fix)
 */

const SYSTEM_TEXTS = {
    TITLE_MAIN: "Censo & Inteligência 360º",
    SUBTITLE_MAIN: "Neural Architecture • Protocolo SRE V19.3",
    TITLE_MODAL: "Arquiteto Neural",
    BTN_NEW_PROTOCOL: "Novo Protocolo",
    BTN_COMMIT_PROTOCOL: "Sincronizar Protocolo",
    BTN_ADD_ATTRIBUTE: "Adicionar Atributo",
    LBL_NO_TITLE: "Sem Título",
    RESP_SIM: "SIM",
    RESP_NAO: "NÃO",
    RESP_PLACEHOLDER: "Digite aqui...",
};

const CATEGORIES = [
    { v: 'GERAL', l: 'Geral' },
    { v: 'EDUCACAO', l: 'Educação' },
    { v: 'SAUDE', l: 'Saúde' },
    { v: 'ESPORTE', l: 'Esporte' },
    { v: 'LAZER', l: 'Lazer & Cultura' },
    { v: 'ASSISTENCIA_SOCIAL', l: 'Assistência Social' },
    { v: 'TURISMO', l: 'Turismo' },
    { v: 'SEGURANCA', l: 'Segurança' },
    { v: 'INFRAESTRUTURA', l: 'Infraestrutura' },
    { v: 'RENDA', l: 'Renda & Trabalho' },
    { v: 'AMBIENTE', l: 'Meio Ambiente' },
    { v: 'MOBILIDADE', l: 'Mobilidade' },
    { v: 'CONSUMO', l: 'Consumo Local' },
    { v: 'ALIMENTACAO', l: 'Alimentação' },
    { v: 'HABITACAO', l: 'Habitação' }
];

const Surveys = ({ systemInfo }: { systemInfo: SystemInfo }) => {
    const [surveys, setSurveys] = useState<Survey[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingSurvey, setEditingSurvey] = useState<any>(null);
    const [activeView, setActiveView] = useState<'LIST' | 'RESULTS'>('LIST');
    const [selectedSurveyResults, setSelectedSurveyResults] = useState<any>(null);

    useEffect(() => {
        loadSurveys();
    }, []);

    const safeQuestions = useMemo((): SurveyQuestion[] => {
        if (!editingSurvey) return [];
        if (Array.isArray(editingSurvey.questions)) return editingSurvey.questions;
        try {
            const parsed = typeof editingSurvey.questions === 'string' ? JSON.parse(editingSurvey.questions) : editingSurvey.questions;
            return Array.isArray(parsed) ? parsed : [];
        } catch (e) { return []; }
    }, [editingSurvey?.questions]);

    const loadSurveys = async () => {
        setIsLoading(true);
        try {
            const res = await surveyService.getAll();
            setSurveys(Array.isArray(res.data?.data) ? res.data.data : []);
        } catch (err) { setSurveys([]); } 
        finally { setIsLoading(false); }
    };

    const loadResults = async (survey: Survey) => {
        setIsLoading(true);
        setActiveView('RESULTS');
        try {
            const res = await api.get(`/surveys/${survey.id}/responses`);
            const responses = res.data.data || [];
            setSelectedSurveyResults({ survey, responses, total: responses.length });
        } catch (e) { alert("Erro ao carregar métricas BI."); }
        finally { setIsLoading(false); }
    };

    const handleSave = async () => {
        if (!editingSurvey?.title) return alert("Título obrigatório.");
        setIsSaving(true);
        try {
            const payload = { ...editingSurvey, questions: safeQuestions };
            if (payload.id && !String(payload.id).startsWith('temp_')) {
                await surveyService.update(payload.id, payload);
            } else {
                delete payload.id;
                await surveyService.create(payload);
            }
            setIsModalOpen(false);
            loadSurveys();
        } catch (err: any) { alert("Erro ao salvar."); }
        finally { setIsSaving(false); }
    };

    const updateQuestion = (index: number, field: keyof SurveyQuestion, value: any) => {
        const qs = [...safeQuestions];
        if (qs[index]) {
            qs[index] = { ...qs[index], [field]: value } as SurveyQuestion;
            setEditingSurvey({ ...editingSurvey, questions: qs });
        }
    };

    const primaryColor = systemInfo.primaryColor || '#4f46e5';

    if (activeView === 'RESULTS' && selectedSurveyResults) {
        return (
             <div className="flex-1 flex flex-col h-full animate-fade-in space-y-6">
                <header className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-xl flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-6">
                        <button onClick={() => setActiveView('LIST')} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-all"><RefreshCw size={20} /></button>
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tightest">{selectedSurveyResults.survey.title}</h2>
                            <p className="text-indigo-400 text-[9px] font-black uppercase tracking-widest mt-1">{selectedSurveyResults.total} Respostas</p>
                        </div>
                    </div>
                </header>
                <div className="flex-1 bg-white rounded-[3rem] p-10 flex items-center justify-center">
                    <p className="text-slate-400 font-bold uppercase tracking-widest">Visualização de BI disponível no Dashboard Demográfico.</p>
                </div>
             </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col min-h-0 space-y-6 animate-fade-in h-full relative font-sans">
            <header className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-xl shrink-0 overflow-hidden relative">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-indigo-600 rounded-2xl shadow-xl" style={{ backgroundColor: primaryColor }}><ClipboardCheck size={28} /></div>
                        <div>
                            <h2 className="text-3xl font-black tracking-tighter uppercase leading-none">{SYSTEM_TEXTS.TITLE_MAIN}</h2>
                            <p className="text-indigo-400 text-[10px] font-black uppercase mt-2 tracking-widest">{SYSTEM_TEXTS.SUBTITLE_MAIN}</p>
                        </div>
                    </div>
                    <button onClick={() => { setEditingSurvey({ title: '', description: '', type: 'GENERAL', questions: [], status: 'ACTIVE' }); setIsModalOpen(true); }} className="px-10 py-4 bg-white text-slate-900 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-2xl hover:bg-indigo-50 flex items-center gap-3">
                        <Plus size={20} /> {SYSTEM_TEXTS.BTN_NEW_PROTOCOL}
                    </button>
                </div>
            </header>

            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm flex-1 overflow-hidden flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-10">
                        {surveys.map(s => (
                            <div key={s.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 hover:border-indigo-200 shadow-sm hover:shadow-2xl transition-all group flex flex-col min-h-[300px] relative">
                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-4">{s.title}</h3>
                                <div className="flex-1">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase">{Array.isArray(s.questions) ? s.questions.length : 0} Perguntas</p>
                                </div>
                                <div className="flex gap-2 mt-4 pt-4 border-t border-slate-50">
                                    <button onClick={() => { setEditingSurvey(s); setIsModalOpen(true); }} className="p-3 text-slate-400 hover:text-indigo-600 transition-colors"><Edit2 size={20} /></button>
                                    <button onClick={() => loadResults(s)} className="p-3 text-slate-400 hover:text-emerald-600 transition-colors"><BarChart3 size={20} /></button>
                                    <button onClick={() => { const url = `${window.location.origin}/census/${s.id}`; navigator.clipboard.writeText(url); alert("Link copiado!"); }} className="p-3 text-slate-400 hover:text-indigo-600 transition-colors"><Link size={20} /></button>
                                </div>
                            </div>
                        ))}
                     </div>
                </div>
            </div>

            {isModalOpen && editingSurvey && (
                <div className="sie-editor-overlay">
                    <div className="sie-modal-container !max-w-7xl !h-[90vh]">
                        <div className="h-20 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-white/5 shadow-2xl relative z-20">
                            <h3 className="font-black text-xl uppercase tracking-tighter">{SYSTEM_TEXTS.TITLE_MODAL}</h3>
                            <div className="flex items-center gap-4">
                                <button onClick={handleSave} disabled={isSaving} className="px-10 py-3.5 bg-indigo-600 text-white rounded-xl font-black text-[11px] uppercase transition-all flex items-center gap-3">
                                    {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} {SYSTEM_TEXTS.BTN_COMMIT_PROTOCOL}
                                </button>
                                <button onClick={() => setIsModalOpen(false)} className="p-3.5 hover:bg-rose-50 rounded-xl transition-all border border-white/5"><X size={24} /></button>
                            </div>
                        </div>

                        <div className="flex-1 flex overflow-hidden bg-[#fdfdfe]">
                            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                                <div className="max-w-4xl mx-auto space-y-12">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <input 
                                            className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-sm font-black uppercase" 
                                            value={editingSurvey.title} 
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingSurvey({ ...editingSurvey, title: e.target.value })} 
                                            placeholder="Título da Pesquisa" 
                                        />
                                    </div>
                                    <div className="space-y-8">
                                        {safeQuestions.map((q: any, idx: number) => (
                                            <div key={q.id || idx} className="p-10 border border-slate-200 rounded-[3rem] shadow-sm space-y-6 bg-white hover:border-indigo-300 transition-all">
                                                <div className="flex gap-4">
                                                    <span className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black">{idx + 1}</span>
                                                    <input 
                                                        className="flex-1 font-black text-lg text-slate-800 uppercase outline-none bg-transparent" 
                                                        value={q.text} 
                                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateQuestion(idx, 'text', e.target.value)} 
                                                        placeholder="Pergunta..." 
                                                    />
                                                    <button onClick={() => { const qs = [...safeQuestions]; qs.splice(idx, 1); setEditingSurvey({ ...editingSurvey, questions: qs }); }} className="text-slate-300 hover:text-rose-600"><Trash2 size={20}/></button>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-slate-400 uppercase">Tipo</label>
                                                        <select 
                                                            className="w-full h-11 bg-slate-50 border border-slate-200 rounded-lg px-4 text-[9px] font-black uppercase outline-none" 
                                                            value={q.type} 
                                                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateQuestion(idx, 'type', e.target.value)}
                                                        >
                                                            <option value="text">TEXTO LIVRE</option>
                                                            <option value="select">SELEÇÃO ÚNICA</option>
                                                            <option value="boolean">SIM / NÃO</option>
                                                            <option value="number">NUMÉRICO</option>
                                                        </select>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-slate-400 uppercase flex items-center gap-1"><Tag size={10}/> Categoria KPI 360</label>
                                                        <select 
                                                            className="w-full h-11 bg-slate-50 border border-slate-200 rounded-lg px-4 text-[9px] font-black uppercase outline-none" 
                                                            value={q.mapping_tag || 'GERAL'} 
                                                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateQuestion(idx, 'mapping_tag', e.target.value)}
                                                        >
                                                            {CATEGORIES.map(cat => <option key={cat.v} value={cat.v}>{cat.l}</option>)}
                                                        </select>
                                                    </div>
                                                </div>
                                                {q.type === 'select' && (
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Opções (Separadas por vírgula)</label>
                                                        <input 
                                                            className="w-full font-bold h-12 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-xs uppercase outline-none" 
                                                            placeholder="Opção 1, Opção 2..." 
                                                            value={Array.isArray(q.options) ? q.options.join(', ') : q.options} 
                                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateQuestion(idx, 'options', e.target.value.split(',').map((opt: string) => opt.trim()))} 
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                        <button onClick={() => setEditingSurvey({ ...editingSurvey, questions: [...safeQuestions, { id: `q-${Date.now()}`, text: '', type: 'text', required: 1, mapping_tag: 'GERAL' }] })} className="w-full py-6 border-2 border-dashed border-slate-200 rounded-[3rem] text-slate-400 font-black text-[10px] uppercase flex items-center justify-center gap-3 hover:bg-slate-50 transition-all">
                                            <Plus size={18} /> {SYSTEM_TEXTS.BTN_ADD_ATTRIBUTE}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Surveys;
