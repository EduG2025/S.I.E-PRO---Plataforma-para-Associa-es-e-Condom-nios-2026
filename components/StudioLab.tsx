
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Monitor, Smartphone, Wand2, Save, LayoutGrid,
  Box, Loader2, RefreshCw, Palette, Layers, Sparkles,
  Search, Eye, BarChart3, Bot, ShieldCheck,
  Type as FontIcon, Edit3, Globe, Zap,
  CheckCircle2, AlertCircle, Trash2, Languages,
  AlignLeft, AlignCenter, AlignRight, Fingerprint,
  Maximize, Sidebar, Layout, Info, Shield, CheckCircle,
  ArrowRight, Droplets, Contrast, RotateCcw, Undo2, Redo2,
  Code, Cpu, X, ToggleRight, ToggleLeft, PanelLeft, AlignJustify,
  Brain, MessageSquare, ListPlus, Plus,
  MousePointer2, Sidebar as SidebarIcon, LayoutPanelLeft,
  MonitorPlay, Smartphone as MobileIcon, Layers2,
  CheckSquare,
  Image as ImageIcon,
  Type,
  Smartphone as MobileDevice,
  MousePointer,
  Signal,
  Landmark,
  FileCode,
  ClipboardCheck,
  Maximize2,
  Columns,
  Type as TypographyIcon,
  MousePointer2 as CursorIcon,
  Square,
  Circle,
  History,
  LayoutTemplate,
  Navigation,
  PanelTop,
  Table as TableIcon,
  Menu
} from 'lucide-react';
import { studioService, systemService } from '../services/api';
import { DesignTokens, DualDesignSystem, SystemInfo } from '../types';
import { MENU_ITEMS } from '../constants';

/**
 * S.I.E STUDIO LAB MASTER V9.2 - SOVEREIGN DESIGN HUB
 * Visual Engine Fix: Mobile Navigation & Drawer Logic
 */

const PRESETS = [
  { id: 'mobile-narrow', label: 'Mobile (360px)', w: 360, h: 800, icon: Smartphone },
  { id: 'mobile-pro', label: 'iPhone Pro (430px)', w: 430, h: 932, icon: Smartphone },
  { id: 'tablet', label: 'iPad Air (820px)', w: 820, h: 1180, icon: Smartphone },
  { id: 'hd', label: 'HD (720p)', w: 1280, h: 720, icon: Monitor },
  { id: 'fhd', label: 'FHD (1080p)', w: 1920, h: 1080, icon: Monitor },
  { id: '4k', label: '4K Ultra (2160p)', w: 3840, h: 2160, icon: MonitorPlay }
];

const DEFAULT_TOKENS: DesignTokens = {
  borderRadius: 16,
  containerPadding: 24,
  viewportPadding: 32,
  sidebarWidth: 280,
  sidebarWidthCollapsed: 80,
  footerHeight: 80,
  shadowIntensity: 0.1,
  fontSizeBase: 16,
  fontScale: 1.2,
  primaryColor: '#4f46e5',
  successColor: '#10b981',
  dangerColor: '#ef4444',
  warningColor: '#f59e0b',
  surfaceColor: '#f8fafc',
  sidebarBg: '#020617',
  sidebarActiveColor: '#4f46e5',
  sidebarTextColor: '#94a3b8',
  sidebarIconSize: 18,
  sidebarBorderColor: 'rgba(255,255,255,0.08)',
  sidebarHoverColor: 'rgba(255,255,255,0.05)',
  formOverlapOffset: 20,
  borderSpacing: 24,
  centerTitle: false,
  cardShadowIntensity: 0.1,
  inputHeight: 56,
  fontWeightHeading: 900,
  letterSpacingBase: -5,
  buttonRadius: 16,
  buttonWeight: 900,
  inputBorderWidth: 1,
  cardBorderWidth: 1,
  glassOpacity: 96,
  mobileMenuType: 'SIDEBAR',
  mobileMenuSide: 'left'
};

