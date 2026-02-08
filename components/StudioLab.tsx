
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
  CheckSquare, ImageIcon, Type, Smartphone as MobileDevice,
  MousePointer, Signal, Landmark, FileCode, ClipboardCheck,
  Maximize2, Minimize2, Columns, Type as TypographyIcon,
  MousePointer2 as CursorIcon, Square, Circle, History,
  LayoutTemplate, Navigation, PanelTop, Table as TableIcon, Menu,
  Braces, Terminal, Copy, LogOut, Accessibility, Activity,
  CloudLightning, HardDrive, Filter, Gauge, User, Users,
  EyeOff, Settings2, MousePointerClick, Home, ListFilter, Sliders,
  Tag, Type as TypeIcon, GripVertical, MousePointerClick as ClickIcon,
  SunMedium, Moon, Share2, CornerRightDown
} from 'lucide-react';
import { studioService, systemService, aiService } from '../services/api';
import { DesignTokens, DualDesignSystem, SystemInfo } from '../types';
import { MENU_ITEMS } from '../constants';
import { useNavigate } from 'react-router-dom';

const PRESETS = [
  { id: 'mobile-narrow', label: 'Mobile (360px)', w: 360, h: 800, icon: Smartphone },
  { id: 'mobile-pro', label: 'iPhone Pro (430px)', w: 430, h: 932, icon: Smartphone },
  { id: 'hd', label: 'HD (720p)', w: 1280, h: 720, icon: Monitor },
  { id: 'fhd', label: 'FHD (1080p)', w: 1920, h: 1080, icon: Monitor }
];

// --- INTERFACES DE CONTROLE ---
interface ControlItemProps {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    unit: string;
    onChange: (val: number) => void;
}

interface ColorControlProps {
    label: string;
    value: string;
    onChange: (val: string) => void;
}

interface ToggleItemProps {
    label: string;
    active: boolean;
    onToggle: (val: boolean) => void;
}

