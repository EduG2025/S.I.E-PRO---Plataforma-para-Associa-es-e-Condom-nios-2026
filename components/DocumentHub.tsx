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
    Clock, ToggleRight, ToggleLeft
} from 'lucide-react';

// [SIE: INICIO DA ATUALIZAÇÃO] - Interface atualizada para suportar margens estritas do PATCH
interface VisualTemplate {
    id: number;
    name: string;
    paper: string;
    margins: { top: number; right: number; bottom: number; left: number } | any;
    header_html: string;
    footer_html: string;
    is_default: number;
}
// [SIE: FIM DA ATUALIZAÇÃO]

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
 * S.I.E DocumentHub PRO V27.5 (Unified with SRE Paging Engine V4.5)
 * Protocolo SRE: Gestão Cronológica, Visual Documental Soberana e Paginação Física
 */
const DocumentHub = ({ systemInfo, currentUser, onNavigate, sidebarCollapsed }: { systemInfo: SystemInfo, currentUser: User | null, onNavigate?: (tab: string) => void, sidebarCollapsed?: boolean }) => {
    const [documents, setDocuments] = useState<OfficialDocument[]>([]);
    const [visualTemplates, setVisualTemplates] = useState<VisualTemplate[]>([]);
    const [activeDoc, setActiveDoc] = useState<OfficialDocument | null>(null);
    const [docStatus, setDocStatus] = useState<DocStatus>('DRAFT');
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    
    // [SIE: ADICIONADO] Preservado do BASE para gestão de templates
    const [isTemplateManagerOpen, setIsTemplateManagerOpen] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<Partial<VisualTemplate> | null>(null);

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

    const editorRef = useRef<HTMLDivElement>(null);
    const attachmentInputRef = useRef<HTMLInputElement>(null);
    const [zoomLevel, setZoomLevel] = useState(100);
    const [stats, setStats] = useState({ words: 0, chars: 0, pages: 1 });
    const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SAVING' | 'SUCCESS'>('IDLE');

    // [SIE: INICIO DA ATUALIZAÇÃO] - Estados de Configuração de Paginação SRE V4.5
    const [repeatHeader, setRepeatHeader] = useState(true);
    const [repeatFooter, setRepeatFooter] = useState(true);
    const primaryColor = systemInfo.primaryColor || '#4f46e5';
    // [SIE: FIM DA ATUALIZAÇÃO]

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

    // [SIE: INICIO DA ATUALIZAÇÃO] - Lógica de stats atualizada para considerar repetição de cabeçalho
    const updateStats = useCallback(() => {
        if (editorRef.current) {
            const text = editorRef.current.innerText || '';
            const visual = visualTemplates.find(v => v.id === selectedVisualId);
            const config = PAPER_SIZES[visual?.paper || 'A4'] || PAPER_SIZES['A4'];
            const pageHeightPx = config.heightCm * 37.8; 
            const totalHeight = editorRef.current.scrollHeight;
            // Fatores de ajuste baseados na presença de Header/Footer repetidos
            const usefulFactor = (repeatHeader && repeatFooter) ? 0.78 : (!repeatHeader && !repeatFooter) ? 0.94 : 0.86;
            const estPages = Math.max(1, Math.ceil(totalHeight / (pageHeightPx * usefulFactor)));
            setStats({ words: text.split(/\s+/).filter(w => w.length > 0).length, chars: text.length, pages: estPages });
        }
    }, [selectedVisualId, visualTemplates, repeatHeader, repeatFooter]);
    // [SIE: FIM DA ATUALIZAÇÃO]

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

            // [SIE: INICIO DA ATUALIZAÇÃO] - Uso de appendChild (PATCH) em vez de innerHTML (BASE) para ser aditivo
            if (res.data?.text) {
                if (editorRef.current) {
                    const zone = document.createElement('div');
                    zone.innerHTML = res.data.text;
                    editorRef.current.appendChild(zone);
                    updateStats();
                } else {
                     // Fallback para caso o editor ainda não esteja montado (improvável neste fluxo)
                    const bodyEl = document.getElementById('document-body-zone');
                    if (bodyEl) bodyEl.innerHTML += res.data.text;
                }
                setAiChatInput('');
                setSessionAttachment('');
                setAttachmentName('');
            }
            // [SIE: FIM DA ATUALIZAÇÃO]
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

    // [SIE: ADICIONADO] Mantido do BASE para funcionalidade do Modal de Templates
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
        if (!doc) {
            setActiveDoc({ id: `temp_${Date.now()}`, title: 'NOVO DOCUMENTO', content: '', type: 'OFICIO', status: 'DRAFT', created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
            setDocStatus('DRAFT');
        } else {
            setActiveDoc(doc);
            setDocStatus(doc.status as DocStatus);
            if (!String(doc.id).startsWith('temp_')) loadHistory(doc.id);
        }
        
        setIsEditorOpen(true);
        setZoomLevel(100);
        setShowHistory(false);

        setTimeout(() => {
            if (editorRef.current && doc) {
                editorRef.current.innerHTML = doc.content;
                updateStats();
            }
        }, 100);
    };

    const handleFormat = (command: string, value?: string) => {
        document.execCommand(command, false, value);
    };

    // [SIE: INICIO DA ATUALIZAÇÃO] - SRE PAGING ENGINE V4.5 (Lógica de Exportação do PATCH)
    const preparePagedDOMForExport = () => {
        if (!editorRef.current || !selectedVisualId) return null;
        
        const visual = visualTemplates.find(v => v.id === selectedVisualId);
        const paperConfig = PAPER_SIZES[visual?.paper || 'A4'] || PAPER_SIZES['A4'];
        
        const exportContainer = document.createElement('div');
        exportContainer.className = "paged-export-root";
        exportContainer.style.width = `${paperConfig.widthCm}cm`;

        const headerHtml = interpolateTemplate(visual?.header_html || '');
        const footerHtml = interpolateTemplate(visual?.footer_html || '');

        const nodes = Array.from(editorRef.current.childNodes) as HTMLElement[];
        
        let currentPageIndex = 1;
        let currentPage = createPhysicalPage(paperConfig, headerHtml, footerHtml);
        let currentContentArea = currentPage.querySelector('.content-area') as HTMLElement;
        exportContainer.appendChild(currentPage);

        let maxHeight = paperConfig.heightCm * 37.8 * 0.76; 

        nodes.forEach((node) => {
            const clone = node.cloneNode(true) as HTMLElement;
            currentContentArea.appendChild(clone);

            if (currentContentArea.scrollHeight > maxHeight) {
                currentContentArea.removeChild(clone);
                currentPageIndex++;
                
                const hToInject = repeatHeader ? headerHtml : "";
                const fToInject = repeatFooter ? footerHtml : "";
                
                currentPage = createPhysicalPage(paperConfig, hToInject, fToInject);
                currentContentArea = currentPage.querySelector('.content-area') as HTMLElement;
                
                const paddingFactor = (!repeatHeader && !repeatFooter) ? 0.95 : (repeatHeader ? 0.85 : 0.92);
                maxHeight = paperConfig.heightCm * 37.8 * paddingFactor;

                currentContentArea.appendChild(clone);
                exportContainer.appendChild(currentPage);
            }
        });

        return exportContainer;
    };

    const createPhysicalPage = (config: any, header: string, footer: string) => {
        const page = document.createElement('div');
        page.className = "pdf-physical-page";
        page.style.width = `${config.widthCm}cm`;
        page.style.height = `${config.heightCm}cm`;
        page.style.backgroundColor = "white";
        page.style.display = "flex";
        page.style.flexDirection = "column";
        page.style.position = "relative";
        page.style.overflow = "hidden";
        page.style.pageBreakAfter = "always";
        page.style.boxSizing = "border-box";

        page.innerHTML = `
            ${header ? `<div class="page-header" style="flex-shrink: 0; width: 100%;">${header}</div>` : ''}
            <div class="content-area" style="flex-grow: 1; padding: ${header ? '1cm' : '2cm'} 2.5cm ${footer ? '1cm' : '2cm'}; overflow: hidden; font-family: 'Times New Roman', serif; text-transform: uppercase; font-size: 11pt; line-height: 1.6; text-align: justify; word-break: break-word;"></div>
            ${footer ? `<div class="page-footer" style="flex-shrink: 0; width: 100%;">${footer}</div>` : ''}
        `;
        return page;
    };

    const handleExportPDF = async () => {
        const exportDOM = preparePagedDOMForExport();
        if (!exportDOM) return;
        const hiddenWrapper = document.createElement('div');
        hiddenWrapper.style.position = 'fixed';
        hiddenWrapper.style.left = '-9999px';
        hiddenWrapper.appendChild(exportDOM);
        document.body.appendChild(hiddenWrapper);

        const visual = visualTemplates.find(v => v.id === selectedVisualId);
        const opt = {
            margin: 0,
            filename: `${activeDoc?.title || 'documento'}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 3, useCORS: true, logging: false },
            jsPDF: { unit: 'cm', format: visual?.paper.toLowerCase() || 'a4', orientation: 'portrait', compress: true }
        };

        try {
            // @ts-ignore
            await window.html2pdf().set(opt).from(exportDOM).save();
        } finally { document.body.removeChild(hiddenWrapper); }
    };
    // [SIE: FIM DA ATUALIZAÇÃO]

    const currentVisual = visualTemplates.find(v => v.id === selectedVisualId) || visualTemplates[0];
    const activeConfig = PAPER_SIZES[currentVisual?.paper || 'A4'] || PAPER_SIZES['A4'];

    return (
        <div className="h-full flex flex-col gap-6 animate-fade-in relative bg-slate-50">
            <input type="file" ref={attachmentInputRef} className="hidden" onChange={handleAttachment} accept="image/*,.txt,.md,.pdf" />

            {/* HUB HEADER - Atualizado com Estilo PATCH e PrimaryColor */}
            <header className="bg-slate-900 p-8 rounded-[3rem] shadow-xl text-white shrink-0 overflow-hidden relative flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="flex items-center gap-6 relative z-10">
                    <div className="p-4 bg-indigo-600 rounded-2xl shadow-lg" style={{ backgroundColor: primaryColor }}><FileSignature size={28} /></div>
                    <div>
                        <h2 className="text-2xl font-black tracking-tighter uppercase leading-none">Hub de Documentos</h2>
                        <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mt-2">SRE Repositório & Paging V4.5</p>
                    </div>
                </div>
                <div className="flex gap-4 relative z-10">
                    <button onClick={() => setIsTemplateManagerOpen(true)} className="px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl font-black text-[9px] uppercase tracking-widest transition-all flex items-center gap-2 active:scale-95">
                        <Palette size={16}/> Moldes Visuais
                    </button>
                    {canManage && (
                        <button onClick={() => handleOpenEditor(null)} className="px-10 py-4 bg-indigo-600 hover:bg-indigo-50 text-white rounded-xl font-black text-[11px] uppercase tracking-widest shadow-2xl flex items-center gap-3 transition-all active:scale-95" style={{ backgroundColor: primaryColor }}>
                            <Plus size={20} /> Redigir Protocolo
                        </button>
                    )}
                </div>
            </header>

            {/* DOCUMENT GRID - Estilo PATCH */}
            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm flex flex-1 overflow-hidden mx-2 mb-2 flex-col">
                <div className="p-8 border-b bg-slate-50/30 flex justify-between items-center shrink-0">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input type="text" placeholder="Filtrar base documental..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-[11px] font-black uppercase focus:border-indigo-500 shadow-inner" />
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{documents.length} Arquivos no Ledger</span>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                    {isLoading ? <div className="p-20 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={40} style={{ color: primaryColor }} /></div> : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-10">
                            {documents.filter(d => (d.title || '').toLowerCase().includes(searchTerm.toLowerCase())).map(doc => (
                                <div key={doc.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="p-3 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all"><FileText size={24} /></div>
                                            <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase border shadow-sm ${STATUS_LABELS[doc.status as DocStatus]?.color || 'bg-slate-50 text-slate-400'}`}>
                                                {STATUS_LABELS[doc.status as DocStatus]?.label}
                                            </span>
                                        </div>
                                        <h3 className="text-base font-black text-slate-800 uppercase tracking-tight mb-2 leading-tight">{doc.title || "Sem Título"}</h3>
                                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                                            <Clock size={12}/> {new Date(doc.updated_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="mt-8 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                        <button onClick={() => handleOpenEditor(doc)} className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 rounded-xl shadow-sm"><Edit2 size={16}/></button>
                                        <button onClick={(e) => { e.stopPropagation(); if (confirm("Remover permanentemente?")) documentService.delete(doc.id).then(loadDocuments); }} className="p-3 bg-white border border-slate-200 text-slate-300 hover:text-rose-600 rounded-xl shadow-sm"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            ))}
                            {documents.length === 0 && (
                                <div className="col-span-full py-40 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                                    <FileEdit size={64} className="mx-auto text-slate-200 mb-6 opacity-20"/>
                                    <p className="font-black uppercase text-[10px] text-slate-400 tracking-[0.4em]">Repositório Vazio.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* [SIE: ADICIONADO] TEMPLATE MANAGER MODAL (Preservado INTEGRALMENTE do BASE) */}
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

            {/* [SIE: INICIO DA ATUALIZAÇÃO] - NOVO LAYOUT DO EDITOR (Baseado no PATCH com integração de Histórico do BASE) */}
            {isEditorOpen && activeDoc && (
                <div className="sie-editor-overlay fixed inset-0 z-[9999] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-0 md:p-4 animate-fade-in">
                    <div className="bg-white w-full h-full flex flex-col overflow-hidden shadow-2xl relative transition-all duration-300 md:rounded-[2rem] max-w-[1920px]">
                        <div className="h-20 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 shadow-2xl relative z-30 border-b border-white/5">
                            <div className="flex items-center gap-5">
                                <div className="p-3 bg-indigo-600 rounded-xl"><FileEdit size={20}/></div>
                                <div>
                                    <input className="bg-transparent font-black text-lg uppercase tracking-tight outline-none w-80 focus:border-b border-white/20" value={activeDoc.title} onChange={e => setActiveDoc({...activeDoc, title: e.target.value.toUpperCase()})} />
                                    <p className="text-[9px] text-indigo-400 font-black uppercase tracking-widest mt-0.5">SRE Ghostwriter Live Paging</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button onClick={handleExportPDF} className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10" title="Exportar PDF"><Download size={18}/></button>
                                <select className="bg-white/10 border border-white/10 rounded-lg px-4 py-2 text-[10px] font-black uppercase outline-none" value={docStatus} onChange={e => setDocStatus(e.target.value as DocStatus)}>
                                    {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k} className="text-slate-900">{v.label}</option>)}
                                </select>
                                <button onClick={handleSave} disabled={isSaving} className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2">
                                    {isSaving ? <Loader2 size={14} className="animate-spin"/> : <Save size={14}/>} {saveStatus === 'SUCCESS' ? 'SINCRONIZADO' : 'COMMITAR'}
                                </button>
                                <button onClick={() => setIsEditorOpen(false)} className="p-3 hover:bg-rose-500 text-slate-400 rounded-xl ml-2"><X size={24}/></button>
                            </div>
                        </div>

                        <div className="flex-1 flex overflow-hidden bg-slate-100">
                            {/* Toolbar & AI Side (Esquerda - Padrão PATCH) */}
                            <div className="w-[450px] border-r bg-white flex flex-col shrink-0 overflow-y-auto custom-scrollbar z-20 shadow-xl">
                                {/* Navegação Interna do Sidebar (Restaurada do BASE) */}
                                <div className="flex bg-slate-50 p-2 shrink-0 border-b sticky top-0 z-50">
                                    <button onClick={() => setShowHistory(false)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!showHistory ? 'bg-white text-indigo-600 shadow-md border border-indigo-100' : 'text-slate-400 hover:text-slate-600'}`}>Inteligência AI</button>
                                    <button onClick={() => setShowHistory(true)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${showHistory ? 'bg-white text-indigo-600 shadow-md border border-indigo-100' : 'text-slate-400 hover:text-slate-600'}`}>Versões ({docHistory.length})</button>
                                </div>

                                <div className="p-8 space-y-10">
                                    {!showHistory ? (
                                        <>
                                            <div className="space-y-6">
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Sparkles size={14} className="text-indigo-600"/> Assistente Neural</h4>
                                                <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-200 space-y-4">
                                                    <div className="space-y-2">
                                                         <select className="w-full h-12 bg-white border border-slate-200 rounded-xl px-4 text-[10px] font-black uppercase outline-none" value={selectedPromptId} onChange={e => setSelectedPromptId(e.target.value)}>
                                                            <option value="">Chat Livre</option>
                                                            {savedPrompts.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                                                        </select>
                                                    </div>
                                                    <textarea rows={4} className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-xs font-medium uppercase outline-none focus:border-indigo-500" placeholder="Instrua a IA..." value={aiChatInput} onChange={e => setAiChatInput(e.target.value)} />
                                                    <div className="flex gap-2">
                                                        <button onClick={() => attachmentInputRef.current?.click()} className={`flex-1 py-3 border rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2 transition-all ${sessionAttachment ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'}`}>
                                                            <Paperclip size={14}/> {attachmentName ? attachmentName.slice(0, 10) + '...' : 'Anexar Base'}
                                                        </button>
                                                        <input type="file" ref={attachmentInputRef} className="hidden" onChange={handleAttachment} />
                                                        <button onClick={handleGenerate} disabled={isGenerating} className="flex-[1.5] py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase shadow-lg hover:bg-indigo-600 transition-all flex items-center justify-center gap-2">
                                                            {isGenerating ? <Loader2 size={14} className="animate-spin"/> : <BrainCircuit size={14}/>} Gerar Estrutura
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Settings2 size={14}/> Config. de Impressão (SRE)</h4>
                                                <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-200 space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-black uppercase text-slate-500">Repetir Cabeçalho</span>
                                                        <button onClick={() => { setRepeatHeader(!repeatHeader); setTimeout(updateStats, 100); }} className={`transition-all ${repeatHeader ? 'text-indigo-600' : 'text-slate-300'}`}>
                                                            {repeatHeader ? <ToggleRight size={32}/> : <ToggleLeft size={32}/>}
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-black uppercase text-slate-500">Repetir Rodapé</span>
                                                        <button onClick={() => { setRepeatFooter(!repeatFooter); setTimeout(updateStats, 100); }} className={`transition-all ${repeatFooter ? 'text-indigo-600' : 'text-slate-300'}`}>
                                                            {repeatFooter ? <ToggleRight size={32}/> : <ToggleLeft size={32}/>}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><FileEdit size={14}/> Editor Tático</h4>
                                                <div className="grid grid-cols-5 gap-2">
                                                    <button onClick={() => handleFormat('bold')} className="p-3 bg-slate-50 rounded-lg hover:bg-indigo-50"><Bold size={16}/></button>
                                                    <button onClick={() => handleFormat('italic')} className="p-3 bg-slate-50 rounded-lg hover:bg-indigo-50"><Italic size={16}/></button>
                                                    <button onClick={() => handleFormat('underline')} className="p-3 bg-slate-50 rounded-lg hover:bg-indigo-50"><Underline size={16}/></button>
                                                    <button onClick={() => handleFormat('justifyCenter')} className="p-3 bg-slate-50 rounded-lg hover:bg-indigo-50"><AlignCenter size={16}/></button>
                                                    <button onClick={() => handleFormat('justifyFull')} className="p-3 bg-slate-50 rounded-lg hover:bg-indigo-50"><AlignJustify size={16}/></button>
                                                </div>
                                            </div>

                                            <div className="space-y-6">
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Layout size={14}/> Aparência & Papel</h4>
                                                <div className="grid grid-cols-1 gap-3">
                                                    {visualTemplates.map(tpl => (
                                                        <button key={tpl.id} onClick={() => setSelectedVisualId(tpl.id)} className={`p-4 rounded-2xl border text-left transition-all ${selectedVisualId === tpl.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-indigo-200'}`}>
                                                            <p className="text-[10px] font-black uppercase">{tpl.name}</p>
                                                            <p className="text-[8px] font-bold mt-1 opacity-60">{tpl.paper}</p>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="space-y-4 animate-fade-in">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><History size={14}/> Cronologia do Registro</h4>
                                            {docHistory.map((version, vIdx) => (
                                                <button 
                                                    key={version.id} 
                                                    onClick={() => { if(confirm("Restaurar esta versão? Alterações não salvas serão perdidas.")) { if(editorRef.current) editorRef.current.innerHTML = version.content; updateStats(); } }}
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

                            {/* Canvas Zone (Direita - Padrão PATCH com Visual Paging) */}
                            <div className="flex-1 overflow-y-auto bg-slate-200 p-10 flex flex-col items-center custom-scrollbar relative">
                                <div className="sticky top-0 right-0 w-full flex justify-end z-50 mb-6 print-hidden">
                                    <div className="flex bg-white/80 backdrop-blur-md p-1 rounded-xl shadow-lg border border-white/20">
                                        <button onClick={() => setZoomLevel(Math.max(30, zoomLevel - 10))} className="p-2 hover:bg-slate-100 rounded-lg"><ZoomOut size={16}/></button>
                                        <span className="px-4 flex items-center text-[10px] font-black text-slate-600">{zoomLevel}%</span>
                                        <button onClick={() => setZoomLevel(Math.min(150, zoomLevel + 10))} className="p-2 hover:bg-slate-100 rounded-lg"><ZoomIn size={16}/></button>
                                    </div>
                                </div>

                                <div className="relative transition-all duration-300 origin-top flex flex-col gap-10" style={{ transform: `scale(${zoomLevel / 100})` }}>
                                    {/* Lógica de Renderização Visual de Páginas do PATCH */}
                                    {Array.from({ length: stats.pages }).map((_, i) => {
                                        const isFirst = i === 0;
                                        const showH = isFirst || repeatHeader;
                                        const showF = isFirst || repeatFooter;
                                        const paperW = PAPER_SIZES[visualTemplates.find(v => v.id === selectedVisualId)?.paper || 'A4']?.widthCm || 21;
                                        const paperH = PAPER_SIZES[visualTemplates.find(v => v.id === selectedVisualId)?.paper || 'A4']?.heightCm || 29.7;
                                        
                                        return (
                                            <div key={i} className="bg-white shadow-[0_40px_100px_rgba(0,0,0,0.1)] relative" style={{ width: `${paperW}cm`, height: `${paperH}cm` }}>
                                                {showH && <header className="pointer-events-none" dangerouslySetInnerHTML={{ __html: interpolateTemplate(visualTemplates.find(v => v.id === selectedVisualId)?.header_html || '') }} />}
                                                {isFirst && (
                                                    <div 
                                                        id="document-body-zone"
                                                        ref={editorRef}
                                                        contentEditable
                                                        suppressContentEditableWarning
                                                        className="absolute inset-0 px-20 outline-none text-slate-800 text-[11pt] font-medium leading-[1.6] uppercase text-justify"
                                                        onInput={updateStats}
                                                        style={{ 
                                                            fontFamily: "'Times New Roman', serif", 
                                                            height: 'auto', 
                                                            minHeight: '100%', 
                                                            paddingTop: showH ? '4cm' : '2cm',
                                                            paddingBottom: showF ? '4cm' : '2cm',
                                                            // Stacking Context Trick para permitir edição contínua sobre múltiplas páginas visuais
                                                            overflow: 'visible'
                                                        }}
                                                    />
                                                )}
                                                {showF && <footer className="absolute bottom-0 left-0 w-full pointer-events-none" dangerouslySetInnerHTML={{ __html: interpolateTemplate(visualTemplates.find(v => v.id === selectedVisualId)?.footer_html || '') }} />}
                                                <div className="absolute right-[-80px] top-4 text-[9px] font-black text-slate-300 bg-slate-50 px-2 py-1 rounded print-hidden">PÁGINA {i+1}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="h-20 shrink-0" />
                            </div>
                        </div>

                        <div className="h-14 px-10 bg-white border-t border-slate-200 flex justify-between items-center shrink-0 shadow-inner">
                            <div className="flex gap-6">
                                <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-indigo-600 rounded-full"/> <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stats.words} PALAVRAS</span></div>
                                <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-indigo-600 rounded-full"/> <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{stats.pages} PÁGINAS ESTIMADAS</span></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* [SIE: FIM DA ATUALIZAÇÃO] */}

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
                    /* SRE Export Hide Logic */
                }
            `}</style>
        </div>
    );
};

export default DocumentHub;