const StudioLab = ({ systemInfo, designSystem, setDesignSystem }: {
  systemInfo: SystemInfo,
  designSystem: DualDesignSystem,
  setDesignSystem: React.Dispatch<React.SetStateAction<DualDesignSystem | null>>
}) => {
  const [activePlatform, setActivePlatform] = useState<'desktop' | 'mobile'>('desktop');
  const [activeMode, setActiveMode] = useState<'VISUAL' | 'SIDEBAR' | 'SEMANTIC' | 'AUDIT'>('VISUAL');
  const [activeVisualPanel, setActiveVisualPanel] = useState<'GEOMETRY' | 'TYPOGRAPHY' | 'ATMOSPHERE' | 'UI_DETAILS' | 'MOBILE_NAV'>('GEOMETRY');
  
  const [isSaving, setIsSaving] = useState(false);
  const [isSidebarSimCollapsed, setIsSidebarSimCollapsed] = useState(false);
  const [showSimulatedForm, setShowSimulatedForm] = useState(false);
  const [simPreset, setSimPreset] = useState(PRESETS[3]); // FHD as default for desktop edit
  const [zoomLevel, setZoomLevel] = useState(1);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [activeSimModuleId, setActiveSimModuleId] = useState<string>('dashboard');
  const [moduleMetadata, setModuleMetadata] = useState<any>(systemInfo.module_metadata || {});
  const [dictionary, setDictionary] = useState<Record<string, string>>(systemInfo.dictionary || {});

  const currentTokens = designSystem[activePlatform];
  const sidebarManifest = moduleMetadata.sidebar || {};

  const handleUpdateToken = useCallback((field: keyof DesignTokens, value: any) => {
    setDesignSystem(prev => {
      if (!prev) return null;
      return {
        ...prev,
        [activePlatform]: { ...prev[activePlatform], [field]: value }
      };
    });
  }, [activePlatform, setDesignSystem]);

  const handleResetToDefaults = () => {
    if (!confirm("⚠️ RESTAURAR PADRÕES SRE: Isso apagará todas as customizações desta plataforma. Continuar?")) return;
    setDesignSystem(prev => {
        if (!prev) return null;
        return {
            ...prev,
            [activePlatform]: { ...DEFAULT_TOKENS }
        };
    });
  };

  const handleSaveMaster = async () => {
    setIsSaving(true);
    try {
      await Promise.all([
        studioService.saveTokens(designSystem),
        systemService.updateInfo({ 
            ...systemInfo, 
            module_metadata: moduleMetadata, 
            dictionary: dictionary 
        })
      ]);
      alert("✅ KERNEL MASTER SINCRONIZADO: Geometria e DNA Visual aplicados globalmente.");
    } catch (e) { 
        alert("Falha ao comitar Ledger Visual."); 
    } finally { 
        setIsSaving(false); 
    }
  };

  const dynamicStyles = {
    '--radius': `${currentTokens.borderRadius}px`,
    '--padding-inner': `${currentTokens.containerPadding}px`,
    '--viewport-padding': `${currentTokens.viewportPadding}px`,
    '--border-spacing': `${currentTokens.borderSpacing || 0}px`,
    '--sidebar-w': isSidebarSimCollapsed ? `${currentTokens.sidebarWidthCollapsed || 80}px` : `${currentTokens.sidebarWidth}px`,
    '--footer-h': `${currentTokens.footerHeight || 80}px`,
    '--primary': currentTokens.primaryColor,
    '--success': currentTokens.successColor || '#10b981',
    '--danger': currentTokens.dangerColor || '#ef4444',
    '--warning': currentTokens.warningColor || '#f59e0b',
    '--surface': currentTokens.surfaceColor,
    '--sidebar-bg': currentTokens.sidebarBg || '#020617',
    '--sidebar-active': currentTokens.sidebarActiveColor || currentTokens.primaryColor,
    '--sidebar-text': currentTokens.sidebarTextColor || '#94a3b8',
    '--sidebar-border': currentTokens.sidebarBorderColor || 'rgba(255,255,255,0.08)',
    '--sidebar-hover': currentTokens.sidebarHoverColor || 'rgba(255,255,255,0.05)',
    '--font-base': `${currentTokens.fontSizeBase}px`,
    '--font-scale': `${currentTokens.fontScale || 1.2}`,
    '--font-weight-heading': `${currentTokens.fontWeightHeading || 900}`,
    '--letter-spacing': `${(currentTokens.letterSpacingBase || 0) / 100}em`,
    '--button-radius': `${currentTokens.buttonRadius ?? currentTokens.borderRadius}px`,
    '--button-weight': `${currentTokens.buttonWeight || 900}`,
    '--input-border-w': `${currentTokens.inputBorderWidth || 1}px`,
    '--card-border-w': `${currentTokens.cardBorderWidth || 1}px`,
    '--glass-opacity': `${(currentTokens.glassOpacity || 96) / 100}`,
    '--shadow': `0 ${currentTokens.shadowIntensity * 15}px ${currentTokens.shadowIntensity * 30}px rgba(0,0,0,${currentTokens.shadowIntensity})`,
    '--form-overlap': `${currentTokens.formOverlapOffset || 20}px`,
    '--title-align': currentTokens.centerTitle ? 'center' : 'left',
    '--title-justify': currentTokens.centerTitle ? 'center' : 'flex-start',
    '--input-h': `${currentTokens.inputHeight || 56}px`,
    '--mobile-menu-side': currentTokens.mobileMenuSide || 'left'
  } as React.CSSProperties & Record<string, string>;

  const SectionHeader = ({ icon: Icon, title }: { icon: any, title: string }) => (
    <h3 className="flex items-center gap-3 text-[10px] font-black text-slate-900 uppercase tracking-widest mb-6">
      <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600 shadow-sm" style={{ color: 'var(--sie-primary)' }}><Icon size={16} /></div> {title}
    </h3>
  );

  const activeModuleInSim = useMemo(() => {
    return MENU_ITEMS.find(m => m.id === activeSimModuleId) || MENU_ITEMS[0];
  }, [activeSimModuleId]);

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] text-slate-800 animate-fade-in relative overflow-hidden" 
         style={{ borderRadius: 'var(--sie-radius)', border: '1px solid #e2e8f0', boxShadow: 'var(--sie-shadow)' }}>

      <header className="h-20 px-8 bg-slate-900 flex justify-between items-center shrink-0 border-b border-white/5 z-50">
        <div className="flex items-center gap-6">
          <div className="p-2.5 bg-indigo-600 rounded-xl shadow-xl hidden sm:block" style={{ backgroundColor: 'var(--sie-primary)' }}>
            <Zap size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm md:text-lg font-black uppercase tracking-tightest leading-none text-white">Studio Lab <span className="text-indigo-400">MASTER</span></h1>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">SRE Visual Sovereign Core V9.2</p>
          </div>
        </div>

        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
          {[
            { id: 'VISUAL', label: 'DNA Visual', icon: Palette },
            { id: 'SIDEBAR', label: 'Manifesto', icon: SidebarIcon },
            { id: 'SEMANTIC', label: 'Semântica', icon: Languages },
            { id: 'AUDIT', label: 'Trilha Audit', icon: History }
          ].map(mode => (
            <button key={mode.id} onClick={() => setActiveMode(mode.id as any)} className={`px-4 md:px-6 py-2 rounded-lg text-[9px] font-black uppercase transition-all flex items-center gap-2 whitespace-nowrap ${activeMode === mode.id ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-white'}`}>
              <mode.icon size={14} /> {mode.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button onClick={handleResetToDefaults} className="p-3 bg-white/5 border border-white/10 hover:bg-rose-500 hover:text-white text-slate-400 rounded-xl transition-all" title="Resetar para Padrão">
            <RotateCcw size={16}/>
          </button>
          <button onClick={handleSaveMaster} disabled={isSaving} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-2.5 rounded-xl shadow-xl transition-all font-black text-[9px] uppercase tracking-widest">
            {isSaving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />} Sincronizar Master
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
        <aside className="w-full lg:w-[450px] border-r border-slate-200 p-8 overflow-y-auto bg-white custom-scrollbar shrink-0 shadow-2xl z-40">
          <div className="mb-10 p-1.5 bg-slate-200 rounded-2xl flex gap-1">
            <button onClick={() => setActivePlatform('desktop')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-3 ${activePlatform === 'desktop' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
              <Monitor size={14} /> Desktop
            </button>
            <button onClick={() => setActivePlatform('mobile')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-3 ${activePlatform === 'mobile' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
              <Smartphone size={14} /> Mobile
            </button>
          </div>

          {activeMode === 'VISUAL' && (
            <div className="space-y-10 animate-fade-in pb-32">
                <div className="flex bg-slate-100 p-1 rounded-xl mb-6 overflow-x-auto no-scrollbar">
                    {[
                        { id: 'GEOMETRY', label: 'Geometria', icon: Box },
                        { id: 'TYPOGRAPHY', label: 'Tipografia', icon: TypographyIcon },
                        { id: 'ATMOSPHERE', label: 'Atmosfera', icon: Droplets },
                        { id: 'UI_DETAILS', label: 'Detalhes UI', icon: CursorIcon },
                        { id: 'MOBILE_NAV', label: 'Nav Mobile', icon: Smartphone }
                    ].map(panel => (
                        <button key={panel.id} onClick={() => setActiveVisualPanel(panel.id as any)} className={`flex-1 min-w-[80px] py-3 rounded-lg text-[8px] font-black uppercase transition-all flex flex-col items-center gap-1 ${activeVisualPanel === panel.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
                            <panel.icon size={12}/> {panel.label}
                        </button>
                    ))}
                </div>

              {activeVisualPanel === 'GEOMETRY' && (
                <section className="space-y-6 animate-fade-in">
                    <SectionHeader icon={Box} title="Geometria Dinâmica" />
                    {[
                        { label: 'Raio de Curvatura (px)', field: 'borderRadius', min: 0, max: 60 },
                        { label: 'Padding de Conteúdo (px)', field: 'containerPadding', min: 0, max: 100 },
                        { label: 'Padding da Viewport (px)', field: 'viewportPadding', min: 0, max: 100 },
                        { label: 'Espaçamento Perimetral (px)', field: 'borderSpacing', min: 0, max: 100 },
                        { label: 'Altura do Rodapé (px)', field: 'footerHeight', min: 5, max: 150 },
                        { label: 'Encaixe de Form (Overlap)', field: 'formOverlapOffset', min: -100, max: 100 },
                        { label: 'Altura Padrão UI (px)', field: 'inputHeight', min: 40, max: 80 },
                        { label: 'Largura Sidebar (px)', field: 'sidebarWidth', min: 200, max: 400 },
                        { label: 'Largura Sidebar Colapsada (px)', field: 'sidebarWidthCollapsed', min: 60, max: 120 }
                    ].map(token => (
                    <div key={token.field} className="space-y-3 p-5 bg-slate-50 border border-slate-100 shadow-sm group hover:border-indigo-400 transition-all rounded-3xl">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black text-slate-500 uppercase">{token.label}</label>
                            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{(currentTokens as any)[token.field] || 0}px</span>
                        </div>
                        <input
                            type="range" min={token.min} max={token.max}
                            value={(currentTokens as any)[token.field] || 0}
                            onChange={e => handleUpdateToken(token.field as any, parseInt(e.target.value))}
                            className="w-full h-1.5 bg-slate-200 rounded-full cursor-pointer accent-indigo-600"
                        />
                    </div>
                    ))}
                    <div className="p-5 bg-slate-50 border border-slate-100 shadow-sm space-y-4 rounded-3xl">
                        <label className="flex items-center justify-between cursor-pointer group">
                            <span className="text-[10px] font-black text-slate-500 uppercase">Centralizar Títulos Globais</span>
                            <div onClick={() => handleUpdateToken('centerTitle', !currentTokens.centerTitle)} className={`p-1 rounded-full transition-all ${currentTokens.centerTitle ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                                {currentTokens.centerTitle ? <ToggleRight size={24} className="text-white" /> : <ToggleLeft size={24} className="text-slate-400" />}
                            </div>
                        </label>
                    </div>
                </section>
              )}

              {activeVisualPanel === 'TYPOGRAPHY' && (
                <section className="space-y-6 animate-fade-in">
                    <SectionHeader icon={TypographyIcon} title="Escala Tipográfica" />
                    {[
                        { label: 'Tamanho Base (px)', field: 'fontSizeBase', min: 12, max: 24 },
                        { label: 'Fator de Escala (Headings)', field: 'fontScale', min: 1.0, max: 2.0, step: 0.1 },
                        { label: 'Peso das Fontes (Headings)', field: 'fontWeightHeading', min: 400, max: 900, step: 100 },
                        { label: 'Espaçamento de Letras (Tracking)', field: 'letterSpacingBase', min: -10, max: 30 }
                    ].map(token => (
                    <div key={token.field} className="space-y-3 p-5 bg-slate-50 border border-slate-100 shadow-sm group hover:border-indigo-400 transition-all rounded-3xl">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black text-slate-500 uppercase">{token.label}</label>
                            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{(currentTokens as any)[token.field] || 0}</span>
                        </div>
                        <input
                            type="range" min={token.min} max={token.max} step={token.step || 1}
                            value={(currentTokens as any)[token.field] || 0}
                            onChange={e => handleUpdateToken(token.field as any, parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-slate-200 rounded-full cursor-pointer accent-indigo-600"
                        />
                    </div>
                    ))}
                </section>
              )}

              {activeVisualPanel === 'ATMOSPHERE' && (
                <section className="space-y-6 animate-fade-in">
                    <SectionHeader icon={Droplets} title="Atmosfera & Cores" />
                    <div className="grid grid-cols-2 gap-4">
                    {[
                        { label: 'Primária', field: 'primaryColor' },
                        { label: 'Superfície', field: 'surfaceColor' },
                        { label: 'Sucesso', field: 'successColor' },
                        { label: 'Erro/Perigo', field: 'dangerColor' },
                        { label: 'Aviso', field: 'warningColor' },
                        { label: 'Sidebar BG', field: 'sidebarBg' },
                        { label: 'Sidebar Ativa', field: 'sidebarActiveColor' },
                        { label: 'Sidebar Texto', field: 'sidebarTextColor' },
                        { label: 'Sidebar Hover', field: 'sidebarHoverColor' },
                        { label: 'Sidebar Borda', field: 'sidebarBorderColor' }
                    ].map(color => (
                        <div key={color.field} className="p-4 bg-slate-50 border border-slate-100 shadow-sm space-y-3 group hover:border-indigo-400 transition-all rounded-3xl">
                        <label className="text-[8px] font-black text-slate-400 uppercase block truncate">{color.label}</label>
                        <div className="flex items-center gap-3">
                            <input
                            type="color"
                            value={(currentTokens as any)[color.field] || '#000000'}
                            onChange={e => handleUpdateToken(color.field as any, e.target.value)}
                            className="w-10 h-10 rounded-lg border-none shadow-xl cursor-pointer"
                            />
                            <span className="text-[8px] font-mono text-slate-400 font-black">{(currentTokens as any)[color.field]}</span>
                        </div>
                        </div>
                    ))}
                    </div>
                    {[
                        { label: 'Intensidade de Sombras', field: 'shadowIntensity', min: 0, max: 0.5, step: 0.01 },
                        { label: 'Intensidade Sombras (Cards)', field: 'cardShadowIntensity', min: 0, max: 0.5, step: 0.01 },
                        { label: 'Opacidade do Glass (Modal)', field: 'glassOpacity', min: 0, max: 100 }
                    ].map(token => (
                    <div key={token.field} className="space-y-3 p-5 bg-slate-50 border border-slate-100 shadow-sm group hover:border-indigo-400 transition-all rounded-3xl">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black text-slate-500 uppercase">{token.label}</label>
                            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{(currentTokens as any)[token.field] || 0}</span>
                        </div>
                        <input
                            type="range" min={token.min} max={token.max} step={token.step || 1}
                            value={(currentTokens as any)[token.field] || 0}
                            onChange={e => handleUpdateToken(token.field as any, parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-slate-200 rounded-full cursor-pointer accent-indigo-600"
                        />
                    </div>
                    ))}
                </section>
              )}

              {activeVisualPanel === 'UI_DETAILS' && (
                <section className="space-y-6 animate-fade-in">
                    <SectionHeader icon={CursorIcon} title="Detalhes da Interface" />
                    {[
                        { label: 'Raio de Borda (Botões)', field: 'buttonRadius', min: 0, max: 40 },
                        { label: 'Peso da Fonte (Botões)', field: 'buttonWeight', min: 400, max: 900, step: 100 },
                        { label: 'Espessura Borda (Inputs)', field: 'inputBorderWidth', min: 0, max: 5 },
                        { label: 'Espessura Borda (Cards)', field: 'cardBorderWidth', min: 0, max: 5 },
                        { label: 'Tamanho Ícones Sidebar', field: 'sidebarIconSize', min: 14, max: 24 }
                    ].map(token => (
                    <div key={token.field} className="space-y-3 p-5 bg-slate-50 border border-slate-100 shadow-sm group hover:border-indigo-400 transition-all rounded-3xl">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-black text-slate-500 uppercase">{token.label}</label>
                            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{(currentTokens as any)[token.field] || 0}</span>
                        </div>
                        <input
                            type="range" min={token.min} max={token.max} step={token.step || 1}
                            value={(currentTokens as any)[token.field] || 0}
                            onChange={e => handleUpdateToken(token.field as any, parseFloat(e.target.value))}
                            className="w-full h-1.5 bg-slate-200 rounded-full cursor-pointer accent-indigo-600"
                        />
                    </div>
                    ))}
                </section>
              )}

              {activeVisualPanel === 'MOBILE_NAV' && (
                <section className="space-y-6 animate-fade-in">
                    <SectionHeader icon={Smartphone} title="Navegação Mobile Hub" />
                    
                    <div className="p-5 bg-slate-50 border border-slate-100 shadow-sm space-y-4 rounded-3xl">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Arquitetura de Menu</label>
                        <div className="grid grid-cols-1 gap-2">
                            {[
                                { id: 'SIDEBAR', label: 'Barra Lateral (Hambúrguer)', icon: PanelLeft },
                                { id: 'DRAWER_TOP', label: 'Top Drawer (Cascata)', icon: PanelTop },
                                { id: 'BOTTOM_NAV', label: 'Bottom Bar (Dock)', icon: TableIcon }
                            ].map(opt => (
                                <button 
                                    key={opt.id} 
                                    onClick={() => handleUpdateToken('mobileMenuType', opt.id)}
                                    className={`p-4 rounded-xl border text-left transition-all flex items-center gap-4 ${currentTokens.mobileMenuType === opt.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-400'}`}
                                >
                                    <opt.icon size={18}/>
                                    <span className="text-[10px] font-black uppercase">{opt.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-5 bg-slate-50 border border-slate-100 shadow-sm space-y-4 rounded-3xl">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Alinhamento / Posição</label>
                        <div className="flex bg-slate-200 p-1 rounded-xl">
                            <button onClick={() => handleUpdateToken('mobileMenuSide', 'left')} className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase transition-all ${currentTokens.mobileMenuSide === 'left' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Esquerda</button>
                            <button onClick={() => handleUpdateToken('mobileMenuSide', 'right')} className={`flex-1 py-2.5 rounded-lg text-[10px] font-black uppercase transition-all ${currentTokens.mobileMenuSide === 'right' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}>Direita</button>
                        </div>
                    </div>
                    
                    <div className="p-8 bg-indigo-900 text-white rounded-[2rem] shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10"><Smartphone size={80}/></div>
                        <h4 className="text-sm font-black uppercase relative z-10">Estado de Preview</h4>
                        <p className="text-[9px] font-bold mt-2 opacity-60 uppercase relative z-10">Force a visualização do menu no simulador:</p>
                        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="mt-4 w-full py-3 bg-white text-indigo-900 rounded-xl font-black text-[9px] uppercase tracking-widest active:scale-95 transition-all">
                            {mobileMenuOpen ? 'Fechar Preview Menu' : 'Expandir Preview Menu'}
                        </button>
                    </div>
                </section>
              )}
            </div>
          )}

          {activeMode === 'SIDEBAR' && (
            <div className="space-y-6 pb-20 animate-fade-in">
              <SectionHeader icon={SidebarIcon} title="Governança de Módulos" />
              <div className="space-y-4">
                {MENU_ITEMS.map(item => (
                  <div key={item.id} className="p-6 bg-slate-50 border border-slate-200 space-y-4 group hover:shadow-xl transition-all rounded-3xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-white rounded-xl text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm"><item.icon size={18} /></div>
                        <span className="text-[10px] font-black uppercase text-slate-800 tracking-tight">{moduleMetadata[item.id]?.title || item.label}</span>
                      </div>
                      <input
                        type="checkbox"
                        className="w-6 h-6 rounded-lg border-slate-200 text-indigo-600"
                        checked={sidebarManifest[item.id]?.visible !== false}
                        onChange={e => setModuleMetadata({ ...moduleMetadata, sidebar: { ...sidebarManifest, [item.id]: { ...(sidebarManifest[item.id] || {}), visible: e.target.checked } } })}
                      />
                    </div>
                    <input
                      className="w-full h-11 px-6 bg-white border border-slate-200 text-[10px] font-black uppercase outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-inner rounded-xl"
                      value={moduleMetadata[item.id]?.title || item.label}
                      onChange={e => setModuleMetadata({ ...moduleMetadata, [item.id]: { ...(moduleMetadata[item.id] || {}), title: e.target.value.toUpperCase() } })}
                      placeholder="Título Personalizado..."
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeMode === 'SEMANTIC' && (
            <div className="space-y-10 animate-fade-in pb-20">
              <div className="p-8 bg-indigo-600 text-white shadow-2xl relative overflow-hidden rounded-[2.5rem]">
                <div className="absolute top-0 right-0 p-4 opacity-10"><Brain size={120} /></div>
                <h4 className="text-xl font-black uppercase tracking-tightest relative z-10">Dicionário SRE</h4>
                <p className="text-[9px] font-black uppercase tracking-widest mt-2 opacity-80 relative z-10">Tradução e Semântica Global</p>
                <button onClick={() => { const k = prompt("Nova Chave Semântica (Ex: FINANCEIRO):"); if (k) setDictionary({ ...dictionary, [k.toUpperCase()]: 'DEFINIÇÃO' }); }} className="mt-8 w-full py-4 bg-white text-indigo-950 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-2xl active:scale-95 transition-all">
                  <Plus size={16} /> Injetar Chave Semântica
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input type="text" placeholder="BUSCAR TERMO..." className="w-full pl-14 h-16 bg-white border border-slate-200 rounded-3xl font-black uppercase text-xs shadow-inner outline-none focus:border-indigo-500 transition-all" />
              </div>

              <div className="space-y-4">
                {Object.entries(dictionary).map(([key, value]) => (
                  <div key={key} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4 group hover:border-indigo-400 transition-all">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">{key}</span>
                      <button onClick={() => { const d = { ...dictionary }; delete d[key]; setDictionary(d); }} className="text-rose-300 hover:text-rose-500 p-2"><Trash2 size={16} /></button>
                    </div>
                    <input value={value} onChange={e => setDictionary({ ...dictionary, [key]: e.target.value.toUpperCase() })} className="w-full bg-white border border-slate-100 rounded-2xl text-xs font-black uppercase p-4 focus:ring-4 focus:ring-indigo-500/10 outline-none shadow-inner" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeMode === 'AUDIT' && (
              <div className="space-y-8 animate-fade-in">
                  <div className="p-8 bg-slate-900 rounded-3xl text-white">
                      <div className="flex items-center gap-3 mb-4">
                          <History size={20} className="text-indigo-400" />
                          <h4 className="text-sm font-black uppercase">Trilha de Estilo</h4>
                      </div>
                      <p className="text-[9px] text-slate-400 uppercase tracking-widest leading-relaxed">Registro imutável das últimas 5 sincronizações do DNA Visual.</p>
                  </div>
                  
                  <div className="space-y-4">
                      {[
                          { date: 'Hoje, 14:22', user: 'SRE MASTER', desc: 'Ajuste de Overlap e Raio de Borda (Desktop)' },
                          { date: 'Ontem, 09:10', user: 'ADMIN', desc: 'Expansão da paleta de cores (Sucesso/Erro)' },
                          { date: '22 Abr, 11:45', user: 'SRE MASTER', desc: 'Normalização de tipografia em mobile' },
                          { date: '21 Abr, 18:30', user: 'SRE MASTER', desc: 'Setup inicial de DNA Studio Lab' }
                      ].map((log, i) => (
                          <div key={i} className="p-5 bg-white border border-slate-100 rounded-2xl shadow-sm space-y-2">
                              <div className="flex justify-between items-center">
                                  <span className="text-[8px] font-black text-indigo-600 uppercase bg-indigo-50 px-2 py-0.5 rounded">{log.user}</span>
                                  <span className="text-[8px] font-bold text-slate-400">{log.date}</span>
                              </div>
                              <p className="text-[10px] font-bold text-slate-600 uppercase leading-relaxed">{log.desc}</p>
                          </div>
                      ))}
                  </div>
              </div>
          )}
        </aside>

        <main className="flex-1 bg-slate-200 p-6 md:p-12 relative flex flex-col items-center justify-center overflow-hidden">
            {/* SIMULATOR HUD */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[100] flex bg-slate-900/90 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 shadow-2xl gap-1">
                {PRESETS.map(preset => (
                    <button 
                        key={preset.id} 
                        onClick={() => { setSimPreset(preset); setZoomLevel(preset.w > 1200 ? 0.6 : 1); }}
                        className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase transition-all flex items-center gap-2 ${simPreset.id === preset.id ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-white'}`}
                    >
                        <preset.icon size={12}/> <span className="hidden sm:inline">{preset.label}</span>
                    </button>
                ))}
            </div>

            <div className="absolute top-6 right-6 z-[100] flex bg-slate-900/90 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 shadow-2xl gap-4 items-center px-4">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Zoom: {Math.round(zoomLevel * 100)}%</span>
                <input type="range" min="0.2" max="1.5" step="0.1" value={zoomLevel} onChange={e => setZoomLevel(parseFloat(e.target.value))} className="w-32 h-1 bg-slate-700 rounded-full cursor-pointer accent-indigo-500" />
            </div>

          <div
            className="bg-white shadow-[0_80px_200px_-50px_rgba(0,0,0,0.6)] transition-all duration-700 ease-in-out relative flex flex-col overflow-hidden"
            style={{
              width: `${simPreset.w}px`,
              height: `${simPreset.h}px`,
              transform: `scale(${zoomLevel})`,
              borderRadius: simPreset.id.includes('mobile') ? '4rem' : 'var(--sie-radius)',
              border: simPreset.id.includes('mobile') ? '14px solid #020617' : 'none' 
            }}
          >
            <div className="flex flex-1 overflow-hidden relative" style={dynamicStyles}>
              
              {/* DESKTOP SIDEBAR SIMULATED */}
              {!simPreset.id.includes('mobile') && (
                <aside
                    className="hidden lg:flex flex-col overflow-hidden transition-all duration-500 border-r shrink-0"
                    style={{
                    width: 'var(--sidebar-w)',
                    backgroundColor: 'var(--sidebar-bg)',
                    color: 'var(--sidebar-text)',
                    borderColor: 'var(--sidebar-border)'
                    }}
                >
                    <div className="p-8 border-b flex justify-between items-center" style={{ borderColor: 'var(--sidebar-border)' }}>
                    <Fingerprint size={32} style={{ color: 'var(--sidebar-active)' }} />
                    </div>
                    <div className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
                    {MENU_ITEMS.filter(item => sidebarManifest[item.id]?.visible !== false).map(item => (
                        <div
                        key={item.id}
                        onClick={() => setActiveSimModuleId(item.id)}
                        className={`p-4 rounded-xl flex items-center gap-4 cursor-pointer transition-all ${activeSimModuleId === item.id ? 'shadow-lg' : 'opacity-70'}`}
                        style={{
                            backgroundColor: activeSimModuleId === item.id ? 'var(--sidebar-active)' : 'transparent',
                            color: activeSimModuleId === item.id ? '#fff' : 'var(--sidebar-text)',
                            borderRadius: 'calc(var(--radius) * 0.5)'
                        }}
                        >
                        <item.icon size={18} />
                        {!isSidebarSimCollapsed && (
                            <span className="text-[10px] font-black uppercase tracking-widest truncate">
                            {sidebarManifest[item.id]?.label || item.label}
                            </span>
                        )}
                        </div>
                    ))}
                    </div>
                </aside>
              )}

              {/* MOBILE MENU SIMULATION (SIDEBAR) */}
              {simPreset.id.includes('mobile') && currentTokens.mobileMenuType === 'SIDEBAR' && (
                  <div 
                    className={`absolute inset-0 z-[300] bg-slate-950/80 backdrop-blur-md transition-all duration-500 ${mobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                      <div 
                        className={`absolute top-0 bottom-0 w-[80%] bg-slate-900 border-slate-800 transition-all duration-500 flex flex-col p-8 ${mobileMenuOpen ? 'translate-x-0' : (currentTokens.mobileMenuSide === 'right' ? 'translate-x-full' : '-translate-x-full')}`}
                        style={{ [currentTokens.mobileMenuSide === 'right' ? 'right' : 'left']: 0, backgroundColor: 'var(--sidebar-bg)' }}
                        onClick={e => e.stopPropagation()}
                      >
                          <div className="flex justify-between items-center mb-10">
                              <Fingerprint size={32} style={{ color: 'var(--sidebar-active)' }} />
                              <button onClick={() => setMobileMenuOpen(false)}><X size={24} className="text-white"/></button>
                          </div>
                          <div className="space-y-4">
                              {MENU_ITEMS.slice(0, 5).map(item => (
                                  <div key={item.id} className="flex items-center gap-4 text-slate-400 p-2 font-black uppercase text-[10px] tracking-widest">
                                      <item.icon size={18}/> {item.label}
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              )}

              {/* MOBILE MENU SIMULATION (DRAWER_TOP) */}
              {simPreset.id.includes('mobile') && currentTokens.mobileMenuType === 'DRAWER_TOP' && (
                  <div 
                    className={`absolute inset-0 z-[300] bg-slate-950/80 backdrop-blur-md transition-all duration-500 ${mobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                      <div 
                        className={`absolute top-0 left-0 w-full bg-slate-900 border-b border-slate-800 transition-all duration-500 flex flex-col p-8 ${mobileMenuOpen ? 'translate-y-0' : '-translate-y-full'}`}
                        style={{ backgroundColor: 'var(--sidebar-bg)' }}
                        onClick={e => e.stopPropagation()}
                      >
                          <div className="flex justify-between items-center mb-6">
                              <Fingerprint size={32} style={{ color: 'var(--sidebar-active)' }} />
                              <button onClick={() => setMobileMenuOpen(false)}><X size={24} className="text-white"/></button>
                          </div>
                          <div className="space-y-4 max-h-[50vh] overflow-y-auto">
                              {MENU_ITEMS.slice(0, 5).map(item => (
                                  <div key={item.id} className="flex items-center gap-4 text-slate-400 p-3 font-black uppercase text-[10px] tracking-widest border-b border-white/5">
                                      <item.icon size={18}/> {item.label}
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              )}

              {/* VIEWPORT PRINCIPAL SIMULADO */}
              <div className="flex-1 overflow-hidden flex flex-col relative" style={{ backgroundColor: 'var(--surface)' }}>
                
                {/* MOBILE TOP BAR (If Mobile) */}
                {simPreset.id.includes('mobile') && (
                    <div className="h-16 px-6 bg-white border-b border-slate-100 flex items-center justify-between shrink-0 relative z-20">
                         <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white"><Shield size={16}/></div>
                             <span className="text-[10px] font-black uppercase">{systemInfo.shortName}</span>
                         </div>
                         {/* SRE: Menu icon only if not Bottom Nav */}
                         {currentTokens.mobileMenuType !== 'BOTTOM_NAV' && (
                             <button onClick={() => setMobileMenuOpen(true)} className="p-2 bg-slate-100 rounded-lg text-slate-600"><Menu size={20}/></button>
                         )}
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-[var(--viewport-padding)] flex flex-col gap-10 custom-scrollbar relative">
                  
                  <div 
                    id="sim-panel-header"
                    className="flex justify-between items-center gap-8 bg-slate-900 p-[var(--padding-inner)] rounded-[var(--radius)] text-white shadow-2xl relative overflow-hidden shrink-0 z-10"
                    style={{ margin: 'var(--border-spacing)' }}
                  >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                    <div className="flex items-center gap-6 relative z-10 w-full" style={{ justifyContent: 'var(--title-justify)' }}>
                      <div className="p-5 bg-indigo-600 rounded-[1.5rem] shadow-2xl" style={{ backgroundColor: 'var(--primary)', borderRadius: 'calc(var(--radius) * 0.7)' }}>
                        {activeModuleInSim && <activeModuleInSim.icon size={32} />}
                      </div>
                      <div style={{ textAlign: (dynamicStyles['--title-align'] as any) }}>
                        <h2 style={{ fontSize: 'calc(var(--font-base) * var(--font-scale))', fontWeight: 'var(--font-weight-heading)' as any, letterSpacing: 'var(--letter-spacing)' }} className="uppercase tracking-tightest leading-none">
                          {moduleMetadata[activeSimModuleId]?.title || activeModuleInSim?.label}
                        </h2>
                        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mt-3 opacity-80">
                          {moduleMetadata[activeSimModuleId]?.slogan || 'SRE OPERATIONAL HUD'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className={`grid gap-10 relative z-10 ${simPreset.w > 1200 ? 'grid-cols-2' : 'grid-cols-1'}`} style={{ margin: 'var(--border-spacing)' }}>
                    <div 
                        className="bg-white p-[var(--padding-inner)] rounded-[var(--radius)] shadow-[var(--shadow)] flex flex-col justify-between min-h-[250px] group overflow-hidden relative"
                        style={{ borderWidth: 'var(--card-border-w)', borderColor: '#e2e8f0', borderStyle: 'solid' }}
                    >
                      <div className="relative z-10 space-y-8">
                        <div>
                          <h4 style={{ fontWeight: 'var(--font-weight-heading)' as any, letterSpacing: 'var(--letter-spacing)' }} className="text-xl uppercase text-slate-800 tracking-tight">Geometria SRE</h4>
                          <p style={{ fontSize: 'var(--font-base)' }} className="text-slate-400 font-bold uppercase mt-2 leading-relaxed">Demonstração de escala tipográfica e peso visual.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => setShowSimulatedForm(!showSimulatedForm)} 
                                className="w-full py-6 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl active:scale-95 transition-all hover:brightness-110" 
                                style={{ backgroundColor: 'var(--primary)', height: 'var(--input-h)', borderRadius: 'var(--button-radius)', fontWeight: 'var(--button-weight)' as any }}
                            >
                                {showSimulatedForm ? 'Fechar Form' : 'Testar Overlap'}
                            </button>
                            <button 
                                className="w-full py-6 text-emerald-700 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl border-2 border-emerald-100 hover:bg-emerald-50 transition-all" 
                                style={{ height: 'var(--input-h)', borderRadius: 'var(--button-radius)', fontWeight: 'var(--button-weight)' as any }}
                            >
                                Action Secundária
                            </button>
                        </div>
                      </div>
                    </div>

                    <div 
                        className="bg-white p-[var(--padding-inner)] rounded-[var(--radius)] shadow-[var(--shadow)] flex flex-col justify-between min-h-[250px]"
                        style={{ borderWidth: 'var(--card-border-w)', borderColor: '#e2e8f0', borderStyle: 'solid' }}
                    >
                        <div className="space-y-6">
                            <h4 style={{ fontSize: 'calc(var(--font-base) * 0.8)' }} className="font-black uppercase text-slate-400 tracking-widest">Inputs Parametrizados</h4>
                            <div className="space-y-4">
                                <input 
                                    className="w-full h-14 px-6 bg-slate-50 border-slate-200 outline-none focus:border-indigo-500 transition-all uppercase font-black text-xs" 
                                    style={{ height: 'var(--input-h)', borderWidth: 'var(--input-border-w)', borderStyle: 'solid', borderRadius: 'calc(var(--radius) * 0.7)' }}
                                    placeholder="Exemplo de Input..." 
                                />
                                <div className="flex gap-4">
                                    <div className="h-14 w-1/2 bg-slate-100 animate-pulse rounded-2xl"></div>
                                    <div className="h-14 w-1/2 bg-slate-100 animate-pulse rounded-2xl"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                  </div>
                </div>

                {/* BOTTOM NAV SIMULATION */}
                {simPreset.id.includes('mobile') && currentTokens.mobileMenuType === 'BOTTOM_NAV' && (
                    <div className="h-20 bg-white/90 backdrop-blur-md border-t border-slate-200 flex items-center justify-around px-4 shrink-0 z-30">
                         {MENU_ITEMS.slice(0, 4).map(item => (
                             <div key={item.id} className="flex flex-col items-center gap-1 text-slate-400">
                                 <item.icon size={20}/>
                                 <span className="text-[7px] font-black uppercase tracking-widest">{item.label.split(' ')[0]}</span>
                             </div>
                         ))}
                    </div>
                )}

                <footer 
                    className="shrink-0 bg-slate-900 border-t border-white/10 px-10 flex items-center justify-between text-white z-[50]"
                    style={{ height: 'var(--footer-h)' }}
                >
                    <div className="flex items-center gap-4">
                        <Shield size={20} className="text-indigo-400" />
                        <span className="text-[9px] font-black uppercase tracking-widest">SRE Alpha Node Online</span>
                    </div>
                </footer>
              </div>
            </div>
            
            {/* OVERLAY GLASS SIMULADO */}
            {showSimulatedForm && (
                <div className="absolute inset-0 z-[400] bg-slate-950/80 backdrop-blur-lg flex items-center justify-center p-12">
                    <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden animate-scale-in" style={{ opacity: 'var(--glass-opacity)' as any }}>
                        <div className="h-16 px-8 bg-slate-900 text-white flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase tracking-widest">Protocolo de Teste</span>
                            <button onClick={() => setShowSimulatedForm(false)}><X size={20}/></button>
                        </div>
                        <div className="p-10 space-y-8">
                             <div className="h-4 w-1/2 bg-slate-100 rounded-full"></div>
                             <div className="h-32 w-full bg-slate-50 border border-slate-100 rounded-3xl"></div>
                             <button className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase" style={{ backgroundColor: 'var(--primary)', borderRadius: 'var(--button-radius)' }}>Confirmar Handshake</button>
                        </div>
                    </div>
                </div>
            )}
          </div>
        </main>
      </div>

      <footer className="bg-white border-t border-slate-200 px-10 flex items-center justify-between shrink-0" 
              style={{ height: 'var(--sie-footer-h)' }}>
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-4">
            <ShieldCheck size={18} className="text-indigo-600" style={{ color: 'var(--sie-primary)' }} />
            <span className="text-[10px] font-black uppercase text-slate-600 tracking-widest">SRE Design Sovereign Hub V9.2</span>
          </div>
          <div className="h-5 w-px bg-slate-200"></div>
          <div className="flex items-center gap-4">
              <Signal size={16} className="text-emerald-500 animate-pulse"/>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Kernel Sincronizado: 200 OK</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default StudioLab;
