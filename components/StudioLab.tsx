
import React, { useState, useEffect, useMemo } from 'react';
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
  Columns
} from 'lucide-react';
import { studioService, systemService } from '../services/api';
import { DesignTokens, DualDesignSystem, SystemInfo } from '../types';
import { MENU_ITEMS } from '../constants';

const StudioLab = ({ systemInfo, designSystem, setDesignSystem }: {
  systemInfo: SystemInfo,
  designSystem: DualDesignSystem,
  setDesignSystem: React.Dispatch<React.SetStateAction<DualDesignSystem | null>>
}) => {
  const [activePlatform, setActivePlatform] = useState<'desktop' | 'mobile'>('desktop');
  const [activeMode, setActiveMode] = useState<'VISUAL' | 'SIDEBAR' | 'SEMANTIC' | 'AUDIT'>('VISUAL');
  const [isSaving, setIsSaving] = useState(false);
  const [isSidebarSimCollapsed, setIsSidebarSimCollapsed] = useState(false);
  const [showSimulatedForm, setShowSimulatedForm] = useState(false);

  const [activeSimModuleId, setActiveSimModuleId] = useState<string>('dashboard');
  const [moduleMetadata, setModuleMetadata] = useState<any>(systemInfo.module_metadata || {});
  const [dictionary, setDictionary] = useState<Record<string, string>>(systemInfo.dictionary || {});

  const currentTokens = designSystem[activePlatform];
  const sidebarManifest = moduleMetadata.sidebar || {};

  const handleUpdateToken = (field: keyof DesignTokens, value: any) => {
    setDesignSystem(prev => {
      if (!prev) return null;
      return {
        ...prev,
        [activePlatform]: { ...prev[activePlatform], [field]: value }
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
      alert("✅ KERNEL MASTER SINCRONIZADO: Geometria aplicada a todos os componentes reais e simulados.");
    } catch (e) { 
        alert("Falha ao comitar Ledger Visual."); 
    } finally { 
        setIsSaving(false); 
    }
  };

  const simulationStyles = {
    '--radius': `${currentTokens.borderRadius}px`,
    '--padding-inner': `${currentTokens.containerPadding}px`,
    '--viewport-padding': `${currentTokens.viewportPadding}px`,
    '--border-spacing': `${currentTokens.borderSpacing || 0}px`,
    '--sidebar-w': isSidebarSimCollapsed ? `${currentTokens.sidebarWidthCollapsed || 80}px` : `${currentTokens.sidebarWidth}px`,
    '--footer-h': `${currentTokens.footerHeight || 80}px`,
    '--primary': currentTokens.primaryColor,
    '--surface': currentTokens.surfaceColor,
    '--sidebar-bg': currentTokens.sidebarBg || '#020617',
    '--sidebar-active': currentTokens.sidebarActiveColor || currentTokens.primaryColor,
    '--sidebar-text': currentTokens.sidebarTextColor || '#94a3b8',
    '--sidebar-border': currentTokens.sidebarBorderColor || 'rgba(255,255,255,0.08)',
    '--sidebar-hover': currentTokens.sidebarHoverColor || 'rgba(255,255,255,0.05)',
    '--font-base': `${currentTokens.fontSizeBase}px`,
    '--font-scale': `${currentTokens.fontScale || 1.2}`,
    '--shadow': `0 ${currentTokens.shadowIntensity * 15}px ${currentTokens.shadowIntensity * 30}px rgba(0,0,0,${currentTokens.shadowIntensity})`,
    '--form-overlap': `${currentTokens.formOverlapOffset || 20}px`,
    '--title-align': currentTokens.centerTitle ? 'center' : 'left',
    '--title-justify': currentTokens.centerTitle ? 'center' : 'flex-start',
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
    <div className="flex flex-col h-full bg-white text-slate-800 animate-fade-in relative overflow-hidden" 
         style={{ borderRadius: 'var(--sie-radius)', border: '1px solid #e2e8f0', boxShadow: 'var(--shadow)' }}>

      <header className="h-20 px-8 bg-slate-900 flex flex-col md:flex-row justify-between items-center shrink-0 border-b border-white/5 z-50 gap-4">
        <div className="flex items-center gap-6 w-full md:w-auto" style={{ justifyContent: 'var(--sie-title-justify)' }}>
          <div className="p-2.5 bg-indigo-600 rounded-xl shadow-xl hidden sm:block" style={{ backgroundColor: 'var(--sie-primary)' }}>
            <Zap size={20} className="text-white" />
          </div>
          <div style={{ textAlign: 'var(--sie-title-align)' as any }}>
            <h1 className="text-sm md:text-lg font-black uppercase tracking-tightest leading-none text-white">Studio Lab <span className="text-indigo-400">PRO</span></h1>
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">SRE UI/UX Governance Engine</p>
          </div>
        </div>

        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 overflow-x-auto no-scrollbar">
          {[
            { id: 'VISUAL', label: 'Geometria', icon: Palette },
            { id: 'SIDEBAR', label: 'Manifesto', icon: SidebarIcon },
            { id: 'SEMANTIC', label: 'Semântica', icon: Languages },
            { id: 'AUDIT', label: 'Trilha', icon: ShieldCheck }
          ].map(mode => (
            <button key={mode.id} onClick={() => setActiveMode(mode.id as any)} className={`px-4 md:px-6 py-2 rounded-lg text-[9px] font-black uppercase transition-all flex items-center gap-2 whitespace-nowrap ${activeMode === mode.id ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-white'}`}>
              <mode.icon size={14} /> {mode.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button onClick={handleSaveMaster} disabled={isSaving} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-2.5 rounded-xl shadow-xl transition-all font-black text-[9px] uppercase tracking-widest">
            {isSaving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />} Sincronizar Kernel
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
        <aside className="w-full lg:w-[450px] border-r border-slate-200 p-8 overflow-y-auto bg-slate-50/50 custom-scrollbar shrink-0">
          <div className="mb-10 p-1.5 bg-slate-200 rounded-2xl flex gap-1" style={{ borderRadius: 'calc(var(--sie-radius) * 0.8)' }}>
            <button onClick={() => setActivePlatform('desktop')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-3 ${activePlatform === 'desktop' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
              <Monitor size={14} /> Desktop
            </button>
            <button onClick={() => setActivePlatform('mobile')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-3 ${activePlatform === 'mobile' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-500 hover:text-slate-700'}`}>
              <Smartphone size={14} /> Mobile
            </button>
          </div>

          {activeMode === 'VISUAL' && (
            <div className="space-y-10 animate-fade-in pb-32">
              <section className="space-y-6">
                <SectionHeader icon={Box} title="Geometria & Layout Ativo" />
                {[
                  { label: 'Raio de Curvatura (px)', field: 'borderRadius', min: 0, max: 60 },
                  { label: 'Padding Interno (px)', field: 'containerPadding', min: 0, max: 100 },
                  { label: 'Espaçamento Perimetral (px)', field: 'borderSpacing', min: 0, max: 100 },
                  { label: 'Altura do Rodapé (px)', field: 'footerHeight', min: 40, max: 150 },
                  { label: 'Encaixe de Form (Overlap Offset)', field: 'formOverlapOffset', min: -100, max: 100 }
                ].map(token => (
                  <div key={token.field} className="space-y-3 p-5 bg-white border border-slate-100 shadow-sm group hover:border-indigo-400 transition-all" style={{ borderRadius: 'var(--sie-radius)' }}>
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-slate-500 uppercase">{token.label}</label>
                      <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded" style={{ color: 'var(--sie-primary)' }}>{(currentTokens as any)[token.field] || 0}px</span>
                    </div>
                    <input
                      type="range" min={token.min} max={token.max}
                      value={(currentTokens as any)[token.field] || 0}
                      onChange={e => handleUpdateToken(token.field as any, parseInt(e.target.value))}
                      className="w-full accent-indigo-600 h-1.5 bg-slate-100 rounded-full cursor-pointer"
                      style={{ accentColor: 'var(--sie-primary)' }}
                    />
                  </div>
                ))}
              </section>

              <section className="space-y-6">
                <SectionHeader icon={Droplets} title="Cores do Cluster" />
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { label: 'Primária', field: 'primaryColor' },
                    { label: 'Superfície', field: 'surfaceColor' },
                    { label: 'Sidebar BG', field: 'sidebarBg' },
                    { label: 'Sidebar Borda', field: 'sidebarBorderColor' }
                  ].map(color => (
                    <div key={color.field} className="p-4 bg-white border border-slate-100 shadow-sm space-y-3 group hover:border-indigo-400 transition-all" style={{ borderRadius: 'var(--sie-radius)' }}>
                      <label className="text-[8px] font-black text-slate-400 uppercase block truncate">{color.label}</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={(currentTokens as any)[color.field] || '#000000'}
                          onChange={e => handleUpdateToken(color.field as any, e.target.value)}
                          className="w-10 h-10 rounded-lg border-none shadow-xl cursor-pointer"
                        />
                        <span className="text-[8px] font-mono text-slate-300 font-black">{(currentTokens as any)[color.field]}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </aside>

        <main className="flex-1 bg-slate-200 p-6 md:p-12 lg:p-16 relative flex items-center justify-center overflow-hidden">
          <div
            className="bg-white shadow-[0_80px_200px_-50px_rgba(0,0,0,0.6)] transition-all duration-700 ease-in-out relative flex flex-col overflow-hidden"
            style={{
              width: activePlatform === 'desktop' ? '100%' : '375px',
              height: activePlatform === 'desktop' ? '100%' : '812px',
              maxWidth: activePlatform === 'desktop' ? '1440px' : '375px',
              maxHeight: activePlatform === 'desktop' ? '850px' : '812px',
              borderRadius: activePlatform === 'mobile' ? '4rem' : '1rem',
              // SRE Fix: Remove borda artificial do preview para simular viewport real
              border: activePlatform === 'mobile' ? '14px solid #020617' : 'none' 
            }}
          >
            <div className="flex flex-1 overflow-hidden relative" style={simulationStyles}>
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

              <div className="flex-1 overflow-hidden flex flex-col relative" style={{ backgroundColor: 'var(--surface)' }}>
                <div className="flex-1 overflow-y-auto p-[var(--viewport-padding)] flex flex-col gap-10 custom-scrollbar relative">
                  
                  <div 
                    id="sim-panel-header"
                    className="flex justify-between items-center gap-8 bg-slate-900 p-[var(--padding-inner)] rounded-[var(--radius)] text-white shadow-2xl relative overflow-hidden shrink-0 z-30"
                    style={{ margin: 'var(--border-spacing)' }}
                  >
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                    <div className="flex items-center gap-6 relative z-10 w-full" style={{ justifyContent: 'var(--title-justify)' }}>
                      <div className="p-5 bg-indigo-600 rounded-[1.5rem] shadow-2xl" style={{ backgroundColor: 'var(--primary)', borderRadius: 'calc(var(--radius) * 0.7)' }}>
                        {activeModuleInSim && <activeModuleInSim.icon size={32} />}
                      </div>
                      <div style={{ textAlign: (simulationStyles['--title-align'] as any) }}>
                        <h2 style={{ fontSize: 'calc(var(--font-base) * var(--font-scale))', fontWeight: 900 }} className="uppercase tracking-tightest leading-none">
                          {moduleMetadata[activeSimModuleId]?.title || activeModuleInSim?.label}
                        </h2>
                        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mt-3 opacity-80">
                          {moduleMetadata[activeSimModuleId]?.slogan || 'SRE OPERATIONAL HUD'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10" style={{ margin: 'var(--border-spacing)' }}>
                    <div className="bg-white p-[var(--padding-inner)] rounded-[var(--radius)] shadow-[var(--shadow)] border border-slate-100 flex flex-col justify-between min-h-[250px] group overflow-hidden relative">
                      <div className="relative z-10 space-y-8">
                        <div>
                          <h4 className="text-xl font-black uppercase text-slate-800 tracking-tight">Geometria SRE</h4>
                          <p style={{ fontSize: 'var(--font-base)' }} className="text-slate-400 font-bold uppercase mt-2 leading-relaxed">Demonstração de escala tipográfica e raio de borda.</p>
                        </div>
                        <button 
                            onClick={() => setShowSimulatedForm(!showSimulatedForm)} 
                            className="w-full py-6 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-widest shadow-2xl active:scale-95 transition-all hover:brightness-110" 
                            style={{ backgroundColor: 'var(--primary)', borderRadius: 'calc(var(--radius) * 1.5)' }}
                        >
                            {showSimulatedForm ? 'Fechar Protocolo' : 'Abrir Form (Overlap)'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

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
            
            <div className="absolute top-6 right-6 bg-slate-900/90 backdrop-blur-xl px-6 py-2.5 rounded-full text-[10px] font-mono text-white/90 z-[200] border border-white/10 uppercase tracking-widest flex items-center gap-3">
              {activePlatform === 'desktop' ? <Monitor size={14}/> : <Smartphone size={14}/>}
              {activePlatform.toUpperCase()}
            </div>
          </div>
        </main>
      </div>

      <footer className="bg-slate-50 border-t border-slate-200 px-10 flex items-center justify-between shrink-0" 
              style={{ height: 'var(--sie-footer-h)' }}>
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-4">
            <ShieldCheck size={18} className="text-indigo-600" style={{ color: 'var(--sie-primary)' }} />
            <span className="text-[10px] font-black uppercase text-slate-600 tracking-widest">SRE Design Hub V43.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default StudioLab;
