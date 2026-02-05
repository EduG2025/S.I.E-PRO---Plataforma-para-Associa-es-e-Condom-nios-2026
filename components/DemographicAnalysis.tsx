
import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import {
    Users, Loader2, LayoutDashboard, Map as MapIcon, ShieldAlert, Search, X,
    Compass, Flame, User as UserIcon, Brain, Globe, ShieldCheck, Activity,
    TrendingUp, Filter, FileText, Printer, RefreshCw, ChevronDown, Download,
    Sparkles, Fingerprint, Eye, MoreHorizontal, MapPin, Phone, Mail, Calendar,
    Briefcase, PieChart as PieChartIcon, HardHat, Siren, Leaf, Bus, Coins,
    AlertTriangle, CheckCircle2, Factory, Stethoscope, GraduationCap, BarChart3,
    Database, Landmark, Plane, Heart, Gamepad, ShoppingBag, Users2,
    Layers, ScanLine, Play, FilterX, Tent, Utensils, Zap
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, Cell, PieChart, Pie, Legend
} from 'recharts';
import { SystemInfo, User, Incident } from '../types';
import { demographicsService, mapService, operationsService, surveyService, aiService, systemService } from '../services/api';

const SmartMap = lazy(() => import('./SmartMap'));

/**
 * S.I.E TacticalActionHub - Componente de Ação Pós-Filtro
 */
interface TacticalActionHubProps {
  count: number;
  onLaunchCampaign: () => void;
  onPrintReport: () => void;
}

const TacticalActionHub = ({ count, onLaunchCampaign, onPrintReport }: TacticalActionHubProps) => {
  if (count === 0) return null;

  return (
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[3000] flex items-center gap-6 bg-slate-900/95 backdrop-blur-2xl border border-white/10 p-4 pl-8 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-slide-up">
      <div className="flex items-center gap-4 border-r border-white/10 pr-6">
        <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-500/20">
          <Users size={20} />
        </div>
        <div>
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">Audiência Selecionada</p>
          <p className="text-xl font-black text-white leading-none mt-1">{count} <span className="text-xs text-slate-400 font-bold uppercase">Entidades</span></p>
        </div>
      </div>

      <div className="flex gap-3 pr-4">
        {/* BOTÃO: CAMPANHA NO MESSENGER */}
        <button 
          onClick={onLaunchCampaign}
          className="flex items-center gap-3 px-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/20"
        >
          <Zap size={16} fill="white" />
          Disparar Campanha
        </button>

        {/* BOTÃO: IMPRESSÃO / PDF */}
        <button 
          onClick={onPrintReport}
          className="flex items-center gap-3 px-6 py-4 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
        >
          <Printer size={16} />
          Relatório de Campo
        </button>
      </div>
    </div>
  );
};

interface DemographicAnalysisProps {
    systemInfo: SystemInfo;
    onNavigate?: (tab: string) => void;
}

interface FilterState {
    status: string;
    role: string;
    residentType: string;
    gender: string;
    unit: string;
    neighborhood: string;
    profession: string;
    ageMin: string;
    ageMax: string;
    socialKey: string;
    socialValue: any;
}

const INITIAL_FILTERS: FilterState = {
    status: 'ALL',
    role: 'ALL',
    residentType: 'ALL',
    gender: 'ALL',
    unit: '',
    neighborhood: '',
    profession: '',
    ageMin: '',
    ageMax: '',
    socialKey: '',
    socialValue: {}
};

const CATEGORY_CONFIG: Record<string, { color: string, icon: any, label: string }> = {
    EDUCACAO: { color: '#3b82f6', icon: GraduationCap, label: 'Educação' },
    ESPORTE: { color: '#f97316', icon: Activity, label: 'Esporte' },
    LAZER: { color: '#ec4899', icon: Gamepad, label: 'Lazer & Cultura' },
    SAUDE: { color: '#10b981', icon: Stethoscope, label: 'Saúde' },
    ASSISTENCIA_SOCIAL: { color: '#8b5cf6', icon: Heart, label: 'Assistência Social' },
    TURISMO: { color: '#14b8a6', icon: Plane, label: 'Turismo' },
    DEMOGRAFIA: { color: '#6366f1', icon: Users2, label: 'Demografia' },
    INFRAESTRUTURA: { color: '#64748b', icon: HardHat, label: 'Infraestrutura' },
    SEGURANCA: { color: '#e11d48', icon: Siren, label: 'Segurança' },
    RENDA: { color: '#f59e0b', icon: Coins, label: 'Renda & Trabalho' },
    AMBIENTE: { color: '#22c55e', icon: Leaf, label: 'Meio Ambiente' },
    MOBILIDADE: { color: '#0ea5e9', icon: Bus, label: 'Mobilidade' },
    CONSUMO: { color: '#d946ef', icon: ShoppingBag, label: 'Consumo Local' },
    ALIMENTACAO: { color: '#f43f5e', icon: Utensils, label: 'Alimentação' },
    HABITACAO: { color: '#8b5cf6', icon: Tent, label: 'Habitação' },
    GERAL: { color: '#94a3b8', icon: PieChartIcon, label: 'Geral' },
    DEFAULT: { color: '#94a3b8', icon: PieChartIcon, label: 'Outros Indicadores' }
};

