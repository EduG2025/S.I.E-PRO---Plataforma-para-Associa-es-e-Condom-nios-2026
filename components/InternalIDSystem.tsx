import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Fingerprint, Layout, Layers, Box, Type as TypeIcon, Image as ImageIcon, 
  Settings as SettingsIcon, Eye, Save, Trash2, Move, RotateCw, 
  AlignCenter, AlignLeft, AlignRight, Printer, Sparkles, ScanLine, Building2, 
  RefreshCcw, X, Edit3, Globe, ShieldCheck, Cpu, Download, ArrowRight,
  Palette, Wand2, Loader2, CheckCircle2, ListFilter, Clock, CheckCircle,
  Search, UserCheck, Smartphone, Zap, FileJson, History, Grid3X3,
  ArrowUp, ArrowDown, Maximize, Square, QrCode as QrIcon, Upload, Copy,
  RotateCcw
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { SystemInfo, User } from '../types';
import { systemService, userService } from '../services/api';

interface CardElement {
    id: string;
    type: 'text-static' | 'text-dynamic' | 'image' | 'shape' | 'qrcode';
    field?: string;
    value?: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
    style: React.CSSProperties;
}

interface IDStudioProps {
    systemInfo: SystemInfo;
}

const INITIAL_TEMPLATE = (sys: SystemInfo): { front: CardElement[], back: CardElement[] } => ({
    front: [
        { id: 'header-bg', type: 'shape' as const, x: 0, y: 0, width: 600, height: 85, style: { backgroundColor: '#0f5d34', zIndex: 1, borderRadius: '0px' } },
        { id: 'header-logo', type: 'image' as const, field: 'logoUrl', x: 20, y: 10, width: 65, height: 65, style: { zIndex: 5, backgroundColor: 'transparent', borderRadius: '50%' } },
        { id: 'assoc-title', type: 'text-static' as const, value: 'ASSOCIAÇÃO DE MORADORES DE CACARIA', x: 100, y: 30, width: 480, height: 30, style: { color: '#ffffff', fontSize: '20px', fontWeight: '900', textAlign: 'left' as const, zIndex: 10, letterSpacing: '0.05em' } },
        { id: 'member-photo', type: 'image' as const, field: 'photoUrl', x: 30, y: 105, width: 160, height: 175, style: { borderRadius: '15px', border: '2px solid #0f5d34', zIndex: 10, backgroundColor: '#f8fafc' } },
        { id: 'role-badge', type: 'shape' as const, x: 30, y: 290, width: 160, height: 30, style: { backgroundColor: '#0f5d34', borderRadius: '20px', zIndex: 10 } },
        { id: 'role-text', type: 'text-dynamic' as const, field: 'role', x: 30, y: 295, width: 160, height: 20, style: { color: '#ffffff', fontSize: '11px', fontWeight: '900', textAlign: 'center' as const, zIndex: 11, textTransform: 'uppercase' as const } },
        { id: 'lbl-name', type: 'text-static' as const, value: 'NOME COMPLETO', x: 210, y: 115, width: 150, height: 15, style: { fontSize: '10px', color: '#64748b', fontWeight: '800', zIndex: 10 } },
        { id: 'val-name', type: 'text-dynamic' as const, field: 'name', x: 210, y: 140, width: 370, height: 30, style: { fontSize: '22px', fontWeight: '900', color: '#0f172a', zIndex: 10, textAlign: 'left' as const } },
        { id: 'lbl-rg', type: 'text-static' as const, value: 'RG', x: 210, y: 180, width: 150, height: 15, style: { fontSize: '10px', color: '#64748b', fontWeight: '800', zIndex: 10 } },
        { id: 'val-rg', type: 'text-dynamic' as const, field: 'rg', x: 210, y: 200, width: 150, height: 25, style: { fontSize: '16px', fontWeight: '900', color: '#0f172a', zIndex: 10 } },
        { id: 'lbl-birth', type: 'text-static' as const, value: 'NASCIMENTO', x: 400, y: 180, width: 150, height: 15, style: { fontSize: '10px', color: '#64748b', fontWeight: '800', zIndex: 10 } },
        { id: 'val-birth', type: 'text-dynamic' as const, field: 'birth_date', x: 400, y: 200, width: 150, height: 25, style: { fontSize: '16px', fontWeight: '900', color: '#0f172a', zIndex: 10 } },
        { id: 'lbl-cpf', type: 'text-static' as const, value: 'CPF', x: 210, y: 240, width: 150, height: 15, style: { fontSize: '10px', color: '#64748b', fontWeight: '800', zIndex: 10 } },
        { id: 'val-cpf', type: 'text-dynamic' as const, field: 'cpf_cnpj', x: 210, y: 260, width: 180, height: 25, style: { fontSize: '16px', fontWeight: '900', color: '#0f172a', zIndex: 10 } },
        { id: 'watermark-amc', type: 'image' as const, field: 'logoUrl', x: 420, y: 180, width: 220, height: 220, style: { zIndex: 2, opacity: 0.1, backgroundColor: 'transparent' } },
        { id: 'footer-bg', type: 'shape' as const, x: 0, y: 335, width: 600, height: 45, style: { backgroundColor: '#f9c32c', zIndex: 1, borderRadius: '0px' } },
        { id: 'footer-txt', type: 'text-static' as const, value: 'Rua Manoel Eiras N 117 | CEP 27175-000 | Cacaria - Pirai/RJ    CNPJ: 05.548.399/0001-63', x: 10, y: 350, width: 580, height: 20, style: { fontSize: '10px', fontWeight: '900', color: '#000000', textAlign: 'center' as const, zIndex: 10 } }
    ],
    back: [
      { id: 'back-bg', type: 'shape' as const, x: 0, y: 0, width: 600, height: 380, style: { backgroundColor: '#ffffff', zIndex: 1 } },
      { id: 'back-logo', type: 'image' as const, field: 'logoUrl', x: 150, y: 20, width: 300, height: 250, style: { zIndex: 5, opacity: 1 } },
      { id: 'back-signature', type: 'image' as const, field: 'signature', x: 200, y: 250, width: 200, height: 80, style: { zIndex: 6, opacity: 1, borderBottom: '1px solid #ccc' } },
      { id: 'back-role-title', type: 'text-static' as const, value: 'PRESIDENTE', x: 100, y: 340, width: 400, height: 20, style: { fontSize: '12px', fontWeight: '800', textAlign: 'center' as const, color: '#000000', zIndex: 7 } }
    ]
});

