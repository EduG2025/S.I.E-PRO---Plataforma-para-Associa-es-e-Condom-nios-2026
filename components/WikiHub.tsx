import React, { useState, useEffect, useMemo } from 'react';
import { 
    BookOpen, Search, ChevronRight, FileText, Palette, 
    Shield, Zap, Cpu, Terminal, Loader2, Edit3, Save, 
    Trash2, Plus, Sparkles, X, History, Info, BrainCircuit, Scale,
    CheckCircle2, Database, Book, Layers, Brain, Send, Landmark,
    ShoppingBag, Camera, LayoutGrid, Leaf, Activity, MessageSquare,
    Maximize2, Minimize2, Wand2, BookMarked, Share2, Printer,
    Wrench, LifeBuoy, FileCode
} from 'lucide-react';
import api from '../services/api';
import { SystemInfo } from '../types';
import { MENU_ITEMS } from '../constants';

/**
 * S.I.E WIKI HUB V3.3 - SRE VIEWPORT ESCAPE
 * Protocolo SRE: Correção de Contenção de Overlay e Expansão Neural.
 */

interface WikiEntry {
    id: number;
    category: string;
    title: string;
    slug: string;
    content: string;
    is_system: number;
    updated_at: string;
}

const CATEGORY_MAP: Record<string, { label: string, icon: any, color: string, bg: string, border: string }> = {
    'CORE': { label: 'Núcleo SRE', icon: Cpu, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100' },
    'STRATEGIC': { label: 'Estratégico', icon: LayoutGrid, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
    'FINANCE': { label: 'Financeiro', icon: Landmark, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    'GOVERNANCE': { label: 'Governança', icon: Shield, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
    'OPERATIONAL': { label: 'Operacional', icon: Terminal, color: 'text-slate-700', bg: 'bg-slate-100', border: 'border-slate-200' },
    'COMMUNITY': { label: 'Comunitário', icon: ShoppingBag, color: 'text-pink-600', bg: 'bg-pink-50', border: 'border-pink-100' },
    'AI': { label: 'Inteligência', icon: BrainCircuit, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100' },
    'ESG': { label: 'S.I.E Green', icon: Leaf, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-100' },
    'DESIGN': { label: 'Studio Lab', icon: Palette, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-100' }
};

const WikiHub = ({ systemInfo }: { systemInfo: SystemInfo }) => {
    const [entries, setEntries] = useState<WikiEntry[]>([]);
    const [selectedEntry, setSelectedEntry] = useState<WikiEntry | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isExpanding, setIsExpanding] = useState(false);
    const [isReaderMode, setIsReaderMode] = useState(false);
    const [isIngesting, setIsIngesting] = useState(false);
    const [isAutoDocLoading, setIsAutoDocLoading] = useState(false);
    const [showIngestionModal, setShowIngestionModal] = useState(false);
    const [rawIngestionText, setRawIngestionText] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('ALL');
    const [readingProgress, setReadingProgress] = useState(0);

    const categories = useMemo(() => [
        { id: 'ALL', label: 'Todos os Recursos', icon: Layers, color: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-100' },
        ...Object.entries(CATEGORY_MAP).map(([id, cfg]) => ({ id, ...cfg }))
    ], []);

    useEffect(() => { loadWiki(); }, []);

    const loadWiki = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/settings/wiki');
            const data = res.data.data || [];
            setEntries(data);
            if (data.length > 0 && !selectedEntry) setSelectedEntry(data[0]);
        } catch (e) { console.error("Wiki Engine Fail"); }
        finally { setIsLoading(false); }
    };

    const handleSaveEntry = async () => {
        if (!selectedEntry) return;
        try {
            if (selectedEntry.id) await api.put(`/settings/wiki/${selectedEntry.id}`, selectedEntry);
            else await api.post('/settings/wiki', selectedEntry);
            setIsEditing(false);
            loadWiki();
        } catch (e) { alert("Erro ao sincronizar Wiki."); }
    };

    const handleAutoGenerateManuals = async () => {
        if (!confirm("O Kernel irá analisar todos os módulos ativos e gerar manuais técnicos automáticos. Continuar?")) return;
        setIsAutoDocLoading(true);
        try {
            const modules = MENU_ITEMS.map(m => ({ id: m.id, label: m.label, category: m.category }));
            const res = await api.post('/ai/generate-system-manuals', { modules });
            alert(`✅ Sincronia Concluída: ${res.data.count} manuais gerados.`);
            loadWiki();
        } catch (e) { alert("Falha na Auto-Documentação."); }
        finally { setIsAutoDocLoading(false); }
    };

    const handleNeuralExpansion = async () => {
        if (!selectedEntry) return;
        setIsExpanding(true);
        try {
            const prompt = `Expanda tecnicamente o conteúdo abaixo: ${selectedEntry.title}. Retorne HTML semântico.`;
            const res = await api.post('/ai/generate-document', { prompt });
            setSelectedEntry({ ...selectedEntry, content: res.data.text });
            setIsEditing(true);
        } catch (e) { alert("Falha na Expansão Neural."); }
        finally { setIsExpanding(false); }
    };

    const handleNeuralIngestion = async () => {
        if (!rawIngestionText.trim()) return;
        setIsIngesting(true);
        try {
            const res = await api.post('/ai/bulk-wiki-ingestion', { rawText: rawIngestionText });
            alert(`✅ Sucesso! ${res.data.count} tópicos documentados.`);
            setShowIngestionModal(false);
            setRawIngestionText('');
            loadWiki();
        } catch (e) { alert("Falha na Ingestão."); } finally { setIsIngesting(false); }
    };

    const handleScroll = (e: React.UIEvent<HTMLElement>) => {
        const target = e.currentTarget;
        const progress = (target.scrollTop / (target.scrollHeight - target.clientHeight)) * 100;
        setReadingProgress(progress);
    };

    const filteredEntries = entries.filter(e => 
        (activeCategory === 'ALL' || e.category === activeCategory) &&
        (e.title.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const activeCatConfig = selectedEntry ? CATEGORY_MAP[selectedEntry.category] || CATEGORY_MAP.OPERATIONAL : CATEGORY_MAP.OPERATIONAL;

    return (
        <div className={`relative w-full h-[calc(100vh-250px)] transition-all duration-500 ${isReaderMode ? 'fixed inset-4 z-[9999] !h-[calc(100vh-32px)] bg-white rounded-[2rem] shadow-2xl' : ''}`}>
            
            {/* WRAPPER COM ANIMAÇÃO (Desacoplado do modal) */}
            <div className={`flex h-full bg-white rounded-[2rem] md:rounded-[3.5rem] border border-slate-200 overflow-hidden shadow-2xl animate-fade-in flex-col md:flex-row h-full`}>
                
                {/* SIDEBAR */}
                <aside className={`w-full md:w-80 lg:w-[350px] border-r border-slate-100 bg-slate-50/50 flex flex-col shrink-0 transition-all ${isReaderMode ? 'md:w-0 overflow-hidden opacity-0' : 'h-1/3 md:h-full opacity-100'}`}>
                    <div className="p-6 border-b bg-white/80 backdrop-blur-md sticky top-0 z-10 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-[10px] font-black uppercase text-slate-900 tracking-widest flex items-center gap-2">
                                <BookMarked size={14} className="text-indigo-600"/> Wiki Hub
                            </h3>
                            <div className="flex gap-1.5">
                                 <button onClick={handleAutoGenerateManuals} disabled={isAutoDocLoading} className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-all">
                                    {isAutoDocLoading ? <Loader2 size={16} className="animate-spin"/> : <Wand2 size={16}/>}
                                </button>
                                 <button onClick={() => setShowIngestionModal(true)} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-all">
                                    <Brain size={16}/>
                                </button>
                            </div>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                            <input type="text" placeholder="BUSCAR..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 h-10 bg-white border border-slate-200 rounded-xl text-[9px] font-black uppercase outline-none focus:border-indigo-500 shadow-sm" />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                        {filteredEntries.map(entry => (
                            <button key={entry.id} onClick={() => { setSelectedEntry(entry); setIsEditing(false); }} className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${selectedEntry?.id === entry.id ? 'bg-white border-indigo-500 shadow-lg scale-[1.01]' : 'bg-white border-slate-100 hover:border-indigo-200'}`}>
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="p-2 bg-slate-50 rounded-lg"><Cpu size={12} className="text-indigo-600"/></div>
                                    <p className="text-[10px] font-black uppercase truncate text-slate-700">{entry.title}</p>
                                </div>
                                <ChevronRight size={12} className="text-slate-300"/>
                            </button>
                        ))}
                    </div>
                </aside>

                {/* MAIN */}
                <main className="flex-1 bg-white overflow-hidden flex flex-col relative h-2/3 md:h-full">
                    <div className="absolute top-0 left-0 w-full h-1 bg-slate-100 z-[60]">
                        <div className="h-full bg-indigo-600 transition-all duration-200" style={{ width: `${readingProgress}%` }} />
                    </div>

                    {selectedEntry ? (
                        <>
                            <div className="h-16 px-6 border-b bg-slate-900 text-white flex justify-between items-center shrink-0 z-20">
                                <h2 className="text-xs font-black uppercase tracking-tight truncate max-w-xs">{selectedEntry.title}</h2>
                                <div className="flex gap-2">
                                    {isEditing ? (
                                        <button onClick={handleSaveEntry} className="px-5 py-2 bg-emerald-600 text-white rounded-lg font-black text-[8px] uppercase tracking-widest flex items-center gap-2">
                                            <Save size={12}/> Sincronizar
                                        </button>
                                    ) : (
                                        <button onClick={() => setIsEditing(true)} className="px-5 py-2 bg-white text-slate-900 rounded-lg font-black text-[8px] uppercase tracking-widest shadow-lg flex items-center gap-2">
                                            <Edit3 size={12}/> Editar
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 md:p-16 custom-scrollbar bg-[#fdfdfe]" onScroll={handleScroll}>
                                {isEditing ? (
                                    <textarea rows={15} className="w-full bg-slate-900 text-emerald-400 font-mono p-8 text-[11px] rounded-3xl outline-none shadow-inner resize-none leading-relaxed" value={selectedEntry.content} onChange={e => setSelectedEntry({...selectedEntry, content: e.target.value})} />
                                ) : (
                                    <article className="max-w-3xl mx-auto animate-fade-in pb-20">
                                        <div className="wiki-content prose prose-slate max-w-none">
                                            <div 
                                                className="text-sm text-slate-800 font-medium leading-relaxed uppercase tracking-tight whitespace-pre-wrap"
                                                style={{ fontSize: 'calc(var(--sie-font-base) * 0.85)' }}
                                                dangerouslySetInnerHTML={{ __html: selectedEntry.content }}
                                            />
                                        </div>
                                    </article>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-10 opacity-10">
                            <BookOpen size={80} className="text-slate-300" />
                            <h3 className="text-lg font-black uppercase tracking-[0.3em] mt-6">Selecione um Artigo</h3>
                        </div>
                    )}
                </main>
            </div>

            {/* NEURAL INGESTION MODAL - SRE FULL ESCAPE */}
            {showIngestionModal && (
                <div className="sie-editor-overlay !z-[9999999]">
                    <div className="sie-modal-container !h-auto !max-w-4xl self-center border border-white/10 shadow-[0_0_150px_rgba(0,0,0,0.8)]">
                        <div className="h-16 px-8 bg-indigo-600 text-white flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-4">
                                <Brain size={20} className="animate-pulse" />
                                <div>
                                    <h3 className="font-black text-sm uppercase tracking-tighter">Ingestão Neural Ativa</h3>
                                    <p className="text-indigo-100 text-[8px] font-black uppercase tracking-widest mt-0.5 opacity-80">Manual Digitalization Pipeline v4.3 • SRE ESCAPE</p>
                                </div>
                            </div>
                            <button onClick={() => setShowIngestionModal(false)} className="p-3 hover:bg-white/10 rounded-xl transition-all"><X size={24}/></button>
                        </div>
                        
                        <div className="p-6 md:p-12 space-y-8 flex-1 bg-white">
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] ml-1 flex items-center gap-2">
                                    <MessageSquare size={14} className="text-indigo-600"/> Base de Conhecimento para Doutrina
                                </label>
                                <textarea 
                                    rows={12} 
                                    className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] p-8 text-[12px] font-mono text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-all shadow-inner uppercase leading-relaxed resize-none" 
                                    placeholder="COLE AQUI ATAS, PROTOCOLOS OU REGIMENTOS BRUTOS PARA O KERNEL PROCESSAR..."
                                    value={rawIngestionText}
                                    onChange={e => setRawIngestionText(e.target.value)}
                                />
                            </div>
                            <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-[2.5rem] flex items-start gap-5 shadow-sm">
                                <div className="p-3 bg-white rounded-2xl text-indigo-600 shadow-sm"><Sparkles size={20} className="animate-pulse" /></div>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-indigo-900 font-black uppercase tracking-widest leading-none m-0">Processamento SRE Ativo</p>
                                    <p className="text-[9px] text-indigo-800/70 font-bold uppercase leading-relaxed m-0">
                                        O Kernel fragmentará o texto em artigos técnicos modulares para consulta imediata via Advisor Neural e Repositório Wiki.
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-8 border-t bg-slate-50 flex justify-between items-center shrink-0">
                            <button onClick={() => setShowIngestionModal(false)} className="px-8 py-4 text-slate-400 font-black text-[11px] uppercase tracking-widest hover:text-slate-600 transition-colors">Cancelar Operação</button>
                            <button 
                                onClick={handleNeuralIngestion} 
                                disabled={isIngesting || !rawIngestionText.trim()}
                                className="px-12 py-4 bg-indigo-600 text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-2xl hover:bg-indigo-700 transition-all flex items-center gap-4 disabled:opacity-50 active:scale-95"
                            >
                                {isIngesting ? <Loader2 className="animate-spin" size={16}/> : <Send size={16}/>} Iniciar Ingestão
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WikiHub;