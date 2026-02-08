
import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { OfficialDocument, SystemInfo, User, DocumentVersion, DocStatus, DualDesignSystem } from '../types';
import { documentService, aiService, api, visualTemplateService, storageService } from '../services/api';
import {
    FileText, Search, Plus, Sparkles, Save, Trash2, Edit2,
    Loader2, X, Bold, Italic, Underline, AlignCenter,
    AlignJustify, AlignLeft, AlignRight, Undo2, Redo2, Eraser,
    FileSignature, Palette, Download, Clock, BrainCircuit,
    Paperclip, FileEdit, Settings2, ToggleRight, ToggleLeft,
    ZoomIn, ZoomOut, Image as ImageIcon, Wand2, Zap,
    CheckCircle2, LayoutGrid, TypeOutline, Stamp, UserCog,
    Ghost, AlertCircle, Table as TableIcon, Braces, Printer, Upload, ScanLine,
    LayoutTemplate, Eye, RefreshCw, Copy, Maximize, Minimize,
    Layout, MoveUp, MoveDown, Code, Smartphone, Monitor, Settings,
    Building2, Layers, Type, Building,
    List, ListOrdered, Indent, Outdent, Highlighter, Baseline, Subscript, Superscript,
    PenTool, BookOpen, Quote
} from 'lucide-react';

// --- Interfaces ---

interface VisualTemplate {
    id: number;
    name: string;
    header_html: string;
    footer_html: string;
    is_default: number;
}

interface PageConfig {
    mode: 'PAGES' | 'PAGRELESS';
    applyTo: 'ALL' | 'SECTION';
    orientation: 'PORTRAIT' | 'LANDSCAPE';
    paperSize: 'A4' | 'LETTER' | 'CUSTOM';
    customWidth: number;
    customHeight: number;
    pageColor: string;
    margins: {
        top: number;
        bottom: number;
        left: number;
        right: number;
    };
}

interface WatermarkConfig {
    enabled: boolean;
    type: 'TEXT' | 'IMAGE';
    text: string;
    imageUrl: string;
    opacity: number;
    rotation: number;
    fontSize: number; 
    scale: number;    
    color: string;
}

interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
}

interface DocumentHubProps {
    systemInfo: SystemInfo;
    currentUser: User | null;
    sidebarCollapsed?: boolean;
    onNavigate?: (tab: string) => void;
    permissions?: string[];
    t?: (term: string) => string;
    designSystem?: DualDesignSystem | null;
}

// --- Constants ---

const PAPER_SIZES: Record<string, { name: string; widthCm: number; heightCm: number; }> = {
    A4: { name: 'A4 (21 cm x 29,7 cm)', widthCm: 21.0, heightCm: 29.7 },
    LETTER: { name: 'Carta (21,6 cm x 27,9 cm)', widthCm: 21.59, heightCm: 27.94 },
    LEGAL: { name: 'Ofício (21,6 cm x 35,6 cm)', widthCm: 21.59, heightCm: 35.56 }
};

const FONT_FAMILIES = [
    { label: 'Arial', value: 'Arial, sans-serif' },
    { label: 'Times New Roman', value: '"Times New Roman", serif' },
    { label: 'Inter', value: '"Inter", sans-serif' },
    { label: 'Georgia', value: 'Georgia, serif' },
    { label: 'Courier New', value: '"Courier New", monospace' }
];

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72];

const STATUS_LABELS: Record<DocStatus, { label: string; color: string }> = {
    DRAFT: { label: 'Rascunho', color: 'bg-slate-100 text-slate-600' },
    REVIEW: { label: 'Revisão', color: 'bg-amber-50 text-amber-600' },
    APPROVED: { label: 'Aprovado', color: 'bg-emerald-50 text-emerald-600' },
    SIGNED: { label: 'Assinado', color: 'bg-indigo-50 text-indigo-600' },
    SENT: { label: 'Enviado', color: 'bg-blue-50 text-blue-600' },
    ARCHIVED: { label: 'Arquivado', color: 'bg-slate-200 text-slate-500' }
};

// --- Sub-components ---