const CardRenderer = ({ template, data, editMode, onSelect, selectedId, onUpdate, snapGrid = 1, systemInfo }: any) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const draggingRef = useRef<{id: string, startX: number, startY: number, initialX: number, initialY: number} | null>(null);

    const handleMouseDown = (e: React.MouseEvent, el: CardElement) => {
        if (!editMode) return;
        e.stopPropagation();
        onSelect(el.id);
        draggingRef.current = {
            id: el.id,
            startX: e.clientX,
            startY: e.clientY,
            initialX: el.x,
            initialY: el.y
        };
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!draggingRef.current || !onUpdate) return;
        const dx = e.clientX - draggingRef.current.startX;
        const dy = e.clientY - draggingRef.current.startY;
        
        let newX = draggingRef.current.initialX + dx;
        let newY = draggingRef.current.initialY + dy;

        newX = Math.round(newX / snapGrid) * snapGrid;
        newY = Math.round(newY / snapGrid) * snapGrid;

        onUpdate(draggingRef.current.id, { x: newX, y: newY });
    }, [onUpdate, snapGrid]);

    const handleMouseUp = () => {
        draggingRef.current = null;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };

    if (!Array.isArray(template)) return null;

    return (
        <div 
            ref={containerRef}
            className="relative bg-white shadow-2xl rounded-[24px] overflow-hidden shrink-0" 
            style={{ width: '600px', height: '380px', transformOrigin: 'center' }}
        >
            {template.map((el: CardElement) => {
                const isSelected = selectedId === el.id;
                const content = String(el.type === 'text-dynamic' ? (data?.[el.field!] ?? '---') : (el.value ?? ''));
                let displayContent = content;
                if (el.field === 'birth_date' && content && content !== '---') {
                    try { displayContent = new Date(content).toLocaleDateString('pt-BR'); } catch(e) { displayContent = '---'; }
                }
                
                return (
                    <div 
                        key={el.id}
                        onMouseDown={(e) => handleMouseDown(e, el)}
                        className={`absolute flex items-center overflow-visible transition-shadow select-none ${editMode ? 'cursor-move' : ''} ${isSelected ? 'ring-2 ring-indigo-500 z-50 shadow-2xl scale-[1.01]' : ''}`}
                        style={{
                            left: el.x, 
                            top: el.y, 
                            width: el.width, 
                            height: el.height,
                            transform: `rotate(${el.rotation || 0}deg)`,
                            ...el.style,
                            justifyContent: el.style.textAlign === 'center' ? 'center' : el.style.textAlign === 'right' ? 'flex-end' : 'flex-start',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {el.type.startsWith('text') && <span className="uppercase tracking-tight leading-none" style={{ display: 'inline-block' }}>{displayContent}</span>}
                        {el.type === 'image' && <img src={el.field === 'photoUrl' ? (data?.avatar_url || 'https://via.placeholder.com/300') : (el.field === 'logoUrl' ? systemInfo.logoUrl : (el.field === 'signature' ? systemInfo.president_signature : el.value))} className="w-full h-full object-contain pointer-events-none" alt="Asset" />}
                        {el.type === 'shape' && <div className="w-full h-full" style={{ backgroundColor: el.style.backgroundColor }} />}
                        {el.type === 'qrcode' && (
                            <div className="w-full h-full bg-slate-100 flex items-center justify-center border border-slate-200">
                                <QrIcon size={Math.min(el.width, el.height) * 0.7} className="text-slate-800" />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

const NavAction = ({ icon: Icon, active, onClick, label }: { icon: any, active?: boolean, onClick: () => void, label: string }) => (
    <button onClick={onClick} className={`group relative p-4 rounded-[20px] transition-all duration-300 ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 scale-110' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
        <Icon size={24} />
        <span className="absolute left-full ml-5 px-3 py-1.5 bg-slate-800 text-white text-[9px] font-black rounded-lg opacity-0 group-hover:opacity-100 transition-all uppercase tracking-widest whitespace-nowrap z-[100] pointer-events-none shadow-2xl">{label}</span>
    </button>
);

const ToolBtn = ({ icon: Icon, label, onClick }: { icon: any, label: string, onClick: () => void }) => (
    <button onClick={onClick} className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-[20px] border border-slate-100 hover:border-indigo-400 hover:bg-white hover:shadow-xl transition-all group">
        <Icon size={18} className="text-slate-400 group-hover:text-indigo-600 mb-2" />
        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none text-center">{label}</span>
    </button>
);

const SectionHeader = ({ icon: Icon, title }: { icon: any, title: string }) => (
    <h3 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">
        <Icon size={14} className="text-indigo-500" /> {title}
    </h3>
);

const InputGroup = ({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) => (
    <div className="space-y-2">
        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">{label}</label>
        <input type="text" value={value} onChange={e => onChange(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none uppercase" />
    </div>
);

const PropInput = ({ label, value, onChange }: { label: string, value: any, onChange: (v: string) => void }) => (
    <div className="space-y-2">
        <label className="text-[9px] font-black text-slate-400 uppercase block">{label}</label>
        <input type="number" value={value} onChange={e => onChange(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500" />
    </div>
);

const SelectGroup = ({ label, value, options, onChange }: { label: string, value: string, options: any[], onChange: (v: string) => void }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase block">{label}</label>
        <div className="relative">
            <select value={value} onChange={e => onChange(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase outline-none focus:border-indigo-500 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23007CB2%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%0-5-1.9-9.2-5.5-12.8z%22/%3E%3C/svg%3E')] bg-[length:12px] bg-[right_1rem_center] bg-no-repeat uppercase">
                {options.map((o: any) => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
        </div>
    </div>
);

const InternalIDSystem = ({ systemInfo }: IDStudioProps) => {
    const [view, setView] = useState<'DASHBOARD' | 'EDITOR' | 'QUEUE'>('DASHBOARD');
    const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);
    const [queueFilter, setQueueFilter] = useState<'PENDING' | 'ACTIVE'>('PENDING');
    const [showGrid, setShowGrid] = useState(true);
    const [snapGrid, setSnapGrid] = useState(5);
    
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [template, setTemplate] = useState<{front: CardElement[], back: CardElement[]}>(() => {
        try {
            const saved = systemInfo.module_metadata?.id_template;
            const parsed = saved ? (typeof saved === 'string' ? JSON.parse(saved) : saved) : null;
            if (parsed && Array.isArray(parsed.front) && Array.isArray(parsed.back)) {
                return parsed;
            }
        } catch (e) {
            console.error("SRE ID Template Corruption detected. Reverting to AMC Standard.");
        }
        return INITIAL_TEMPLATE(systemInfo);
    });

    const loadRealData = async () => {
        setIsLoadingUsers(true);
        try {
            const res = await userService.getAll(1, 1000); 
            setUsers(res.data.data || []);
        } finally { setIsLoadingUsers(false); }
    };

    useEffect(() => { loadRealData(); }, []);

    const handleAddElement = (type: CardElement['type']) => {
        const newEl: CardElement = {
            id: `el-${Date.now()}`,
            type,
            x: 50, y: 50, width: type === 'shape' ? 100 : type === 'image' ? 100 : 200, height: type === 'shape' ? 100 : type === 'image' ? 100 : 40,
            style: { 
                fontSize: '14px', 
                color: type === 'shape' ? '#115e3b' : '#1e293b',
                fontWeight: '700',
                backgroundColor: type === 'shape' ? '#115e3b' : 'transparent',
                zIndex: template[activeSide].length + 1,
                textAlign: 'left',
                borderRadius: '0px',
                borderWidth: '0px',
                borderColor: '#000000',
                opacity: 1,
                padding: '2px' 
            },
            value: type === 'text-static' ? 'NOVO TEXTO' : type === 'qrcode' ? 'https://sie.pro' : type === 'image' ? 'https://via.placeholder.com/150' : '',
            field: type === 'text-dynamic' ? 'name' : undefined
        };
        setTemplate(prev => ({ ...prev, [activeSide]: [...prev[activeSide], newEl] }));
        setSelectedId(newEl.id);
    };

    const duplicateElement = (id: string) => {
        const el = template[activeSide].find(e => e.id === id);
        if (!el) return;
        const newEl = { 
            ...el, 
            id: `el-dup-${Date.now()}`, 
            x: el.x + 20, 
            y: el.y + 20,
            style: { ...el.style, zIndex: template[activeSide].length + 1 }
        };
        setTemplate(prev => ({ ...prev, [activeSide]: [...prev[activeSide], newEl] }));
        setSelectedId(newEl.id);
    };

    const updateElement = useCallback((id: string, updates: Partial<CardElement>) => {
        setTemplate(prev => ({
            ...prev,
            [activeSide]: prev[activeSide].map(el => el.id === id ? { ...el, ...updates } : el)
        }));
    }, [activeSide]);

    const handleAssetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !selectedId) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            updateElement(selectedId, { value: reader.result as string, field: undefined });
        };
        reader.readAsDataURL(file);
    };

    const moveLayer = (id: string, direction: 'up' | 'down') => {
        const currentLayers = [...template[activeSide]];
        const idx = currentLayers.findIndex(l => l.id === id);
        if (idx === -1) return;

        const newIdx = direction === 'up' ? idx + 1 : idx - 1;
        if (newIdx < 0 || newIdx >= currentLayers.length) return;

        const tempArr = [...currentLayers];
        const tempItem = tempArr[idx];
        tempArr[idx] = tempArr[newIdx];
        tempArr[newIdx] = tempItem;

        setTemplate(prev => ({ ...prev, [activeSide]: tempArr }));
    };

    const handleSaveMaster = async (targetTemplate = template) => {
        setIsSaving(true);
        try {
            const newMetadata = {
                ...(systemInfo.module_metadata || {}),
                id_template: targetTemplate
            };
            await systemService.updateInfo({ ...systemInfo, module_metadata: newMetadata });
            alert("✅ LAYOUT MESTRE SINCRONIZADO NO KERNEL.");
        } catch (e) { alert("Erro ao sincronizar com o banco."); } 
        finally { setIsSaving(false); }
    };

    const handleResetToDefault = async () => {
        if (!confirm("Isso apagará o layout customizado atual e restaurará o padrão AMC. Continuar?")) return;
        const defaults = INITIAL_TEMPLATE(systemInfo);
        setTemplate(defaults);
        await handleSaveMaster(defaults);
    };

    const exportCard = async (user: User) => {
        const el = document.getElementById('card-render-zone');
        if (!el) return;
        
        setIsSaving(true);
        try {
            await new Promise(r => setTimeout(r, 300));
            const canvas = await html2canvas(el, { 
                scale: 3, 
                useCORS: true, 
                allowTaint: true,
                backgroundColor: null,
                logging: false,
                scrollX: 0,
                scrollY: -window.scrollY,
                onclone: (clonedDoc) => {
                    const clonedEl = clonedDoc.getElementById('card-render-zone');
                    if (clonedEl) {
                        clonedEl.style.transform = 'none'; 
                        clonedEl.style.overflow = 'visible';
                    }
                }
            });
            const link = document.createElement('a');
            link.download = `ID_${user.name.replace(/\s+/g, '_')}.png`;
            link.href = canvas.toDataURL('image/png', 1.0);
            link.click();
            alert(`✅ IDENTIDADE DE ${user.name} GERADA COM SUCESSO.`);
        } catch (e) {
            console.error("Export Fail:", e);
            alert("❌ Erro ao gerar imagem.");
        } finally {
            setIsSaving(false);
        }
    };

    const selectedElement = Array.isArray(template[activeSide]) 
        ? template[activeSide].find(el => el.id === selectedId) 
        : null;

    const primaryColor = systemInfo.primaryColor || '#115e3b';

    return (
        <div className="flex h-full w-full bg-[#f1f5f9] animate-fade-in overflow-hidden relative">
            <aside className="w-20 lg:w-24 bg-slate-900 flex flex-col items-center py-10 gap-8 z-40 shadow-2xl relative shrink-0">
                <div className="absolute top-0 right-0 w-1 h-full bg-white/5"></div>
                <div className="w-12 h-12 lg:w-14 lg:h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-indigo-500/20 rotate-3 active:scale-95 transition-all cursor-pointer">
                    <Fingerprint size={28} />
                </div>
                <div className="flex flex-col gap-6">
                    <NavAction icon={Building2} active={view === 'DASHBOARD'} onClick={() => setView('DASHBOARD')} label="Emissor" />
                    <NavAction icon={Layers} active={view === 'EDITOR'} onClick={() => setView('EDITOR')} label="Editor Canvas" />
                    <NavAction icon={Clock} active={view === 'QUEUE'} onClick={() => setView('QUEUE')} label="Fila Produção" />
                </div>
                <div className="mt-auto space-y-4">
                     <NavAction icon={RotateCcw} onClick={handleResetToDefault} label="Restaurar Padrão" />
                     <NavAction icon={Download} onClick={() => {
                        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(template, null, 2));
                        const link = document.createElement('a');
                        link.href = dataStr; link.download = `sie_template_${Date.now()}.json`; link.click();
                     }} label="Baixar JSON" />
                     <NavAction icon={Save} onClick={() => handleSaveMaster()} label="Commitar DB" />
                </div>
            </aside>

            <div className="flex-1 flex flex-col min-w-0">
                <header className="h-20 lg:h-24 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-12 shrink-0 z-30 shadow-sm">
                    <div className="flex items-center gap-6">
                        <div className="w-1.5 h-10 rounded-full" style={{ backgroundColor: primaryColor }}></div>
                        <div>
                            <h1 className="text-xl lg:text-2xl font-black tracking-tightest uppercase">{view === 'DASHBOARD' ? 'Emissão de Identidades' : view === 'EDITOR' ? 'Configurar Template' : 'Linha de Produção'}</h1>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                                <ShieldCheck size={12} className="text-emerald-500" /> S.I.E REAL DATA SYNC V3.0
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {view === 'EDITOR' && (
                            <div className="flex items-center gap-3 mr-4">
                                <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner mr-2">
                                    <button onClick={() => setShowGrid(!showGrid)} className={`p-2 rounded-lg transition-all ${showGrid ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`} title="Toggle Grid"><Grid3X3 size={16}/></button>
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-slate-400 uppercase ml-1 mb-0.5">Snap Grid</span>
                                    <select value={snapGrid} onChange={e => setSnapGrid(Number(e.target.value))} className="h-9 bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase outline-none focus:border-indigo-500 px-2">
                                        <option value={1}>Off</option>
                                        <option value={5}>5px</option>
                                        <option value={10}>10px</option>
                                        <option value={20}>20px</option>
                                    </select>
                                </div>
                            </div>
                        )}
                        <div className="hidden sm:flex items-center gap-4 border-l pl-6 border-slate-100">
                            <div className="text-right">
                                <p className="text-[9px] font-black text-slate-400 uppercase">{systemInfo.shortName}</p>
                                <p className="text-xs font-black text-slate-800 uppercase">Status: ONLINE</p>
                            </div>
                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 shadow-sm overflow-hidden">
                                {systemInfo.logoUrl ? <img src={systemInfo.logoUrl} className="p-1.5 object-contain h-full w-full" alt="Logo" /> : <Globe size={18} className="text-slate-300" />}
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-hidden relative">
                    {view === 'DASHBOARD' && (
                        <div className="h-full flex animate-fade-in flex-col lg:flex-row">
                            <div className="w-full lg:w-[420px] bg-white border-r border-slate-200 flex flex-col shrink-0">
                                <div className="p-6 border-b bg-slate-50/50">
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                                        <input type="text" placeholder="FILTRAR MEMBRO REAL..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-12 pr-6 h-12 bg-white border border-slate-200 rounded-xl text-xs font-bold uppercase outline-none focus:border-indigo-500 shadow-sm transition-all" />
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                                    {isLoadingUsers ? <div className="p-10 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={32}/></div> : 
                                    users.filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase())).map(user => (
                                        <button key={user.id} onClick={() => setSelectedUser(user)} className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center gap-4 group ${selectedUser?.id === user.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-100 hover:border-indigo-200'}`}>
                                            <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shadow-sm shrink-0">
                                                <img src={user.avatar_url || 'https://via.placeholder.com/100'} className="w-full h-full object-cover" alt="Avatar" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className={`text-sm font-black uppercase truncate ${selectedUser?.id === user.id ? 'text-white' : 'text-slate-800'}`}>{user.name}</p>
                                                <p className={`text-[9px] font-bold uppercase ${selectedUser?.id === user.id ? 'text-indigo-200' : 'text-slate-400'}`}>Unid. {user.unit} • {user.role}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex-1 bg-[#eeeff3] flex flex-col items-center justify-center p-6 lg:p-12 relative overflow-hidden">
                                {selectedUser ? (
                                    <div className="flex flex-col items-center gap-8 animate-scale-in">
                                        <div className="bg-white p-1 rounded-2xl shadow-xl z-20 border border-slate-200 flex">
                                            <button onClick={() => setActiveSide('front')} className={`px-10 py-2.5 rounded-xl text-[10px] font-black transition-all ${activeSide === 'front' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-600'}`}>FRENTE</button>
                                            <button onClick={() => setActiveSide('back')} className={`px-10 py-2.5 rounded-xl text-[10px] font-black transition-all ${activeSide === 'back' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-600'}`}>VERSO</button>
                                        </div>
                                        <div id="card-render-zone" className="shadow-[0_50px_100px_rgba(0,0,0,0.2)] rounded-[24px] overflow-hidden">
                                            <CardRenderer template={template[activeSide]} data={selectedUser} systemInfo={systemInfo} />
                                        </div>
                                        <button onClick={() => exportCard(selectedUser)} disabled={isSaving} className="px-12 py-5 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:bg-indigo-600 transition-all flex items-center gap-4 active:scale-95 disabled:opacity-50">
                                            {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Printer size={18}/>} 
                                            Gerar Identidade Final
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-center space-y-4 opacity-20">
                                        <Fingerprint size={80} className="mx-auto text-slate-400" />
                                        <h3 className="text-xl font-black uppercase tracking-widest text-slate-500">Selecione um Membro</h3>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {view === 'EDITOR' && (
                        <div className="h-full flex animate-in slide-in-from-right duration-500 flex-col lg:flex-row">
                            <div className="w-full lg:w-72 bg-white border-r border-slate-200 p-6 flex flex-col gap-8 shrink-0 overflow-y-auto">
                                <SectionHeader icon={Palette} title="Construtor" />
                                <div className="grid grid-cols-2 gap-2">
                                    <ToolBtn icon={TypeIcon} label="Texto Estático" onClick={() => handleAddElement('text-static')} />
                                    <ToolBtn icon={RefreshCcw} label="Campo Ledger" onClick={() => handleAddElement('text-dynamic')} />
                                    <ToolBtn icon={ImageIcon} label="Imagem / Foto" onClick={() => handleAddElement('image')} />
                                    <ToolBtn icon={Box} label="Forma / Bloco" onClick={() => handleAddElement('shape')} />
                                    <ToolBtn icon={QrIcon} label="QR Code" onClick={() => handleAddElement('qrcode')} />
                                </div>
                                <div className="flex-1 space-y-4">
                                    <SectionHeader icon={Layers} title="Pilha de Camadas" />
                                    <div className="space-y-1">
                                        {Array.isArray(template[activeSide]) && [...template[activeSide]].reverse().map((el, revIdx, arr) => {
                                            const originalIdx = arr.length - 1 - revIdx;
                                            return (
                                                <div key={el.id} onClick={() => setSelectedId(el.id)} className={`p-3 rounded-xl border flex justify-between items-center transition-all cursor-pointer ${selectedId === el.id ? 'bg-indigo-50 border-indigo-200 text-indigo-700 ring-2 ring-indigo-500/20' : 'bg-slate-50 border-slate-100 text-slate-500 hover:border-slate-200'}`}>
                                                    <div className="flex flex-col gap-0.5 min-w-0">
                                                        <span className="text-[10px] font-black uppercase truncate">{el.type === 'text-dynamic' ? `{${el.field}}` : el.type === 'shape' ? 'BLOCO' : el.type === 'qrcode' ? 'QRCODE' : 'TEXTO'}</span>
                                                        <span className="text-[8px] font-bold text-slate-400 uppercase">Nível {originalIdx + 1}</span>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <button onClick={(e) => { e.stopPropagation(); moveLayer(el.id, 'up'); }} className="p-1 hover:text-indigo-600 disabled:opacity-20" disabled={originalIdx === template[activeSide].length - 1}><ArrowUp size={12}/></button>
                                                        <button onClick={(e) => { e.stopPropagation(); moveLayer(el.id, 'down'); }} className="p-1 hover:text-indigo-600 disabled:opacity-20" disabled={originalIdx === 0}><ArrowDown size={12}/></button>
                                                        <button onClick={(e) => { e.stopPropagation(); setTemplate(prev => ({...prev, [activeSide]: prev[activeSide].filter(it => it.id !== el.id)})); }} className="p-1 hover:text-rose-500 ml-1"><Trash2 size={12}/></button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 bg-[#eeeff3] flex flex-col items-center justify-center p-6 lg:p-12 relative overflow-hidden">
                                <div className="mb-8 bg-white p-1 rounded-2xl shadow-lg z-20 border border-slate-200 flex">
                                    <button onClick={() => setActiveSide('front')} className={`px-10 py-2.5 rounded-xl text-[10px] font-black transition-all ${activeSide === 'front' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-600'}`}>EDITOR FRENTE</button>
                                    <button onClick={() => setActiveSide('back')} className={`px-10 py-2.5 rounded-xl text-[10px] font-black transition-all ${activeSide === 'back' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-600'}`}>EDITOR VERSO</button>
                                </div>
                                <div className="relative p-6 bg-white/50 backdrop-blur-md border-2 border-white rounded-[40px] shadow-2xl">
                                    {showGrid && <div className="absolute inset-0 z-0 pointer-events-none opacity-10 rounded-[40px] overflow-hidden" style={{ backgroundImage: `radial-gradient(#000 1px, transparent 1px)`, backgroundSize: `${snapGrid * 4}px ${snapGrid * 4}px` }}></div>}
                                    <CardRenderer template={template[activeSide]} data={users[0] || {}} editMode onSelect={setSelectedId} selectedId={selectedId} onUpdate={updateElement} snapGrid={snapGrid} systemInfo={systemInfo} />
                                </div>
                            </div>
                            <div className="w-full lg:w-[380px] bg-white border-l border-slate-200 p-8 overflow-y-auto shrink-0 shadow-xl custom-scrollbar">
                                {selectedElement ? (
                                    <div className="space-y-8 animate-fade-in">
                                        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                                             <SectionHeader icon={SettingsIcon} title="Propriedades" />
                                             <div className="flex gap-2">
                                                <button onClick={() => duplicateElement(selectedId!)} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-all"><Copy size={16}/></button>
                                                <button onClick={() => setSelectedId(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><X size={16}/></button>
                                             </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <PropInput label="Posição X" value={selectedElement.x} onChange={(v) => updateElement(selectedId!, {x: Math.round(Number(v) / snapGrid) * snapGrid})} />
                                            <PropInput label="Posição Y" value={selectedElement.y} onChange={(v) => updateElement(selectedId!, {y: Math.round(Number(v) / snapGrid) * snapGrid})} />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <PropInput label="Largura" value={selectedElement.width} onChange={(v) => updateElement(selectedId!, {width: Math.round(Number(v) / snapGrid) * snapGrid})} />
                                            <PropInput label="Altura" value={selectedElement.height} onChange={(v) => updateElement(selectedId!, {height: Math.round(Number(v) / snapGrid) * snapGrid})} />
                                        </div>
                                        <PropInput label="Rotação (deg)" value={selectedElement.rotation || 0} onChange={(v) => updateElement(selectedId!, {rotation: parseInt(v)})} />
                                        <div className="space-y-4 pt-4 border-t border-slate-100">
                                            <SectionHeader icon={Palette} title="Aparência" />
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase">Opacidade</label>
                                                    <input type="range" min="0" max="1" step="0.1" className="w-full accent-indigo-600" value={selectedElement.style.opacity as number || 1} onChange={e => updateElement(selectedId!, {style: {...selectedElement.style, opacity: parseFloat(e.target.value)}})} />
                                                </div>
                                                <PropInput label="Raio Borda" value={parseInt(selectedElement.style.borderRadius as string || '0')} onChange={(v) => updateElement(selectedId!, {style: {...selectedElement.style, borderRadius: `${v}px` }})} />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <PropInput label="Borda Espessura" value={parseInt(selectedElement.style.borderWidth as string || '0')} onChange={(v) => updateElement(selectedId!, {style: {...selectedElement.style, borderWidth: `${v}px`, borderStyle: 'solid' }})} />
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase">Cor Borda</label>
                                                    <input type="color" className="w-full h-10 rounded-lg cursor-pointer border border-slate-200" value={selectedElement.style.borderColor as string || '#000000'} onChange={e => updateElement(selectedId!, {style: {...selectedElement.style, borderColor: e.target.value}})} />
                                                </div>
                                            </div>
                                        </div>
                                        {selectedElement.type === 'image' && (
                                            <div className="space-y-6 pt-4 border-t border-slate-100">
                                                <SectionHeader icon={ImageIcon} title="Asset da Imagem" />
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Upload Asset</label>
                                                    <label className="w-full flex items-center justify-center gap-3 py-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-indigo-50 hover:border-indigo-400 transition-all group">
                                                        <Upload size={18} className="text-slate-400 group-hover:text-indigo-600" />
                                                        <span className="text-[10px] font-black uppercase text-slate-500">Selecionar</span>
                                                        <input type="file" className="hidden" accept="image/*" onChange={handleAssetUpload} />
                                                    </label>
                                                </div>
                                                <SelectGroup label="Ou Vincular Ledger" value={selectedElement.field || ''} options={[{v: '', l: 'Sem vínculo'}, {v: 'photoUrl', l: 'Foto Membro'}, {v: 'logoUrl', l: 'Logo Entidade'}, {v: 'signature', l: 'Assinatura'}]} onChange={(v) => updateElement(selectedId!, {field: v})} />
                                            </div>
                                        )}
                                        {selectedElement.type.startsWith('text') && (
                                            <div className="space-y-6 pt-4 border-t border-slate-100">
                                                {selectedElement.type === 'text-dynamic' ? (
                                                    <SelectGroup label="Campo Ledger" value={selectedElement.field || ''} options={[
                                                        {v: 'name', l: 'Nome Completo'}, 
                                                        {v: 'cpf_cnpj', l: 'CPF/ID'}, 
                                                        {v: 'unit', l: 'Unidade'}, 
                                                        {v: 'role', l: 'Papel SRE'}, 
                                                        {v: 'birth_date', l: 'Nascimento'},
                                                        {v: 'email', l: 'E-mail Oficial'},
                                                        {v: 'phone', l: 'Telefone Contato'},
                                                        {v: 'membership_id', l: 'ID Protocolo'}
                                                    ]} onChange={(v) => updateElement(selectedId!, {field: v})} />
                                                ) : (
                                                    <InputGroup label="Texto Fixo" value={selectedElement.value || ''} onChange={(v) => updateElement(selectedId!, {value: v})} />
                                                )}
                                                <div className="grid grid-cols-2 gap-4">
                                                    <PropInput label="Fonte (px)" value={parseInt(selectedElement.style.fontSize as string || '14')} onChange={(v) => updateElement(selectedId!, {style: {...selectedElement.style, fontSize: `${v}px` }})} />
                                                    <div className="space-y-2">
                                                        <label className="text-[10px] font-black text-slate-400 uppercase">Cor</label>
                                                        <input type="color" className="w-full h-10 rounded-lg cursor-pointer border border-slate-200" value={selectedElement.style.color as string} onChange={e => updateElement(selectedId!, {style: {...selectedElement.style, color: e.target.value}})} />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase">Alinhamento</label>
                                                    <div className="flex bg-slate-50 p-1 rounded-xl gap-1">
                                                        <button onClick={() => updateElement(selectedId!, {style: {...selectedElement.style, textAlign: 'left'}})} className={`flex-1 p-2 rounded-lg flex justify-center ${selectedElement.style.textAlign === 'left' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><AlignLeft size={16}/></button>
                                                        <button onClick={() => updateElement(selectedId!, {style: {...selectedElement.style, textAlign: 'center'}})} className={`flex-1 p-2 rounded-lg flex justify-center ${selectedElement.style.textAlign === 'center' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><AlignCenter size={16}/></button>
                                                        <button onClick={() => updateElement(selectedId!, {style: {...selectedElement.style, textAlign: 'right'}})} className={`flex-1 p-2 rounded-lg flex justify-center ${selectedElement.style.textAlign === 'right' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><AlignRight size={16}/></button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {selectedElement.type === 'shape' && (
                                            <div className="space-y-6 pt-4 border-t border-slate-100">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase">Cor Bloco</label>
                                                    <input type="color" className="w-full h-10 rounded-lg cursor-pointer border border-slate-200" value={selectedElement.style.backgroundColor as string} onChange={e => updateElement(selectedId!, {style: {...selectedElement.style, backgroundColor: e.target.value}})} />
                                                </div>
                                            </div>
                                        )}
                                        {selectedElement.type === 'qrcode' && (
                                            <div className="space-y-6 pt-4 border-t border-slate-100">
                                                <InputGroup label="URL / Chave QR" value={selectedElement.value || ''} onChange={(v) => updateElement(selectedId!, {value: v})} />
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center opacity-10 p-10 text-center">
                                        <Grid3X3 size={64} className="mb-4 text-slate-900"/>
                                        <p className="text-[11px] font-black uppercase tracking-widest text-slate-900">Selecione uma camada</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {view === 'QUEUE' && (
                        <div className="h-full p-6 lg:p-12 bg-[#f8fafc] overflow-y-auto animate-fade-in custom-scrollbar">
                            <div className="max-w-6xl mx-auto space-y-8">
                                <div className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm gap-6">
                                    <div className="flex items-center gap-6">
                                        <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-xl"><Clock size={24}/></div>
                                        <div>
                                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Fila Produção</h3>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{users.length} Membros Totais</p>
                                        </div>
                                    </div>
                                    <div className="flex bg-slate-100 p-1.5 rounded-2xl shadow-inner">
                                        <button onClick={() => setQueueFilter('PENDING')} className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${queueFilter === 'PENDING' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Pendente ({users.filter(u => u.status === 'PENDING').length})</button>
                                        <button onClick={() => setQueueFilter('ACTIVE')} className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${queueFilter === 'ACTIVE' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>Ativos ({users.filter(u => u.status === 'ACTIVE').length})</button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-4 pb-12">
                                    {users.filter(u => u.status === queueFilter).filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase())).map(item => (
                                        <div key={item.id} className="bg-white p-6 px-10 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center group hover:border-indigo-300 transition-all hover:shadow-lg">
                                            <div className="flex items-center gap-8">
                                                <div className={`p-4 rounded-2xl shadow-inner ${item.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                    {item.status === 'ACTIVE' ? <CheckCircle size={24}/> : <History size={24}/>}
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-50">
                                                        <img src={item.avatar_url || 'https://via.placeholder.com/100'} className="w-full h-full object-cover" alt="User" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight leading-none">{item.name}</h4>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1.5 tracking-widest">Unid. {item.unit || 'HUB'} • CPF {item.cpf_cnpj}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6 mt-4 md:mt-0">
                                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border ${item.status === 'PENDING' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>{item.status}</span>
                                                <button onClick={() => { setSelectedUser(item); setView('DASHBOARD'); }} className="px-8 py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase hover:bg-indigo-600 transition-all shadow-xl active:scale-95">Visualizar</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default InternalIDSystem;