const DemographicAnalysis = ({ systemInfo, onNavigate }: DemographicAnalysisProps) => {
    const [activeTab, setActiveTab] = useState<'MAP' | 'DASHBOARD' | 'KPI360'>('MAP');
    const [selectedMember, setSelectedMember] = useState<User | null>(null);
    const [stats, setStats] = useState<any>(null);
    const [isStatsLoading, setIsStatsLoading] = useState(true);

    // FIX: Define metadata using useMemo to resolve 'Cannot find name metadata' error
    const metadata = useMemo(() => systemInfo?.module_metadata?.['demographics'] || {
        title: "Observatório Social",
    }, [systemInfo]);

    const [units, setUnits] = useState<User[]>([]);
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [aiDiagnosis, setAiDiagnosis] = useState<string>("Diagnóstico pendente. Execute a análise neural para gerar insights.");
    const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
    const [dynamicFilterConfigs, setDynamicFilterConfigs] = useState<any[]>([]);
    const [activeLayers, setActiveLayers] = useState({ residents: true, incidents: true, heatmap: false, surveys: false });
    const [selectedEntity, setSelectedEntity] = useState<any>(null);
    const [focusCoord, setFocusCoord] = useState<{ lat: number, lng: number } | null>(null);
    const [mapMode, setMapMode] = useState<'DEFAULT' | 'RISK' | 'AGE'>('DEFAULT');
    const [searchQuery, setSearchQuery] = useState('');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    const [filters, setFilters] = useState<FilterState>(() => {
        try {
            const saved = sessionStorage.getItem('sie_demographic_filters');
            return saved ? JSON.parse(saved) : INITIAL_FILTERS;
        } catch { return INITIAL_FILTERS; }
    });

    useEffect(() => {
        const loadObservatoryData = async () => {
            try {
                const [resStats, resUnits, resIncidents, resSurveys] = await Promise.all([
                    demographicsService.getStats(),
                    mapService.getUnits(),
                    operationsService.getIncidents(),
                    surveyService.getAll()
                ]);

                if (resStats.status === 'fulfilled') setStats(resStats.value.data?.data || resStats.value.data);
                if (resUnits.status === 'fulfilled') setUnits(resUnits.value.data?.data || []);
                if (resIncidents.status === 'fulfilled') setIncidents(resIncidents.value.data?.data || []);
                if (resSurveys.status === 'fulfilled') {
                    const surveys = resSurveys.value.data?.data || [];
                    const filterables = surveys.flatMap((s: any) =>
                        (s.questions || []).filter((q: any) => q.filterable || q.mapping_tag).map((q: any) => ({
                            ...q, surveyTitle: s.title
                        }))
                    ) || [];
                    setDynamicFilterConfigs(filterables);
                }
            } catch (err) { console.warn("[SRE] Data stream degraded."); } finally { setIsStatsLoading(false); }
        };
        loadObservatoryData();
    }, []);

    const filteredUnits = useMemo(() => {
        return units.filter(user => {
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch = !searchQuery ||
                user.name?.toLowerCase().includes(searchLower) ||
                user.unit?.toLowerCase().includes(searchLower) ||
                user.cpf_cnpj?.includes(searchLower);

            if (!matchesSearch) return false;
            if (filters.status !== 'ALL' && user.status !== filters.status) return false;
            if (filters.role !== 'ALL' && user.role !== filters.role) return false;

            const userAge = (user as any).age || 0;
            if (filters.ageMin && userAge < parseInt(filters.ageMin)) return false;
            if (filters.ageMax && userAge > parseInt(filters.ageMax)) return false;

            const activeDynamicFilters = Object.entries(filters.socialValue);
            for (const [key, requiredValue] of activeDynamicFilters) {
                if (!requiredValue || requiredValue === 'ALL') continue;
                const userResponse = (user as any).socialData?.[key]; 
                if (String(userResponse).toLowerCase() !== String(requiredValue).toLowerCase()) return false;
            }
            return true;
        });
    }, [units, searchQuery, filters]);

    // Lógica do Tactical Action Hub
    const handleLaunchCampaign = () => {
        if (filteredUnits.length === 0) return;
        const campaignData = {
            name: `Campanha Tática - ${new Date().toLocaleDateString()}`,
            targetIds: filteredUnits.map(u => u.id),
            filters: filters
        };
        sessionStorage.setItem('pending_tactical_campaign', JSON.stringify(campaignData));
        if (onNavigate) onNavigate('messenger_bridge');
    };

    const handlePrintReport = () => {
        window.print();
    };

    const handleRunNeuralAnalysis = async () => {
        if (filteredUnits.length === 0) return alert("Filtre dados para análise.");
        setIsAiAnalyzing(true);
        try {
            const summary = { total: filteredUnits.length };
            const prompt = `Atue como Cientista de Dados SRE. Analise estes dados: ${JSON.stringify(summary)}. Identifique 1 Risco e 1 Oportunidade. Responda em PT-BR, 3 frases.`;
            const res = await aiService.chat(prompt);
            setAiDiagnosis(`"${res.data.text}"`);
        } catch (e) { setAiDiagnosis("Falha na conexão neural."); } finally { setIsAiAnalyzing(false); }
    };

    const kpi360Data = useMemo(() => {
        const grouped: Record<string, any[]> = {};
        dynamicFilterConfigs.forEach(config => {
            const tag = (config.mapping_tag || 'GERAL').toUpperCase();
            if (!grouped[tag]) grouped[tag] = [];
            const stats: Record<string, number> = {};
            let total = 0;
            filteredUnits.forEach(u => {
                const val = (u as any).socialData?.[config.id];
                if (val) { stats[String(val).toUpperCase()] = (stats[String(val).toUpperCase()] || 0) + 1; total++; }
            });
            const chartData = Object.entries(stats).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);
            if (chartData.length > 0) grouped[tag].push({ ...config, totalResponses: total, chartData });
        });
        return grouped;
    }, [filteredUnits, dynamicFilterConfigs]);

    return (
        <div className="flex-1 flex flex-col min-h-screen animate-fade-in pb-12 print:bg-white bg-[#f8fafc]">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-6 lg:px-10 lg:py-8 rounded-t-[3.5rem] shadow-sm border-x border-t border-slate-200 shrink-0 gap-6 print:hidden">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-xl border border-white/10"><Landmark size={24} /></div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tightest uppercase leading-none">{metadata.title}</h2>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-2">Observatório Territorial</p>
                    </div>
                </div>

                <div className="flex-1 w-full max-w-2xl mx-6 hidden lg:block">
                    <div className="relative group z-40">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                        <input type="text" placeholder="Filtrar Identidade..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-14 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all uppercase placeholder:normal-case shadow-inner" />
                        <button onClick={() => setShowAdvancedFilters(!showAdvancedFilters)} className={`absolute right-2 top-2 p-2.5 rounded-xl hover:bg-white border border-transparent hover:border-slate-200 transition-all ${showAdvancedFilters ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400'}`}><Filter size={16} /></button>
                    </div>
                </div>

                <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1 border border-slate-200 shadow-inner w-full lg:w-auto">
                    <button onClick={() => setActiveTab('MAP')} className={`flex-1 lg:flex-none px-6 py-3.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-3 ${activeTab === 'MAP' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-indigo-600'}`}>Mapa</button>
                    <button onClick={() => setActiveTab('DASHBOARD')} className={`flex-1 lg:flex-none px-6 py-3.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-3 ${activeTab === 'DASHBOARD' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-indigo-600'}`}>Dados</button>
                    <button onClick={() => setActiveTab('KPI360')} className={`flex-1 lg:flex-none px-6 py-3.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-3 ${activeTab === 'KPI360' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-indigo-600'}`}>Matriz</button>
                </div>
            </div>

            {showAdvancedFilters && (
                <div className="bg-white border-b border-slate-200 p-8 lg:px-10 animate-slide-down shadow-2xl relative z-30 print:hidden overflow-y-auto max-h-[80vh] custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Status</h4>
                            <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold appearance-none outline-none"><option value="ALL">Todos</option><option value="ACTIVE">Ativo</option><option value="PENDING">Pendente</option></select>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Atributos</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <input type="number" value={filters.ageMin} onChange={(e) => setFilters({...filters, ageMin: e.target.value})} placeholder="Min" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xs font-bold" />
                                <input type="number" value={filters.ageMax} onChange={(e) => setFilters({...filters, ageMax: e.target.value})} placeholder="Max" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xs font-bold" />
                            </div>
                        </div>
                        <div className="flex gap-3 pt-4 items-end">
                            <button onClick={() => setFilters(INITIAL_FILTERS)} className="flex-1 py-3 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2"><FilterX size={14} /></button>
                            <button onClick={() => setShowAdvancedFilters(false)} className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase flex items-center justify-center gap-2 shadow-lg"><Filter size={14} /> Aplicar</button>
                        </div>
                        <div className="col-span-full border-t pt-8 mt-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                                {dynamicFilterConfigs.map(config => (
                                    <div key={config.id} className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-tight">{config.text}</label>
                                        <select value={filters.socialValue[config.id] || 'ALL'} onChange={e => setFilters({...filters, socialValue: {...filters.socialValue, [config.id]: e.target.value}})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-[10px] font-bold outline-none appearance-none">
                                            <option value="ALL">TODOS</option>
                                            {config.type === 'boolean' ? (<><option value="SIM">SIM</option><option value="NÃO">NÃO</option></>) : config.options?.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'MAP' ? (
                <div className="flex-1 flex flex-col bg-white border-x border-slate-200 min-h-[800px] relative">
                    <div className="relative bg-slate-200 overflow-hidden print:hidden" style={{ height: 'calc(100vh - 280px)', minHeight: '600px' }}>
                        <Suspense fallback={<div className="absolute inset-0 flex items-center justify-center bg-slate-50 z-50"><Loader2 className="animate-spin text-indigo-600" /></div>}>
                            <SmartMap systemInfo={systemInfo} activeLayers={activeLayers} onSelectEntity={setSelectedEntity} filteredData={filteredUnits} visualizationMode={mapMode} showSearch={false} />
                        </Suspense>
                        
                        {/* HUB TÁTICO FLUTUANTE */}
                        <TacticalActionHub 
                            count={filteredUnits.length}
                            onLaunchCampaign={handleLaunchCampaign}
                            onPrintReport={handlePrintReport}
                        />
                    </div>
                </div>
            ) : activeTab === 'DASHBOARD' ? (
                <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-12 animate-fade-in print:p-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { title: 'Audiência Ativa', value: filteredUnits.length, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                            { title: 'Score Coletivo', value: '88.4', icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
                            { title: 'Vulnerabilidades', value: '12%', icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
                            { title: 'Integridade', value: '99.2%', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' }
                        ].map((k, i) => (
                            <div key={i} className="bg-white p-10 rounded-[3rem] border border-slate-200 flex flex-col justify-between shadow-sm hover:shadow-xl transition-all">
                                <div className={`p-5 rounded-2xl w-fit ${k.bg} ${k.color}`}><k.icon size={32} /></div>
                                <div className="mt-8"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{k.title}</p><h3 className="text-4xl font-black text-slate-800 mt-2">{k.value}</h3></div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-8 bg-white rounded-[3.5rem] border border-slate-200 overflow-hidden shadow-sm flex flex-col">
                            <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
                                <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Base de Dados Localizada</h4>
                            </div>
                            <div className="overflow-x-auto custom-scrollbar max-h-[500px]">
                                <table className="w-full text-left">
                                    <thead><tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b"><th className="p-6">Membro</th><th className="p-6">Unidade</th><th className="p-6">Status</th><th className="p-6 text-right">Dossiê</th></tr></thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {filteredUnits.slice(0, 100).map(u => (
                                            <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="p-6 font-black text-slate-800 uppercase text-xs">{u.name}</td>
                                                <td className="p-6 font-bold text-indigo-600 text-xs uppercase">{u.unit || '---'}</td>
                                                <td className="p-6"><span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase border ${u.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>{u.status}</span></td>
                                                <td className="p-6 text-right"><button onClick={() => setSelectedMember(u)} className="p-2 text-slate-400 hover:text-indigo-600"><Eye size={18} /></button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div className="lg:col-span-4 bg-slate-900 rounded-[3.5rem] p-10 text-white shadow-2xl flex flex-col justify-between relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700"><Brain size={150} /></div>
                            <div className="relative z-10">
                                <h4 className="text-xl font-black uppercase tracking-tightest flex items-center gap-3"><Sparkles size={20} className="text-indigo-400" /> Advisor Neural</h4>
                                <div className="mt-8 p-6 bg-white/5 border border-white/10 rounded-[2rem] italic text-sm uppercase leading-relaxed">{aiDiagnosis}</div>
                            </div>
                            <button onClick={handleRunNeuralAnalysis} disabled={isAiAnalyzing} className="w-full mt-10 py-5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all">
                                {isAiAnalyzing ? <Loader2 className="animate-spin" size={16} /> : <Play size={16} />} Executar Análise Neural
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-12 bg-[#f8fafc] rounded-b-[3.5rem] animate-fade-in print:bg-white">
                    <div className="space-y-16">
                        {Object.entries(kpi360Data).map(([tag, questions]) => {
                            const config = CATEGORY_CONFIG[tag] || CATEGORY_CONFIG.DEFAULT;
                            const Icon = config.icon;
                            return (
                                <div key={tag} className="animate-slide-up">
                                    <div className="flex items-center gap-4 border-b border-slate-200 pb-4 mb-8">
                                        <div className="p-3 rounded-xl text-white shadow-md" style={{ backgroundColor: config.color }}><Icon size={20} /></div>
                                        <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">{config.label}</h4>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {(questions as any[]).map((q: any) => (
                                            <div key={q.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-lg transition-shadow">
                                                <h5 className="text-sm font-black text-slate-700 uppercase leading-tight mb-4 min-h-[40px]">{q.text}</h5>
                                                <div className="h-[180px] w-full">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <BarChart data={q.chartData} layout="vertical">
                                                            <XAxis type="number" hide />
                                                            <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} interval={0} />
                                                            <Tooltip cursor={{ fill: '#f8fafc' }} />
                                                            <Bar dataKey="value" barSize={16} radius={[0, 4, 4, 0]}>
                                                                {(q.chartData as any[]).map((entry, index) => <Cell key={`cell-${index}`} fill={config.color} fillOpacity={0.8 - (index * 0.15)} />)}
                                                            </Bar>
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                                <div className="mt-4 pt-4 border-t flex justify-between items-center"><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Amostra</span><span className="text-xs font-black text-slate-800">{q.totalResponses}</span></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <footer className="h-14 bg-slate-900 border-t border-white/5 flex items-center justify-between px-10 shrink-0 print:hidden">
                <div className="flex items-center gap-6"><div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">SRE BI_NODE ONLINE</span></div></div>
                <div className="flex items-center gap-4"><button onClick={handlePrintReport} className="flex items-center gap-2 text-[9px] font-black text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest"><Printer size={14} /> Imprimir Relatório Estratégico</button></div>
            </footer>

            {selectedMember && (
                <div className="fixed inset-0 z-[100] flex items-center justify-end bg-slate-900/60 backdrop-blur-sm animate-fade-in p-6 lg:p-12 print:hidden">
                    <div className="w-full max-w-2xl bg-white h-full rounded-[4rem] shadow-2xl flex flex-col overflow-hidden animate-slide-left relative">
                        <button onClick={() => setSelectedMember(null)} className="absolute top-10 right-10 p-4 hover:bg-rose-50 hover:text-rose-500 text-slate-400 rounded-2xl transition-all z-20"><X size={32} /></button>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-12 lg:p-16 space-y-12">
                            <div className="flex items-center gap-10">
                                <div className="w-40 h-40 rounded-[3rem] bg-slate-100 overflow-hidden border-4 border-indigo-50 shadow-xl">{selectedMember.avatar_url ? <img src={selectedMember.avatar_url} className="w-full h-full object-cover" /> : <UserIcon size={40} className="text-slate-300 m-12" />}</div>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3"><span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border ${selectedMember.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>{selectedMember.status}</span><span className="text-xs font-black text-indigo-600 uppercase tracking-widest">{selectedMember.role}</span></div>
                                    <h3 className="text-4xl font-black text-slate-900 leading-none uppercase tracking-tighter">{selectedMember.name}</h3>
                                    <div className="flex items-center gap-3 text-slate-400 text-xs font-bold uppercase"><MapPin size={14} /> {selectedMember.unit}</div>
                                </div>
                            </div>
                            <div className="space-y-8">
                                <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-3 border-b border-slate-100 pb-4"><Brain size={24} className="text-indigo-600" /> Inteligência de Censo</h4>
                                <div className="grid grid-cols-1 gap-4">
                                    {dynamicFilterConfigs.map(config => (
                                        <div key={config.id} className="flex justify-between items-center p-6 bg-indigo-50/30 rounded-3xl border border-indigo-100/50"><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{config.text}</span><span className="text-xs font-black text-indigo-700 uppercase italic">{(selectedMember as any).socialData?.[config.id] || "Pendente"}</span></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DemographicAnalysis;
