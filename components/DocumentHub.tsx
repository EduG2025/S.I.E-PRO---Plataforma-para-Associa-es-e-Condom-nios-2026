import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { OfficialDocument, SystemInfo, User, DocumentVersion, DocStatus } from '../types';
import { documentService, aiService, systemService, api, visualTemplateService } from '../services/api';
import {
    FileText, Search, Plus, Sparkles, Save, Trash2, Edit2,
    Loader2, X, ChevronRight, Printer, Camera, Bold, Italic,
    Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify,
    Table as TableIcon, Wand2, Undo2, Redo2,
    Minimize2, Maximize2, List, ListOrdered, Heading1, Heading2,
    Quote, CheckSquare, Link as LinkIcon, Image as ImageIcon,
    SeparatorHorizontal, Eye, FileSignature, PenTool, Settings,
    LayoutTemplate, ArrowDownCircle, Palette, Indent, Outdent,
    Eraser, Superscript, Subscript, Bookmark, Star, MoreHorizontal,
    FileJson, Variable, Download, AlertTriangle, RefreshCw,
    History, FileClock, RotateCcw, BrainCircuit, UploadCloud, FileType,
    Type, Baseline, Highlighter, Strikethrough, ListTodo, Link2,
    Minus, Plus as PlusIcon, ZoomIn, ZoomOut, PaintBucket,
    Sun, Moon, CheckCircle2, AlertCircle, FileCheck, Database,
    ImagePlus, Move, Trash, SlidersHorizontal, Paperclip, FileOutput,
    Files, Upload, Info, MessageSquare, StickyNote, FileEdit,
    Layout, Settings2, Code, FileDown, CheckCircle, ChevronLeft,
    Clock
} from 'lucide-react';

interface VisualTemplate {
    id: number;
    name: string;
    paper: string;
    margins: any;
    header_html: string;
    footer_html: string;
    is_default: number;
}

const PAPER_SIZES: Record<string, { name: string; widthCm: number; heightCm: number; }> = {
    A4: { name: 'A4 (210 x 297 mm)', widthCm: 21.0, heightCm: 29.7 },
    LETTER: { name: 'Carta (216 x 279 mm)', widthCm: 21.59, heightCm: 27.94 }
};

const STATUS_LABELS: Record<DocStatus, { label: string; color: string }> = {
    DRAFT: { label: 'Rascunho', color: 'bg-slate-100 text-slate-600' },
    REVIEW: { label: 'Revisão', color: 'bg-amber-50 text-amber-600' },
    APPROVED: { label: 'Aprovado', color: 'bg-emerald-50 text-emerald-600' },
    SIGNED: { label: 'Assinado', color: 'bg-indigo-50 text-indigo-600' },
    SENT: { label: 'Enviado', color: 'bg-blue-50 text-blue-600' },
    ARCHIVED: { label: 'Arquivado', color: 'bg-slate-200 text-slate-500' }
};

/**
 * S.I.E DocumentHub PRO V27.0
 * Protocolo SRE: Gestão Cronológica e Visual Documental Soberana
 */
