
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Fingerprint, Layout, Layers, Box, Type as TypeIcon, Image as ImageIcon, 
  Settings as SettingsIcon, Eye, Save, Trash2, Move, RotateCw, 
  AlignCenter, AlignLeft, AlignRight, Printer, Sparkles, ScanLine, Building2, 
  RefreshCcw, X, Edit3, Globe, ShieldCheck, Cpu, Download, ArrowRight,
  Palette, Wand2, Loader2, CheckCircle2, ListFilter, Clock, CheckCircle,
  Search, UserCheck, Smartphone, Zap, FileJson, History, Grid3X3,
  ArrowUp, ArrowDown, Maximize, Square, QrCode as QrIcon, Upload, Copy,
  RotateCcw, FolderOpen, EyeOff, Lock, Unlock, MousePointer2, FileUp
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { SystemInfo, User } from '../types';
import { systemService, userService, idTemplateService } from '../services/api';

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
    visible?: boolean;
    locked?: boolean;
    style: React.CSSProperties;
}

interface IDStudioProps {
    systemInfo: SystemInfo;
}

const INITIAL_TEMPLATE = (sys: SystemInfo): { front: CardElement[], back: CardElement[] } => {
    // Endereço formatado para o rodapé
    const fullAddress = [
        sys.street ? `Rua ${sys.street}` : '',
        sys.number ? `N ${sys.number}` : '',
        sys.cep ? `| CEP ${sys.cep}` : '',
        sys.neighborhood ? `| ${sys.neighborhood}` : '',
        sys.city ? `- ${sys.city}/${sys.state}` : ''
    ].filter(Boolean).join(' ');

    const cnpjText = sys.cnpj ? `CNPJ: ${sys.cnpj}` : '';
    const footerText = `${fullAddress}   ${cnpjText}`;

    // Datas de mandato
    const mandateStart = sys.management_start ? new Date(sys.management_start).getFullYear() : new Date().getFullYear();
    const mandateEnd = sys.management_end ? new Date(sys.management_end).getFullYear() : new Date().getFullYear() + 2;

    return {
        front: [
            // 1. HEADER VERDE (AMC Style)
            { id: 'header-bg', type: 'shape', x: 0, y: 0, width: 600, height: 95, visible: true, locked: true, style: { backgroundColor: '#15803d', zIndex: 1, borderRadius: '0px' } }, 

            // 2. LOGO (Círculo Branco no Header)
            { id: 'header-logo-bg', type: 'shape', x: 20, y: 8, width: 80, height: 80, visible: true, style: { backgroundColor: '#ffffff', borderRadius: '50%', zIndex: 2 } },
            { id: 'header-logo', type: 'image', field: 'logoUrl', x: 25, y: 13, width: 70, height: 70, visible: true, style: { zIndex: 5, backgroundColor: 'transparent', borderRadius: '50%', objectFit: 'contain' } },

            // 3. TÍTULO ASSOCIAÇÃO
            { id: 'assoc-title', type: 'text-static', value: sys.name?.toUpperCase() || 'ASSOCIAÇÃO DE MORADORES', x: 115, y: 35, width: 460, height: 30, visible: true, style: { color: '#ffffff', fontSize: '24px', fontWeight: '900', textAlign: 'left', zIndex: 10, letterSpacing: '0.02em', lineHeight: '1.1' } },

            // 4. MOLDURA DA FOTO
            { id: 'photo-frame', type: 'shape', x: 30, y: 120, width: 140, height: 170, visible: true, style: { backgroundColor: 'transparent', border: '3px solid #15803d', borderRadius: '20px', zIndex: 9 } },
            { id: 'member-photo', type: 'image', field: 'photoUrl', x: 33, y: 123, width: 134, height: 164, visible: true, style: { borderRadius: '17px', zIndex: 8, backgroundColor: '#f1f5f9', objectFit: 'cover' } },

            // 5. NOME DO MEMBRO
            { id: 'lbl-name', type: 'text-static', value: 'NOME COMPLETO', x: 190, y: 125, width: 200, height: 15, visible: true, style: { fontSize: '11px', color: '#64748b', fontWeight: '800', zIndex: 10, letterSpacing: '0.05em', textTransform: 'uppercase' } },
            { id: 'val-name', type: 'text-dynamic', field: 'name', x: 190, y: 142, width: 390, height: 40, visible: true, style: { fontSize: '26px', fontWeight: '900', color: '#1e293b', zIndex: 10, textAlign: 'left', lineHeight: '1.1', textTransform: 'uppercase' } },

            // 6. RG
            { id: 'lbl-rg', type: 'text-static', value: 'RG', x: 190, y: 195, width: 100, height: 15, visible: true, style: { fontSize: '11px', color: '#64748b', fontWeight: '800', zIndex: 10, textTransform: 'uppercase' } },
            { id: 'val-rg', type: 'text-dynamic', field: 'rg', x: 190, y: 210, width: 180, height: 25, visible: true, style: { fontSize: '20px', fontWeight: '800', color: '#334155', zIndex: 10 } },

            // 7. NASCIMENTO (Alinhado à direita do RG)
            { id: 'lbl-birth', type: 'text-static', value: 'NASCIMENTO', x: 400, y: 195, width: 120, height: 15, visible: true, style: { fontSize: '11px', color: '#64748b', fontWeight: '800', zIndex: 10, textTransform: 'uppercase' } },
            { id: 'val-birth', type: 'text-dynamic', field: 'birth_date', x: 400, y: 210, width: 120, height: 25, visible: true, style: { fontSize: '20px', fontWeight: '800', color: '#334155', zIndex: 10 } },

            // 8. CPF
            { id: 'lbl-cpf', type: 'text-static', value: 'CPF', x: 190, y: 250, width: 100, height: 15, visible: true, style: { fontSize: '11px', color: '#64748b', fontWeight: '800', zIndex: 10, textTransform: 'uppercase' } },
            { id: 'val-cpf', type: 'text-dynamic', field: 'cpf_cnpj', x: 190, y: 265, width: 250, height: 25, visible: true, style: { fontSize: '22px', fontWeight: '900', color: '#1e293b', zIndex: 10 } },

            // 9. MARCA D'ÁGUA
            { id: 'watermark', type: 'image', field: 'logoUrl', x: 380, y: 140, width: 220, height: 220, visible: true, locked: true, style: { zIndex: 1, opacity: 0.1, backgroundColor: 'transparent' } },

            // 10. BADGE CARGO (Abaixo da foto - Verde Sólido)
            { id: 'role-badge', type: 'shape', x: 30, y: 300, width: 140, height: 32, visible: true, style: { backgroundColor: '#15803d', borderRadius: '16px', zIndex: 10 } },
            { id: 'role-text', type: 'text-dynamic', field: 'role', x: 30, y: 308, width: 140, height: 20, visible: true, style: { color: '#ffffff', fontSize: '12px', fontWeight: '900', textAlign: 'center', zIndex: 11, textTransform: 'uppercase' } },

            // 11. MANDATO TEXTO
            { id: 'mandate-text', type: 'text-static', value: `Mandato: Novembro ${mandateStart} / ${mandateEnd}`, x: 220, y: 310, width: 360, height: 20, visible: true, style: { fontSize: '14px', fontWeight: '800', color: '#15803d', textAlign: 'right', zIndex: 10 } },

            // 12. FOOTER AMARELO
            { id: 'footer-bg', type: 'shape', x: 0, y: 340, width: 600, height: 40, visible: true, locked: true, style: { backgroundColor: '#facc15', zIndex: 1, borderRadius: '0px' } }, // Amarelo Ouro
            { id: 'footer-txt', type: 'text-static', value: footerText, x: 10, y: 353, width: 580, height: 15, visible: true, style: { fontSize: '11px', fontWeight: '900', color: '#000000', textAlign: 'center', zIndex: 10, textTransform: 'uppercase' } }
        ],
        back: [
            { id: 'back-bg', type: 'shape', x: 0, y: 0, width: 600, height: 380, visible: true, locked: true, style: { backgroundColor: '#ffffff', zIndex: 1 } },
            { id: 'back-watermark', type: 'image', field: 'logoUrl', x: 200, y: 90, width: 200, height: 200, visible: true, style: { zIndex: 2, opacity: 0.1 } },
            
            // Assinatura Presidente
            { id: 'back-sign-line', type: 'text-static', value: '_________________________________________', x: 150, y: 150, width: 300, height: 20, visible: true, style: { color: '#cbd5e1', fontSize: '14px', fontWeight: '500', zIndex: 3, textAlign: 'center' } },
            { id: 'back-sign-img', type: 'image', field: 'signature', x: 200, y: 80, width: 200, height: 70, visible: true, style: { zIndex: 4, objectFit: 'contain' } },
            { id: 'back-sign-lbl', type: 'text-static', value: 'ASSINATURA DO PRESIDENTE', x: 150, y: 170, width: 300, height: 20, visible: true, style: { fontSize: '10px', fontWeight: '800', textAlign: 'center', color: '#64748b', zIndex: 4 } },

            // Linha de Assinatura do Titular (Solicitada no JSON snippet)
            { id: 'back-sign-holder-line', type: 'text-static', value: '_________________________________________', x: 150, y: 240, width: 300, height: 20, visible: true, style: { color: '#cbd5e1', fontSize: '14px', fontWeight: '500', zIndex: 3, textAlign: 'center' } },
             { id: 'back-sign-holder-lbl', type: 'text-static', value: 'ASSINATURA DO TITULAR', x: 150, y: 260, width: 300, height: 20, visible: true, style: { fontSize: '10px', fontWeight: '800', textAlign: 'center', color: '#64748b', zIndex: 4 } },

            // Validação
            { id: 'back-qr', type: 'qrcode', value: 'https://sie.pro/validate', x: 30, y: 260, width: 90, height: 90, visible: true, style: { zIndex: 5 } },
            { id: 'back-info', type: 'text-static', value: 'Este documento é pessoal e intransferível.\nEm caso de perda, comunique a administração imediatamente.', x: 150, y: 300, width: 400, height: 40, visible: true, style: { fontSize: '10px', color: '#334155', textAlign: 'center', fontWeight: '600', zIndex: 5 } },
            
            // Footer Repetido
            { id: 'footer-bg-back', type: 'shape', x: 0, y: 360, width: 600, height: 20, visible: true, locked: true, style: { backgroundColor: '#15803d', zIndex: 1 } }
        ]
    };
};