const GhostwriterModal = memo(({ isOpen, onClose, onInsert, systemInfo }: any) => {
    const [prompt, setPrompt] = useState('');
    const [type, setType] = useState('OFÍCIO');
    const [tone, setTone] = useState('FORMAL');
    const [isGenerating, setIsGenerating] = useState(false);
    const [result, setResult] = useState('');

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setIsGenerating(true);
        try {
            const systemPrompt = `Você é o Ghostwriter Administrativo Senior do sistema S.I.E PRO. 
            OBJETIVO: Redigir um(a) ${type} com tom ${tone}.
            ENTIDADE: ${systemInfo.name}. SIGLA: ${systemInfo.shortName}. PRESIDENTE: ${systemInfo.president_name}.
            
            DIRETRIZES:
            1. Estruture o documento com cabeçalho interno (se necessário), local e data, vocativo, corpo do texto e fecho.
            2. Use HTML semântico (<p>, <strong>, <ul>).
            3. Não inclua estilos CSS em linha complexos, apenas estrutura limpa.
            4. Responda APENAS com o código HTML do documento.`;

            const res = await api.post('/ai/generate-document', { prompt: `${systemPrompt}\n\nINSTRUÇÃO DO USUÁRIO: ${prompt}` });
            setResult(res.data.text);
        } catch (e) {
            alert("Erro na geração neural.");
        } finally {
            setIsGenerating(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10010] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white w-full max-w-5xl h-[85vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden border border-white/10 animate-scale-in">
                <div className="h-20 px-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-fuchsia-600 rounded-xl shadow-lg animate-pulse">
                            <PenTool size={20} className="text-white" />
                        </div>
                        <div>
                            <h3 className="font-black text-xl uppercase tracking-tighter leading-none">Ghostwriter Neural</h3>
                            <p className="text-fuchsia-400 text-[9px] font-black uppercase tracking-widest mt-1">SRE Editorial Assistant V7.0</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-rose-500 rounded-xl transition-all border border-white/5"><X size={24} /></button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Painel de Configuração */}
                    <div className="w-80 border-r border-slate-200 p-8 flex flex-col gap-8 bg-slate-50/50">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Tipo de Documento</label>
                            <div className="grid grid-cols-1 gap-2">
                                {['OFÍCIO', 'ATA', 'EDITAL', 'CIRCULAR', 'NOTIFICAÇÃO'].map(t => (
                                    <button key={t} onClick={() => setType(t)} className={`py-3 px-4 rounded-xl text-[10px] font-black uppercase text-left transition-all border ${type === t ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300'}`}>
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Tom de Voz</label>
                            <div className="grid grid-cols-1 gap-2">
                                {['FORMAL', 'JURÍDICO', 'AMIGÁVEL', 'URGENTE'].map(t => (
                                    <button key={t} onClick={() => setTone(t)} className={`py-3 px-4 rounded-xl text-[10px] font-black uppercase text-left transition-all border ${tone === t ? 'bg-fuchsia-600 border-fuchsia-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-500 hover:border-fuchsia-300'}`}>
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="mt-auto p-5 bg-indigo-50 border border-indigo-100 rounded-2xl">
                            <p className="text-[9px] font-bold text-indigo-900 uppercase leading-relaxed">
                                <Sparkles size={12} className="inline mr-2" />
                                O Ghostwriter utiliza os dados mestres do Kernel para preencher campos automáticos.
                            </p>
                        </div>
                    </div>

                    {/* Área de Redação */}
                    <div className="flex-1 flex flex-col bg-white overflow-hidden">
                        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar space-y-6">
                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                    <Wand2 size={16} className="text-indigo-600" /> O que você deseja escrever?
                                </label>
                                <textarea 
                                    className="w-full h-40 p-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] text-sm font-medium outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner placeholder:text-slate-300"
                                    placeholder="Ex: Escreva um comunicado urgente sobre a manutenção da caixa d'água central amanhã das 08h às 14h..."
                                    value={prompt}
                                    onChange={e => setPrompt(e.target.value)}
                                />
                            </div>

                            {result && (
                                <div className="space-y-4 animate-fade-in">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[11px] font-black text-slate-900 uppercase tracking-widest">Resultado Gerado</label>
                                        <button onClick={() => setResult('')} className="text-[9px] font-black text-rose-500 uppercase">Limpar</button>
                                    </div>
                                    <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-dashed border-indigo-200 font-serif text-sm prose max-w-none" dangerouslySetInnerHTML={{ __html: result }} />
                                </div>
                            )}
                        </div>

                        <div className="p-8 border-t bg-slate-50 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">IA Conectada • Cluster Alpha</span>
                            </div>
                            <div className="flex gap-4">
                                {result ? (
                                    <button 
                                        onClick={() => { onInsert(result); onClose(); }}
                                        className="px-12 py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-500 transition-all flex items-center gap-2"
                                    >
                                        <CheckCircle2 size={16} /> Inserir no Editor
                                    </button>
                                ) : (
                                    <button 
                                        onClick={handleGenerate}
                                        disabled={isGenerating || !prompt.trim()}
                                        className="px-12 py-4 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-600 transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50"
                                    >
                                        {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} />} Gerar Rascunho
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});

const VisualTemplateManager = memo(({ isOpen, onClose, systemInfo, onTemplateUpdate }: any) => {
    const [templates, setTemplates] = useState<VisualTemplate[]>([]);
    const [editingTpl, setEditingTpl] = useState<Partial<VisualTemplate> | null>(null);
    const [loading, setLoading] = useState(false);
    
    // DocBuilder State
    const [activeTab, setActiveTab] = useState<'simple' | 'advanced'>('simple');
    const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
    const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
    
    // Default initial state
    const defaultDocData = {
        settings: {
            entityName: systemInfo?.name || "Associação Comercial Exemplo",
            cnpj: systemInfo?.cnpj || "00.000.000/0001-00",
            primaryColor: systemInfo?.primaryColor || "#2563eb",
            fontFamily: "sans-serif",
            padding: "20px"
        },
        blocks: [
            { id: '1', type: 'header', content: { logo: true, showCnpj: true }, style: { textAlign: 'center', fontSize: '18px', fontWeight: 'bold', margin: '0' } },
            { id: '2', type: 'divider', content: {}, style: { margin: '20px 0' } },
            { id: '3', type: 'text', content: { text: 'Documento processado digitalmente.' }, style: { fontSize: '12px', fontWeight: 'normal', color: '#666666', textAlign: 'center' } },
        ]
    };

    const [documentData, setDocumentData] = useState<{
        settings: typeof defaultDocData.settings;
        blocks: {
            id: string;
            type: string;
            content: any;
            style: any;
        }[];
    }>(defaultDocData);

    useEffect(() => {
        if (isOpen) loadTemplates();
    }, [isOpen]);

    // Inicializa o builder quando um template é editado
    useEffect(() => {
        if (editingTpl) {
            // Tenta recuperar configuração JSON oculta no HTML ou usa padrão
            const legacyHtml = editingTpl.header_html || '';
            // Regex mais robusto para capturar JSON, permitindo quebras de linha
            const match = legacyHtml.match(/<!--JSON_CONFIG:([\s\S]*?)-->/);
            
            if (match && match[1]) {
                try {
                    const parsedData = JSON.parse(match[1]);
                    // Merge com default para garantir estrutura
                    setDocumentData({
                        ...defaultDocData,
                        ...parsedData,
                        settings: { ...defaultDocData.settings, ...parsedData.settings }
                    });
                    setActiveTab('simple');
                } catch (e) {
                    console.error("Failed to parse template JSON:", e);
                    setActiveTab('advanced'); // Fallback para modo código se falhar parse
                }
            } else if (editingTpl.id) {
                // Template existente sem JSON -> Modo Avançado (Código)
                setActiveTab('advanced');
            } else {
                // Novo template -> Modo Simples
                setActiveTab('simple');
                setDocumentData({
                    ...defaultDocData,
                    settings: {
                        ...defaultDocData.settings,
                        entityName: systemInfo.name || defaultDocData.settings.entityName,
                        cnpj: systemInfo.cnpj || defaultDocData.settings.cnpj,
                        primaryColor: systemInfo.primaryColor || defaultDocData.settings.primaryColor
                    }
                });
            }
        }
    }, [editingTpl?.id, systemInfo]); 

    const loadTemplates = async () => {
        setLoading(true);
        try {
            const res = await visualTemplateService.getAll();
            setTemplates(res.data?.data || []);
        } catch (e) { console.error("Templates load failed"); }
        finally { setLoading(false); }
    };

    const handleCreate = () => {
        setEditingTpl({ name: 'NOVA IDENTIDADE', header_html: '', footer_html: '', is_default: 0 });
    };

    const handleBlockImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, blockId: string) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const res = await storageService.upload(file);
            const newBlocks = documentData.blocks.map(block => 
                block.id === blockId ? { ...block, content: { ...block.content, imageUrl: res.data.url } } : block
            );
            setDocumentData({ ...documentData, blocks: newBlocks });
        } catch (e) { alert("Falha no upload"); }
    };

    // Gera HTML final a partir dos blocos
    const generateHtmlFromBlocks = () => {
        // Embed the configuration JSON in the header HTML
        const jsonConfig = `<!--JSON_CONFIG:${JSON.stringify(documentData)}-->`;
        
        let headerHtml = `${jsonConfig}\n`;
        let footerHtml = '';

        const globalStyles = `font-family: ${documentData.settings.fontFamily}; color: #333;`;

        // Wrapper para o Header
        headerHtml += `<div style="padding: ${documentData.settings.padding}; ${globalStyles}">`;
        
        documentData.blocks.forEach(block => {
            let blockHtml = '';
            // Ensure style properties have defaults to avoid 'undefined' in CSS
            const textAlign = block.style.textAlign || 'left';
            const fontSize = block.style.fontSize || '14px';
            const fontWeight = block.style.fontWeight || 'normal';
            const margin = block.style.margin || '0';
            const color = block.style.color || '#333333';
            
            const blockStyle = `text-align: ${textAlign}; font-size: ${fontSize}; font-weight: ${fontWeight}; margin: ${margin}; color: ${color};`;

            if (block.type === 'header') {
                blockHtml = `
                    <div style="border-bottom: 2px solid ${documentData.settings.primaryColor}; padding-bottom: 15px; margin-bottom: 20px; text-align: center;">
                        ${(block.content as any).logo && systemInfo.logoUrl ? `<img src="${systemInfo.logoUrl}" style="height: 80px; width: auto; margin-bottom: 10px; object-fit: contain;" alt="Logo" />` : ''}
                        <h1 style="margin: 0; color: ${documentData.settings.primaryColor}; font-size: 18pt; text-transform: uppercase; line-height: 1.2;">${documentData.settings.entityName}</h1>
                        ${(block.content as any).showCnpj ? `<p style="margin: 5px 0 0; font-size: 10pt; color: #666;">CNPJ: ${documentData.settings.cnpj}</p>` : ''}
                    </div>
                `;
                headerHtml += blockHtml;
            } else if (block.type === 'image') {
                const imgUrl = (block.content as any).imageUrl || '';
                const width = (block.style as any).width || '100%';
                if (imgUrl) {
                    blockHtml = `<div style="text-align: ${textAlign}; margin: ${margin};"><img src="${imgUrl}" style="width: ${width}; max-width: 100%; height: auto; object-fit: contain;" /></div>`;
                    // Images usually go to header unless specifically footer
                    headerHtml += blockHtml;
                }
            } else if (block.type === 'divider') {
                if (block.id === 'footer-divider') {
                     footerHtml += `<hr style="border: 0; border-top: 1px solid #ccc; margin: 10px 0;" />`;
                } else {
                     headerHtml += `<hr style="border: 0; border-top: 1px solid #ccc; margin: 20px 0;" />`;
                }
            } else if (block.type === 'text') {
                if (block.id === '3') { 
                     footerHtml += `<div style="${blockStyle} border-top: 1px solid #eee; padding-top: 10px; margin-top: 30px;">${(block.content as any).text}</div>`;
                } else {
                     headerHtml += `<div style="${blockStyle}">${(block.content as any).text}</div>`;
                }
            }
        });
        
        headerHtml += `</div>`;
        
        // Se footerHtml estiver vazio, garantir que pelo menos não quebre
        if (!footerHtml) footerHtml = '<div style="display:none"></div>';
        
        return { headerHtml, footerHtml };
    };

    const handleSave = async () => {
        if (!editingTpl?.name) return alert("Defina um nome.");
        setLoading(true);
        try {
            let finalHeader = editingTpl.header_html;
            let finalFooter = editingTpl.footer_html;

            if (activeTab === 'simple') {
                const { headerHtml, footerHtml } = generateHtmlFromBlocks();
                finalHeader = headerHtml;
                finalFooter = footerHtml;
            }

            const payload = {
                ...editingTpl,
                header_html: finalHeader,
                footer_html: finalFooter
            };

            if (editingTpl.id) {
                await visualTemplateService.update(editingTpl.id, payload);
            } else {
                await visualTemplateService.create(payload);
            }
            await loadTemplates();
            if(onTemplateUpdate) onTemplateUpdate();
            setEditingTpl(null);
        } catch (e) { alert("Erro ao salvar."); }
        finally { setLoading(false); }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Excluir este modelo?")) return;
        try {
            await visualTemplateService.delete(id);
            loadTemplates();
            if(onTemplateUpdate) onTemplateUpdate();
        } catch (e) { alert("Erro ao excluir."); }
    };

    // Builder Actions
    const addBlock = (type: string) => {
        const newBlock = {
            id: Math.random().toString(36).substr(2, 9),
            type,
            content: type === 'text' ? { text: 'Informação adicional...' } : type === 'image' ? { imageUrl: '' } : {},
            style: { fontSize: '12px', textAlign: 'center', fontWeight: 'normal', color: '#666666', margin: '10px 0', width: '100px' }
        };
        setDocumentData({ ...documentData, blocks: [...documentData.blocks, newBlock] });
    };

    const updateBlockStyle = (id: string, newStyle: any) => {
        const newBlocks = documentData.blocks.map(block => 
            block.id === id ? { ...block, style: { ...block.style, ...newStyle } } : block
        );
        setDocumentData({ ...documentData, blocks: newBlocks });
    };

    const deleteBlock = (id: string) => {
        setDocumentData({ ...documentData, blocks: documentData.blocks.filter(b => b.id !== id) });
        if (selectedBlockId === id) setSelectedBlockId(null);
    };

    const moveBlock = (index: number, direction: number) => {
        const newBlocks = [...documentData.blocks];
        // Proteção de limites
        if (index + direction < 0 || index + direction >= newBlocks.length) return;
        
        const element = newBlocks.splice(index, 1)[0];
        newBlocks.splice(index + direction, 0, element);
        setDocumentData({ ...documentData, blocks: newBlocks });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10010] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white w-full max-w-7xl h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-white/10 animate-scale-in">
                
                {/* Header do Sistema */}
                <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/30">
                            <Layout className="text-white w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="font-black text-lg tracking-tight uppercase leading-none">DocBuilder <span className="text-indigo-600">Pro</span></h1>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">SRE Visual Identity Engine</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-full border border-slate-200">
                        <button 
                            onClick={() => setActiveTab('simple')}
                            className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'simple' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Settings className="w-3.5 h-3.5" /> Visual
                        </button>
                        <button 
                            onClick={() => setActiveTab('advanced')}
                            className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'advanced' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            <Code className="w-3.5 h-3.5" /> Código
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </header>
                
                <div className="flex flex-1 overflow-hidden">
                    {/* Sidebar Lista */}
                    <div className="w-72 bg-slate-50 border-r border-slate-200 flex flex-col p-4 shrink-0">
                        <button onClick={handleCreate} className="mb-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center justify-center gap-2 shadow-xl active:scale-95">
                            <Plus size={16}/> Novo Template
                        </button>
                        <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 px-2">Biblioteca</h4>
                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                            {templates.map(tpl => (
                                <div key={tpl.id} onClick={() => setEditingTpl(tpl)} className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col gap-1 group ${editingTpl?.id === tpl.id ? 'bg-white border-indigo-500 shadow-md ring-1 ring-indigo-500/20' : 'bg-white border-slate-200 hover:border-indigo-300'}`}>
                                    <div className="flex justify-between items-start">
                                        <span className="text-[10px] font-black uppercase text-slate-700 truncate w-40">{tpl.name}</span>
                                        {!!tpl.is_default && <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">PADRÃO</span>}
                                    </div>
                                    <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                         <button onClick={(e) => { e.stopPropagation(); handleDelete(tpl.id); }} className="text-slate-300 hover:text-rose-500 p-1"><Trash2 size={12}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Editor Area */}
                    {editingTpl ? (
                        <div className="flex-1 flex overflow-hidden">
                            {activeTab === 'simple' ? (
                                <>
                                    {/* Painel de Controle (Item 1) */}
                                    <aside className="w-80 border-r border-slate-200 bg-white overflow-y-auto shrink-0 shadow-[5px_0_20px_-5px_rgba(0,0,0,0.05)] z-10 custom-scrollbar">
                                        <div className="p-6 space-y-8">
                                            <div className="space-y-4">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nome do Modelo</label>
                                                <input 
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold uppercase outline-none focus:border-indigo-500 transition-all" 
                                                    value={editingTpl.name} 
                                                    onChange={e => setEditingTpl({...editingTpl, name: e.target.value.toUpperCase()})} 
                                                />
                                                <label className="flex items-center gap-2 cursor-pointer">
                                                    <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-indigo-600" checked={!!editingTpl.is_default} onChange={e => setEditingTpl({...editingTpl, is_default: e.target.checked ? 1 : 0})} />
                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Definir como Padrão</span>
                                                </label>
                                            </div>

                                            <div>
                                                <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Building2 size={12}/> Dados da Entidade</h3>
                                                <div className="space-y-4">
                                                    <div className="group">
                                                        <label className="text-[10px] font-bold text-slate-500 mb-1.5 block">Nome Institucional</label>
                                                        <input 
                                                            type="text" 
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:border-indigo-500 outline-none transition-all"
                                                            value={documentData.settings.entityName}
                                                            onChange={(e) => setDocumentData({...documentData, settings: {...documentData.settings, entityName: e.target.value}})}
                                                        />
                                                    </div>
                                                    <div className="group">
                                                        <label className="text-[10px] font-bold text-slate-500 mb-1.5 block">CNPJ / Registro</label>
                                                        <input 
                                                            type="text" 
                                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:border-indigo-500 outline-none transition-all"
                                                            value={documentData.settings.cnpj}
                                                            onChange={(e) => setDocumentData({...documentData, settings: {...documentData.settings, cnpj: e.target.value}})}
                                                        />
                                                    </div>
                                                    <div className="group">
                                                        <label className="text-[10px] font-bold text-slate-500 mb-1.5 block">Cor Primária</label>
                                                        <div className="flex items-center gap-2">
                                                            <input 
                                                                type="color" 
                                                                className="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-100"
                                                                value={documentData.settings.primaryColor}
                                                                onChange={(e) => setDocumentData({...documentData, settings: {...documentData.settings, primaryColor: e.target.value}})}
                                                            />
                                                            <span className="text-xs font-mono text-slate-400">{documentData.settings.primaryColor}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div>
                                                <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Layers size={12}/> Estrutura Visual</h3>
                                                <div className="space-y-3">
                                                    {documentData.blocks.map((block, index) => (
                                                        <div 
                                                            key={block.id}
                                                            onClick={() => setSelectedBlockId(block.id)}
                                                            className={`p-4 border rounded-2xl cursor-pointer transition-all flex items-center justify-between group ${selectedBlockId === block.id ? 'border-indigo-500 bg-indigo-50 shadow-sm ring-1 ring-indigo-500/20' : 'border-slate-100 hover:border-slate-300 bg-slate-50'}`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <div className={`p-2 rounded-lg ${selectedBlockId === block.id ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400 border border-slate-200'}`}>
                                                                    {block.type === 'header' && <Layout className="w-3.5 h-3.5" />}
                                                                    {block.type === 'text' && <Type className="w-3.5 h-3.5" />}
                                                                    {block.type === 'divider' && <ScanLine className="w-3.5 h-3.5" />}
                                                                    {block.type === 'image' && <ImageIcon className="w-3.5 h-3.5" />}
                                                                </div>
                                                                <span className="text-[10px] font-bold uppercase">{block.type === 'header' ? 'Cabeçalho' : block.type === 'divider' ? 'Divisor' : block.type === 'image' ? 'Imagem' : 'Texto'}</span>
                                                            </div>
                                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <button onClick={(e) => {e.stopPropagation(); if(index > 0) moveBlock(index, -1)}} className="p-1.5 hover:bg-white rounded-lg text-slate-400"><MoveUp className="w-3 h-3" /></button>
                                                                <button onClick={(e) => {e.stopPropagation(); if(index < documentData.blocks.length -1) moveBlock(index, 1)}} className="p-1.5 hover:bg-white rounded-lg text-slate-400"><MoveDown className="w-3 h-3" /></button>
                                                                <button onClick={(e) => {e.stopPropagation(); deleteBlock(block.id)}} className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-400"><Trash2 className="w-3 h-3" /></button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    
                                                    <div className="grid grid-cols-2 gap-2 mt-4">
                                                        <button onClick={() => addBlock('text')} className="py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all flex flex-col items-center justify-center gap-1">
                                                            <Type className="w-4 h-4" /> <span className="text-[8px] font-black uppercase">Texto</span>
                                                        </button>
                                                        <button onClick={() => addBlock('image')} className="py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all flex flex-col items-center justify-center gap-1">
                                                            <ImageIcon className="w-4 h-4" /> <span className="text-[8px] font-black uppercase">Imagem</span>
                                                        </button>
                                                        <button onClick={() => addBlock('divider')} className="col-span-2 py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all flex flex-col items-center justify-center gap-1">
                                                            <ScanLine className="w-4 h-4" /> <span className="text-[8px] font-black uppercase">Divisor</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {selectedBlockId && (
                                                <div className="pt-6 border-t border-slate-100 animate-slide-up">
                                                    <h3 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 flex justify-between items-center">
                                                        Propriedades
                                                        <button onClick={() => setSelectedBlockId(null)} className="text-slate-300 hover:text-slate-500"><X size={14}/></button>
                                                    </h3>
                                                    <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                                        {documentData.blocks.find(b => b.id === selectedBlockId)?.type === 'text' && (
                                                            <>
                                                                <div className="space-y-2">
                                                                    <label className="text-[9px] font-bold text-slate-500 uppercase block">Conteúdo</label>
                                                                    <textarea 
                                                                        rows={3}
                                                                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs outline-none focus:border-indigo-500"
                                                                        value={(documentData.blocks.find(b => b.id === selectedBlockId)?.content as any).text || ''}
                                                                        onChange={(e) => {
                                                                            const newBlocks = documentData.blocks.map(block => 
                                                                                block.id === selectedBlockId ? { ...block, content: { ...block.content, text: e.target.value } } : block
                                                                            );
                                                                            setDocumentData({ ...documentData, blocks: newBlocks });
                                                                        }}
                                                                    />
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <div className="flex-1 space-y-2">
                                                                         <label className="text-[9px] font-bold text-slate-500 uppercase block">Cor</label>
                                                                         <input type="color" className="w-full h-8 rounded border border-slate-200" value={documentData.blocks.find(b => b.id === selectedBlockId)?.style.color || '#333333'} onChange={(e) => updateBlockStyle(selectedBlockId, { color: e.target.value })} />
                                                                    </div>
                                                                </div>
                                                            </>
                                                        )}
                                                        {documentData.blocks.find(b => b.id === selectedBlockId)?.type === 'image' && (
                                                            <div className="space-y-3">
                                                                <label className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-indigo-400 text-slate-400 hover:text-indigo-600 transition-all">
                                                                    <Upload size={14}/> Carregar Imagem
                                                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleBlockImageUpload(e, selectedBlockId)} />
                                                                </label>
                                                                {(documentData.blocks.find(b => b.id === selectedBlockId)?.content as any).imageUrl && (
                                                                     <div className="h-20 bg-slate-200 rounded-lg overflow-hidden border border-slate-300">
                                                                         <img src={(documentData.blocks.find(b => b.id === selectedBlockId)?.content as any).imageUrl} className="w-full h-full object-contain" />
                                                                     </div>
                                                                )}
                                                                <div className="space-y-2">
                                                                    <label className="text-[9px] font-bold text-slate-500 uppercase block">Largura (px / %)</label>
                                                                    <input type="text" className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs" value={documentData.blocks.find(b => b.id === selectedBlockId)?.style.width || '100px'} onChange={(e) => updateBlockStyle(selectedBlockId, { width: e.target.value })} />
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div className="flex gap-2">
                                                            {['left', 'center', 'right'].map(align => (
                                                                <button 
                                                                    key={align}
                                                                    onClick={() => updateBlockStyle(selectedBlockId, { textAlign: align })}
                                                                    className={`flex-1 py-2 rounded-lg border text-[10px] font-black uppercase transition-all ${documentData.blocks.find(b => b.id === selectedBlockId)?.style.textAlign === align ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-500 border-slate-200'}`}
                                                                >
                                                                    {align === 'left' ? <AlignLeft size={14}/> : align === 'center' ? <AlignCenter size={14}/> : <AlignRight size={14}/>}
                                                                </button>
                                                            ))}
                                                        </div>
                                                        {(documentData.blocks.find(b => b.id === selectedBlockId)?.type === 'text' || documentData.blocks.find(b => b.id === selectedBlockId)?.type === 'header') && (
                                                            <div>
                                                                <label className="text-[9px] font-bold text-slate-500 uppercase block mb-2">Tamanho Fonte</label>
                                                                <input 
                                                                    type="range" min="8" max="32" step="1" 
                                                                    className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-full"
                                                                    value={parseInt(documentData.blocks.find(b => b.id === selectedBlockId)?.style.fontSize || '12')}
                                                                    onChange={(e) => updateBlockStyle(selectedBlockId, { fontSize: `${e.target.value}px` })}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </aside>

                                    {/* Workspace Principal (Item 8) */}
                                    <main className="flex-1 flex flex-col items-center bg-slate-100 overflow-y-auto p-8 relative">
                                        
                                        {/* Controles de Visualização */}
                                        <div className="mb-8 bg-white rounded-full shadow-lg border border-slate-200 p-1.5 flex gap-1 sticky top-0 z-20">
                                            <button 
                                                onClick={() => setPreviewMode('desktop')}
                                                className={`p-3 rounded-full transition-all ${previewMode === 'desktop' ? 'bg-indigo-50 text-indigo-600 shadow-inner' : 'text-slate-400 hover:bg-slate-50'}`}
                                            >
                                                <Monitor className="w-4 h-4" />
                                            </button>
                                            <button 
                                                onClick={() => setPreviewMode('mobile')}
                                                className={`p-3 rounded-full transition-all ${previewMode === 'mobile' ? 'bg-indigo-50 text-indigo-600 shadow-inner' : 'text-slate-400 hover:bg-slate-50'}`}
                                            >
                                                <Smartphone className="w-4 h-4" />
                                            </button>
                                        </div>

                                        {/* Canvas do Documento (A4 Ratio) */}
                                        <div 
                                            id="print-canvas"
                                            className={`bg-white shadow-2xl transition-all duration-500 ease-in-out border border-slate-200 overflow-hidden relative ${previewMode === 'mobile' ? 'w-[360px] min-h-[600px]' : 'w-[210mm] min-h-[297mm]'}`}
                                            style={{ padding: documentData.settings.padding, fontFamily: documentData.settings.fontFamily }}
                                        >
                                            {/* Grid Invisível / Guia Visual (Item 6) */}
                                            <div className="absolute inset-0 pointer-events-none border-[20px] border-slate-50/30"></div>

                                            {documentData.blocks.map((block) => (
                                                <div 
                                                    key={block.id}
                                                    onClick={() => setSelectedBlockId(block.id)}
                                                    className={`relative group mb-4 transition-all duration-200 ${selectedBlockId === block.id ? 'ring-2 ring-indigo-500 ring-offset-4 rounded-lg' : 'hover:ring-1 hover:ring-slate-300 rounded-lg'}`}
                                                    style={{
                                                        textAlign: block.style.textAlign as any,
                                                        fontSize: block.style.fontSize,
                                                        fontWeight: block.style.fontWeight,
                                                        margin: block.style.margin,
                                                        color: block.style.color
                                                    }}
                                                >
                                                    {/* Visualizador de Bloco (O que será renderizado no PDF) */}
                                                    {block.type === 'header' && (
                                                        <div className="border-b-2 border-slate-800 pb-6 mb-8" style={{ borderColor: documentData.settings.primaryColor }}>
                                                            <div className="flex flex-col items-center gap-2">
                                                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center border-4 border-white shadow-md mb-2 overflow-hidden">
                                                                    {(block.content as any).logo && systemInfo.logoUrl ? <img src={systemInfo.logoUrl} className="w-full h-full object-contain p-2"/> : <ImageIcon className="text-slate-300" />}
                                                                </div>
                                                                <h2 className="text-2xl font-black uppercase tracking-tight" style={{ color: documentData.settings.primaryColor }}>{documentData.settings.entityName}</h2>
                                                                {(block.content as any).showCnpj && <p className="text-[11px] text-slate-500 font-mono tracking-[0.2em] uppercase">CNPJ: {documentData.settings.cnpj}</p>}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {block.type === 'divider' && (
                                                        <div className="w-full h-px bg-slate-300 my-8"></div>
                                                    )}

                                                    {block.type === 'text' && (
                                                        <div className="leading-relaxed whitespace-pre-wrap">
                                                            {(block.content as any).text}
                                                        </div>
                                                    )}
                                                    
                                                    {block.type === 'image' && (
                                                        <div style={{ width: '100%', display: 'flex', justifyContent: block.style.textAlign === 'center' ? 'center' : block.style.textAlign === 'right' ? 'flex-end' : 'flex-start' }}>
                                                            {(block.content as any).imageUrl ? (
                                                                <img src={(block.content as any).imageUrl} style={{ width: (block.style as any).width || '100px', maxWidth: '100%', height: 'auto', objectFit: 'contain' }} />
                                                            ) : (
                                                                <div className="w-24 h-24 bg-slate-100 flex items-center justify-center text-slate-300 border border-dashed border-slate-300 rounded-lg"><ImageIcon size={24}/></div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Badge de Bloco no Editor */}
                                                    {selectedBlockId === block.id && (
                                                        <div className="absolute -left-12 top-0 bg-indigo-600 text-white p-2 rounded-l-xl shadow-lg animate-in slide-in-from-right-2">
                                                            <Layout className="w-4 h-4" />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}

                                            {/* Rodapé Automático */}
                                            <div className="absolute bottom-10 left-0 right-0 px-12 border-t border-slate-100 pt-6 flex justify-between items-center text-[9px] text-slate-400 font-medium uppercase tracking-widest">
                                                <div>Emitido via S.I.E PRO • {new Date().toLocaleDateString()}</div>
                                                <div>Página 01 / 01</div>
                                            </div>
                                        </div>

                                        {/* Dicas de UX (Item 7 e 8) */}
                                        <div className="mt-12 max-w-2xl w-full grid grid-cols-2 gap-6">
                                            <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[2rem] flex gap-4 shadow-sm">
                                                <CheckCircle2 className="text-emerald-500 shrink-0 w-6 h-6" />
                                                <div>
                                                    <h4 className="text-xs font-black text-emerald-900 uppercase tracking-widest">Validado SRE</h4>
                                                    <p className="text-[10px] text-emerald-700 leading-relaxed mt-1">O layout respeita as margens de impressão A4 padrão AMC.</p>
                                                </div>
                                            </div>
                                            <div className="bg-amber-50 border border-amber-100 p-6 rounded-[2rem] flex gap-4 shadow-sm">
                                                <AlertCircle className="text-amber-500 shrink-0 w-6 h-6" />
                                                <div>
                                                    <h4 className="text-xs font-black text-amber-900 uppercase tracking-widest">Legibilidade</h4>
                                                    <p className="text-[10px] text-amber-700 leading-relaxed mt-1">Mantenha fontes acima de 12px para documentos jurídicos oficiais.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </main>
                                </>
                            ) : (
                                <div className="flex-1 flex flex-col p-8 bg-slate-900 overflow-hidden">
                                    <div className="flex gap-4 mb-6">
                                        <div className="flex-1 space-y-2">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">HTML do Cabeçalho</label>
                                            <textarea 
                                                className="w-full h-64 bg-black/30 text-emerald-400 font-mono text-[11px] p-6 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500 resize-none border border-white/5"
                                                value={editingTpl.header_html}
                                                onChange={e => setEditingTpl({...editingTpl, header_html: e.target.value})}
                                            />
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">HTML do Rodapé</label>
                                            <textarea 
                                                className="w-full h-64 bg-black/30 text-emerald-400 font-mono text-[11px] p-6 rounded-3xl outline-none focus:ring-2 focus:ring-indigo-500 resize-none border border-white/5"
                                                value={editingTpl.footer_html}
                                                onChange={e => setEditingTpl({...editingTpl, footer_html: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Actions Bar */}
                            <div className="w-20 bg-white border-l border-slate-200 flex flex-col items-center py-6 gap-4 shrink-0 shadow-xl z-20">
                                <button onClick={handleSave} disabled={loading} className="w-12 h-12 bg-indigo-600 text-white rounded-2xl shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center active:scale-95 group" title="Salvar">
                                    {loading ? <Loader2 className="animate-spin" size={20}/> : <Save size={20} className="group-hover:scale-110 transition-transform"/>}
                                </button>
                                <div className="w-8 h-px bg-slate-200 my-2"></div>
                                <div className="space-y-4">
                                     <div className="w-2 h-2 rounded-full bg-emerald-500 mx-auto animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-300 bg-slate-50/50">
                            <LayoutTemplate size={80} className="mb-6 opacity-20"/>
                            <p className="text-[11px] font-black uppercase tracking-[0.3em]">Selecione um modelo para editar</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});

const WatermarkModal = memo(({ isOpen, onClose, watermark, setWatermark, fileRef, onFileChange }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[10005] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10 animate-scale-in">
                <div className="h-20 px-8 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-white/5">
                    <div className="flex items-center gap-4">
                        <Stamp size={20} className="text-indigo-400" />
                        <h3 className="font-black text-sm uppercase tracking-widest">Marca D'água Tática</h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-rose-500 rounded-lg transition-all"><X size={24} /></button>
                </div>
                <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200 shadow-inner">
                        <span className="text-[10px] font-black text-slate-500 uppercase">Habilitar no Documento</span>
                        <button onClick={() => setWatermark({ ...watermark, enabled: !watermark.enabled })} className={`p-1 rounded-full transition-all ${watermark.enabled ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                            {watermark.enabled ? <ToggleRight size={28} className="text-white" /> : <ToggleLeft size={28} className="text-slate-400" />}
                        </button>
                    </div>

                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button onClick={() => setWatermark({ ...watermark, type: 'TEXT' })} className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase transition-all ${watermark.type === 'TEXT' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Texto</button>
                        <button onClick={() => setWatermark({ ...watermark, type: 'IMAGE' })} className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase transition-all ${watermark.type === 'IMAGE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Imagem</button>
                    </div>

                    {watermark.type === 'TEXT' ? (
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Texto da Marca</label>
                            <input className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-black uppercase outline-none focus:border-indigo-500" value={watermark.text} onChange={e => setWatermark({ ...watermark, text: e.target.value.toUpperCase() })} />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Upload Imagem</label>
                            <button onClick={() => fileRef.current?.click()} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:text-indigo-600 transition-all">
                                {watermark.imageUrl ? <img src={watermark.imageUrl} className="h-20 object-contain mb-2" alt="Watermark" /> : <Upload size={24} className="mb-2" />}
                                <span className="text-[10px] font-black uppercase">{watermark.imageUrl ? 'Trocar Imagem' : 'Selecionar Arquivo'}</span>
                            </button>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-400 uppercase block">Escala</label>
                                <input type="range" min="0.1" max="3" step="0.1" value={watermark.scale} onChange={e => setWatermark({ ...watermark, scale: parseFloat(e.target.value) })} className="w-full h-1.5 accent-indigo-600" />
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase block">Opacidade</label>
                            <input type="range" min="0" max="0.5" step="0.05" value={watermark.opacity} onChange={e => setWatermark({ ...watermark, opacity: parseFloat(e.target.value) })} className="w-full h-1.5 accent-indigo-600" />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-slate-400 uppercase block">Rotação</label>
                            <input type="number" value={watermark.rotation} onChange={e => setWatermark({ ...watermark, rotation: parseInt(e.target.value) })} className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-xs font-black" />
                        </div>
                    </div>
                </div>
                <div className="p-6 bg-slate-50 border-t flex justify-end">
                    <button onClick={onClose} className="px-10 py-3.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase shadow-xl hover:bg-emerald-600 transition-all active:scale-95">Aplicar Protocolo</button>
                </div>
            </div>
        </div>
    );
});

const PageConfigModal = memo(({ isOpen, onClose, pageConfig, setPageConfig }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[10005] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10 animate-scale-in">
                <div className="h-20 px-8 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-white/5">
                    <div className="flex items-center gap-4">
                        <Settings2 size={20} className="text-indigo-400" />
                        <h3 className="font-black text-sm uppercase tracking-widest">Layout do Documento</h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-rose-500 rounded-lg transition-all"><X size={24} /></button>
                </div>
                <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                        <button onClick={() => setPageConfig({ ...pageConfig, mode: 'PAGES' })} className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase transition-all ${pageConfig.mode === 'PAGES' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Paginado</button>
                        <button onClick={() => setPageConfig({ ...pageConfig, mode: 'PAGRELESS' })} className={`flex-1 py-3 rounded-lg text-[10px] font-black uppercase transition-all ${pageConfig.mode === 'PAGRELESS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>Sem Páginas</button>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Tamanho do Papel</label>
                            <select className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-[10px] font-black uppercase outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all" value={pageConfig.paperSize} onChange={e => setPageConfig({ ...pageConfig, paperSize: e.target.value })}>
                                <option value="A4">A4 (21,0 x 29,7 cm)</option>
                                <option value="LETTER">Carta (21,6 x 27,9 cm)</option>
                                <option value="LEGAL">Ofício (21,6 x 35,6 cm)</option>
                            </select>
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Orientação</label>
                            <div className="flex bg-slate-100 p-1 rounded-lg h-12">
                                <button onClick={() => setPageConfig({ ...pageConfig, orientation: 'PORTRAIT' })} className={`flex-1 rounded-md text-[10px] font-black uppercase ${pageConfig.orientation === 'PORTRAIT' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}>Retrato</button>
                                <button onClick={() => setPageConfig({ ...pageConfig, orientation: 'LANDSCAPE' })} className={`flex-1 rounded-md text-[10px] font-black uppercase ${pageConfig.orientation === 'LANDSCAPE' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}>Paisagem</button>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase">Margens (cm)</p>
                        <div className="grid grid-cols-4 gap-2">
                            <input type="number" step="0.1" value={pageConfig.margins.top} onChange={e => setPageConfig({ ...pageConfig, margins: { ...pageConfig.margins, top: parseFloat(e.target.value) } })} className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-center text-xs font-bold" placeholder="Top" />
                            <input type="number" step="0.1" value={pageConfig.margins.bottom} onChange={e => setPageConfig({ ...pageConfig, margins: { ...pageConfig.margins, bottom: parseFloat(e.target.value) } })} className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-center text-xs font-bold" placeholder="Bot" />
                            <input type="number" step="0.1" value={pageConfig.margins.left} onChange={e => setPageConfig({ ...pageConfig, margins: { ...pageConfig.margins, left: parseFloat(e.target.value) } })} className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-center text-xs font-bold" placeholder="Left" />
                            <input type="number" step="0.1" value={pageConfig.margins.right} onChange={e => setPageConfig({ ...pageConfig, margins: { ...pageConfig.margins, right: parseFloat(e.target.value) } })} className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-center text-xs font-bold" placeholder="Right" />
                        </div>
                    </div>
                </div>
                <div className="p-6 bg-slate-50 border-t flex justify-end">
                    <button onClick={onClose} className="px-10 py-3.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase shadow-xl hover:bg-emerald-600 transition-all">Sincronizar Layout</button>
                </div>
            </div>
        </div>
    );
});

const CustomAIModal = memo(({ isOpen, onClose, tone, setTone, command, setCommand, onExecute, isGenerating }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[10005] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/10 animate-scale-in">
                <div className="h-20 px-8 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-white/5">
                    <div className="flex items-center gap-4">
                        <Wand2 size={20} className="text-indigo-400" />
                        <h3 className="font-black text-sm uppercase tracking-widest">Mágica Neural Customizada</h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-rose-500 rounded-lg transition-all"><X size={24} /></button>
                </div>
                <div className="p-8 space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Tom de Voz</label>
                        <div className="grid grid-cols-2 gap-2">
                            {['JURIDICAL', 'FORMAL', 'FRIENDLY', 'URGENT'].map(t => (
                                <button key={t} onClick={() => setTone(t)} className={`py-2 text-[9px] font-black uppercase rounded-lg border ${tone === t ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-slate-200 text-slate-400 hover:border-indigo-200'}`}>
                                    {t === 'JURIDICAL' ? 'Jurídico' : t === 'FORMAL' ? 'Corporativo' : t === 'FRIENDLY' ? 'Amigável' : 'Urgente'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <textarea
                        rows={4}
                        className="w-full p-6 bg-slate-50 border border-slate-200 rounded-3xl text-sm font-medium uppercase outline-none focus:border-indigo-500 shadow-inner"
                        placeholder="Ex: Reescreva de forma mais agressiva..."
                        value={command}
                        onChange={e => setCommand(e.target.value)}
                    />
                </div>
                <div className="p-6 bg-slate-50 border-t flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-3 text-slate-400 font-black text-[10px] uppercase">Cancelar</button>
                    <button onClick={() => onExecute(command)} disabled={isGenerating} className="px-10 py-3.5 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center gap-3">
                        {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />} Executar
                    </button>
                </div>
            </div>
        </div>
    );
});

const ActionManagerModal = memo(({ isOpen, onClose, quickActions, editingAction, setEditingAction, onSave, onDelete, isSaving }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[10005] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white w-full max-w-4xl h-[80vh] rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col border border-white/10 animate-scale-in">
                <div className="h-20 px-8 bg-slate-900 text-white flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <Sparkles size={20} className="text-indigo-400" />
                        <h3 className="font-black text-sm uppercase tracking-widest">Gerenciar Ações Rápidas Assistidas</h3>
                    </div>
                    <button onClick={() => { onClose(); setEditingAction(null); }} className="p-2 hover:bg-rose-500 rounded-lg transition-all"><X size={24} /></button>
                </div>
                <div className="flex-1 flex overflow-hidden">
                    <div className="w-80 border-r bg-slate-50 p-6 overflow-y-auto custom-scrollbar">
                        <button onClick={() => setEditingAction({ title: 'NOVA AÇÃO', content: '', is_favorite: 1 })} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-indigo-50 transition-all mb-6 flex items-center justify-center gap-2">
                            <Plus size={16} /> Nova Ação
                        </button>
                        <div className="space-y-2">
                            {quickActions.map((action: any) => (
                                <div key={action.id} onClick={() => setEditingAction(action)} className={`p-4 rounded-2xl border cursor-pointer transition-all ${editingAction?.id === action.id ? 'bg-white border-indigo-500 shadow-md' : 'bg-white/50 border-slate-200 hover:border-indigo-300'}`}>
                                    <p className="text-[10px] font-black uppercase text-slate-800 truncate">{action.title}</p>
                                    <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Snapshot IA</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 p-10 bg-white overflow-y-auto custom-scrollbar">
                        {editingAction ? (
                            <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Título do Botão</label>
                                    <input className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-sm font-black uppercase outline-none focus:border-indigo-500 shadow-inner" value={editingAction.title} onChange={e => setEditingAction({ ...editingAction, title: e.target.value.toUpperCase() })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Restringir ao Cargo</label>
                                    <select className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-[10px] font-black uppercase" value={editingAction.role_restriction || 'ALL'} onChange={e => setEditingAction({ ...editingAction, role_restriction: e.target.value })}>
                                        <option value="ALL">Todos os Cargos</option>
                                        <option value="ADMIN">Apenas Administradores</option>
                                        <option value="PRESIDENT">Apenas Presidentes</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-1">Instrução Neural (Prompt)</label>
                                    <textarea rows={6} className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] p-6 text-sm font-medium uppercase outline-none focus:border-indigo-500 shadow-inner" value={editingAction.content} onChange={e => setEditingAction({ ...editingAction, content: e.target.value })} />
                                </div>
                                <div className="flex gap-4 pt-6 border-t">
                                    <button onClick={() => onDelete(editingAction.id)} className="p-4 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={20} /></button>
                                    <button onClick={onSave} disabled={isSaving} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3">
                                        {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Commitar Ação
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center opacity-10">
                                <LayoutGrid size={80} />
                                <p className="text-[10px] font-black uppercase tracking-[0.4em] mt-6 text-center leading-loose">Selecione uma ação para editar <br /> ou clique em Nova Ação.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
});

// --- Main Component ---

const DocumentHub = ({ systemInfo, currentUser, sidebarCollapsed }: DocumentHubProps) => {
    // State - Documents & Status
    const [documents, setDocuments] = useState<OfficialDocument[]>([]);
    const [activeDoc, setActiveDoc] = useState<OfficialDocument | null>(null);
    const [docStatus, setDocStatus] = useState<DocStatus>('DRAFT');
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'IDLE' | 'SAVING' | 'SUCCESS'>('IDLE');
    const [searchTerm, setSearchTerm] = useState('');
    const [toasts, setToasts] = useState<Toast[]>([]);
    
    // State - Configuration & Modals
    const [visualTemplates, setVisualTemplates] = useState<VisualTemplate[]>([]);
    const [selectedVisualId, setSelectedVisualId] = useState<number | null>(null);
    const [isPageConfigOpen, setIsPageConfigOpen] = useState(false);
    const [isWatermarkModalOpen, setIsWatermarkModalOpen] = useState(false);
    const [isCustomAIModalOpen, setIsCustomAIModalOpen] = useState(false);
    const [isGhostwriterModalOpen, setIsGhostwriterModalOpen] = useState(false);
    const [isActionManagerOpen, setIsActionManagerOpen] = useState(false);
    const [isVariablePickerOpen, setIsVariablePickerOpen] = useState(false);
    const [isTemplateBuilderOpen, setIsTemplateBuilderOpen] = useState(false);
    
    // State - Editor Settings
    const [pageConfig, setPageConfig] = useState<PageConfig>({
        mode: 'PAGES', applyTo: 'ALL', orientation: 'PORTRAIT', paperSize: 'A4',
        customWidth: 21.0, customHeight: 29.7, pageColor: '#ffffff',
        margins: { top: 2.5, bottom: 2.5, left: 3.0, right: 2.0 }
    });
    const [watermark, setWatermark] = useState<WatermarkConfig>({
        enabled: false, type: 'TEXT', text: 'CÓPIA NÃO CONTROLADA', imageUrl: '',
        opacity: 0.1, rotation: -45, fontSize: 60, scale: 1, color: '#000000'
    });
    const [repeatHeader, setRepeatHeader] = useState(true);
    const [repeatFooter, setRepeatFooter] = useState(true);
    const [zoomLevel, setZoomLevel] = useState(100);
    const [stats, setStats] = useState({ words: 0, chars: 0, pages: 1 });
    const [docHistory, setDocHistory] = useState<DocumentVersion[]>([]);
    const [showHistory, setShowHistory] = useState(false);

    // State - AI & Prompts
    const [savedPrompts, setSavedPrompts] = useState<any[]>([]);
    const [quickActions, setQuickActions] = useState<any[]>([]);
    const [editingAction, setEditingAction] = useState<any>(null);
    const [customAICommand, setCustomAICommand] = useState('');
    const [aiTone, setAiTone] = useState('JURIDICAL');
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedPromptId, setSelectedPromptId] = useState('');
    const [aiChatInput, setAiChatInput] = useState('');
    const [sessionAttachments, setSessionAttachments] = useState<{name: string, data: string}[]>([]); // MULTIPLE ATTACHMENTS
    const [attachmentName, setAttachmentName] = useState<string>('');
    
    // SRE: Image Resizing & Selection
    const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);

    // Refs
    const editorRef = useRef<HTMLDivElement>(null);
    const attachmentInputRef = useRef<HTMLInputElement>(null);
    const watermarkFileRef = useRef<HTMLInputElement>(null);
    const timerRef = useRef<any>(null);
    const lastSelectionRange = useRef<Range | null>(null);

    const primaryColor = systemInfo.primaryColor || '#4f46e5';
    const primaryColorStyle = { backgroundColor: primaryColor };
    const canManage = currentUser?.role === 'ADMIN' || currentUser?.role === 'PRESIDENT';

    // Effects
    useEffect(() => { loadDocuments(); loadPrompts(); loadVisualTemplates(); }, []);

    // Loaders
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
            const data = res.data?.data || [];
            setSavedPrompts(data);
            setQuickActions(data.filter((p: any) => p.category === 'SMART_ACTION' || p.is_favorite));
        } catch (e) { setSavedPrompts([]); }
    };

    const loadHistory = async (id: string | number) => {
        if (String(id).startsWith('temp_')) {
            setDocHistory([]);
            return;
        }
        try {
            const res = await documentService.getHistory(id);
            setDocHistory(res.data?.data || []);
        } catch (e) { setDocHistory([]); }
    };

    // Utilities
    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    };

    const interpolateTemplate = (html: string) => {
        if (!html) return "";
        let out = html;
        // SRE UPDATE: Mapeamento detalhado de endereço
        const address = [
            systemInfo.street, 
            systemInfo.number, 
            systemInfo.complement,
            systemInfo.neighborhood,
            systemInfo.city,
            systemInfo.state
        ].filter(Boolean).join(', ');

        const vars = {
            logo: systemInfo.logoUrl ? `<img src="${systemInfo.logoUrl}" style="height: 60px; width: auto; object-fit: contain;" alt="Logo" />` : "",
            assinatura: systemInfo.president_signature ? `<img src="${systemInfo.president_signature}" style="height: 50px; width: auto;" alt="Assinatura" />` : "",
            nome_presidente: systemInfo.president_name || "PRESIDENTE (EDITAR)",
            // SRE UPDATE: Injeção de CPF do Presidente
            cpf_presidente: systemInfo.president_cpf || "000.000.000-00",
            entidade: systemInfo.name || "ASSOCIAÇÃO",
            sigla: systemInfo.shortName || "AMC",
            cnpj: systemInfo.cnpj || "",
            cidade: systemInfo.city || "Cidade",
            data_atual: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }),
            // SRE UPDATE: Fallback inteligente de endereço
            endereco: address || `${systemInfo.street || 'Endereço'}, ${systemInfo.number || 'S/N'} - ${systemInfo.neighborhood || 'Bairro'}`
        };
        Object.entries(vars).forEach(([key, val]) => {
            const regex = new RegExp(`\\{${key}\\}`, 'g');
            out = out.replace(regex, val);
        });
        return out;
    };

    // Editor Logic
    const saveSelection = () => {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            if (editorRef.current && editorRef.current.contains(range.commonAncestorContainer)) {
                lastSelectionRange.current = range.cloneRange();
            }
        }
    };

    const restoreSelection = () => {
        if (lastSelectionRange.current) {
            const selection = window.getSelection();
            if (selection) {
                selection.removeAllRanges();
                selection.addRange(lastSelectionRange.current);
            }
        } else if (editorRef.current) {
            editorRef.current.focus();
        }
    };

    const updateStats = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            if (editorRef.current) {
                if (activeDoc) {
                    localStorage.setItem(`sie_draft_${activeDoc.id}`, editorRef.current.innerHTML);
                }
                const text = editorRef.current.innerText || '';
                let paperH = pageConfig.paperSize === 'CUSTOM' ? pageConfig.customHeight : (PAPER_SIZES[pageConfig.paperSize] || PAPER_SIZES['A4']).heightCm;
                if (pageConfig.orientation === 'LANDSCAPE') {
                    const paperW = pageConfig.paperSize === 'CUSTOM' ? pageConfig.customWidth : (PAPER_SIZES[pageConfig.paperSize] || PAPER_SIZES['A4']).widthCm;
                    paperH = paperW; 
                }
                const CM_TO_PX = 37.8;
                const pageHeightPx = paperH * CM_TO_PX;
                const marginsSumCm = pageConfig.margins.top + pageConfig.margins.bottom + 2; 
                const usefulHeightPx = pageHeightPx - (marginsSumCm * CM_TO_PX);
                const totalHeight = editorRef.current.scrollHeight;
                let estPages = 1;
                if (totalHeight > usefulHeightPx + 50) {
                    estPages = Math.ceil(totalHeight / usefulHeightPx);
                }
                setStats({
                    words: text.split(/\s+/).filter(w => w.length > 0).length,
                    chars: text.length,
                    pages: pageConfig.mode === 'PAGRELESS' ? 1 : estPages
                });
            }
        }, 500);
    }, [pageConfig, activeDoc]);

    const handleFormat = (command: string, value: string | undefined = undefined) => {
        restoreSelection();
        
        // SRE FONT FIX: Use spans for better font control
        if (command === 'fontSize' || command === 'fontName') {
             // Create span with style instead of legacy font tag
             const selection = window.getSelection();
             if (selection && selection.rangeCount > 0) {
                 const range = selection.getRangeAt(0);
                 const span = document.createElement('span');
                 if (command === 'fontSize') span.style.fontSize = `${value}px`;
                 if (command === 'fontName') span.style.fontFamily = value || 'Arial';
                 
                 // Extract contents and wrap
                 const contents = range.extractContents();
                 if (contents.textContent) {
                    span.appendChild(contents);
                    range.insertNode(span);
                 } else {
                     // If empty selection, insert span with zero width space to type into
                     span.innerHTML = '&#8203;';
                     range.insertNode(span);
                 }
                 // Reset range to end of span
                 range.setStartAfter(span);
                 range.setEndAfter(span);
                 selection.removeAllRanges();
                 selection.addRange(range);
             }
        } else {
            document.execCommand(command, false, value);
        }
        
        saveSelection();
        updateStats();
    };

    const insertHtmlAtCaret = (html: string) => {
        restoreSelection();
        document.execCommand('insertHTML', false, html);
        saveSelection();
        updateStats();
    };

    // SRE: IMAGE HANDLING
    const handleEditorClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'IMG') {
            setSelectedImage(target as HTMLImageElement);
            document.querySelectorAll('.sie-editor-img-selected').forEach(el => el.classList.remove('sie-editor-img-selected'));
            target.classList.add('sie-editor-img-selected');
        } else {
            setSelectedImage(null);
            document.querySelectorAll('.sie-editor-img-selected').forEach(el => el.classList.remove('sie-editor-img-selected'));
        }
    };

    const updateImageSize = (size: number) => {
        if (selectedImage) {
            selectedImage.style.width = `${size}%`;
            selectedImage.style.height = 'auto';
            updateStats();
        }
    };

    const alignImage = (align: 'left' | 'center' | 'right') => {
        if (selectedImage) {
            selectedImage.style.display = 'block';
            selectedImage.style.marginLeft = align === 'center' || align === 'right' ? 'auto' : '0';
            selectedImage.style.marginRight = align === 'center' || align === 'left' ? 'auto' : '0';
            updateStats();
        }
    };

    // Printing / Exporting
    const createPhysicalPage = (config: any, header: string, footer: string, content: Node[]) => {
        const page = document.createElement('div');
        page.className = 'sie-physical-page';
        page.style.width = `${config.widthCm}cm`;
        page.style.height = `${config.heightCm}cm`;
        page.style.backgroundColor = pageConfig.pageColor;
        page.style.position = "relative";
        page.style.overflow = "hidden";
        page.style.pageBreakAfter = "always";
        page.style.breakAfter = "page";
        page.style.display = "flex";
        page.style.flexDirection = "column";
        page.style.boxSizing = "border-box";

        const watermarkHtml = watermark.enabled ? `
            <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 0; display: flex; align-items: center; justify-content: center;">
                <div style="transform: rotate(${watermark.rotation}deg); opacity: ${watermark.opacity}; color: ${watermark.color}; font-size: ${watermark.fontSize}pt; font-family: 'Arial', sans-serif; font-weight: 900; white-space: nowrap; text-transform: uppercase;">
                    ${watermark.type === 'IMAGE' && watermark.imageUrl ? `<img src="${watermark.imageUrl}" style="transform: scale(${watermark.scale}); max-width: 80%; object-fit: contain;" />` : watermark.text}
                </div>
            </div>` : '';

        const headerDiv = document.createElement('div');
        headerDiv.innerHTML = header;
        headerDiv.style.flexShrink = '0';
        headerDiv.style.width = '100%';
        headerDiv.style.position = 'relative';
        headerDiv.style.zIndex = '2';

        const footerDiv = document.createElement('div');
        footerDiv.innerHTML = footer;
        footerDiv.style.flexShrink = '0';
        footerDiv.style.width = '100%';
        footerDiv.style.position = 'relative';
        footerDiv.style.zIndex = '2';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'content-area';
        contentDiv.style.flexGrow = '1';
        contentDiv.style.padding = `${pageConfig.margins.top}cm ${pageConfig.margins.right}cm ${pageConfig.margins.bottom}cm ${pageConfig.margins.left}cm`;
        contentDiv.style.fontFamily = "'Times New Roman', serif";
        contentDiv.style.fontSize = '11pt';
        contentDiv.style.lineHeight = '1.5';
        contentDiv.style.textAlign = 'justify';
        contentDiv.style.position = 'relative';
        contentDiv.style.zIndex = '2';
        contentDiv.style.overflow = 'hidden';

        content.forEach(node => contentDiv.appendChild(node));
        page.innerHTML = watermarkHtml;
        if(header) page.appendChild(headerDiv);
        page.appendChild(contentDiv);
        if(footer) page.appendChild(footerDiv);

        return page;
    };

    const preparePagedDOMForExport = () => {
        if (!editorRef.current || !selectedVisualId) return null;
        const visual = visualTemplates.find(v => v.id === selectedVisualId);

        let paperW = pageConfig.paperSize === 'CUSTOM' ? pageConfig.customWidth : (PAPER_SIZES[pageConfig.paperSize] || PAPER_SIZES['A4']).widthCm;
        let paperH = pageConfig.paperSize === 'CUSTOM' ? pageConfig.customHeight : (PAPER_SIZES[pageConfig.paperSize] || PAPER_SIZES['A4']).heightCm;
        if (pageConfig.orientation === 'LANDSCAPE') [paperW, paperH] = [paperH, paperW];

        const exportContainer = document.createElement('div');
        exportContainer.id = 'sie-print-container';
        exportContainer.style.width = `${paperW}cm`;
        exportContainer.style.boxSizing = 'border-box';

        const headerHtml = interpolateTemplate(visual?.header_html || '');
        const footerHtml = interpolateTemplate(visual?.footer_html || '');

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = editorRef.current.innerHTML;
        const stealthNodes = tempDiv.querySelectorAll('.sie-print-stealth');
        stealthNodes.forEach(n => n.remove());

        const page = createPhysicalPage({ widthCm: paperW, heightCm: paperH }, headerHtml, footerHtml, Array.from(tempDiv.childNodes));
        page.style.height = 'auto'; 
        page.style.minHeight = `${paperH}cm`;
        
        exportContainer.appendChild(page);
        return exportContainer;
    };

    const handlePrint = async () => {
        setIsSaving(true);
        try {
            const exportDOM = preparePagedDOMForExport();
            if (!exportDOM) return;

            const iframe = document.createElement('iframe');
            Object.assign(iframe.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' });
            document.body.appendChild(iframe);

            const doc = iframe.contentWindow?.document;
            if (!doc) return;

            doc.open();
            doc.write(`
                <html>
                <head>
                    <title>${activeDoc?.title || 'Documento'}</title>
                    <style>
                        @page { margin: 0; size: auto; }
                        body { margin: 0; padding: 0; -webkit-print-color-adjust: exact; font-family: 'Times New Roman', serif; }
                        .sie-physical-page { margin: 0; page-break-after: always; overflow: hidden; display: flex; flex-direction: column; }
                        img { max-width: 100%; }
                        table { width: 100%; border-collapse: collapse; }
                        td, th { border: 1px solid #000; padding: 4px; }
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;900&display=swap');
                    </style>
                </head>
                <body>${exportDOM.innerHTML}</body>
                </html>
            `);
            doc.close();

            iframe.onload = () => {
                setTimeout(() => {
                    iframe.contentWindow?.focus();
                    iframe.contentWindow?.print();
                    setTimeout(() => {
                        document.body.removeChild(iframe);
                        setIsSaving(false);
                    }, 1000);
                }, 800);
            };
        } catch (error) {
            console.error(error);
            showToast("Erro ao preparar impressão", "error");
            setIsSaving(false);
        }
    };

    const handleExportPDF = async () => {
        const exportDOM = preparePagedDOMForExport();
        if (!exportDOM) return;

        // @ts-ignore
        if (!window.html2pdf) {
            showToast("Biblioteca PDF não carregada.", "error");
            return;
        }

        setIsSaving(true);
        showToast("Gerando PDF de alta fidelidade...", "info");

        const hiddenWrapper = document.createElement('div');
        hiddenWrapper.style.position = 'fixed';
        hiddenWrapper.style.left = '-9999px';
        hiddenWrapper.appendChild(exportDOM);
        document.body.appendChild(hiddenWrapper);

        let paperW = pageConfig.paperSize === 'CUSTOM' ? pageConfig.customWidth : (PAPER_SIZES[pageConfig.paperSize] || PAPER_SIZES['A4']).widthCm;
        let paperH = pageConfig.paperSize === 'CUSTOM' ? pageConfig.customHeight : (PAPER_SIZES[pageConfig.paperSize] || PAPER_SIZES['A4']).heightCm;
        if (pageConfig.orientation === 'LANDSCAPE') [paperW, paperH] = [paperH, paperW];

        const opt = {
            margin: 0,
            filename: `${activeDoc?.title || 'documento'}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true, scrollY: 0 },
            jsPDF: { unit: 'cm', format: [paperW, paperH], orientation: pageConfig.orientation.toLowerCase() }
        };

        try {
            // @ts-ignore
            await window.html2pdf().set(opt).from(exportDOM).save();
            showToast("Download iniciado!", "success");
        } catch (e) {
            showToast("Erro na geração do PDF.", "error");
        } finally {
            document.body.removeChild(hiddenWrapper);
            setIsSaving(false);
        }
    };

    // AI & Actions
    const handleAIRefactor = async (commandOverride?: string) => {
        const selection = window.getSelection();
        const selectedText = selection?.toString();
        
        // SRE AI FIX: Restore selection if empty (might be lost due to modal focus)
        if (!selectedText && lastSelectionRange.current) {
            restoreSelection();
        }

        const effectiveText = window.getSelection()?.toString();
        if (!effectiveText && !commandOverride) {
            showToast("Selecione um texto para a IA processar.", "error");
            return;
        }
        
        setIsGenerating(true);
        try {
            const toneMap: any = {
                'JURIDICAL': 'Tom estritamente jurídico e formal.',
                'FORMAL': 'Tom formal e corporativo.',
                'FRIENDLY': 'Tom amigável e acessível.',
                'URGENT': 'Tom de urgência e ultimato.'
            };
            const prompt = commandOverride
                ? `Texto Base: "${effectiveText}". Ordem: ${commandOverride}. Tom: ${toneMap[aiTone]}. Retorne APENAS o HTML resultante.`
                : `Refatore juridicamente: "${effectiveText}". Tom: ${toneMap[aiTone]}. Retorne APENAS o HTML resultante.`;

            const res = await api.post('/ai/generate-document', { prompt });
            if (res.data?.text) {
                // Ensure selection is active before inserting
                restoreSelection();
                // Command to replace text
                document.execCommand('insertHTML', false, res.data.text);
                
                setIsCustomAIModalOpen(false);
                setCustomAICommand('');
                showToast("Processamento Neural Concluído", "success");
            }
        } catch (e) { showToast("Falha na refatoração neural.", "error"); }
        finally { setIsGenerating(false); }
    };

    const handleGenerate = async () => {
        if (!aiChatInput.trim() && !selectedPromptId) return;
        setIsGenerating(true);
        
        let contextFromAttachment = "";
        
        // SRE OCR Pipeline (Multiple Docs)
        if (sessionAttachments.length > 0) {
            showToast(`Processando ${sessionAttachments.length} documento(s) via OCR...`, "info");
            for (const att of sessionAttachments) {
                try {
                    const ocrRes = await api.post('/ai/ocr', {
                        image: att.data,
                        context: "Extraia o conteúdo textual completo e dados chave para redação."
                    });
                    contextFromAttachment += `\n\n--- DADOS DE FONTE (${att.name}) ---\n${JSON.stringify(ocrRes.data)}\n--- FIM DOS DADOS ---\n`;
                } catch (e) {
                    console.error("Falha no OCR do anexo:", att.name);
                }
            }
        }

        const promptTpl = savedPrompts.find(p => p.id === Number(selectedPromptId) || p.title === selectedPromptId || p.content === selectedPromptId);
        // SRE FIX: Ensure clear separation of context and instructions
        const finalPrompt = `
        ${promptTpl ? `BASE TÉCNICA: ${promptTpl.content}\n` : ''}
        ${contextFromAttachment ? `${contextFromAttachment}` : ''}
        \nINSTRUÇÃO DO USUÁRIO: ${aiChatInput}
        \n\nRETORNE APENAS HTML PURO PARA O CORPO DO DOCUMENTO.
        `;
        
        try {
            const res = await api.post('/ai/generate-document', { prompt: finalPrompt });
            if (res.data?.text && editorRef.current) {
                editorRef.current.focus();
                if (!editorRef.current.innerText.trim()) editorRef.current.innerHTML = res.data.text;
                else insertHtmlAtCaret(res.data.text);
                updateStats();
                setAiChatInput('');
                setSessionAttachments([]);
                setAttachmentName('');
                showToast("Documento Gerado com Sucesso", "success");
            }
        } catch (e) { showToast("Erro na geração neural.", "error"); }
        finally { setIsGenerating(false); }
    };

    const handleSaveAction = async () => {
        if (!editingAction?.title || !editingAction?.content) return;
        setIsSaving(true);
        try {
            const payload = {
                ...editingAction,
                category: 'SMART_ACTION',
                role_restriction: editingAction.role_restriction || 'ALL'
            };
            if (editingAction.id) await aiService.updatePrompt(editingAction.id, payload);
            else await aiService.createPrompt(payload);
            setEditingAction(null);
            loadPrompts();
            showToast("Ação Inteligente Salva", "success");
        } catch (e) { showToast("Falha ao salvar ação.", "error"); }
        finally { setIsSaving(false); }
    };

    const handleDeleteAction = async (id: number) => {
        if (confirm("Remover permanentemente?")) {
            await aiService.deletePrompt(id);
            setEditingAction(null);
            loadPrompts();
        }
    };

    // Document Management
    const handleSave = async () => {
        if (!activeDoc || !activeDoc.title) return;
        setIsSaving(true);
        setSaveStatus('SAVING');
        try {
            const content = editorRef.current?.innerHTML || '';
            const payload = {
                ...activeDoc,
                content,
                status: docStatus,
                metadata: JSON.stringify({ pageConfig, repeatHeader, repeatFooter, selectedVisualId, watermark })
            };
            if (String(activeDoc.id).startsWith('temp_')) await documentService.create(payload);
            else await documentService.update(String(activeDoc.id), payload);
            localStorage.removeItem(`sie_draft_${activeDoc.id}`);
            setSaveStatus('SUCCESS');
            showToast("Documento Sincronizado", "success");
            setTimeout(() => { setSaveStatus('IDLE'); setIsEditorOpen(false); loadDocuments(); }, 800);
        } catch (e) {
            setSaveStatus('IDLE');
            showToast("Erro ao salvar", "error");
        }
        finally { setIsSaving(false); }
    };

    const handleDuplicate = async (doc: OfficialDocument) => {
        if(!confirm("Duplicar este documento?")) return;
        setIsSaving(true);
        try {
            const payload = {
                ...doc,
                title: `${doc.title} (Cópia)`,
                status: 'DRAFT',
                id: undefined 
            };
            await documentService.create(payload);
            showToast("Documento duplicado com sucesso", "success");
            loadDocuments();
        } catch (e) {
            showToast("Erro ao duplicar", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleOpenEditor = (doc: OfficialDocument | null) => {
        setStats({ words: 0, chars: 0, pages: 1 });
        if (!doc) {
            setActiveDoc({ id: `temp_${Date.now()}`, title: 'NOVO DOCUMENTO', content: '', type: 'OFICIO', status: 'DRAFT', created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
            setDocStatus('DRAFT');
            setWatermark({ enabled: false, type: 'TEXT', text: 'CÓPIA NÃO CONTROLADA', imageUrl: '', opacity: 0.1, rotation: -45, fontSize: 60, scale: 1, color: '#000000' });
            setPageConfig({ mode: 'PAGES', applyTo: 'ALL', orientation: 'PORTRAIT', paperSize: 'A4', customWidth: 21.0, customHeight: 29.7, pageColor: '#ffffff', margins: { top: 2.5, bottom: 2.5, left: 3.0, right: 2.0 } });
            setDocHistory([]);
        } else {
            setActiveDoc(doc);
            setDocStatus(doc.status as DocStatus);
            if (!String(doc.id).startsWith('temp_')) {
                loadHistory(doc.id);
                try {
                    const meta = typeof doc.metadata === 'string' ? JSON.parse(doc.metadata) : doc.metadata;
                    if (meta?.pageConfig) setPageConfig(meta.pageConfig);
                    if (meta?.repeatHeader !== undefined) setRepeatHeader(meta.repeatHeader);
                    if (meta?.repeatFooter !== undefined) setRepeatFooter(meta.repeatFooter);
                    if (meta?.selectedVisualId) setSelectedVisualId(meta.selectedVisualId);
                    if (meta?.watermark) setWatermark(meta.watermark);
                } catch (e) { }
            } else { setDocHistory([]); }
        }
        setIsEditorOpen(true);
        setTimeout(() => {
            if (editorRef.current && doc) {
                editorRef.current.innerHTML = doc.content;
                editorRef.current.focus();
                updateStats();
            }
        }, 100);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsSaving(true);
        try {
            const res = await storageService.upload(file);
            insertHtmlAtCaret(`<img src="${res.data.url}" style="max-width: 100%; height: auto;" />`);
            showToast("Imagem Inserida", "success");
        } catch (e) { showToast("Erro no upload.", "error"); }
        finally { setIsSaving(false); }
    };

    const handleWatermarkImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsSaving(true);
        try {
            const res = await storageService.upload(file);
            setWatermark(prev => ({ ...prev, imageUrl: res.data.url, type: 'IMAGE' }));
            showToast("Marca d'água atualizada", "success");
        } catch (e) { showToast("Erro no upload da marca d'água.", "error"); }
        finally { setIsSaving(false); }
    };

    const handleAttachmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
             const r = new FileReader();
             r.onloadend = () => {
                 setSessionAttachments(prev => [...prev, { name: file.name, data: r.result as string }]);
                 setAttachmentName(`${sessionAttachments.length + 1} anexo(s)`);
             };
             r.readAsDataURL(file);
        }
    };

    const handleSmartAction = (action: any) => {
        setSelectedPromptId(action.content);
        if (action.autoAttach && sessionAttachments.length === 0) {
            showToast("Anexe um documento de base.", "info");
            attachmentInputRef.current?.click();
        }
    };

    const toggleStealthMode = () => {
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;
        const range = selection.getRangeAt(0);
        const span = document.createElement('span');
        span.className = 'sie-print-stealth';
        span.title = 'Invisível na Impressão';
        span.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
        span.style.border = '1px dashed #ef4444';
        span.appendChild(range.extractContents());
        range.insertNode(span);
        updateStats();
    };

    const handleInsertPresidentDossier = () => {
        if (!systemInfo.president_name) {
            showToast("Dados do Presidente não localizados no Kernel. Inserindo placeholder.", "info");
        }
        const dossierHtml = `
            <div class="sie-president-dossier" style="margin-top: 40px; padding: 20px; border: 1px dashed #cbd5e1; border-radius: 12px; width: fit-content; min-width: 300px; page-break-inside: avoid; display: flex; flex-direction: column; align-items: center;">
                <div style="text-align: center; margin-bottom: 10px;">
                    ${systemInfo.president_signature ? `<img src="${systemInfo.president_signature}" style="max-height: 80px; width: auto; cursor: pointer; max-width: 100%;" alt="Assinatura" />` : '<div style="height: 60px; width: 200px; border-bottom: 1px solid #000; margin-bottom: 5px;"></div>'}
                </div>
                <p style="text-align: center; font-weight: 900; margin: 0; text-transform: uppercase; font-size: 11pt;">${systemInfo.president_name || "NOME DO PRESIDENTE (EDITAR)"}</p>
                <p style="text-align: center; font-weight: 400; margin: 0; color: #64748b; font-size: 9pt;">PRESIDENTE • CPF: ${systemInfo.president_cpf || '---'}</p>
            </div>
        `;
        insertHtmlAtCaret(dossierHtml);
    };

    const handleInsertTable = () => {
        const tableHtml = `
            <table style="width: 100%; border-collapse: collapse; margin: 1em 0;">
                <thead><tr><th style="border: 1px solid #000; padding: 8px; background: #f0f0f0;">Col 1</th><th style="border: 1px solid #000; padding: 8px; background: #f0f0f0;">Col 2</th></tr></thead>
                <tbody><tr><td style="border: 1px solid #000; padding: 8px;">Dados</td><td style="border: 1px solid #000; padding: 8px;">Dados</td></tr></tbody>
            </table><br/>
        `;
        insertHtmlAtCaret(tableHtml);
    };

    return (
        <div className="h-full flex flex-col gap-6 animate-fade-in relative bg-slate-50">
            <div className="fixed bottom-6 right-6 z-[11000] flex flex-col gap-2 pointer-events-none">
                {toasts.map(t => (
                    <div key={t.id} className={`p-4 rounded-xl shadow-2xl border flex items-center gap-3 animate-slide-in-right pointer-events-auto ${t.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : t.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-slate-900 text-white'}`}>
                        {t.type === 'success' && <CheckCircle2 size={20} />}
                        {t.type === 'error' && <AlertCircle size={20} />}
                        {t.type === 'info' && <CheckCircle2 size={20} />}
                        <span className="text-[10px] font-black uppercase tracking-wide">{t.message}</span>
                    </div>
                ))}
            </div>

            <input type="file" id="editor-image-upload" className="hidden" onChange={handleImageUpload} accept="image/*" />
            <input type="file" ref={attachmentInputRef} className="hidden" onChange={handleAttachmentUpload} />
            <input type="file" ref={watermarkFileRef} className="hidden" onChange={handleWatermarkImageUpload} accept="image/*" />

            {/* Header */}
            <header className="bg-slate-900 p-8 rounded-[3rem] shadow-xl text-white shrink-0 overflow-hidden relative flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="flex items-center gap-6 relative z-10">
                    <div className="p-4 bg-indigo-600 rounded-2xl shadow-lg" style={primaryColorStyle}><FileSignature size={28} /></div>
                    <div>
                        <h2 className="text-2xl font-black tracking-tighter uppercase leading-none">Hub de Documentos</h2>
                        <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mt-2">SRE Repositório & Editorial V6.5</p>
                    </div>
                </div>
                <div className="flex gap-4 relative z-10">
                    <button onClick={() => setIsTemplateBuilderOpen(true)} className="px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl font-black text-[9px] uppercase tracking-widest transition-all flex items-center gap-2 active:scale-95">
                        <LayoutTemplate size={16} /> Construtor de Templates
                    </button>
                    <button onClick={() => setIsActionManagerOpen(true)} className="px-6 py-3 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl font-black text-[9px] uppercase tracking-widest transition-all flex items-center gap-2 active:scale-95">
                        <Palette size={16} /> Gestor de Prompts
                    </button>
                    {canManage && (
                        <button onClick={() => handleOpenEditor(null)} className="px-10 py-4 bg-indigo-600 hover:bg-indigo-50 text-white rounded-xl font-black text-[11px] uppercase tracking-widest shadow-2xl flex items-center gap-3 transition-all active:scale-95" style={primaryColorStyle}>
                            <Plus size={20} /> Redigir Protocolo
                        </button>
                    )}
                </div>
            </header>

            {/* Document List */}
            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm flex flex-1 overflow-hidden mx-2 mb-2 flex-col">
                <div className="p-8 border-b bg-slate-50/30 flex justify-between items-center shrink-0">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input type="text" placeholder="Filtrar base documental..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-[11px] font-black uppercase focus:border-indigo-500 shadow-inner" />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{documents.length} Arquivos no Ledger</span>
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
                                            <Clock size={12} /> {new Date(doc.updated_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <div className="mt-8 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                        <button onClick={() => handleDuplicate(doc)} className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-emerald-600 rounded-xl shadow-sm" title="Duplicar"><Copy size={16} /></button>
                                        <button onClick={() => handleOpenEditor(doc)} className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 rounded-xl shadow-sm"><Edit2 size={16} /></button>
                                        <button onClick={(e) => { e.stopPropagation(); if (confirm("Remover?")) documentService.delete(doc.id).then(loadDocuments); }} className="p-3 bg-white border border-slate-200 text-slate-300 hover:text-rose-600 rounded-xl shadow-sm"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Editor Overlay */}
            {isEditorOpen && activeDoc && (
                <div className="fixed inset-0 z-[9995] bg-slate-900/95 backdrop-blur-md flex items-center justify-center p-0 md:p-4 animate-fade-in">
                    <div className="bg-white w-full h-full flex flex-col overflow-hidden shadow-2xl relative transition-all duration-300 md:rounded-[2rem] max-w-[1920px]">
                        
                        <WatermarkModal isOpen={isWatermarkModalOpen} onClose={() => setIsWatermarkModalOpen(false)} watermark={watermark} setWatermark={setWatermark} fileRef={watermarkFileRef} />
                        <PageConfigModal isOpen={isPageConfigOpen} onClose={() => setIsPageConfigOpen(false)} pageConfig={pageConfig} setPageConfig={setPageConfig} />
                        <ActionManagerModal isOpen={isActionManagerOpen} onClose={() => setIsActionManagerOpen(false)} quickActions={quickActions} editingAction={editingAction} setEditingAction={setEditingAction} onSave={handleSaveAction} onDelete={handleDeleteAction} isSaving={isSaving} />
                        <CustomAIModal isOpen={isCustomAIModalOpen} onClose={() => setIsCustomAIModalOpen(false)} tone={aiTone} setTone={setAiTone} command={customAICommand} setCommand={setCustomAICommand} onExecute={handleAIRefactor} isGenerating={isGenerating} />
                        <GhostwriterModal isOpen={isGhostwriterModalOpen} onClose={() => setIsGhostwriterModalOpen(false)} onInsert={insertHtmlAtCaret} systemInfo={systemInfo} />
                        
                        {/* Editor Toolbar Header */}
                        <div className="h-20 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 shadow-2xl relative z-[100] border-b border-white/5">
                            <div className="flex items-center gap-5">
                                <div className="p-3 bg-indigo-600 rounded-xl" style={primaryColorStyle}><FileEdit size={20} /></div>
                                <div>
                                    <input className="bg-transparent font-black text-lg uppercase tracking-tight outline-none w-80 focus:border-b border-white/20" value={activeDoc.title} onChange={e => setActiveDoc({ ...activeDoc, title: e.target.value.toUpperCase() })} />
                                    <p className="text-[9px] text-indigo-400 font-black uppercase tracking-widest mt-0.5">SRE Editorial Master Core</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button onClick={() => setIsPageConfigOpen(true)} className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10" title="Configurações de Página"><Settings2 size={18} /></button>
                                <button onClick={() => setIsWatermarkModalOpen(true)} className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10" title="Marca D'água"><Stamp size={18} /></button>
                                <button onClick={handlePrint} className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10" title="Imprimir Corretamente"><Printer size={18} /></button>
                                <button onClick={handleExportPDF} className="p-3 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10" title="Exportar PDF"><Download size={18} /></button>
                                <select className="bg-white/10 border border-white/10 rounded-lg px-4 py-2 text-[10px] font-black uppercase outline-none" value={docStatus} onChange={e => setDocStatus(e.target.value as DocStatus)}>
                                    {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k} className="text-slate-900">{v.label}</option>)}
                                </select>
                                <button onClick={handleSave} disabled={isSaving} className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2">
                                    {isSaving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />} {saveStatus === 'SUCCESS' ? 'SINCRONIZADO' : 'COMMITAR'}
                                </button>
                                <button onClick={() => setIsEditorOpen(false)} className="p-3 hover:bg-rose-500 text-slate-400 rounded-xl ml-2"><X size={24} /></button>
                            </div>
                        </div>

                        {/* Main Editor Area */}
                        <div className="flex-1 flex flex-col overflow-hidden bg-slate-100 relative">
                            {/* Format Toolbar (Relative, Flex-Wrap for accessibility) */}
                            <div className="w-full border-b border-slate-200 bg-white z-[90] flex flex-wrap items-center justify-between px-6 py-2 gap-2 shadow-sm min-h-[64px] shrink-0">
                                
                                <div className="flex flex-wrap items-center gap-1">
                                     <button onMouseDown={e => { e.preventDefault(); handleFormat('undo'); }} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"><Undo2 size={18} /></button>
                                     <button onMouseDown={e => { e.preventDefault(); handleFormat('redo'); }} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"><Redo2 size={18} /></button>
                                     
                                     <div className="h-6 w-px bg-slate-200 mx-1" />

                                     <select className="h-9 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black uppercase px-2 outline-none w-24" onChange={(e) => handleFormat('fontName', e.target.value)}>
                                        {FONT_FAMILIES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                                     </select>
                                     <select className="h-9 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black uppercase px-2 outline-none w-16" onChange={(e) => handleFormat('fontSize', e.target.value)}>
                                        {FONT_SIZES.map(s => <option key={s} value={s}>{s}px</option>)}
                                     </select>

                                     <div className="h-6 w-px bg-slate-200 mx-1" />

                                     <button onMouseDown={e => { e.preventDefault(); handleFormat('bold'); }} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"><Bold size={18} /></button>
                                     <button onMouseDown={e => { e.preventDefault(); handleFormat('italic'); }} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"><Italic size={18} /></button>
                                     <button onMouseDown={e => { e.preventDefault(); handleFormat('underline'); }} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"><Underline size={18} /></button>
                                     <button onMouseDown={e => { e.preventDefault(); handleFormat('strikeThrough'); }} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"><TypeOutline size={18} /></button>

                                     <div className="h-6 w-px bg-slate-200 mx-1" />

                                     <button onMouseDown={e => { e.preventDefault(); handleFormat('justifyLeft'); }} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"><AlignLeft size={18} /></button>
                                     <button onMouseDown={e => { e.preventDefault(); handleFormat('justifyCenter'); }} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"><AlignCenter size={18} /></button>
                                     <button onMouseDown={e => { e.preventDefault(); handleFormat('justifyRight'); }} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"><AlignRight size={18} /></button>
                                     <button onMouseDown={e => { e.preventDefault(); handleFormat('justifyFull'); }} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"><AlignJustify size={18} /></button>
                                     
                                     <div className="h-6 w-px bg-slate-200 mx-1" />

                                     <button onMouseDown={e => { e.preventDefault(); handleFormat('insertUnorderedList'); }} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"><List size={18} /></button>
                                     <button onMouseDown={e => { e.preventDefault(); handleFormat('insertOrderedList'); }} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"><ListOrdered size={18} /></button>
                                     
                                     <div className="h-6 w-px bg-slate-200 mx-1" />

                                     <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-1 border border-slate-200">
                                         <label className="cursor-pointer p-1 hover:bg-white rounded" title="Cor do Texto">
                                             <Baseline size={16} className="text-slate-600"/>
                                             <input type="color" className="hidden" onChange={e => handleFormat('foreColor', e.target.value)} />
                                         </label>
                                     </div>
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                    {selectedImage ? (
                                        <div className="flex items-center gap-2 bg-indigo-50 px-2 py-1 rounded-xl border border-indigo-100">
                                            <span className="text-[9px] font-black text-indigo-600 uppercase">Imagem:</span>
                                            <button onClick={() => updateImageSize(25)} className="px-2 py-1 bg-white rounded text-[8px] font-bold text-indigo-500 hover:bg-indigo-100">25%</button>
                                            <button onClick={() => updateImageSize(50)} className="px-2 py-1 bg-white rounded text-[8px] font-bold text-indigo-500 hover:bg-indigo-100">50%</button>
                                            <button onClick={() => updateImageSize(100)} className="px-2 py-1 bg-white rounded text-[8px] font-bold text-indigo-500 hover:bg-indigo-100">100%</button>
                                            <div className="w-px h-4 bg-indigo-200 mx-1"></div>
                                            <button onClick={() => alignImage('left')} className="p-1 hover:bg-white rounded"><AlignLeft size={12} className="text-indigo-500"/></button>
                                            <button onClick={() => alignImage('center')} className="p-1 hover:bg-white rounded"><AlignCenter size={12} className="text-indigo-500"/></button>
                                            <button onClick={() => alignImage('right')} className="p-1 hover:bg-white rounded"><AlignRight size={12} className="text-indigo-500"/></button>
                                        </div>
                                    ) : (
                                        <>
                                            <button onMouseDown={e => { e.preventDefault(); handleInsertTable(); }} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500" title="Inserir Tabela"><TableIcon size={18} /></button>
                                            <button onMouseDown={e => { e.preventDefault(); document.getElementById('editor-image-upload')?.click(); }} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500" title="Inserir Imagem"><ImageIcon size={18} /></button>
                                            
                                            <div className="h-6 w-px bg-slate-200 mx-1" />

                                            <div className="relative">
                                                <button onClick={() => setIsVariablePickerOpen(!isVariablePickerOpen)} className="p-2.5 px-4 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all font-black text-[10px] uppercase flex items-center gap-2">
                                                    <Braces size={14} /> Variáveis
                                                </button>
                                                {isVariablePickerOpen && (
                                                    <div className="absolute top-12 left-0 w-48 bg-white border border-slate-200 rounded-xl shadow-xl p-2 z-[100]">
                                                        {['nome_presidente', 'cpf_presidente', 'data_atual', 'cnpj', 'entidade', 'cidade'].map(v => (
                                                            <button key={v} onClick={() => { insertHtmlAtCaret(`{${v}} `); setIsVariablePickerOpen(false); }} className="w-full text-left p-2 hover:bg-slate-50 text-[10px] font-bold uppercase text-slate-600 rounded-lg">
                                                                {v.replace('_', ' ')}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            <button onClick={() => setIsGhostwriterModalOpen(true)} className="p-2.5 px-4 bg-fuchsia-100 text-fuchsia-700 rounded-xl hover:bg-fuchsia-600 hover:text-white transition-all font-black text-[10px] uppercase flex items-center gap-2 shadow-sm border border-fuchsia-200">
                                                <PenTool size={14} /> Ghostwriter
                                            </button>

                                            <button onClick={handleInsertPresidentDossier} className="p-2.5 px-4 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all font-black text-[10px] uppercase flex items-center gap-2">
                                                <UserCog size={14} /> Assinatura
                                            </button>
                                            <button onClick={toggleStealthMode} className="p-2.5 px-4 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-800 hover:text-white transition-all font-black text-[10px] uppercase flex items-center gap-2">
                                                <Ghost size={14} /> Stealth
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Content Wrapper */}
                            <div className="flex-1 flex overflow-hidden relative">
                                {/* Sidebar - Tools & History */}
                                <div className="w-[380px] border-r bg-white flex flex-col shrink-0 overflow-y-auto custom-scrollbar z-[80] shadow-[5px_0_15px_-5px_rgba(0,0,0,0.05)]">
                                    <div className="flex bg-slate-50 p-2 shrink-0 border-b sticky top-0 z-50">
                                        <button onClick={() => setShowHistory(false)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!showHistory ? 'bg-white text-indigo-600 shadow-md border border-indigo-100' : 'text-slate-400 hover:text-slate-600'}`}>Assistente IA</button>
                                        <button onClick={() => setShowHistory(true)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${showHistory ? 'bg-white text-indigo-600 shadow-md border border-indigo-100' : 'text-slate-400 hover:text-slate-600'}`}>Versões</button>
                                    </div>
                                    <div className="p-8 space-y-10">
                                        {!showHistory ? (
                                            <>
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center">
                                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Sparkles size={14} className="text-indigo-600" /> Ações Rápidas</h4>
                                                        <button onClick={() => setIsActionManagerOpen(true)} className="p-2 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-lg transition-all"><Settings2 size={14} /></button>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        {quickActions.map(action => (
                                                            <button
                                                                key={action.id}
                                                                onClick={() => handleSmartAction(action)}
                                                                className={`p-4 rounded-3xl border flex flex-col items-center justify-center gap-3 transition-all hover:shadow-lg active:scale-95 ${selectedPromptId === action.content ? 'bg-white border-indigo-500 shadow-xl ring-2 ring-indigo-500/10' : 'bg-slate-50 border-slate-100 hover:bg-white'}`}
                                                            >
                                                                <div className={`p-3 rounded-2xl bg-indigo-50 text-indigo-600`}><Zap size={20} /></div>
                                                                <span className="text-[9px] font-black uppercase text-slate-600 text-center leading-tight">{action.title}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><BrainCircuit size={14} className="text-indigo-600" /> Redação Neural</h4>
                                                    <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-200 space-y-4 shadow-inner">
                                                        <textarea
                                                            rows={4}
                                                            className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-xs font-medium uppercase outline-none focus:border-indigo-500 shadow-sm"
                                                            placeholder="Instruções livres..."
                                                            value={aiChatInput}
                                                            onChange={e => setAiChatInput(e.target.value)}
                                                        />
                                                        {sessionAttachments.length > 0 && (
                                                            <div className="space-y-2">
                                                                {sessionAttachments.map((att, idx) => (
                                                                    <div key={idx} className="flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-100 rounded-lg">
                                                                        <ScanLine size={12} className="text-emerald-600"/>
                                                                        <span className="text-[8px] font-black text-emerald-700 uppercase truncate flex-1">{att.name}</span>
                                                                        <button onClick={() => setSessionAttachments(prev => prev.filter((_, i) => i !== idx))} className="text-rose-500"><X size={12}/></button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                        <div className="flex gap-2">
                                                            <button onClick={() => attachmentInputRef.current?.click()} className={`flex-1 py-3 border rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2 transition-all ${sessionAttachments.length > 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white border-slate-200 text-slate-400'}`}><Paperclip size={14} /> Anexo</button>
                                                            <button onClick={handleGenerate} disabled={isGenerating} className="flex-[1.5] py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase shadow-lg hover:bg-indigo-600 transition-all flex items-center justify-center gap-2">
                                                                {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />} Gerar
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Palette size={14} /> Papel Timbrado</h4>
                                                    <select className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-[10px] font-black uppercase outline-none focus:border-indigo-500 transition-all" value={selectedVisualId || ''} onChange={e => setSelectedVisualId(Number(e.target.value))}>
                                                        {visualTemplates.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                                    </select>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="space-y-4 animate-fade-in">
                                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Clock size={14} /> Snapshots</h4>
                                                {docHistory.length === 0 ? <p className="text-[10px] text-slate-400 italic">Sem versões para este documento.</p> : docHistory.map((version, vIdx) => (
                                                    <button key={version.id} onClick={() => { if (confirm("Restaurar?")) { if (editorRef.current) editorRef.current.innerHTML = version.content; updateStats(); } }} className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[2rem] text-left hover:border-indigo-500 transition-all group">
                                                        <span className="text-[8px] font-black uppercase text-indigo-600">Snapshot #{docHistory.length - vIdx}</span>
                                                        <p className="text-[9px] text-slate-400 font-bold mt-2">{new Date(version.created_at).toLocaleString()}</p>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Canvas Area */}
                                <div className="flex-1 overflow-y-auto bg-slate-200/50 p-10 flex flex-col items-center custom-scrollbar relative" onClick={() => editorRef.current?.focus()}>
                                    <div className="sticky top-0 right-0 w-full flex justify-end z-[70] mb-6 pointer-events-none">
                                        <div className="flex bg-white/80 backdrop-blur-md p-1.5 rounded-2xl shadow-lg border border-white/20 pointer-events-auto" onClick={e => e.stopPropagation()}>
                                            <button onClick={() => setZoomLevel(Math.max(30, zoomLevel - 10))} className="p-2.5 hover:bg-slate-100 rounded-xl"><ZoomOut size={16} /></button>
                                            <span className="px-4 flex items-center text-[10px] font-black text-slate-600">{zoomLevel}%</span>
                                            <button onClick={() => setZoomLevel(Math.min(150, zoomLevel + 10))} className="p-2.5 hover:bg-slate-100 rounded-xl"><ZoomIn size={16} /></button>
                                        </div>
                                    </div>

                                    <div className="relative transition-all duration-300 origin-top flex flex-col gap-10" style={{ transform: `scale(${zoomLevel / 100})` }}>
                                        {Array.from({ length: stats.pages }).map((_, i) => {
                                            const isFirst = i === 0;
                                            const showH = isFirst || (repeatHeader && pageConfig.mode === 'PAGES');
                                            const showF = i === stats.pages - 1 || (repeatFooter && pageConfig.mode === 'PAGES');
                                            const visual = visualTemplates.find(v => v.id === selectedVisualId);

                                            let paperW = pageConfig.paperSize === 'CUSTOM' ? pageConfig.customWidth : (PAPER_SIZES[pageConfig.paperSize] || PAPER_SIZES['A4']).widthCm;
                                            let paperH = pageConfig.paperSize === 'CUSTOM' ? pageConfig.customHeight : (PAPER_SIZES[pageConfig.paperSize] || PAPER_SIZES['A4']).heightCm;
                                            if (pageConfig.orientation === 'LANDSCAPE') [paperW, paperH] = [paperH, paperW];

                                            return (
                                                <div key={i} className="bg-white shadow-[0_40px_100px_rgba(0,0,0,0.1)] relative transition-all" style={{ width: `${paperW}cm`, height: pageConfig.mode === 'PAGRELESS' ? 'auto' : `${paperH}cm`, minHeight: pageConfig.mode === 'PAGRELESS' ? '100%' : 'auto', backgroundColor: pageConfig.pageColor }}>
                                                    {watermark.enabled && (
                                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden" style={{ zIndex: 1 }}>
                                                            <div style={{ transform: `rotate(${watermark.rotation}deg)`, opacity: watermark.opacity, color: watermark.color, fontSize: `${watermark.fontSize}pt`, fontFamily: 'Inter, sans-serif', fontWeight: 900, whiteSpace: 'nowrap', textTransform: 'uppercase' }}>
                                                                {watermark.type === 'IMAGE' && watermark.imageUrl 
                                                                    ? <img src={watermark.imageUrl} style={{ transform: `scale(${watermark.scale})`, maxWidth: '80%', objectFit: 'contain' }} alt="Watermark" />
                                                                    : watermark.text}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {showH && (
                                                        <header className="absolute top-0 left-0 w-full pointer-events-none z-[4]" dangerouslySetInnerHTML={{ __html: interpolateTemplate(visual?.header_html || '') }} />
                                                    )}
                                                    {isFirst && (
                                                        <div
                                                            ref={editorRef}
                                                            contentEditable
                                                            suppressContentEditableWarning
                                                            className="absolute inset-0 outline-none text-slate-800 font-medium leading-[1.6] text-justify relative z-[10]"
                                                            onInput={updateStats}
                                                            onBlur={saveSelection}
                                                            onKeyUp={saveSelection}
                                                            onMouseUp={saveSelection}
                                                            onClick={handleEditorClick}
                                                            style={{
                                                                fontFamily: "'Times New Roman', serif",
                                                                height: pageConfig.mode === 'PAGRELESS' ? 'auto' : '100%',
                                                                minHeight: '100%',
                                                                paddingTop: `${pageConfig.margins.top + (showH ? 2 : 0)}cm`,
                                                                paddingBottom: `${pageConfig.margins.bottom + (showF ? 2 : 0)}cm`,
                                                                paddingLeft: `${pageConfig.margins.left}cm`,
                                                                paddingRight: `${pageConfig.margins.right}cm`,
                                                                overflow: 'visible',
                                                            }}
                                                        />
                                                    )}
                                                    {showF && (
                                                        <footer className="absolute bottom-0 left-0 w-full pointer-events-none z-[4]" dangerouslySetInnerHTML={{ __html: interpolateTemplate(visual?.footer_html || '') }} />
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="h-20 shrink-0" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            <ActionManagerModal isOpen={isActionManagerOpen} onClose={() => setIsActionManagerOpen(false)} quickActions={quickActions} editingAction={editingAction} setEditingAction={setEditingAction} onSave={handleSaveAction} onDelete={handleDeleteAction} isSaving={isSaving} />
            <VisualTemplateManager isOpen={isTemplateBuilderOpen} onClose={() => setIsTemplateBuilderOpen(false)} systemInfo={systemInfo} onTemplateUpdate={loadVisualTemplates} />
            
            <style>{`
                .sie-print-stealth { position: relative; }
                .sie-editor-img-selected { outline: 3px solid #6366f1; cursor: pointer; }
                @media print { 
                    .sie-print-stealth { display: none !important; } 
                    body * { visibility: hidden; }
                    body::before {
                        content: "⚠️ Use o botão de IMPRIMIR na barra de ferramentas.";
                        visibility: visible;
                        position: absolute; top: 50%; left: 50%;
                        transform: translate(-50%, -50%);
                        font-size: 18pt; text-align: center; width: 80%;
                    }
                }
                .sie-president-dossier { break-inside: avoid; page-break-inside: avoid; }
                [contenteditable]:focus { outline: none; }
                .sie-variable-badge { pointer-events: none; user-select: none; }
                @keyframes slide-in-right {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .animate-slide-in-right { animation: slide-in-right 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default DocumentHub;