const DocumentHub = ({ systemInfo, currentUser, onNavigate, sidebarCollapsed }: { systemInfo: SystemInfo, currentUser: User | null, onNavigate?: (tab: string) => void, sidebarCollapsed?: boolean }) => {
    const [documents, setDocuments] = useState<OfficialDocument[]>([]);
    const [visualTemplates, setVisualTemplates] = useState<VisualTemplate[]>([]);
    const [activeDoc, setActiveDoc] = useState<OfficialDocument | null>(null);
    const [docStatus, setDocStatus] = useState<DocStatus>('DRAFT');
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // --- VERSIONS & HISTORY ---
    const [docHistory, setDocHistory] = useState<DocumentVersion[]>([]);
    const [showHistory, setShowHistory] = useState(false);

    // --- CONFIGURAÇÃO DE UI ---
    const [selectedVisualId, setSelectedVisualId] = useState<number | null>(null);
    const [selectedPromptId, setSelectedPromptId] = useState('');
    const [savedPrompts, setSavedPrompts] = useState<any[]>([]);
    
    // --- CHAT & ANEXOS ---
    const [aiChatInput, setAiChatInput] = useState('');
    const [sessionAttachment, setSessionAttachment] = useState<string>('');
    const [attachmentName, setAttachmentName] = useState<string>('');
    const [isAttachmentImage, setIsAttachmentImage] = useState(false);

    // --- ESTADO DE MOLDES ---
    const [editingTemplate, setEditingTemplate] = useState<Partial<VisualTemplate> | null>(null);

    const editorRef = useRef<HTMLDivElement>(null);
    const attachmentInputRef = useRef<HTMLInputElement>(null);
    const [zoomLevel, setZoomLevel] = useState(100);
    const [stats, setStats] = useState({ words: 0, chars: 0, pages: 1 });
    const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SAVING' | 'SUCCESS'>('IDLE');

    const canManage = currentUser?.role === 'ADMIN' || currentUser?.role === 'PRESIDENT' || currentUser?.role === 'SINDIC' || currentUser?.role === 'COUNCIL';

    useEffect(() => { loadDocuments(); loadPrompts(); loadVisualTemplates(); }, []);

    const loadDocuments = async () => {
        setIsLoading(true);
        try {
            const res = await documentService.getAll();
            setDocuments(res.data?.data || []);
        } catch (e) { setDocuments([]); }
        finally { setIsLoading(false); }
    };

    const loadVisualTemplates = async () => {
        try {
            const res = await visualTemplateService.getAll();
            const data = res.data?.data || [];
            setVisualTemplates(data);
            if (data.length > 0 && !selectedVisualId) {
                const def = data.find((t: any) => t.is_default) || data[0];
                setSelectedVisualId(def.id);
            }
        } catch (e) { console.error("Visual Templates Fail"); }
    };

    const loadPrompts = async () => {
        try {
            const res = await aiService.listPrompts();
            setSavedPrompts(res.data?.data || []);
        } catch (e) { setSavedPrompts([]); }
    };

    const loadHistory = async (id: string | number) => {
        try {
            const res = await documentService.getHistory(id);
            setDocHistory(res.data?.data || []);
        } catch (e) { setDocHistory([]); }
    };

    // --- MOTOR DE INTERPOLAÇÃO SRE ---
    const interpolateTemplate = (html: string) => {
        if (!html) return "";
        let out = html;
        const vars = {
            logo: systemInfo.logoUrl || "",
            assinatura: systemInfo.president_signature || "",
            nome_presidente: systemInfo.president_name || "",
            entidade: systemInfo.name || "",
            sigla: systemInfo.shortName || "",
            cnpj: systemInfo.cnpj || "",
            cidade: systemInfo.city || "",
            data_atual: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }),
            endereco: `${systemInfo.street}, ${systemInfo.number} - ${systemInfo.city}/${systemInfo.state}`
        };
        Object.entries(vars).forEach(([key, val]) => {
            const regex = new RegExp(`\\{${key}\\}`, 'g');
            out = out.replace(regex, val);
        });
        return out;
    };

    const updateStats = useCallback(() => {
        if (editorRef.current) {
            const text = editorRef.current.innerText || '';
            const visual = visualTemplates.find(v => v.id === selectedVisualId);
            const config = PAPER_SIZES[visual?.paper || 'A4'];
            const estPages = Math.max(1, Math.ceil(editorRef.current.scrollHeight / (config.heightCm * 37.8)));
            setStats({ words: text.split(/\s+/).filter(w => w.length > 0).length, chars: text.length, pages: estPages });
        }
    }, [selectedVisualId, visualTemplates]);

    const handleAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAttachmentName(file.name);
        const reader = new FileReader();
        reader.onload = (event) => {
            const result = event.target?.result as string;
            setSessionAttachment(result);
            setIsAttachmentImage(file.type.startsWith('image/'));
        };
        if (file.type.startsWith('image/')) reader.readAsDataURL(file);
        else reader.readAsText(file);
    };

    const handleGenerate = async () => {
        if (!aiChatInput.trim() && !selectedPromptId) return;
        setIsGenerating(true);

        const visual = visualTemplates.find(v => v.id === selectedVisualId);
        const promptTpl = savedPrompts.find(p => p.id === selectedPromptId);

        const finalPrompt = `
            ${promptTpl ? `ESTRUTURA DE TEXTO (BASE): ${promptTpl.content}` : ''}
            INSTRUÇÃO ADICIONAL DO USUÁRIO: ${aiChatInput}
            REGRAS DE VÍNCULO: Se houver um anexo, extraia os dados dele (nomes, valores, endereços) e use no documento.
            REQUISITO DE SAÍDA: Retorne APENAS o corpo do documento em HTML semântico limpo.
            NÃO gere cabeçalhos ou rodapés, pois o molde visual "${visual?.name}" já os possui no sistema.
        `;

        try {
            const res = await api.post('/ai/generate-document', {
                prompt: finalPrompt,
                context: `Entidade: ${systemInfo.name}, Presidente: ${systemInfo.president_name}`,
                attachment: sessionAttachment,
                isImage: isAttachmentImage
            });

            if (res.data?.text) {
                const bodyEl = document.getElementById('document-body-zone');
                if (bodyEl) {
                    bodyEl.innerHTML = res.data.text;
                } else {
                    document.execCommand('insertHTML', false, res.data.text);
                }
                updateStats();
                setAiChatInput('');
                setSessionAttachment('');
                setAttachmentName('');
            }
        } catch (e) {
            alert("Erro na geração neural.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!activeDoc || !activeDoc.title) return;
        setIsSaving(true);
        setSaveStatus('SAVING');
        try {
            const payload = { ...activeDoc, content: editorRef.current?.innerHTML || '', status: docStatus };
            if (String(activeDoc.id).startsWith('temp_')) await documentService.create(payload);
            else await documentService.update(String(activeDoc.id), payload);
            setSaveStatus('SUCCESS');
            setTimeout(() => { setSaveStatus('IDLE'); setIsEditorOpen(false); loadDocuments(); }, 800);
        } catch (e) { setSaveStatus('IDLE'); }
        finally { setIsSaving(false); }
    };

    const handleSaveVisualTemplate = async () => {
        if (!editingTemplate?.name) return;
        setIsSaving(true);
        try {
            if (editingTemplate.id) await visualTemplateService.update(editingTemplate.id, editingTemplate);
            else await visualTemplateService.create(editingTemplate);
            setEditingTemplate(null);
            loadVisualTemplates();
        } catch (e) { alert("Erro ao salvar molde."); }
        finally { setIsSaving(false); }
    };

    const handleOpenEditor = (doc: OfficialDocument | null) => {
        // FIX: Added 'created_at' property to the temporary document object to comply with OfficialDocument interface.
        setActiveDoc(doc || { id: `temp_${Date.now()}`, title: '', content: '', type: 'OFICIO', status: 'DRAFT', created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
        setIsEditorOpen(true);
        setZoomLevel(100);
        setShowHistory(false);
        
        if (doc && !String(doc.id).startsWith('temp_')) loadHistory(doc.id);

        setTimeout(() => {
            if (editorRef.current) {
                const visual = visualTemplates.find(v => v.id === selectedVisualId) || visualTemplates[0];
                if (!doc) {
                    editorRef.current.innerHTML = `
                        ${interpolateTemplate(visual?.header_html || "")}
                        <div id="document-body-zone" style="min-height: 400px; padding: 20px 0;">
                            <p>O conteúdo gerado pela IA ou digitado aparecerá aqui...</p>
                        </div>
                        ${interpolateTemplate(visual?.footer_html || "")}
                    `;
                } else {
                    editorRef.current.innerHTML = doc.content;
                }
                updateStats();
            }
        }, 100);
    };

    const handleExportPDF = () => {
        const element = document.getElementById('printable-canvas');
        if (!element) return;
        
        const opt = {
            margin: 0,
            filename: `${activeDoc?.title || 'documento'}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 3, useCORS: true, logging: false },
            jsPDF: { unit: 'cm', format: currentVisual?.paper || 'a4', orientation: 'portrait' }
        };

        // @ts-ignore (html2pdf is global)
        window.html2pdf().set(opt).from(element).save();
    };

    const currentVisual = visualTemplates.find(v => v.id === selectedVisualId) || visualTemplates[0];
    const activeConfig = PAPER_SIZES[currentVisual?.paper || 'A4'];

    return (
        <div className="h-full flex flex-col gap-6 animate-fade-in relative bg-slate-50">
            <input type="file" ref={attachmentInputRef} className="hidden" onChange={handleAttachment} accept="image/*,.txt,.md,.pdf" />

            {/* HUB HEADER */}
            <header className="bg-slate-900 p-8 rounded-[2.5rem] shadow-xl text-white shrink-0 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="flex flex-col md:flex-row justify-between items-center gap-6 relative z-10">
                    <div className="flex items-center gap-5">
                        <div className="p-4 bg-indigo-600 rounded-2xl shadow-lg"><FileSignature size={28} /></div>
                        <div>
                            <h2 className="text-3xl font-black tracking-tighter uppercase leading-none">Hub de Documentos</h2>
                            <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mt-2">Gestão Legal & Moldes SRE v27.0</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => setIsTemplateManagerOpen(true)} className="px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center gap-3 active:scale-95">
                            <Palette size={18}/> Moldes Visuais
                        </button>
                        {canManage && (
                            <button onClick={() => handleOpenEditor(null)} className="px-10 py-4 bg-white text-slate-950 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-2xl flex items-center gap-3 transition-all active:scale-95">
                                <Plus size={20} /> Novo Registro
                            </button>
                        )}
                    </div>
                </div>
            </header>

            {/* DOCUMENT GRID */}
            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm flex flex-1 overflow-hidden mx-2 mb-2">
                <div className="flex-1 flex flex-col">
                    <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center shrink-0">
                        <div className="relative w-full max-w-md">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                            <input type="text" placeholder="Filtrar base documental..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-14 pr-6 h-14 bg-white border border-slate-200 rounded-2xl text-sm font-bold shadow-inner outline-none uppercase" />
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{documents.length} Arquivos Protocolados</span>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                        {isLoading ? <div className="p-20 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={40} /></div> : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 pb-10">
                                {documents.filter(d => (d.title || '').toLowerCase().includes(searchTerm.toLowerCase())).map(doc => (
                                    <div key={doc.id} onClick={() => handleOpenEditor(doc)} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 hover:border-indigo-200 cursor-pointer hover:shadow-2xl transition-all group flex flex-col min-h-[260px] relative overflow-hidden">
                                        <div className={`absolute top-0 left-0 w-2 h-full ${doc.status === 'APPROVED' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="p-4 bg-slate-50 text-slate-400 rounded-2xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all shadow-inner"><FileText size={24} /></div>
                                            <div className={`text-[9px] font-bold px-2 py-1 rounded uppercase ${STATUS_LABELS[doc.status as DocStatus]?.color}`}>{STATUS_LABELS[doc.status as DocStatus]?.label}</div>
                                        </div>
                                        <h3 className="text-lg font-black text-slate-800 uppercase leading-tight line-clamp-2 mb-4">{doc.title || "Sem Título"}</h3>
                                        <div className="mt-auto flex justify-between items-center pt-4 border-t border-slate-50">
                                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                                                <Clock size={12}/> {new Date(doc.updated_at).toLocaleDateString()}
                                            </div>
                                            <button onClick={(e) => { e.stopPropagation(); if (confirm("Remover permanentemente?")) documentService.delete(doc.id).then(loadDocuments); }} className="p-2 text-slate-300 hover:text-rose-600 transition-colors"><Trash2 size={18} /></button>
                                        </div>
                                    </div>
                                ))}
                                {documents.length === 0 && (
                                    <div className="col-span-full py-40 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                                        <FileEdit size={64} className="mx-auto text-slate-200 mb-6 opacity-20"/>
                                        <p className="font-black uppercase text-[10px] text-slate-400 tracking-[0.4em]">Repositório Vazio. Nenhum registro localizado.</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* TEMPLATE MANAGER MODAL */}
            {isTemplateManagerOpen && (
                <div className="sie-editor-overlay fixed inset-0 z-[10000] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden shadow-2xl rounded-[2.5rem] border border-slate-200 animate-scale-in">
                        <div className="h-20 px-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-600 rounded-xl"><Palette size={20}/></div>
                                <h3 className="font-black text-xl uppercase tracking-tight">Gestor de Papel Timbrado</h3>
                            </div>
                            <button onClick={() => { setIsTemplateManagerOpen(false); setEditingTemplate(null); }} className="p-3 hover:bg-rose-500 rounded-xl transition-all"><X size={24}/></button>
                        </div>

                        <div className="flex-1 flex overflow-hidden">
                            {/* Listagem Lateral */}
                            <div className="w-80 border-r bg-slate-50 flex flex-col shrink-0">
                                <div className="p-6 border-b">
                                    <button onClick={() => setEditingTemplate({ name: 'Novo Molde', paper: 'A4', margins: {top:2, right:2, bottom:2, left:2.5}, header_html: '<!-- HTML HEADER -->', footer_html: '<!-- HTML FOOTER -->' })} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2">
                                        <Plus size={16}/> Novo Modelo
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                                    {visualTemplates.map(t => (
                                        <button key={t.id} onClick={() => setEditingTemplate(t)} className={`w-full p-5 rounded-2xl border text-left transition-all ${editingTemplate?.id === t.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl scale-[1.02]' : 'bg-white text-slate-500 hover:border-indigo-300'}`}>
                                            <p className="text-[10px] font-black uppercase">{t.name}</p>
                                            <p className="text-[8px] mt-1 opacity-60 uppercase">{t.paper} • {t.is_default ? 'PADRÃO ATIVO' : 'DISPONÍVEL'}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Editor de Molde */}
                            <div className="flex-1 overflow-y-auto p-10 bg-white custom-scrollbar">
                                {editingTemplate ? (
                                    <div className="space-y-10 animate-fade-in pb-20">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rótulo do Molde</label>
                                                <input className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-sm font-black uppercase outline-none focus:bg-white transition-all shadow-inner" value={editingTemplate.name} onChange={e => setEditingTemplate({...editingTemplate, name: e.target.value})} />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Padrão de Papel</label>
                                                <select className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-[10px] font-black uppercase shadow-inner" value={editingTemplate.paper} onChange={e => setEditingTemplate({...editingTemplate, paper: e.target.value})}>
                                                    <option value="A4">A4 (Standard Digital)</option>
                                                    <option value="LETTER">Carta (US Letter)</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="flex justify-between items-center">
                                                <h5 className="text-[10px] font-black uppercase text-indigo-600 tracking-[0.2em] flex items-center gap-2"><Code size={14}/> Cabeçalho (HTML)</h5>
                                                <div className="flex flex-wrap gap-2">
                                                    {['logo', 'entidade', 'sigla', 'cnpj', 'endereco'].map(v => (
                                                        <button key={v} onClick={() => setEditingTemplate({...editingTemplate, header_html: (editingTemplate.header_html || '') + `{${v}}`})} className="px-2 py-1 bg-slate-100 rounded text-[8px] font-black text-slate-500 border border-slate-200 hover:bg-indigo-50">+{v}</button>
                                                    ))}
                                                </div>
                                            </div>
                                            <textarea rows={8} className="w-full bg-slate-900 text-emerald-400 font-mono text-xs p-8 rounded-3xl outline-none focus:ring-4 focus:ring-indigo-500/20 shadow-inner" value={editingTemplate.header_html} onChange={e => setEditingTemplate({...editingTemplate, header_html: e.target.value})} />
                                        </div>

                                        <div className="space-y-6">
                                            <div className="flex justify-between items-center">
                                                <h5 className="text-[10px] font-black uppercase text-indigo-600 tracking-[0.2em] flex items-center gap-2"><Code size={14}/> Rodapé (HTML)</h5>
                                                <div className="flex flex-wrap gap-2">
                                                    {['assinatura', 'nome_presidente', 'data_atual', 'cidade'].map(v => (
                                                        <button key={v} onClick={() => setEditingTemplate({...editingTemplate, footer_html: (editingTemplate.footer_html || '') + `{${v}}`})} className="px-2 py-1 bg-slate-100 rounded text-[8px] font-black text-slate-500 border border-slate-200 hover:bg-indigo-50">+{v}</button>
                                                    ))}
                                                </div>
                                            </div>
                                            <textarea rows={8} className="w-full bg-slate-900 text-emerald-400 font-mono text-xs p-8 rounded-3xl outline-none focus:ring-4 focus:ring-indigo-500/20 shadow-inner" value={editingTemplate.footer_html} onChange={e => setEditingTemplate({...editingTemplate, footer_html: e.target.value})} />
                                        </div>

                                        <div className="pt-8 border-t flex justify-between items-center">
                                            <div className="flex items-center gap-4">
                                                <label className="flex items-center gap-3 cursor-pointer group">
                                                    <input type="checkbox" className="w-6 h-6 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500" checked={!!editingTemplate.is_default} onChange={e => setEditingTemplate({...editingTemplate, is_default: e.target.checked ? 1 : 0})} />
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-indigo-600">Definir como Molde Padrão</span>
                                                </label>
                                            </div>
                                            <div className="flex gap-4">
                                                {editingTemplate.id && (
                                                    <button onClick={() => { if(confirm("Excluir molde permanente?")) visualTemplateService.delete(editingTemplate.id!).then(() => {setEditingTemplate(null); loadVisualTemplates();}); }} className="px-6 py-3 text-rose-500 font-black text-[10px] uppercase hover:bg-rose-50 rounded-xl transition-all border border-rose-100"><Trash size={16}/></button>
                                                )}
                                                <button onClick={handleSaveVisualTemplate} disabled={isSaving} className="px-10 py-4 bg-slate-900 text-white rounded-xl font-black text-[11px] uppercase tracking-widest shadow-xl flex items-center gap-3 active:scale-95 transition-all">
                                                    {isSaving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Commitar no Ledger
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center opacity-20 grayscale">
                                        <Layout size={100} className="mb-6"/>
                                        <p className="font-black uppercase text-sm tracking-[0.4em] text-center">Selecione ou crie um molde <br/> para configurar a identidade legal.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* FULLSCREEN EDITOR OVERLAY */}
            {isEditorOpen && activeDoc && (
                <div className="sie-editor-overlay fixed inset-0 z-[9999] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-0 md:p-4 animate-fade-in">
                    <div className="bg-white w-full h-full flex flex-col overflow-hidden shadow-2xl relative transition-all duration-300 md:rounded-[2rem] max-w-[1920px]">
                        
                        {/* EDITOR HEADER */}
                        <div className="h-20 px-8 bg-slate-900 text-white flex justify-between items-center shrink-0 z-50">
                            <div className="flex items-center gap-6">
                                <div className="p-3 bg-indigo-600 rounded-xl shadow-lg"><FileSignature size={20} /></div>
                                <input className="font-black text-lg uppercase bg-transparent border-none outline-none p-0 w-[400px] text-white focus:ring-0" value={activeDoc.title} onChange={e => setActiveDoc({ ...activeDoc, title: e.target.value })} placeholder="Título do Documento..." />
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={() => window.print()} className="p-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl transition-all" title="Imprimir"><Printer size={18} /></button>
                                <button onClick={handleExportPDF} className="p-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl transition-all" title="Baixar PDF SRE"><FileDown size={18} /></button>
                                <button onClick={handleSave} disabled={isSaving} className={`px-8 py-3 ${saveStatus === 'SUCCESS' ? 'bg-emerald-600' : 'bg-indigo-600 hover:bg-indigo-500'} text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 transition-all shadow-lg active:scale-95`}>
                                    {isSaving ? <Loader2 className="animate-spin" size={16} /> : saveStatus === 'SUCCESS' ? <CheckCircle2 size={16} /> : <Save size={16} />} Salvar Registro
                                </button>
                                <button onClick={() => { setIsEditorOpen(false); setActiveDoc(null); }} className="p-3 hover:bg-rose-500 text-slate-400 rounded-xl transition-all"><X size={24} /></button>
                            </div>
                        </div>

                        {/* WORKSPACE AREA */}
                        <div className="flex-1 flex overflow-hidden bg-[#eef1f5] relative">
                            
                            {/* CONFIG SIDEBAR (LEFT) */}
                            <div className="w-[450px] bg-white border-r border-slate-200 flex flex-col shrink-0 shadow-2xl z-30 overflow-hidden">
                                
                                {/* SECTION 1: VISUAL MOLD */}
                                <div className="p-8 border-b bg-slate-50/50 space-y-6 shrink-0">
                                    <h4 className="text-xs font-black uppercase text-slate-900 tracking-[0.2em] flex items-center gap-3"><Palette size={18} className="text-indigo-600" /> 1. Molde Visual</h4>
                                    <div className="grid grid-cols-1 gap-3 overflow-y-auto max-h-[250px] custom-scrollbar pr-2">
                                        {visualTemplates.map(tpl => (
                                            <button 
                                                key={tpl.id} 
                                                onClick={() => {
                                                    setSelectedVisualId(tpl.id);
                                                    if (editorRef.current) {
                                                        const bodyContent = document.getElementById('document-body-zone')?.innerHTML || '<p>O conteúdo aparecerá aqui...</p>';
                                                        editorRef.current.innerHTML = `
                                                            ${interpolateTemplate(tpl.header_html)}
                                                            <div id="document-body-zone" style="min-height: 400px; padding: 20px 0;">${bodyContent}</div>
                                                            ${interpolateTemplate(tpl.footer_html)}
                                                        `;
                                                    }
                                                }}
                                                className={`p-5 rounded-[1.5rem] text-left transition-all border-2 flex items-center justify-between group ${selectedVisualId === tpl.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl scale-[1.01]' : 'bg-white border-slate-100 text-slate-500 hover:border-indigo-400'}`}
                                            >
                                                <div>
                                                    <p className="text-xs font-black uppercase leading-none">{tpl.name}</p>
                                                    <p className={`text-[9px] mt-2 font-bold uppercase ${selectedVisualId === tpl.id ? 'text-indigo-200' : 'text-slate-400'}`}>{tpl.paper}</p>
                                                </div>
                                                <div className={`p-2 rounded-lg ${selectedVisualId === tpl.id ? 'bg-white/10' : 'bg-slate-50 group-hover:bg-indigo-50'} transition-all`}><Layout size={18}/></div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* INTERNAL TAB NAV */}
                                <div className="flex bg-slate-50 p-2 shrink-0 border-b">
                                    <button onClick={() => setShowHistory(false)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!showHistory ? 'bg-white text-indigo-600 shadow-md border border-indigo-100' : 'text-slate-400 hover:text-slate-600'}`}>Inteligência AI</button>
                                    <button onClick={() => setShowHistory(true)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${showHistory ? 'bg-white text-indigo-600 shadow-md border border-indigo-100' : 'text-slate-400 hover:text-slate-600'}`}>Versões ({docHistory.length})</button>
                                </div>

                                {/* DYNAMIC CONTENT (AI OR HISTORY) */}
                                <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                                    {!showHistory ? (
                                        <div className="p-8 space-y-8 animate-fade-in">
                                            <h4 className="text-xs font-black uppercase text-slate-900 tracking-[0.2em] flex items-center gap-3"><BrainCircuit size={18} className="text-indigo-600" /> 2. Inteligência de Escrita</h4>
                                            
                                            <div className="space-y-3">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Modelo Semântico</label>
                                                <select 
                                                    className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 font-black uppercase text-xs text-indigo-600 outline-none focus:bg-white transition-all shadow-inner appearance-none"
                                                    value={selectedPromptId}
                                                    onChange={e => setSelectedPromptId(e.target.value)}
                                                >
                                                    <option value="">LIVRE / CHAT APENAS</option>
                                                    {savedPrompts.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                                                </select>
                                            </div>

                                            <div className={`p-6 rounded-[2.5rem] border-2 border-dashed transition-all ${sessionAttachment ? 'bg-emerald-50 border-emerald-300' : 'bg-slate-50 border-slate-200 shadow-inner'}`}>
                                                <div className="flex justify-between items-center mb-4">
                                                    <span className="text-[9px] font-black uppercase text-slate-500 flex items-center gap-2"><Paperclip size={14} className="text-indigo-500"/> Anexo de Referência</span>
                                                    {sessionAttachment && <button onClick={() => {setSessionAttachment(''); setAttachmentName('');}} className="text-rose-600 hover:underline text-[9px] font-black uppercase">Limpar</button>}
                                                </div>
                                                {sessionAttachment ? (
                                                    <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-emerald-100">
                                                        {isAttachmentImage ? <ImageIcon size={24} className="text-emerald-600"/> : <FileText size={24} className="text-emerald-600"/>}
                                                        <p className="text-[10px] font-black text-emerald-800 truncate flex-1 uppercase tracking-tight">{attachmentName}</p>
                                                        <CheckCircle2 size={16} className="text-emerald-500"/>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => attachmentInputRef.current?.click()} className="w-full py-5 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center gap-3 shadow-sm group active:scale-95">
                                                        <UploadCloud size={18} className="group-hover:scale-110 transition-transform" /> Carregar Origem
                                                    </button>
                                                )}
                                            </div>

                                            <div className="space-y-3">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Instruções Ghostwriter</label>
                                                <textarea 
                                                    rows={6} 
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] p-8 text-sm font-medium uppercase leading-relaxed outline-none focus:bg-white focus:border-indigo-500 transition-all shadow-inner placeholder:text-slate-300" 
                                                    placeholder="Ex: Redija um ofício sobre manutenção de via... Use os dados do anexo." 
                                                    value={aiChatInput} 
                                                    onChange={e => setAiChatInput(e.target.value)} 
                                                />
                                            </div>

                                            <button 
                                                onClick={handleGenerate} 
                                                disabled={isGenerating || (!aiChatInput.trim() && !selectedPromptId)} 
                                                className="w-full py-6 bg-slate-950 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-indigo-600 flex items-center justify-center gap-4 shadow-2xl active:scale-95 transition-all group"
                                            >
                                                {isGenerating ? <Loader2 className="animate-spin" size={24} /> : <Sparkles size={24} className="text-amber-400 group-hover:rotate-12 transition-transform" />} 
                                                Gerar Conteúdo AI
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="p-8 space-y-4 animate-fade-in">
                                            <h4 className="text-xs font-black uppercase text-slate-900 tracking-[0.2em] flex items-center gap-3 mb-6"><History size={18} className="text-indigo-600" /> Cronologia do Registro</h4>
                                            {docHistory.map((version, vIdx) => (
                                                <button 
                                                    key={version.id} 
                                                    onClick={() => { if(confirm("Restaurar esta versão? Alterações não salvas serão perdidas.")) editorRef.current!.innerHTML = version.content; }}
                                                    className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[2rem] text-left hover:border-indigo-500 hover:bg-indigo-50/30 transition-all group"
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <span className="text-[8px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">Snapshot #{docHistory.length - vIdx}</span>
                                                        <RotateCcw size={14} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                                                    </div>
                                                    <p className="text-[10px] font-black text-slate-800 uppercase leading-none">Ponto de Restauração</p>
                                                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-2">{new Date(version.created_at).toLocaleString()}</p>
                                                </button>
                                            ))}
                                            {docHistory.length === 0 && (
                                                <div className="py-20 text-center opacity-20">
                                                    <History size={48} className="mx-auto mb-4"/>
                                                    <p className="text-[10px] font-black uppercase tracking-widest">Sem versões anteriores.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* EDITOR CANVAS (RIGHT) */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-12 flex flex-col items-center">
                                
                                {/* FLOATING TOOLBAR */}
                                <div className="bg-white/90 backdrop-blur-xl px-8 py-3 rounded-2xl shadow-2xl border border-white/20 mb-12 flex items-center gap-6 print-hidden sticky top-0 z-40 transition-all hover:scale-[1.02]">
                                    <div className="flex items-center gap-2 border-r border-slate-100 pr-6">
                                        <button onClick={() => setZoomLevel(z => Math.max(50, z - 10))} className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><Minus size={16}/></button>
                                        <span className="text-[11px] font-black w-12 text-center text-slate-800">{zoomLevel}%</span>
                                        <button onClick={() => setZoomLevel(z => Math.min(200, z + 10))} className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><PlusIcon size={16}/></button>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => document.execCommand('bold')} className="p-3 hover:bg-slate-100 rounded-xl transition-all" title="Negrito"><Bold size={18}/></button>
                                        <button onClick={() => document.execCommand('italic')} className="p-3 hover:bg-slate-100 rounded-xl transition-all" title="Itálico"><Italic size={18}/></button>
                                        <button onClick={() => document.execCommand('underline')} className="p-3 hover:bg-slate-100 rounded-xl transition-all" title="Sublinhado"><Underline size={18}/></button>
                                    </div>
                                    <div className="flex items-center gap-2 border-l border-slate-100 pl-6">
                                        <button onClick={() => document.execCommand('justifyLeft')} className="p-3 hover:bg-slate-100 rounded-xl transition-all"><AlignLeft size={18}/></button>
                                        <button onClick={() => document.execCommand('justifyCenter')} className="p-3 hover:bg-slate-100 rounded-xl transition-all"><AlignCenter size={18}/></button>
                                        <button onClick={() => document.execCommand('justifyFull')} className="p-3 hover:bg-slate-100 rounded-xl transition-all"><AlignJustify size={18}/></button>
                                    </div>
                                </div>

                                <div 
                                    id="printable-canvas" 
                                    className="relative transition-all duration-300 origin-top shadow-[0_40px_100px_rgba(0,0,0,0.12)] bg-white border border-slate-200"
                                    style={{ 
                                        transform: `scale(${zoomLevel / 100})`,
                                        width: `${activeConfig.widthCm}cm`,
                                        minHeight: `${activeConfig.heightCm}cm`,
                                        padding: `${currentVisual?.margins?.top || 2}cm ${currentVisual?.margins?.right || 2}cm ${currentVisual?.margins?.bottom || 2}cm ${currentVisual?.margins?.left || 2.5}cm`,
                                        backgroundImage: `linear-gradient(to bottom, transparent 0, transparent ${activeConfig.heightCm}cm, #cbd5e1 ${activeConfig.heightCm}cm, #cbd5e1 ${activeConfig.heightCm + 1.0}cm)`,
                                        backgroundSize: `100% ${activeConfig.heightCm + 1.0}cm`
                                    }}
                                >
                                    <div 
                                        ref={editorRef} 
                                        contentEditable
                                        suppressContentEditableWarning 
                                        onInput={updateStats} 
                                        className="outline-none cursor-text text-slate-950 overflow-visible min-h-full"
                                        style={{
                                            fontFamily: '"Times New Roman", Times, serif',
                                            fontSize: '12pt',
                                            lineHeight: '1.6',
                                            textAlign: 'justify'
                                        }} 
                                    />

                                    {Array.from({ length: stats.pages }).map((_, i) => (
                                        <div key={i} className="absolute right-[-80px] text-[10px] font-black text-slate-400 bg-white/50 border border-slate-100 px-3 py-1.5 rounded-xl shadow-sm print-hidden" style={{ top: `${(activeConfig.heightCm + 1.0) * i + 1}cm` }}>PÁGINA {i + 1}</div>
                                    ))}
                                </div>

                                <div className="h-40 shrink-0 print-hidden" />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                [contenteditable] p { margin-bottom: 14pt; }
                [contenteditable] h1, [contenteditable] h2 { text-align: center; font-weight: 900; margin: 24pt 0; text-transform: uppercase; letter-spacing: -0.5px; }
                [contenteditable] table { width: 100%; border-collapse: collapse; margin: 18pt 0; }
                [contenteditable] th, [contenteditable] td { border: 1px solid #ddd; padding: 10pt; font-size: 11pt; }
                
                @media print {
                    @page { size: ${currentVisual?.paper || 'A4'} portrait; margin: 0; }
                    body { background: white !important; margin: 0 !important; }
                    #root, main, .sidebar-glass, header, button, .print-hidden, .sie-editor-overlay > div:not(#printable-canvas) { 
                        display: none !important; 
                        visibility: hidden !important;
                    }
                    .sie-editor-overlay { 
                        position: absolute !important; 
                        top: 0 !important; 
                        left: 0 !important; 
                        width: 100% !important; 
                        height: auto !important; 
                        background: white !important; 
                        display: block !important;
                    }
                    #printable-canvas { 
                        position: absolute !important; 
                        top: 0 !important; 
                        left: 0 !important; 
                        width: ${activeConfig.widthCm}cm !important; 
                        padding: ${currentVisual?.margins?.top || 2}cm ${currentVisual?.margins?.right || 2}cm ${currentVisual?.margins?.bottom || 2}cm ${currentVisual?.margins?.left || 2.5}cm !important;
                        box-shadow: none !important; 
                        border: none !important;
                        transform: none !important;
                        visibility: visible !important;
                        background: white !important;
                    }
                    #printable-canvas * { visibility: visible !important; }
                }
            `}</style>
        </div>
    );
};

export default DocumentHub;