interface CardRendererProps {
    template: CardElement[];
    data: Partial<User & { photoUrl?: string, signature?: string }>;
    editMode: boolean;
    onSelect: (id: string) => void;
    selectedId: string | null;
    onUpdate?: (id: string, updates: Partial<CardElement>) => void;
    snapGrid: number;
    systemInfo: SystemInfo;
}

const CardRenderer = ({ template, data, editMode, onSelect, selectedId, onUpdate, snapGrid = 1, systemInfo }: CardRendererProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const draggingRef = useRef<{id: string, startX: number, startY: number, initialX: number, initialY: number} | null>(null);

    const handleMouseDown = (e: React.MouseEvent, el: CardElement) => {
        if (!editMode || el.locked) return;
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
                if (el.visible === false) return null;
                const isSelected = selectedId === el.id;
                const content = String(el.type === 'text-dynamic' ? (data?.[el.field as keyof User] ?? '---') : (el.value ?? ''));
                let displayContent = content;
                if (el.field === 'birth_date' && content && content !== '---') {
                    try { displayContent = new Date(content).toLocaleDateString('pt-BR'); } catch(e) { displayContent = '---'; }
                }
                
                return (
                    <div 
                        key={el.id}
                        onMouseDown={(e) => handleMouseDown(e, el)}
                        onClick={(e) => { e.stopPropagation(); if(editMode) onSelect(el.id); }}
                        className={`absolute flex items-center overflow-visible transition-shadow select-none ${editMode && !el.locked ? 'cursor-move' : ''} ${isSelected ? 'ring-2 ring-indigo-500 z-50 shadow-2xl scale-[1.01]' : ''} ${el.locked && editMode ? 'cursor-not-allowed opacity-90' : ''}`}
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
                        {el.locked && editMode && isSelected && (
                            <div className="absolute top-0 right-0 p-1 bg-rose-500 rounded-bl-lg shadow-sm pointer-events-none">
                                <Lock size={12} className="text-white"/>
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
    <button onClick={onClick} className="flex flex-col items-center justify-center p-3 bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50 hover:shadow-md transition-all group h-20 w-full">
        <Icon size={20} className="text-slate-400 group-hover:text-indigo-600 mb-2 transition-colors" />
        <span className="text-[8px] font-black text-slate-500 group-hover:text-indigo-700 uppercase tracking-widest leading-none text-center">{label}</span>
    </button>
);

const SectionHeader = ({ icon: Icon, title }: { icon: any, title: string }) => (
    <h3 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 border-b border-slate-100 pb-2">
        <Icon size={14} className="text-indigo-500" /> {title}
    </h3>
);

const InputGroup = ({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) => (
    <div className="space-y-2">
        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">{label}</label>
        <input type="text" value={value} onChange={e => onChange(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none uppercase focus:bg-white" />
    </div>
);

const PropInput = ({ label, value, onChange, min, max, step }: { label: string, value: any, onChange: (v: string) => void, min?: number, max?: number, step?: number }) => (
    <div className="space-y-2">
        <label className="text-[9px] font-black text-slate-400 uppercase block tracking-widest">{label}</label>
        <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-1">
            <input type="number" min={min} max={max} step={step} value={value} onChange={(e) => onChange(e.target.value)} className="w-full p-2 bg-transparent text-xs font-bold outline-none text-slate-700" />
        </div>
    </div>
);

const SelectGroup = ({ label, value, options, onChange }: { label: string, value: string, options: any[], onChange: (v: string) => void }) => (
    <div className="space-y-2">
        <label className="text-[10px] font-black text-slate-400 uppercase block tracking-widest">{label}</label>
        <div className="relative">
            <select value={value} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase outline-none focus:border-indigo-500 appearance-none bg-white cursor-pointer focus:ring-4 focus:ring-indigo-500/10 transition-all">
                {options.map((o: any) => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ArrowDown size={12}/>
            </div>
        </div>
    </div>
);

const getLayerIcon = (type: string) => {
    switch(type) {
        case 'text-static': return TypeIcon;
        case 'text-dynamic': return RefreshCcw;
        case 'image': return ImageIcon;
        case 'shape': return Box;
        case 'qrcode': return QrIcon;
        default: return MousePointer2;
    }
};

const InternalIDSystem = ({ systemInfo }: IDStudioProps) => {
    const [view, setView] = useState<'DASHBOARD' | 'EDITOR' | 'QUEUE' | 'TEMPLATES'>('DASHBOARD');
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
    
    // Multi-Template Support
    const [templates, setTemplates] = useState<any[]>([]);
    const [currentTemplateId, setCurrentTemplateId] = useState<number | null>(null);
    const [templateName, setTemplateName] = useState('NOVO LAYOUT');
    const [layout, setLayout] = useState<{front: CardElement[], back: CardElement[]}>(INITIAL_TEMPLATE(systemInfo));

    // Ref para importação
    const importInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { 
        loadRealData(); 
        loadTemplates(); 
    }, []);

    const loadRealData = async () => {
        setIsLoadingUsers(true);
        try {
            const res = await userService.getAll(1, 1000); 
            setUsers(res.data.data || []);
        } finally { setIsLoadingUsers(false); }
    };

    const loadTemplates = async () => {
        try {
            const res = await idTemplateService.getAll();
            const data = res.data.data || [];
            setTemplates(data);
            
            const active = data.find((t: any) => t.is_active);
            if (active) {
                setCurrentTemplateId(active.id);
                setTemplateName(active.name);
                setLayout({ front: active.layout_front, back: active.layout_back });
            } else if (data.length > 0) {
                setCurrentTemplateId(data[0].id);
                setTemplateName(data[0].name);
                setLayout({ front: data[0].layout_front, back: data[0].layout_back });
            }
        } catch (e) { console.error("Failed to load templates"); }
    };

    const handleAddElement = (type: CardElement['type']) => {
        const newEl: CardElement = {
            id: `el-${Date.now()}`,
            type,
            x: 50, y: 50, width: type === 'shape' ? 100 : type === 'image' ? 100 : 200, height: type === 'shape' ? 100 : type === 'image' ? 100 : 40,
            visible: true,
            locked: false,
            style: { 
                fontSize: '14px', 
                color: type === 'shape' ? '#115e3b' : '#1e293b',
                fontWeight: '700',
                backgroundColor: type === 'shape' ? '#115e3b' : 'transparent',
                zIndex: layout[activeSide].length + 1,
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
        setLayout(prev => ({ ...prev, [activeSide]: [...prev[activeSide], newEl] }));
        setSelectedId(newEl.id);
    };

    const duplicateElement = (id: string) => {
        const el = layout[activeSide].find(e => e.id === id);
        if (!el) return;
        const newEl = { 
            ...el, 
            id: `el-dup-${Date.now()}`, 
            x: el.x + 20, 
            y: el.y + 20,
            style: { ...el.style, zIndex: layout[activeSide].length + 1 }
        };
        setLayout(prev => ({ ...prev, [activeSide]: [...prev[activeSide], newEl] }));
        setSelectedId(newEl.id);
    };

    const updateElement = useCallback((id: string, updates: Partial<CardElement>) => {
        setLayout(prev => ({
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
        const currentLayers = [...layout[activeSide]];
        const idx = currentLayers.findIndex(l => l.id === id);
        if (idx === -1) return;

        const newIdx = direction === 'up' ? idx + 1 : idx - 1;
        if (newIdx < 0 || newIdx >= currentLayers.length) return;

        const tempArr = [...currentLayers];
        const tempItem = tempArr[idx];
        tempArr[idx] = tempArr[newIdx];
        tempArr[newIdx] = tempItem;

        setLayout(prev => ({ ...prev, [activeSide]: tempArr }));
    };

    const handleSaveTemplate = async (asNew = false) => {
        const name = asNew ? prompt("Nome do Novo Modelo:", templateName + " (Cópia)") : templateName;
        if (!name) return;

        setIsSaving(true);
        try {
            const payload = {
                id: asNew ? undefined : currentTemplateId,
                name: name,
                layout_front: layout.front,
                layout_back: layout.back,
                is_active: false
            };
            
            await idTemplateService.save(payload);
            await loadTemplates();
            alert("✅ LAYOUT SINCRONIZADO.");
        } catch (e) { alert("Erro ao salvar."); } 
        finally { setIsSaving(false); }
    };

    const handleActivateTemplate = async (id: number) => {
        if (!confirm("Definir este modelo como ATIVO para impressões?")) return;
        try {
            await idTemplateService.activate(id);
            await loadTemplates();
        } catch (e) { alert("Erro ao ativar."); }
    };

    const handleDeleteTemplate = async (id: number) => {
        if (!confirm("Excluir modelo permanentemente?")) return;
        try {
            await idTemplateService.delete(id);
            if (currentTemplateId === id) {
                setTemplateName('');
                setCurrentTemplateId(null);
                setLayout(INITIAL_TEMPLATE(systemInfo));
            }
            await loadTemplates();
        } catch (e) { alert("Erro ao excluir."); }
    };

    const handleSelectTemplate = (tpl: any) => {
        setCurrentTemplateId(tpl.id);
        setTemplateName(tpl.name);
        setLayout({ front: tpl.layout_front, back: tpl.layout_back });
    };

    // SRE: EXPORT JSON FEATURE
    const handleExportJSON = () => {
        const data = {
            name: templateName,
            layout: layout,
            version: "1.0",
            exportedAt: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `SRE_ID_TEMPLATE_${templateName.replace(/\s+/g, '_')}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    // SRE: IMPORT JSON FEATURE
    const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                if (json.layout && json.layout.front && json.layout.back) {
                    setLayout(json.layout);
                    if (json.name) setTemplateName(json.name + " (Importado)");
                    setCurrentTemplateId(null); // Reset ID to force save as new
                    alert("✅ Template importado com sucesso. Salve para persistir.");
                } else {
                    alert("❌ Arquivo inválido ou corrompido.");
                }
            } catch (err) {
                alert("❌ Erro ao ler arquivo JSON.");
            } finally {
                if (importInputRef.current) importInputRef.current.value = "";
            }
        };
        reader.readAsText(file);
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

    const selectedElement = Array.isArray(layout[activeSide]) 
        ? layout[activeSide].find(el => el.id === selectedId) 
        : null;

    const primaryColor = systemInfo.primaryColor || '#115e3b';

    return (
        <div className="flex h-full w-full bg-[#f1f5f9] animate-fade-in overflow-hidden relative">
            
            {/* Input Oculto para Importação */}
            <input 
                type="file" 
                ref={importInputRef} 
                className="hidden" 
                accept=".json" 
                onChange={handleImportJSON} 
            />

            <aside className="w-20 lg:w-24 bg-slate-900 flex flex-col items-center py-10 gap-8 z-40 shadow-2xl relative shrink-0">
                <div className="absolute top-0 right-0 w-1 h-full bg-white/5"></div>
                <div className="w-12 h-12 lg:w-14 lg:h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-indigo-500/20 rotate-3 active:scale-95 transition-all cursor-pointer">
                    <Fingerprint size={28} />
                </div>
                <div className="flex flex-col gap-6">
                    <NavAction icon={Building2} active={view === 'DASHBOARD'} onClick={() => setView('DASHBOARD')} label="Emissor" />
                    <NavAction icon={Layers} active={view === 'EDITOR'} onClick={() => setView('EDITOR')} label="Editor Canvas" />
                    <NavAction icon={FolderOpen} active={view === 'TEMPLATES'} onClick={() => setView('TEMPLATES')} label="Meus Modelos" />
                    <NavAction icon={Clock} active={view === 'QUEUE'} onClick={() => setView('QUEUE')} label="Fila Produção" />
                </div>
                <div className="mt-auto space-y-4 flex flex-col items-center">
                     <button onClick={() => importInputRef.current?.click()} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all group relative" title="Importar JSON">
                        <FileUp size={20}/>
                        <span className="absolute left-full ml-5 px-3 py-1.5 bg-slate-800 text-white text-[9px] font-black rounded-lg opacity-0 group-hover:opacity-100 transition-all uppercase tracking-widest whitespace-nowrap z-[100] pointer-events-none shadow-2xl">Importar</span>
                     </button>
                     <button onClick={handleExportJSON} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all group relative" title="Exportar JSON">
                        <Download size={20}/>
                        <span className="absolute left-full ml-5 px-3 py-1.5 bg-slate-800 text-white text-[9px] font-black rounded-lg opacity-0 group-hover:opacity-100 transition-all uppercase tracking-widest whitespace-nowrap z-[100] pointer-events-none shadow-2xl">Exportar</span>
                     </button>
                     <NavAction icon={Save} onClick={() => handleSaveTemplate(false)} label="Salvar Alterações" />
                </div>
            </aside>

            <div className="flex-1 flex flex-col min-w-0">
                <header className="h-20 lg:h-24 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-12 shrink-0 z-30 shadow-sm">
                    <div className="flex items-center gap-6">
                        <div className="w-1.5 h-10 rounded-full" style={{ backgroundColor: primaryColor }}></div>
                        <div>
                            <h1 className="text-xl lg:text-2xl font-black tracking-tightest uppercase">
                                {view === 'DASHBOARD' ? 'Emissão de Identidades' : view === 'EDITOR' ? 'Configurar Template' : view === 'TEMPLATES' ? 'Biblioteca de Modelos' : 'Linha de Produção'}
                            </h1>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                                <ShieldCheck size={12} className="text-emerald-500" /> S.I.E REAL DATA SYNC V3.5
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
                                    <select value={snapGrid} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSnapGrid(Number(e.target.value))} className="h-9 bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase outline-none focus:border-indigo-500 px-2">
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
                                    <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex items-center justify-between">
                                        <span className="text-[10px] font-black uppercase text-indigo-700">Modelo Ativo:</span>
                                        <span className="text-[10px] font-bold text-indigo-500">{templateName}</span>
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
                                            <CardRenderer template={layout[activeSide]} data={selectedUser} systemInfo={systemInfo} editMode={false} onSelect={() => {}} selectedId={null} snapGrid={1} />
                                        </div>
                                        <button onClick={() => exportCard(selectedUser!)} disabled={isSaving} className="px-12 py-5 bg-slate-950 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl hover:bg-indigo-600 transition-all flex items-center gap-4 active:scale-95 disabled:opacity-50">
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

                    {view === 'TEMPLATES' && (
                        <div className="h-full p-8 lg:p-12 overflow-y-auto animate-fade-in custom-scrollbar">
                            <div className="max-w-6xl mx-auto space-y-8">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-black uppercase text-slate-800 tracking-tight">Biblioteca de Modelos</h2>
                                    <div className="flex gap-4">
                                        <button onClick={handleExportJSON} className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:border-indigo-200 transition-all flex items-center gap-2">
                                            <Download size={16}/> Exportar Ativo
                                        </button>
                                        <button onClick={() => {
                                            setCurrentTemplateId(null);
                                            setTemplateName('Novo Modelo Vazio');
                                            setLayout(INITIAL_TEMPLATE(systemInfo));
                                            setView('EDITOR');
                                        }} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-50 transition-all flex items-center gap-2">
                                            <Layout size={16}/> Criar do Zero
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {templates.map(tpl => (
                                        <div key={tpl.id} className={`bg-white rounded-[2.5rem] border p-6 flex flex-col gap-6 shadow-sm transition-all group hover:shadow-xl ${tpl.is_active ? 'border-emerald-500 ring-2 ring-emerald-500/10' : 'border-slate-200 hover:border-indigo-300'}`}>
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-3 rounded-2xl ${tpl.is_active ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                                        {tpl.is_active ? <CheckCircle size={20}/> : <Layout size={20}/>}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-black uppercase text-slate-800">{tpl.name}</h4>
                                                        <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">ID: #{tpl.id}</p>
                                                    </div>
                                                </div>
                                                {tpl.is_active && <span className="text-[8px] font-black bg-emerald-500 text-white px-2 py-1 rounded-lg uppercase tracking-widest">ATIVO</span>}
                                            </div>
                                            
                                            <div className="bg-slate-50 h-32 rounded-2xl border border-slate-100 flex items-center justify-center opacity-50 relative overflow-hidden">
                                                <div className="scale-[0.25] origin-center w-[600px] h-[380px] bg-white shadow-lg flex items-center justify-center">
                                                    <span className="text-4xl font-black text-slate-300">PREVIEW</span>
                                                </div>
                                            </div>

                                            <div className="flex gap-2 mt-auto">
                                                <button onClick={() => { handleSelectTemplate(tpl); setView('EDITOR'); }} className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase hover:bg-indigo-600 transition-all">Editar</button>
                                                {!tpl.is_active && <button onClick={() => handleActivateTemplate(tpl.id)} className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all" title="Ativar"><CheckCircle size={16}/></button>}
                                                <button onClick={() => handleDeleteTemplate(tpl.id)} className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-100 transition-all" title="Excluir"><Trash2 size={16}/></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {view === 'EDITOR' && (
                        <div className="h-full flex animate-in slide-in-from-right duration-500 flex-col lg:flex-row">
                            {/* SIDEBAR CONSTRUTOR */}
                            <div className="w-full lg:w-80 bg-white border-r border-slate-200 p-6 flex flex-col gap-8 shrink-0 overflow-y-auto">
                                <div className="mb-4">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Nome do Layout</label>
                                    <input 
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-black uppercase outline-none focus:border-indigo-500" 
                                        value={templateName}
                                        onChange={e => setTemplateName(e.target.value.toUpperCase())}
                                    />
                                    <div className="flex gap-2 mt-3">
                                        <button onClick={() => handleSaveTemplate(false)} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase hover:bg-indigo-700 transition-all">Salvar</button>
                                        <button onClick={() => handleSaveTemplate(true)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl text-[9px] font-black uppercase hover:bg-slate-200 transition-all">Salvar Como</button>
                                    </div>
                                </div>

                                <SectionHeader icon={Palette} title="Ferramentas" />
                                <div className="grid grid-cols-2 gap-3">
                                    <ToolBtn icon={TypeIcon} label="Texto Estático" onClick={() => handleAddElement('text-static')} />
                                    <ToolBtn icon={RefreshCcw} label="Campo Ledger" onClick={() => handleAddElement('text-dynamic')} />
                                    <ToolBtn icon={ImageIcon} label="Imagem / Foto" onClick={() => handleAddElement('image')} />
                                    <ToolBtn icon={Box} label="Forma / Bloco" onClick={() => handleAddElement('shape')} />
                                    <ToolBtn icon={QrIcon} label="QR Code" onClick={() => handleAddElement('qrcode')} />
                                </div>

                                <div className="flex-1 space-y-4 pt-4 border-t border-slate-100">
                                    <SectionHeader icon={Layers} title="Camadas" />
                                    <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                                        {Array.isArray(layout[activeSide]) && [...layout[activeSide]].reverse().map((el, revIdx, arr) => {
                                            const originalIdx = arr.length - 1 - revIdx;
                                            const IconComponent = getLayerIcon(el.type);
                                            return (
                                                <div key={el.id} onClick={() => setSelectedId(el.id)} className={`p-3 rounded-xl border flex justify-between items-center transition-all cursor-pointer group ${selectedId === el.id ? 'bg-indigo-50 border-indigo-200 text-indigo-700 ring-1 ring-indigo-500/20' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'}`}>
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <button onClick={(e) => { e.stopPropagation(); updateElement(el.id, { visible: !el.visible }); }} className={`p-1 rounded hover:bg-white/50 ${!el.visible ? 'text-slate-300' : 'text-slate-400'}`}>
                                                            {el.visible !== false ? <Eye size={14}/> : <EyeOff size={14}/>}
                                                        </button>
                                                        <div className="flex flex-col gap-0.5 min-w-0">
                                                            <div className="flex items-center gap-1.5">
                                                                <IconComponent size={10} className="text-slate-400" />
                                                                <span className="text-[10px] font-black uppercase truncate">{el.type === 'text-dynamic' ? `{${el.field}}` : el.type === 'shape' ? 'BLOCO' : el.type === 'qrcode' ? 'QRCODE' : 'TEXTO'}</span>
                                                            </div>
                                                            <span className="text-[8px] font-bold text-slate-400 uppercase">Layer {originalIdx + 1}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                        <button onClick={(e) => { e.stopPropagation(); moveLayer(el.id, 'up'); }} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600 disabled:opacity-20" disabled={originalIdx === layout[activeSide].length - 1}><ArrowUp size={12}/></button>
                                                        <button onClick={(e) => { e.stopPropagation(); moveLayer(el.id, 'down'); }} className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-indigo-600 disabled:opacity-20" disabled={originalIdx === 0}><ArrowDown size={12}/></button>
                                                        <button onClick={(e) => { e.stopPropagation(); setLayout(prev => ({...prev, [activeSide]: prev[activeSide].filter(it => it.id !== el.id)})); }} className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-500 ml-1"><Trash2 size={12}/></button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            {/* CANVAS AREA */}
                            <div className="flex-1 bg-[#eeeff3] flex flex-col items-center justify-center p-6 lg:p-12 relative overflow-hidden">
                                <div className="mb-8 bg-white p-1 rounded-2xl shadow-lg z-20 border border-slate-200 flex">
                                    <button onClick={() => setActiveSide('front')} className={`px-10 py-2.5 rounded-xl text-[10px] font-black transition-all ${activeSide === 'front' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-600'}`}>FRENTE</button>
                                    <button onClick={() => setActiveSide('back')} className={`px-10 py-2.5 rounded-xl text-[10px] font-black transition-all ${activeSide === 'back' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-600'}`}>VERSO</button>
                                </div>
                                <div className="relative p-8 bg-white/50 backdrop-blur-md border-2 border-white rounded-[40px] shadow-2xl">
                                    {showGrid && <div className="absolute inset-0 z-0 pointer-events-none opacity-10 rounded-[40px] overflow-hidden" style={{ backgroundImage: `radial-gradient(#000 1px, transparent 1px)`, backgroundSize: `${snapGrid * 4}px ${snapGrid * 4}px` }}></div>}
                                    <CardRenderer template={layout[activeSide]} data={users[0] || {}} editMode onSelect={setSelectedId} selectedId={selectedId} onUpdate={updateElement} snapGrid={snapGrid} systemInfo={systemInfo} />
                                </div>
                            </div>

                            {/* PAINEL PROPRIEDADES */}
                            <div className="w-full lg:w-[380px] bg-white border-l border-slate-200 p-8 overflow-y-auto shrink-0 shadow-xl custom-scrollbar">
                                {selectedElement ? (
                                    <div className="space-y-8 animate-fade-in">
                                        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                                             <div className="flex items-center gap-3">
                                                <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600"><SettingsIcon size={16}/></div>
                                                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Propriedades</h3>
                                             </div>
                                             <div className="flex gap-2">
                                                <button onClick={() => updateElement(selectedId!, { locked: !selectedElement.locked })} className={`p-2 rounded-lg transition-all ${selectedElement.locked ? 'bg-rose-50 text-rose-500' : 'bg-slate-100 text-slate-400 hover:text-slate-600'}`}>
                                                    {selectedElement.locked ? <Lock size={16}/> : <Unlock size={16}/>}
                                                </button>
                                                <button onClick={() => duplicateElement(selectedId!)} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-indigo-50 hover:text-indigo-600 transition-all"><Copy size={16}/></button>
                                                <button onClick={() => setSelectedId(null)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400"><X size={16}/></button>
                                             </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Posicionamento</label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <PropInput label="Eixo X" value={selectedElement.x} onChange={(v: string) => updateElement(selectedId!, {x: Math.round(Number(v) / snapGrid) * snapGrid})} />
                                                    <PropInput label="Eixo Y" value={selectedElement.y} onChange={(v: string) => updateElement(selectedId!, {y: Math.round(Number(v) / snapGrid) * snapGrid})} />
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <PropInput label="Largura" value={selectedElement.width} onChange={(v: string) => updateElement(selectedId!, {width: Math.round(Number(v) / snapGrid) * snapGrid})} />
                                                    <PropInput label="Altura" value={selectedElement.height} onChange={(v: string) => updateElement(selectedId!, {height: Math.round(Number(v) / snapGrid) * snapGrid})} />
                                                </div>
                                                <PropInput label="Rotação (°)" value={selectedElement.rotation || 0} onChange={(v: string) => updateElement(selectedId!, {rotation: parseInt(v)})} />
                                            </div>

                                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Estilização</label>
                                                
                                                {/* Common Style Props */}
                                                <div className="space-y-3">
                                                    <div>
                                                        <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Opacidade</label>
                                                        <input type="range" min="0" max="1" step="0.1" className="w-full accent-indigo-600 h-1.5 bg-slate-200 rounded-full appearance-none" value={selectedElement.style.opacity as number || 1} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateElement(selectedId!, {style: {...selectedElement.style, opacity: parseFloat(e.target.value)}})} />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <PropInput label="Raio Borda" value={parseInt(selectedElement.style.borderRadius as string || '0')} onChange={(v: string) => updateElement(selectedId!, {style: {...selectedElement.style, borderRadius: `${v}px` }})} />
                                                        <div className="space-y-1">
                                                            <label className="text-[9px] font-black text-slate-400 uppercase block">Cor Fundo</label>
                                                            <div className="flex gap-2">
                                                                <input type="color" className="w-8 h-8 rounded border border-slate-200 cursor-pointer" value={selectedElement.style.backgroundColor as string || '#ffffff'} onChange={(e) => updateElement(selectedId!, {style: {...selectedElement.style, backgroundColor: e.target.value}})} />
                                                                <button onClick={() => updateElement(selectedId!, {style: {...selectedElement.style, backgroundColor: 'transparent'}})} className="text-[8px] font-bold uppercase text-slate-500 hover:text-indigo-600 bg-white border border-slate-200 px-2 rounded">Transp.</button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Specific Content Controls */}
                                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Conteúdo</label>
                                                
                                                {selectedElement.type === 'image' && (
                                                    <div className="space-y-4">
                                                        <div className="space-y-2">
                                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Upload Asset Local</label>
                                                            <label className="w-full flex items-center justify-center gap-3 py-4 bg-white border border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-indigo-50 hover:border-indigo-400 transition-all group">
                                                                <Upload size={18} className="text-slate-400 group-hover:text-indigo-600" />
                                                                <span className="text-[10px] font-black uppercase text-slate-500 group-hover:text-indigo-600">Carregar Imagem</span>
                                                                <input type="file" className="hidden" accept="image/*" onChange={handleAssetUpload} />
                                                            </label>
                                                        </div>
                                                        <SelectGroup label="Vincular Dado Dinâmico" value={selectedElement.field || ''} options={[{v: '', l: 'Nenhum'}, {v: 'photoUrl', l: 'Foto do Membro'}, {v: 'logoUrl', l: 'Logo Entidade'}, {v: 'signature', l: 'Assinatura Presidente'}]} onChange={(v: string) => updateElement(selectedId!, {field: v})} />
                                                    </div>
                                                )}

                                                {selectedElement.type.startsWith('text') && (
                                                    <div className="space-y-4">
                                                        {selectedElement.type === 'text-dynamic' ? (
                                                            <SelectGroup label="Campo do Ledger" value={selectedElement.field || ''} options={[
                                                                {v: 'name', l: 'Nome Completo'}, 
                                                                {v: 'cpf_cnpj', l: 'CPF/ID'}, 
                                                                {v: 'unit', l: 'Unidade/Lote'}, 
                                                                {v: 'role', l: 'Cargo SRE'}, 
                                                                {v: 'birth_date', l: 'Nascimento'},
                                                                {v: 'email', l: 'E-mail'},
                                                                {v: 'phone', l: 'Telefone'},
                                                                {v: 'membership_id', l: 'ID Matrícula'},
                                                                {v: 'rg', l: 'RG'},
                                                                {v: 'issuing_authority', l: 'Orgão Emissor'}
                                                            ]} onChange={(v: string) => updateElement(selectedId!, {field: v})} />
                                                        ) : (
                                                            <InputGroup label="Texto Fixo" value={selectedElement.value || ''} onChange={(v: string) => updateElement(selectedId!, {value: v})} />
                                                        )}
                                                        
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <PropInput label="Tamanho Fonte" value={parseInt(selectedElement.style.fontSize as string || '14')} onChange={(v: string) => updateElement(selectedId!, {style: {...selectedElement.style, fontSize: `${v}px` }})} />
                                                            <div className="space-y-1">
                                                                <label className="text-[9px] font-black text-slate-400 uppercase block">Cor Texto</label>
                                                                <input type="color" className="w-full h-9 rounded-lg cursor-pointer border border-slate-200" value={selectedElement.style.color as string} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateElement(selectedId!, {style: {...selectedElement.style, color: e.target.value}})} />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[9px] font-black text-slate-400 uppercase block">Alinhamento</label>
                                                            <div className="flex bg-white p-1 rounded-lg border border-slate-200 gap-1">
                                                                <button onClick={() => updateElement(selectedId!, {style: {...selectedElement.style, textAlign: 'left'}})} className={`flex-1 p-2 rounded flex justify-center ${selectedElement.style.textAlign === 'left' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-50'}`}><AlignLeft size={14}/></button>
                                                                <button onClick={() => updateElement(selectedId!, {style: {...selectedElement.style, textAlign: 'center'}})} className={`flex-1 p-2 rounded flex justify-center ${selectedElement.style.textAlign === 'center' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-50'}`}><AlignCenter size={14}/></button>
                                                                <button onClick={() => updateElement(selectedId!, {style: {...selectedElement.style, textAlign: 'right'}})} className={`flex-1 p-2 rounded flex justify-center ${selectedElement.style.textAlign === 'right' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-50'}`}><AlignRight size={14}/></button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {selectedElement.type === 'qrcode' && (
                                                    <InputGroup label="Conteúdo QR Code" value={selectedElement.value || ''} onChange={(v: string) => updateElement(selectedId!, {value: v})} />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center opacity-30 p-10 text-center">
                                        <Grid3X3 size={64} className="mb-4 text-slate-900"/>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Selecione um elemento para editar</p>
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