const StudioLab = ({ systemInfo, designSystem, setDesignSystem }: {
  systemInfo: SystemInfo,
  designSystem: DualDesignSystem,
  setDesignSystem: React.Dispatch<React.SetStateAction<DualDesignSystem | null>>
}) => {
  const navigate = useNavigate();
  const [activePlatform, setActivePlatform] = useState<'desktop' | 'mobile'>('desktop');
  const [activeMode, setActiveMode] = useState<'VISUAL' | 'MANIFEST' | 'SEMANTIC' | 'NEURAL' | 'RAW'>('VISUAL');
  const [activeVisualPanel, setActiveVisualPanel] = useState<'GEOMETRY' | 'TYPOGRAPHY' | 'ATMOSPHERE' | 'SIDEBAR' | 'STRATEGY'>('GEOMETRY');

  const [isSaving, setIsSaving] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [simPreset, setSimPreset] = useState(PRESETS[3]);
  const [zoomLevel, setZoomLevel] = useState(0.45);
  
  const [moduleMetadata, setModuleMetadata] = useState<any>(systemInfo.module_metadata || {});
  const [dictionary, setDictionary] = useState<Record<string, string>>(systemInfo.dictionary || {});

  const currentTokens = designSystem?.[activePlatform] || designSystem?.desktop;

  useEffect(() => {
      if (activePlatform === 'mobile') setZoomLevel(0.8);
      else setZoomLevel(0.45);
  }, [activePlatform]);

  const handleUpdateToken = useCallback((field: keyof DesignTokens, value: any) => {
    setDesignSystem(prev => {
      if (!prev) return null;
      return { 
        ...prev, 
        [activePlatform]: { 
            ...prev[activePlatform], 
            [field]: value 
        } 
      };
    });
  }, [activePlatform, setDesignSystem]);

  const handleNeuralGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsAiThinking(true);
    try {
        const prompt = `Designer SRE Master. Com base no conceito "${aiPrompt}", sugira um Design System em JSON. 
        Inclua: primaryColor, surfaceColor, borderRadius, fontScale, sidebarBg, glassOpacity. 
        Retorne APENAS o JSON puro.`;
        
        const res = await aiService.chat(prompt);
        const text = res.data.text.replace(/```json|```/g, '').trim();
        const suggested = JSON.parse(text);
        
        setDesignSystem(prev => {
            if (!prev) return null;
            return {
                ...prev,
                [activePlatform]: { ...prev[activePlatform], ...suggested }
            };
        });
        setAiPrompt('');
        alert("✨ DNA VISUAL RECONSTRUÍDO.");
    } catch (e) {
        alert("Erro na síntese neural.");
    } finally {
        setIsAiThinking(false);
    }
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
      alert("✅ KERNEL MESTRE SINCRONIZADO.");
    } catch (e) {
      alert("FALHA AO GRAVAR NO LEDGER.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!currentTokens) return (
    <div className="h-screen w-screen bg-[#020617] flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500 mb-4" size={48} />
        <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.4em]">Handshake Design Tokens...</p>
    </div>
  );

  const dynamicStyles = {
    '--radius': `${currentTokens.borderRadius}px`,
    '--viewport-padding': `${currentTokens.viewportPadding}px`,
    '--primary': currentTokens.primaryColor,
    '--surface': currentTokens.surfaceColor,
    '--sidebar-bg': currentTokens.sidebarBg || '#020617',
    '--font-base': `${currentTokens.fontSizeBase}px`,
    '--font-scale': `${currentTokens.fontScale || 1.2}`,
  } as React.CSSProperties;

  return (
    <div className="fixed inset-0 z-[10000] w-screen h-screen bg-[#020617] flex flex-col animate-fade-in font-sans overflow-hidden">
      
      {/* HUD Header SRE */}
      <div className="h-20 px-8 bg-slate-900 text-white flex justify-between items-center shrink-0 z-[110] border-b border-white/5 relative shadow-2xl">
        <div className="flex items-center gap-6">
          <div className="p-3 bg-indigo-600 rounded-xl shadow-xl shadow-indigo-950/40"><Palette size={20} className="text-white" /></div>
          <div>
            <h1 className="text-xl font-black uppercase tracking-tightest leading-none">Studio Lab</h1>
            <p className="text-[8px] text-indigo-400 font-black uppercase tracking-widest mt-1">Design System Architect V52.0</p>
          </div>
        </div>

        <div className="hidden lg:flex bg-white/5 p-1 rounded-2xl border border-white/10 overflow-x-auto no-scrollbar max-w-xl">
          {[
            { id: 'VISUAL', label: 'Visual', icon: Palette },
            { id: 'MANIFEST', label: 'Módulos', icon: ListFilter },
            { id: 'SEMANTIC', label: 'Dicionário', icon: Languages },
            { id: 'NEURAL', label: 'IA Designer', icon: Brain },
            { id: 'RAW', label: 'Código', icon: Code }
          ].map(mode => (
            <button key={mode.id} onClick={() => setActiveMode(mode.id as any)} className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-2 whitespace-nowrap ${activeMode === mode.id ? 'bg-white text-indigo-900 shadow-lg' : 'text-slate-400 hover:text-white'}`}>
              <mode.icon size={14} /> {mode.label}
            </button>
          ))}
        </div>

        <div className="flex gap-4">
          <button onClick={() => navigate('/terminal')} className="p-3 bg-white/5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-all flex items-center gap-2 font-black text-[9px] uppercase tracking-widest group border border-white/5">
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" /> Sair
          </button>
          <button onClick={handleSaveMaster} disabled={isSaving} className="flex items-center gap-3 bg-white text-indigo-950 px-8 py-3 rounded-xl shadow-xl hover:bg-indigo-50 transition-all font-black text-[10px] uppercase tracking-widest active:scale-95">
            {isSaving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />} Sincronizar
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden bg-white relative">
        <aside className="w-96 border-r border-slate-200 p-8 overflow-y-auto bg-white custom-scrollbar shrink-0 z-40">
           <div className="mb-10 p-1.5 bg-slate-100 rounded-2xl flex gap-1 shadow-inner">
            <button onClick={() => setActivePlatform('desktop')} className={`flex-1 py-3.5 rounded-xl text-[9px] font-black uppercase transition-all flex items-center justify-center gap-2 ${activePlatform === 'desktop' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
              <Monitor size={14} /> Desktop
            </button>
            <button onClick={() => setActivePlatform('mobile')} className={`flex-1 py-3.5 rounded-xl text-[9px] font-black uppercase transition-all flex items-center justify-center gap-2 ${activePlatform === 'mobile' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}>
              <Smartphone size={14} /> Mobile
            </button>
          </div>
          
          {activeMode === 'VISUAL' && (
              <div className="space-y-10 animate-fade-in pb-20">
                  <div className="grid grid-cols-5 bg-slate-50 p-1 rounded-xl border border-slate-100">
                      {[
                        { id: 'GEOMETRY', icon: Box, label: 'Geo' },
                        { id: 'TYPOGRAPHY', icon: TypeIcon, label: 'Font' },
                        { id: 'ATMOSPHERE', icon: Droplets, label: 'Atm' },
                        { id: 'SIDEBAR', icon: SidebarIcon, label: 'Side' },
                        { id: 'STRATEGY', icon: Settings2, label: 'Strat' }
                      ].map(p => (
                          <button key={p.id} onClick={() => setActiveVisualPanel(p.id as any)} className={`py-3 rounded-lg text-[7px] font-black uppercase flex flex-col items-center gap-1 transition-all ${activeVisualPanel === p.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}>
                              <p.icon size={12}/> {p.label}
                          </button>
                      ))}
                  </div>

                  {activeVisualPanel === 'GEOMETRY' && (
                      <div className="space-y-8 animate-fade-in">
                          <SectionHeader icon={Box} title="Geometria & Bordas" />
                          <ControlItem label="Raio Global" value={currentTokens.borderRadius} min={0} max={60} unit="px" onChange={(v: number) => handleUpdateToken('borderRadius', v)} />
                          <ControlItem label="Viewport Padding" value={currentTokens.viewportPadding} min={0} max={64} step={4} unit="px" onChange={(v: number) => handleUpdateToken('viewportPadding', v)} />
                          <ControlItem label="Altura Inputs" value={currentTokens.inputHeight} min={40} max={80} unit="px" onChange={(v: number) => handleUpdateToken('inputHeight', v)} />
                          <ControlItem label="Raio Botão" value={currentTokens.buttonRadius} min={0} max={40} unit="px" onChange={(v: number) => handleUpdateToken('buttonRadius', v)} />
                          <ControlItem label="Input Border Width" value={currentTokens.inputBorderWidth} min={0} max={8} unit="px" onChange={(v: number) => handleUpdateToken('inputBorderWidth', v)} />
                          <ControlItem label="Card Border Width" value={currentTokens.cardBorderWidth} min={0} max={8} unit="px" onChange={(v: number) => handleUpdateToken('cardBorderWidth', v)} />
                          <ControlItem label="Espaçamento (Grid)" value={currentTokens.borderSpacing} min={0} max={48} unit="px" onChange={(v: number) => handleUpdateToken('borderSpacing', v)} />
                      </div>
                  )}

                  {activeVisualPanel === 'TYPOGRAPHY' && (
                      <div className="space-y-8 animate-fade-in">
                          <SectionHeader icon={TypeIcon} title="Tipografia & Escala" />
                          <ControlItem label="Base Font Size" value={currentTokens.fontSizeBase} min={10} max={24} unit="px" onChange={(v: number) => handleUpdateToken('fontSizeBase', v)} />
                          <ControlItem label="Escala Modular" value={currentTokens.fontScale} min={1} max={1.6} step={0.05} unit="x" onChange={(v: number) => handleUpdateToken('fontScale', v)} />
                          <ControlItem label="Letter Spacing" value={currentTokens.letterSpacingBase} min={-10} max={20} unit="%" onChange={(v: number) => handleUpdateToken('letterSpacingBase', v)} />
                          <ControlItem label="Peso Títulos" value={currentTokens.fontWeightHeading} min={300} max={900} step={100} unit="w" onChange={(v: number) => handleUpdateToken('fontWeightHeading', v)} />
                          <ControlItem label="Peso Botões" value={currentTokens.buttonWeight} min={300} max={900} step={100} unit="w" onChange={(v: number) => handleUpdateToken('buttonWeight', v)} />
                      </div>
                  )}

                  {activeVisualPanel === 'ATMOSPHERE' && (
                      <div className="space-y-8 animate-fade-in">
                          <SectionHeader icon={Droplets} title="Cores & Atmosfera" />
                          <div className="grid grid-cols-2 gap-4">
                                <ColorControl label="Primária" value={currentTokens.primaryColor} onChange={(v: string) => handleUpdateToken('primaryColor', v)} />
                                <ColorControl label="Superfície" value={currentTokens.surfaceColor} onChange={(v: string) => handleUpdateToken('surfaceColor', v)} />
                                <ColorControl label="Sucesso" value={currentTokens.successColor} onChange={(v: string) => handleUpdateToken('successColor', v)} />
                                <ColorControl label="Perigo" value={currentTokens.dangerColor} onChange={(v: string) => handleUpdateToken('dangerColor', v)} />
                                <ColorControl label="Alerta" value={currentTokens.warningColor} onChange={(v: string) => handleUpdateToken('warningColor', v)} />
                          </div>
                          <ControlItem label="Intensidade Sombras" value={currentTokens.shadowIntensity} min={0} max={0.5} step={0.05} unit="%" onChange={(v: number) => handleUpdateToken('shadowIntensity', v)} />
                          <ControlItem label="Opacidade Vidro" value={currentTokens.glassOpacity} min={0} max={100} unit="%" onChange={(v: number) => handleUpdateToken('glassOpacity', v)} />
                      </div>
                  )}

                  {activeVisualPanel === 'SIDEBAR' && (
                      <div className="space-y-8 animate-fade-in">
                          <SectionHeader icon={SidebarIcon} title="Barra Lateral (Desktop)" />
                          <ColorControl label="Fundo Sidebar" value={currentTokens.sidebarBg} onChange={(v: string) => handleUpdateToken('sidebarBg', v)} />
                          <ColorControl label="Cor Texto" value={currentTokens.sidebarTextColor} onChange={(v: string) => handleUpdateToken('sidebarTextColor', v)} />
                          <ColorControl label="Item Ativo" value={currentTokens.sidebarActiveColor} onChange={(v: string) => handleUpdateToken('sidebarActiveColor', v)} />
                          <ColorControl label="Item Hover" value={currentTokens.sidebarHoverColor} onChange={(v: string) => handleUpdateToken('sidebarHoverColor', v)} />
                          <ControlItem label="Largura Aberta" value={currentTokens.sidebarWidth} min={200} max={400} step={10} unit="px" onChange={(v: number) => handleUpdateToken('sidebarWidth', v)} />
                          <ControlItem label="Largura Colapsada" value={currentTokens.sidebarWidthCollapsed} min={60} max={120} step={5} unit="px" onChange={(v: number) => handleUpdateToken('sidebarWidthCollapsed', v)} />
                          <ControlItem label="Tamanho Ícones" value={currentTokens.sidebarIconSize} min={16} max={32} unit="px" onChange={(v: number) => handleUpdateToken('sidebarIconSize', v)} />
                      </div>
                  )}

                  {activeVisualPanel === 'STRATEGY' && (
                      <div className="space-y-8 animate-fade-in">
                          <SectionHeader icon={Settings2} title="Estratégia de UI" />
                          <div className="space-y-6">
                                <ToggleItem label="Centralizar Títulos" active={currentTokens.centerTitle} onToggle={(v: boolean) => handleUpdateToken('centerTitle', v)} />
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Menu Mobile</label>
                                    <select className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-[10px] font-black uppercase outline-none" value={currentTokens.mobileMenuType} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleUpdateToken('mobileMenuType', e.target.value)}>
                                        <option value="SIDEBAR">GAVETA LATERAL</option>
                                        <option value="BOTTOM_NAV">BARRA INFERIOR</option>
                                        <option value="DRAWER_TOP">MODAL SUPERIOR</option>
                                    </select>
                                </div>
                          </div>
                      </div>
                  )}
              </div>
          )}

          {activeMode === 'MANIFEST' && (
              <div className="space-y-10 animate-fade-in pb-20">
                  <SectionHeader icon={ListFilter} title="Manifesto de Módulos" />
                  <div className="space-y-6">
                      {MENU_ITEMS.map(m => (
                          <div key={m.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 shadow-inner">
                              <div className="flex items-center gap-3">
                                  <div className="p-2 bg-white rounded-lg text-slate-400 shadow-sm"><m.icon size={14}/></div>
                                  <span className="text-[10px] font-black uppercase text-indigo-600">Módulo: {m.id}</span>
                              </div>
                              <div className="space-y-3">
                                  <input 
                                    className="w-full h-11 bg-white border border-slate-200 rounded-xl px-4 text-xs font-black uppercase outline-none focus:border-indigo-500 shadow-sm"
                                    placeholder={`Rótulo (Ex: ${m.label})`}
                                    value={moduleMetadata[m.id]?.title || ''}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setModuleMetadata({...moduleMetadata, [m.id]: {...(moduleMetadata[m.id]||{}), title: e.target.value.toUpperCase()}})}
                                  />
                                  <input 
                                    className="w-full h-11 bg-white border border-slate-200 rounded-xl px-4 text-[10px] font-bold uppercase outline-none focus:border-indigo-500 shadow-sm placeholder:text-slate-300"
                                    placeholder="Slogan de Apoio..."
                                    value={moduleMetadata[m.id]?.slogan || ''}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setModuleMetadata({...moduleMetadata, [m.id]: {...(moduleMetadata[m.id]||{}), slogan: e.target.value.toUpperCase()}})}
                                  />
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {activeMode === 'SEMANTIC' && (
              <div className="space-y-10 animate-fade-in pb-20">
                  <SectionHeader icon={Languages} title="Dicionário Semântico" />
                  <div className="p-6 bg-amber-50 border border-amber-100 rounded-2xl mb-8">
                      <p className="text-[9px] font-bold text-amber-700 uppercase leading-relaxed">
                          Sobrescreva termos técnicos globais para adaptar a interface à cultura local do cluster.
                      </p>
                  </div>
                  <div className="space-y-6">
                      {['Membros', 'Unidade', 'Assembleia', 'Financeiro', 'Incidentes', 'Ouvidoria', 'Reservas'].map(term => (
                          <div key={term} className="space-y-2">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{term}</label>
                              <input 
                                className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-black uppercase outline-none focus:border-indigo-500 shadow-inner"
                                value={dictionary[term.toUpperCase()] || ''}
                                placeholder={`Ex: ${term}`}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDictionary({...dictionary, [term.toUpperCase()]: e.target.value.toUpperCase()})}
                              />
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {activeMode === 'NEURAL' && (
              <div className="space-y-8 animate-fade-in">
                  <SectionHeader icon={Brain} title="Designer Neural Gemini" />
                  <p className="text-[10px] text-slate-500 font-medium uppercase leading-relaxed">
                      Descreva o conceito visual e a IA irá recalcular todos os tokens do ecossistema.
                  </p>
                  <textarea 
                    rows={6}
                    className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] p-6 text-xs font-bold uppercase outline-none focus:border-indigo-500 transition-all shadow-inner"
                    placeholder="Ex: DESIGN MINIMALISTA DARK COM BORDAS ARREDONDADAS E CORES PASTÉIS..."
                    value={aiPrompt}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setAiPrompt(e.target.value)}
                  />
                  <button 
                    onClick={handleNeuralGenerate}
                    disabled={isAiThinking || !aiPrompt.trim()}
                    className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 hover:bg-indigo-600 transition-all"
                  >
                      {isAiThinking ? <Loader2 className="animate-spin" size={18}/> : <Sparkles size={18}/>}
                      Gerar Ecossistema Visual
                  </button>
              </div>
          )}

          {activeMode === 'RAW' && (
              <div className="h-full flex flex-col gap-4 animate-fade-in">
                  <SectionHeader icon={Code} title="JSON Design Tokens" />
                  <textarea 
                    className="flex-1 w-full bg-slate-900 text-emerald-400 font-mono text-[10px] p-6 rounded-2xl outline-none border border-white/5 resize-none shadow-2xl"
                    value={JSON.stringify(designSystem, null, 2)}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                        try {
                            const parsed = JSON.parse(e.target.value);
                            setDesignSystem(parsed);
                        } catch (err) {}
                    }}
                  />
              </div>
          )}
        </aside>

        <main className="flex-1 bg-slate-100 p-8 relative flex flex-col items-center justify-center overflow-hidden">
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[100] flex bg-slate-900/95 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 shadow-2xl gap-1">
            {PRESETS.map(preset => (
              <button key={preset.id} onClick={() => setSimPreset(preset)} className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all flex items-center gap-2 ${simPreset.id === preset.id ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                <preset.icon size={12} /> {preset.label}
              </button>
            ))}
          </div>

          <div
            className="bg-white shadow-[0_80px_200px_-50px_rgba(0,0,0,0.6)] transition-all duration-700 ease-in-out relative flex flex-col overflow-hidden"
            style={{
              width: `${simPreset.w}px`,
              height: `${simPreset.h}px`,
              transform: `scale(${zoomLevel})`,
              borderRadius: simPreset.id.includes('mobile') ? '3.5rem' : '0px',
              border: simPreset.id.includes('mobile') ? '12px solid #020617' : 'none'
            }}
          >
            <div className="flex flex-1 overflow-hidden relative" style={dynamicStyles}>
                {/* Preview HUD Interno */}
                <div className="flex-1 overflow-y-auto p-[var(--viewport-padding)] bg-white flex flex-col gap-10">
                    <div className="bg-slate-900 p-10 rounded-[var(--radius)] text-white relative overflow-hidden border border-white/5 shadow-2xl">
                        <div className="relative z-10 flex items-center gap-6">
                            <div className="p-5 bg-indigo-600 rounded-2xl" style={{ backgroundColor: 'var(--primary)' }}><Monitor size={28}/></div>
                            <div className={currentTokens.centerTitle ? 'text-center flex-1' : ''}>
                                <h2 style={{ fontSize: 'calc(var(--font-base) * var(--font-scale))', fontWeight: currentTokens.fontWeightHeading }} className="uppercase tracking-tightest leading-none">Protótipo Real</h2>
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-2 opacity-80">Sync: Design Tokens Active</p>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                        <div className="h-40 bg-slate-50 border border-slate-100 rounded-[var(--radius)] flex flex-col items-center justify-center gap-3 shadow-inner" style={{ borderWidth: 'var(--sie-card-border-w, 1px)' }}>
                             <div className="p-3 bg-white rounded-xl shadow-sm"><Users size={24} className="text-indigo-600"/></div>
                             <span className="text-[10px] font-black uppercase text-slate-800">{dictionary.MEMBROS || 'Membros'}</span>
                        </div>
                        <div className="h-40 bg-slate-50 border border-slate-100 rounded-[var(--radius)] flex flex-col items-center justify-center gap-3 shadow-inner" style={{ borderWidth: 'var(--sie-card-border-w, 1px)' }}>
                             <div className="p-3 bg-white rounded-xl shadow-sm"><Landmark size={24} className="text-emerald-600"/></div>
                             <span className="text-[10px] font-black uppercase text-slate-800">{dictionary.FINANCEIRO || 'Financeiro'}</span>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <input className="w-full bg-slate-50 border-slate-200 rounded-[var(--radius)] px-6" style={{ height: 'var(--sie-input-h, 56px)', borderWidth: 'var(--sie-input-border-w, 1px)' }} placeholder={`Ex: ${dictionary.UNIDADE || 'Unidade'}`} readOnly />
                        <button className="w-full text-white uppercase text-xs tracking-widest shadow-xl" style={{ height: 'var(--sie-input-h, 56px)', borderRadius: 'var(--radius)', fontWeight: currentTokens.buttonWeight, backgroundColor: 'var(--primary)' }}>Ação Principal</button>
                    </div>
                </div>
            </div>
          </div>
        </main>
      </div>

      <footer className="bg-white border-t border-slate-200 px-10 flex items-center justify-between shrink-0 h-16 relative z-[110]">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <ShieldCheck size={18} className="text-indigo-600" />
            <span className="text-[9px] font-black uppercase text-slate-600 tracking-widest">Cluster SRE Sovereign V52.0</span>
          </div>
          <div className="h-4 w-px bg-slate-200"></div>
          <div className="flex items-center gap-3">
            <Signal size={16} className="text-emerald-500 animate-pulse" />
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pulse: 200 OK</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

const SectionHeader = ({ icon: Icon, title }: { icon: any, title: string }) => (
    <h3 className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">
        <Icon size={14} className="text-indigo-500" /> {title}
    </h3>
);

const ControlItem = ({ label, value, min, max, step = 1, unit, onChange }: ControlItemProps) => (
    <div className="space-y-3">
        <div className="flex justify-between items-end">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
            <span className="text-[10px] font-black text-indigo-600">{value}{unit}</span>
        </div>
        <input 
            type="range" min={min} max={max} step={step} value={value} 
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(parseFloat(e.target.value))} 
            className="w-full accent-indigo-600 h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer" 
        />
    </div>
);

const ColorControl = ({ label, value, onChange }: ColorControlProps) => (
    <div className="space-y-2">
        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</label>
        <div className="flex gap-2 items-center">
            <input 
                type="color" 
                value={value || '#000000'} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)} 
                className="w-10 h-10 rounded-xl cursor-pointer border-2 border-white shadow-sm shrink-0" 
            />
            <input 
                type="text" 
                value={value || ''} 
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)} 
                className="flex-1 h-10 bg-slate-50 border border-slate-200 rounded-xl px-3 text-[10px] font-mono font-bold uppercase outline-none focus:border-indigo-500" 
            />
        </div>
    </div>
);

const ToggleItem = ({ label, active, onToggle }: ToggleItemProps) => (
    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
        <button onClick={() => onToggle(!active)} className={`p-1 rounded-full transition-all ${active ? 'bg-indigo-600' : 'bg-slate-300'}`}>
            {active ? <ToggleRight size={28} className="text-white"/> : <ToggleLeft size={28} className="text-slate-400"/>}
        </button>
    </div>
);

export default StudioLab;
