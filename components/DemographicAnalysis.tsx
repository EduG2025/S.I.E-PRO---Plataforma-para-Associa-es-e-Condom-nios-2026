
import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import {
    Users, Loader2, LayoutDashboard, Map as MapIcon, ShieldAlert, Search, X,
    Compass, Flame, User as UserIcon, Brain, Globe, ShieldCheck, Activity,
    TrendingUp, Filter, FileText, Printer, RefreshCw, ChevronDown, Download,
    Sparkles, Fingerprint, Eye, MoreHorizontal, MapPin, Phone, Mail, Calendar,
    Briefcase, PieChart as PieChartIcon, HardHat, Siren, Leaf, Bus, Coins,
    AlertTriangle, CheckCircle2, Factory, Stethoscope, GraduationCap, BarChart3,
    Database, Landmark, Plane, Heart, Gamepad, ShoppingBag, Users2,
    Layers, ScanLine, Play, FilterX, Tent, Utensils
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, Cell, PieChart, Pie, Legend
} from 'recharts';
import { SystemInfo, User, Incident } from '../types';
import { demographicsService, mapService, operationsService, surveyService, aiService, systemService } from '../services/api';

const SmartMap = lazy(() => import('./SmartMap'));

/**
 * S.I.E DemographicAnalysis V32.1 - SRE PATCH
 * - Fix: Data Lookup via ID (not Slug)
 * - Fix: Category Mapping expansion
 */

interface DemographicAnalysisProps {
    systemInfo: SystemInfo;
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

// SRE: Mapeamento Expandido para Cobrir Tags de IA e Manuais
const CATEGORY_CONFIG: Record<string, { color: string, icon: any, label: string }> = {
    EDUCACAO: { color: '#3b82f6', icon: GraduationCap, label: 'Educação' },
    EDUCATION: { color: '#3b82f6', icon: GraduationCap, label: 'Educação' },
    
    ESPORTE: { color: '#f97316', icon: Activity, label: 'Esporte' },
    SPORTS: { color: '#f97316', icon: Activity, label: 'Esporte' },
    
    LAZER: { color: '#ec4899', icon: Gamepad, label: 'Lazer & Cultura' },
    LEISURE: { color: '#ec4899', icon: Gamepad, label: 'Lazer & Cultura' },
    
    SAUDE: { color: '#10b981', icon: Stethoscope, label: 'Saúde' },
    HEALTH: { color: '#10b981', icon: Stethoscope, label: 'Saúde' },
    
    ASSISTENCIA_SOCIAL: { color: '#8b5cf6', icon: Heart, label: 'Assistência Social' },
    SOCIAL_ASSISTANCE: { color: '#8b5cf6', icon: Heart, label: 'Assistência Social' },
    
    TURISMO: { color: '#14b8a6', icon: Plane, label: 'Turismo' },
    TOURISM: { color: '#14b8a6', icon: Plane, label: 'Turismo' },
    
    DEMOGRAFIA: { color: '#6366f1', icon: Users2, label: 'Demografia' },
    DEMOGRAPHY: { color: '#6366f1', icon: Users2, label: 'Demografia' },
    
    INFRAESTRUTURA: { color: '#64748b', icon: HardHat, label: 'Infraestrutura' },
    INFRASTRUCTURE: { color: '#64748b', icon: HardHat, label: 'Infraestrutura' },
    
    SEGURANCA: { color: '#e11d48', icon: Siren, label: 'Segurança' },
    SECURITY: { color: '#e11d48', icon: Siren, label: 'Segurança' },
    
    RENDA: { color: '#f59e0b', icon: Coins, label: 'Renda & Trabalho' },
    INCOME: { color: '#f59e0b', icon: Coins, label: 'Renda & Trabalho' },
    
    AMBIENTE: { color: '#22c55e', icon: Leaf, label: 'Meio Ambiente' },
    ENVIRONMENT: { color: '#22c55e', icon: Leaf, label: 'Meio Ambiente' },
    
    MOBILIDADE: { color: '#0ea5e9', icon: Bus, label: 'Mobilidade' },
    MOBILITY: { color: '#0ea5e9', icon: Bus, label: 'Mobilidade' },
    
    CONSUMO: { color: '#d946ef', icon: ShoppingBag, label: 'Consumo Local' },
    CONSUMPTION: { color: '#d946ef', icon: ShoppingBag, label: 'Consumo Local' },
    
    ALIMENTACAO: { color: '#f43f5e', icon: Utensils, label: 'Alimentação' },
    FOOD: { color: '#f43f5e', icon: Utensils, label: 'Alimentação' },

    HABITACAO: { color: '#8b5cf6', icon: Tent, label: 'Habitação' },
    HOUSING: { color: '#8b5cf6', icon: Tent, label: 'Habitação' },

    GERAL: { color: '#94a3b8', icon: PieChartIcon, label: 'Geral' },
    GENERAL: { color: '#94a3b8', icon: PieChartIcon, label: 'Geral' },
    
    DEFAULT: { color: '#94a3b8', icon: PieChartIcon, label: 'Outros Indicadores' }
};

const DemographicAnalysis = ({ systemInfo }: DemographicAnalysisProps) => {
    // Navigation & UI State
    const [activeTab, setActiveTab] = useState<'MAP' | 'DASHBOARD' | 'KPI360'>('MAP');
    const [selectedMember, setSelectedMember] = useState<User | null>(null);

    // Data State
    const [stats, setStats] = useState<any>(null);
    const [isStatsLoading, setIsStatsLoading] = useState(true);
    const [units, setUnits] = useState<User[]>([]);
    const [incidents, setIncidents] = useState<Incident[]>([]);

    // Neural State
    const [aiDiagnosis, setAiDiagnosis] = useState<string>("Diagnóstico pendente. Execute a análise neural para gerar insights sobre o cluster.");
    const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);

    // Configurações de Filtros de Censo
    const [dynamicFilterConfigs, setDynamicFilterConfigs] = useState<any[]>([]);

    // Map State
    const [activeLayers, setActiveLayers] = useState({ residents: true, incidents: true, heatmap: false, surveys: false });
    const [selectedEntity, setSelectedEntity] = useState<any>(null);
    const [focusCoord, setFocusCoord] = useState<{ lat: number, lng: number } | null>(null);
    const [mapMode, setMapMode] = useState<'DEFAULT' | 'RISK' | 'AGE'>('DEFAULT');

    // Search & Filter Engine (SRE PERSISTENCE LAYER)
    const [searchQuery, setSearchQuery] = useState('');
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    
    // Inicializa filtros do SessionStorage ou Padrão
    const [filters, setFilters] = useState<FilterState>(() => {
        try {
            const saved = sessionStorage.getItem('sie_demographic_filters');
            return saved ? JSON.parse(saved) : INITIAL_FILTERS;
        } catch { return INITIAL_FILTERS; }
    });

    // Persiste filtros sempre que mudarem
    useEffect(() => {
        sessionStorage.setItem('sie_demographic_filters', JSON.stringify(filters));
    }, [filters]);

    const metadata = useMemo(() => systemInfo?.module_metadata?.['demographics'] || {
        title: "Central de Inteligência",
        slogan: "Pesquisa Territorial & BI Soberano",
        placeholder: "Pesquisar por Nome, CPF, Unidade ou ID...",
        heatmap_label: "Mapa de Calor",
        sync_label: "Sincronia Ativa"
    }, [systemInfo]);

    const primaryColor = systemInfo?.primaryColor || '#4f46e5';

    // 1. Data Loading
    useEffect(() => {
        const loadObservatoryData = async () => {
            try {
                const [resStats, resUnits, resIncidents, resSurveys] = await Promise.allSettled([
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
                            ...q,
                            surveyTitle: s.title
                        }))
                    ) || [];
                    setDynamicFilterConfigs(filterables);
                }
            } catch (err) {
                console.warn("[SRE] Data stream degraded.", err);
            } finally {
                setIsStatsLoading(false);
            }
        };
        loadObservatoryData();
    }, []);

    // 2. Filter Logic (Engine Neural V21)
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
            // @ts-ignore
            if (filters.residentType !== 'ALL' && user.resident_type !== filters.residentType) return false;
            // @ts-ignore
            if (filters.gender !== 'ALL' && user.gender !== filters.gender) return false;

            if (filters.unit && !user.unit?.toLowerCase().includes(filters.unit.toLowerCase())) return false;
            // @ts-ignore
            if (filters.neighborhood && !user.neighborhood?.toLowerCase().includes(filters.neighborhood.toLowerCase())) return false;
            // @ts-ignore
            if (filters.profession && !user.profession?.toLowerCase().includes(filters.profession.toLowerCase())) return false;

            const userAge = (user as any).age || 0;
            if (filters.ageMin && userAge < parseInt(filters.ageMin)) return false;
            if (filters.ageMax && userAge > parseInt(filters.ageMax)) return false;

            const activeDynamicFilters = Object.entries(filters.socialValue);
            for (const [key, requiredValue] of activeDynamicFilters) {
                if (!requiredValue || requiredValue === 'ALL') continue;
                // SRE FIX: Lookup by ID or Slug (Prioritize ID as key)
                const userResponse = (user as any).socialData?.[key]; 
                if (String(userResponse).toLowerCase() !== String(requiredValue).toLowerCase()) {
                    return false;
                }
            }
            return true;
        });
    }, [units, searchQuery, filters]);

    // 3. Drill-Down Handlers (SRE INTERACTIVITY)
    const handleAgeChartClick = (data: any) => {
        if (!data || !data.activeLabel) return;
        const label = data.activeLabel;
        let min = '', max = '';
        
        switch(label) {
            case '0-12': min='0'; max='12'; break;
            case '13-18': min='13'; max='18'; break;
            case '19-35': min='19'; max='35'; break;
            case '36-60': min='36'; max='60'; break;
            case '60+': min='60'; max='120'; break;
        }
        
        setFilters(prev => ({ ...prev, ageMin: min, ageMax: max }));
        setActiveTab('MAP'); // Leva para o mapa para ver o resultado geográfico
    };

    const handleKpiChartClick = (configKey: string, data: any) => {
        if (!data || !data.activeLabel) return;
        const value = data.activeLabel;
        setFilters(prev => ({ 
            ...prev, 
            socialValue: { ...prev.socialValue, [configKey]: value } 
        }));
        setActiveTab('MAP'); // Drill-down para o mapa
    };

    // 4. AI Analysis Handler
    const handleRunNeuralAnalysis = async () => {
        if (filteredUnits.length === 0) return alert("Filtre pelo menos um registro para análise.");
        setIsAiAnalyzing(true);
        try {
            const summary = {
                total: filteredUnits.length,
                age_distribution: {
                    youth: filteredUnits.filter(u => ((u as any).age || 0) < 18).length,
                    adults: filteredUnits.filter(u => ((u as any).age || 0) >= 18 && ((u as any).age || 0) < 60).length,
                    seniors: filteredUnits.filter(u => ((u as any).age || 0) >= 60).length,
                },
                incident_count: incidents.length,
                roles: filteredUnits.reduce((acc: any, u) => { acc[u.role] = (acc[u.role] || 0) + 1; return acc; }, {}),
                status: filteredUnits.reduce((acc: any, u) => { acc[u.status] = (acc[u.status] || 0) + 1; return acc; }, {})
            };

            const prompt = `
                Atue como Cientista de Dados SRE. Analise estes dados demográficos do cluster: ${JSON.stringify(summary)}.
                Identifique 1 Risco Crítico e 1 Oportunidade de Gestão.
                Responda em PT-BR, tom executivo, máximo 3 frases. Sem markdown.
            `;

            const res = await aiService.chat(prompt);
            setAiDiagnosis(`"${res.data.text}"`);
        } catch (e) {
            setAiDiagnosis("Falha na conexão neural. Tente novamente.");
        } finally {
            setIsAiAnalyzing(false);
        }
    };

    // 5. Export Handlers (SRE Compliance)
    const exportToCSV = async () => {
        if (filteredUnits.length === 0) return alert("Sem dados para exportar.");
        
        try {
            await systemService.logTacticalExport({
                module: 'DEMOGRAPHICS_BI',
                count: filteredUnits.length,
                criteria: filters
            });

            const headers = ["ID", "NOME", "CPF", "UNIDADE", "ROLE", "STATUS", "IDADE", "TIPO", "VOTO"];
            const dynamicHeaders = dynamicFilterConfigs.map(c => c.text.toUpperCase());
            const allHeaders = [...headers, ...dynamicHeaders];

            const rows = filteredUnits.map(u => {
                const socialValues = dynamicFilterConfigs.map(c => {
                    // SRE FIX: Lookup by ID
                    const val = (u as any).socialData?.[c.id];
                    return val ? `"${String(val).replace(/"/g, '""')}"` : "";
                });

                return [
                    u.id,
                    `"${u.name}"`,
                    `"${u.cpf_cnpj}"`,
                    `"${u.unit || ''}"`,
                    u.role,
                    u.status,
                    (u as any).age || "",
                    (u as any).resident_type || "",
                    (u as any).voting_rights ? "SIM" : "NAO",
                    ...socialValues
                ].join(",");
            });

            const csvContent = "\uFEFF" + [allHeaders.join(","), ...rows].join("\n");
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `sie_demographics_${Date.now()}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (e) {
            console.error("Export failed", e);
            alert("Erro ao gerar exportação.");
        }
    };

    const handleGeneratePDF = () => {
        window.print();
    };

    const resetFilters = () => { setFilters(INITIAL_FILTERS); setSearchQuery(''); };
    const resetFocus = () => { setFocusCoord(null); setTimeout(() => { setFocusCoord(systemInfo?.coordinates || { lat: -22.6288, lng: -43.8975 }); }, 50); };
    const handleFilterChange = (key: keyof FilterState, value: any) => { setFilters(prev => ({ ...prev, [key]: value })); };
    const handleDynamicValueChange = (key: string, val: string) => { setFilters(prev => ({ ...prev, socialValue: { ...prev.socialValue, [key]: val } })); };

    // --- CHART DATA PREP ---
    const ageData = useMemo(() => [
        { name: '0-12', value: filteredUnits.filter(u => ((u as any).age || 0) <= 12).length, color: '#6366f1' },
        { name: '13-18', value: filteredUnits.filter(u => ((u as any).age || 0) > 12 && ((u as any).age || 0) <= 18).length, color: '#8b5cf6' },
        { name: '19-35', value: filteredUnits.filter(u => ((u as any).age || 0) > 18 && ((u as any).age || 0) <= 35).length, color: '#4f46e5' },
        { name: '36-60', value: filteredUnits.filter(u => ((u as any).age || 0) > 35 && ((u as any).age || 0) <= 60).length, color: '#4338ca' },
        { name: '60+', value: filteredUnits.filter(u => ((u as any).age || 0) > 60).length, color: '#312e81' },
    ], [filteredUnits]);

    const evolutionData = [{ month: 'Jan', score: 82 }, { month: 'Fev', score: 85 }, { month: 'Mar', score: 84 }, { month: 'Abr', score: 89 }, { month: 'Mai', score: 92 }];

    // 5. KPI Logic
    const kpi360Data = useMemo(() => {
        const groupedByTag: Record<string, any[]> = {};

        dynamicFilterConfigs.forEach(config => {
            // SRE FIX: Normalize tag key
            const tag = (config.mapping_tag || 'GERAL').toUpperCase();
            if (!groupedByTag[tag]) groupedByTag[tag] = [];

            const stats: Record<string, number> = {};
            let totalResponses = 0;

            filteredUnits.forEach(u => {
                // SRE FIX: Lookup by ID
                const val = (u as any).socialData?.[config.id];
                if (val) {
                    const key = String(val).toUpperCase();
                    stats[key] = (stats[key] || 0) + 1;
                    totalResponses++;
                }
            });

            const chartData = Object.entries(stats)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 5);

            let alert = null;
            if (chartData.length > 0) {
                const top = chartData[0];
                const criticalKeywords = ['RUIM', 'PÉSSIMO', 'NÃO', 'INSEGURO', 'PRECÁRIO', 'DESEMPREGADO', 'FALTA'];
                if (criticalKeywords.some(k => top.name.includes(k)) && (top.value / totalResponses > 0.3)) {
                    alert = `ALERTA: ${Math.round((top.value / totalResponses) * 100)}% responderam "${top.name}"`;
                }
            }

            if (chartData.length > 0) {
                groupedByTag[tag].push({
                    ...config,
                    totalResponses,
                    chartData,
                    alert
                });
            }
        });

        return groupedByTag;
    }, [filteredUnits, dynamicFilterConfigs]);

    return (
        <div id="demographic-report-container" className="flex-1 flex flex-col min-h-screen animate-fade-in pb-12 print:bg-white print:p-0 bg-[#f8fafc]">
            {/* HEADER */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-white p-6 lg:px-10 lg:py-8 rounded-t-[3.5rem] shadow-sm border-x border-t border-slate-200 shrink-0 gap-6 print:hidden">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-slate-900 text-white rounded-2xl shadow-xl border border-white/10">
                        <Landmark size={24} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tightest uppercase leading-none">{metadata.title}</h2>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-2">Inteligência Territorial • {systemInfo.shortName}</p>
                    </div>
                </div>

                <div className="flex-1 w-full max-w-2xl mx-6 hidden lg:block">
                    <div className="relative group z-40">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder={metadata.placeholder}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-14 pl-12 pr-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all uppercase placeholder:normal-case shadow-inner"
                        />
                        <button
                            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                            className={`absolute right-2 top-2 p-2.5 rounded-xl hover:bg-white border border-transparent hover:border-slate-200 transition-all flex items-center gap-2 ${showAdvancedFilters ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400'}`}
                        >
                            <Filter size={16} />
                            {(Object.values(filters).some(v => v !== 'ALL' && v !== '' && typeof v !== 'object') || Object.values(filters.socialValue).some(v => v !== '')) && (
                                <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
                            )}
                        </button>
                    </div>
                </div>

                <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1 border border-slate-200 shadow-inner w-full lg:w-auto">
                    <button onClick={() => setActiveTab('MAP')} className={`flex-1 lg:flex-none px-6 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${activeTab === 'MAP' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-indigo-600'}`} style={activeTab === 'MAP' ? { color: primaryColor } : {}}>
                        <MapIcon size={16} /> Mapa
                    </button>
                    <button onClick={() => setActiveTab('DASHBOARD')} className={`flex-1 lg:flex-none px-6 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${activeTab === 'DASHBOARD' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-indigo-600'}`} style={activeTab === 'DASHBOARD' ? { color: primaryColor } : {}}>
                        <LayoutDashboard size={16} /> Estatísticas
                    </button>
                    <button onClick={() => setActiveTab('KPI360')} className={`flex-1 lg:flex-none px-6 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${activeTab === 'KPI360' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-indigo-600'}`} style={activeTab === 'KPI360' ? { color: primaryColor } : {}}>
                        <PieChartIcon size={16} /> Matriz 360º
                    </button>
                </div>
            </div>

            {/* FILTER PANEL */}
            {showAdvancedFilters && (
                <div className="bg-white border-b border-slate-200 p-8 lg:px-10 animate-slide-down shadow-2xl relative z-30 print:hidden overflow-y-auto max-h-[80vh] custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Status & Acesso</h4>
                            <select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-600 appearance-none outline-none">
                                <option value="ALL">Todos os Status</option>
                                <option value="PENDING">Pendente</option>
                                <option value="ACTIVE">Ativo</option>
                                <option value="BLOCKED">Bloqueado</option>
                            </select>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Demografia</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <input type="number" value={filters.ageMin} onChange={(e) => handleFilterChange('ageMin', e.target.value)} placeholder="Min" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xs font-bold" />
                                <input type="number" value={filters.ageMax} onChange={(e) => handleFilterChange('ageMax', e.target.value)} placeholder="Max" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xs font-bold" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Território</h4>
                            <input type="text" value={filters.unit} onChange={(e) => handleFilterChange('unit', e.target.value)} placeholder="Unidade / Bloco" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold outline-none" />
                        </div>
                        <div className="flex gap-3 pt-4 items-end">
                            <button onClick={resetFilters} className="flex-1 py-3 bg-white border border-slate-200 text-slate-500 rounded-xl text-xs font-black uppercase hover:text-rose-600 transition-colors flex items-center justify-center gap-2"><FilterX size={14} /></button>
                            <button onClick={() => setShowAdvancedFilters(false)} className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase hover:bg-indigo-700 shadow-lg flex items-center justify-center gap-2"><Filter size={14} /> Aplicar ({filteredUnits.length})</button>
                        </div>
                        <div className="col-span-full mt-6 border-t border-slate-100 pt-8 animate-fade-in">
                            <h4 className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.3em] flex items-center gap-3 mb-6">
                                <Sparkles size={16} /> Inteligência Territorial Dinâmica
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
                                {dynamicFilterConfigs.map((config) => (
                                    <div key={config.id} className="space-y-2 group">
                                        <div className="flex items-center gap-2">
                                            <Fingerprint size={12} className="text-slate-300 group-hover:text-indigo-400 transition-colors" />
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-tight">{config.text}</label>
                                        </div>
                                        <div className="relative">
                                            <select
                                                // SRE FIX: Use ID as key
                                                value={filters.socialValue[config.id] || 'ALL'}
                                                onChange={(e) => handleDynamicValueChange(config.id, e.target.value)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-[10px] font-bold text-slate-700 outline-none appearance-none transition-all"
                                            >
                                                <option value="ALL">TODOS</option>
                                                {config.type === 'boolean' ? (<> <option value="SIM">SIM</option> <option value="NÃO">NÃO</option> </>) : (config.options?.map((opt: string) => <option key={opt} value={opt}>{opt}</option>))}
                                            </select>
                                            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'MAP' ? (
                /* MAPA TÁTICO */
                <div className="flex-1 flex flex-col bg-white border-x border-slate-200 min-h-[800px]">
                    <div className="bg-slate-50 p-6 lg:px-10 border-b border-slate-200 space-y-6 shrink-0 z-20 shadow-sm print:hidden">
                        <div className="flex flex-col lg:flex-row gap-6 justify-between items-start lg:items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-white rounded-xl border border-slate-200 text-indigo-600 shadow-sm"><Activity size={18} /></div>
                                <div><p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Resultado do Filtro</p><p className="text-lg font-black text-slate-800 leading-none">{filteredUnits.length} Entidades</p></div>
                            </div>
                            
                            <div className="flex items-center gap-4">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lente Tática:</span>
                                <div className="flex bg-white border border-slate-200 p-1 rounded-xl shadow-sm">
                                    <button onClick={() => setMapMode('DEFAULT')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${mapMode === 'DEFAULT' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>Padrão</button>
                                    <button onClick={() => setMapMode('RISK')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${mapMode === 'RISK' ? 'bg-rose-50 text-rose-600' : 'text-slate-400 hover:text-slate-600'}`}>Risco Social</button>
                                    <button onClick={() => setMapMode('AGE')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${mapMode === 'AGE' ? 'bg-amber-50 text-amber-600' : 'text-slate-400 hover:text-slate-600'}`}>Faixa Etária</button>
                                </div>
                            </div>

                            <div className="flex gap-3 w-full lg:w-auto overflow-x-auto no-scrollbar">
                                <button onClick={() => setActiveLayers(p => ({ ...p, heatmap: !p.heatmap }))} className={`px-6 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-3 whitespace-nowrap ${activeLayers.heatmap ? 'bg-orange-50 text-orange-600 border-orange-200 shadow-sm' : 'bg-white text-slate-400 border-slate-200'}`}><Flame size={16} /> Mapa de Calor</button>
                                <button onClick={() => setActiveLayers(p => ({ ...p, residents: !p.residents }))} className={`px-6 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all flex items-center gap-3 whitespace-nowrap ${activeLayers.residents ? 'bg-indigo-50 text-indigo-600 border-indigo-200 shadow-sm' : 'bg-white text-slate-400 border-slate-200'}`}><Users size={16} /> Membros</button>
                                <button onClick={resetFocus} className="px-6 py-3.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center gap-3 shadow-lg active:scale-95"><Compass size={16} className="animate-spin-slow" /> Reset</button>
                            </div>
                        </div>
                    </div>
                    <div className="relative bg-slate-200 overflow-hidden print:hidden" style={{ height: 'calc(100vh - 280px)', minHeight: '600px' }}>
                        <Suspense fallback={<div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 z-50"><Loader2 className="animate-spin text-indigo-600 mb-4" size={32} /><p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em]">{metadata.sync_label}</p></div>}>
                            <SmartMap
                                systemInfo={systemInfo}
                                activeLayers={activeLayers}
                                onSelectEntity={setSelectedEntity}
                                focusCoord={focusCoord}
                                showSearch={false}
                                // @ts-ignore 
                                filteredData={filteredUnits}
                                visualizationMode={mapMode}
                            />
                        </Suspense>
                    </div>
                </div>
            ) : activeTab === 'DASHBOARD' ? (
                /* DASHBOARD */
                <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-12 rounded-b-[3.5rem] animate-fade-in print:bg-white print:p-0 print:border-none">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6 print:hidden">
                        <div><h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Estatísticas Consolidadas</h3><p className="text-xs text-slate-500 font-bold mt-1">Cruzamento de dados cadastrais e respostas de censo</p></div>
                        <div className="flex gap-3">
                            <button onClick={exportToCSV} className="px-6 py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold uppercase hover:bg-emerald-700 flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20"><Download size={16} /> Exportar CSV</button>
                            <button onClick={handleGeneratePDF} className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase hover:bg-indigo-700 flex items-center gap-2 shadow-lg transition-all"><Printer size={16} /> Gerar PDF</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { title: 'População Filtrada', value: filteredUnits.length, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                            { title: 'Membros Ativos', value: filteredUnits.filter(u => u.status === 'ACTIVE').length, icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                            { title: 'Score Médio', value: '88.4', icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
                            { title: 'Alertas Locais', value: incidents.length, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' }
                        ].map((k, i) => (
                            <div key={i} className="bg-white p-10 rounded-[3rem] border border-slate-200 flex flex-col justify-between shadow-sm hover:shadow-xl transition-all group">
                                <div className="flex justify-between items-start">
                                    <div className={`p-5 rounded-2xl ${k.bg} ${k.color} group-hover:scale-110 transition-transform`}><k.icon size={32} /></div>
                                    <TrendingUp size={16} className="text-slate-200" />
                                </div>
                                <div className="mt-8">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{k.title}</p>
                                    <h3 className="text-4xl font-black text-slate-800 mt-2">{k.value}</h3>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Listagem */}
                        <div className="lg:col-span-8 bg-white rounded-[3.5rem] border border-slate-200 overflow-hidden shadow-sm flex flex-col">
                            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-100 rounded-lg text-slate-500"><FileText size={18} /></div>
                                    <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Registros Detalhados</h4>
                                </div>
                                <span className="bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-[9px] font-black uppercase">{filteredUnits.length} Entidades</span>
                            </div>
                            <div className="overflow-x-auto custom-scrollbar">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50/50">
                                            <th className="p-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Entidade</th>
                                            <th className="p-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Perfil</th>
                                            <th className="p-6 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Território</th>
                                            {dynamicFilterConfigs.slice(0, 2).map(config => (<th key={config.id} className="p-6 text-left text-[10px] font-black text-indigo-500 uppercase tracking-widest border-b border-indigo-50">{config.text}</th>))}
                                            <th className="p-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">Ação</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUnits.slice(0, 50).map((u) => (
                                            <tr key={u.id} className="hover:bg-indigo-50/30 transition-colors group">
                                                <td className="p-6 border-b border-slate-50">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm">
                                                            {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" /> : <UserIcon className="w-full h-full p-2 text-slate-400" />}
                                                        </div>
                                                        <div><p className="text-xs font-black text-slate-800 uppercase leading-none">{u.name}</p></div>
                                                    </div>
                                                </td>
                                                <td className="p-6 border-b border-slate-50"><span className="px-3 py-1 bg-white border border-slate-100 rounded-lg text-[9px] font-black text-slate-600 uppercase">{u.role}</span></td>
                                                <td className="p-6 border-b border-slate-50"><div className="flex items-center gap-2 text-slate-500"><MapPin size={12} /><span className="text-[10px] font-bold uppercase">{(u as any).neighborhood || "N/A"}</span></div></td>
                                                {/* SRE FIX: Lookup by ID */}
                                                {dynamicFilterConfigs.slice(0, 2).map(config => (<td key={config.id} className="p-6 border-b border-slate-50"><span className="text-[10px] font-black text-indigo-600 uppercase italic">{String((u as any).socialData?.[config.id] || "-")}</span></td>))}
                                                <td className="p-6 border-b border-slate-50 text-right">
                                                    <button onClick={() => setSelectedMember(u)} className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><Eye size={18} /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Neural Diagnosis (Real AI) */}
                        <div className="lg:col-span-4 bg-slate-900 rounded-[3.5rem] p-10 text-white shadow-2xl flex flex-col justify-between relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700"><Brain size={150} /></div>
                            <div className="relative z-10">
                                <h4 className="text-xl font-black uppercase tracking-tightest flex items-center gap-3"><Sparkles size={20} className="text-indigo-400" /> Diagnóstico Neural</h4>
                                <div className="mt-8 p-6 bg-white/5 border border-white/10 rounded-[2rem] italic text-sm font-medium leading-relaxed uppercase animate-fade-in">
                                    {aiDiagnosis}
                                </div>
                            </div>
                            <div className="relative z-10 space-y-4 pt-8">
                                <button onClick={handleRunNeuralAnalysis} disabled={isAiAnalyzing} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/30">
                                    {isAiAnalyzing ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} fill="white"/>} Executar Análise Neural
                                </button>
                                <button onClick={handleGeneratePDF} className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-indigo-50 transition-colors">
                                    <Printer size={16} /> Gerar Dossiê PDF
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-sm min-h-[400px] flex flex-col space-y-6">
                            <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-3"><Users size={20} className="text-indigo-600" /> Distribuição Demográfica</h4>
                            <div className="flex-1 w-full h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={ageData} onClick={handleAgeChartClick} style={{ cursor: 'pointer' }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }} />
                                        <Tooltip contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', textTransform: 'uppercase', fontSize: '10px', fontWeight: 900 }} cursor={{ fill: '#f8fafc', radius: 12 }} />
                                        <Bar dataKey="value" radius={[12, 12, 0, 0]}>{ageData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}</Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-sm min-h-[400px] flex flex-col space-y-6">
                            <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-3"><TrendingUp size={20} className="text-emerald-600" /> Histórico de Engajamento</h4>
                            <div className="flex-1 w-full h-[250px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={evolutionData}>
                                        <defs><linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={primaryColor} stopOpacity={0.3} /><stop offset="95%" stopColor={primaryColor} stopOpacity={0} /></linearGradient></defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 800 }} domain={[60, 100]} />
                                        <Tooltip contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', textTransform: 'uppercase', fontSize: '10px', fontWeight: 900 }} />
                                        <Area type="monotone" dataKey="score" stroke={primaryColor} strokeWidth={4} fillOpacity={1} fill="url(#colorScore)" dot={{ r: 6, fill: 'white', stroke: primaryColor, strokeWidth: 3 }} activeDot={{ r: 8, strokeWidth: 0 }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* KPI 360 */
                <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-12 bg-[#f8fafc] rounded-b-[3.5rem] animate-fade-in print:bg-white print:p-8 print:border-none">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6 print:hidden">
                        <div><h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3"><PieChartIcon size={24} className="text-indigo-600" /> Matriz Multissetorial 360º</h3><p className="text-xs text-slate-500 font-bold mt-1">Baseado em {filteredUnits.length} registros auditados</p></div>
                        <button onClick={handleGeneratePDF} className="px-6 py-3 bg-slate-900 text-white rounded-xl text-xs font-bold uppercase hover:bg-indigo-600 flex items-center gap-2 shadow-lg transition-all"><Printer size={16} /> Relatório Oficial (PDF)</button>
                    </div>

                    {Object.keys(kpi360Data).length === 0 ? (
                        <div className="p-20 text-center flex flex-col items-center bg-white rounded-[3rem] border border-slate-200 border-dashed">
                            <Brain size={48} className="text-slate-300 mb-6" />
                            <h4 className="text-xl font-black text-slate-400 uppercase tracking-tight">Aguardando Dados do Censo 360º</h4>
                            <p className="text-xs font-bold text-slate-400 uppercase mt-2">Configure perguntas filtráveis no módulo Arquiteto de Censo.</p>
                        </div>
                    ) : (
                        <div className="space-y-16">
                            {Object.entries(kpi360Data).map(([tag, questions]) => {
                                // SRE FIX: Fallback to tag name if not in config
                                const config = CATEGORY_CONFIG[tag] || { ...CATEGORY_CONFIG.DEFAULT, label: tag };
                                const Icon = config.icon;
                                return (
                                    <div key={tag} className="break-inside-avoid animate-slide-up">
                                        <div className="flex items-center gap-4 border-b border-slate-200 pb-4 mb-8">
                                            <div className="p-3 rounded-xl text-white shadow-md" style={{ backgroundColor: config.color }}><Icon size={20} /></div>
                                            <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">{config.label}</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                            {questions.map((q: any) => (
                                                <div key={q.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-lg transition-shadow break-inside-avoid print:border print:shadow-none print:rounded-xl">
                                                    <div>
                                                        <h5 className="text-sm font-black text-slate-700 uppercase leading-tight mb-4 min-h-[40px]">{q.text}</h5>
                                                        {q.alert && (
                                                            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3">
                                                                <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                                                                <p className="text-[10px] font-bold text-rose-700 uppercase leading-relaxed">{q.alert}</p>
                                                            </div>
                                                        )}
                                                        <div className="h-[180px] w-full">
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                <BarChart data={q.chartData} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }} onClick={(data) => handleKpiChartClick(q.id, data)} style={{ cursor: 'pointer' }}>
                                                                    <XAxis type="number" hide />
                                                                    <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} interval={0} />
                                                                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', fontSize: '10px', textTransform: 'uppercase', fontWeight: 800, border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                                                    <Bar dataKey="value" barSize={16} radius={[0, 4, 4, 0]}>
                                                                        {q.chartData.map((entry: any, index: number) => (
                                                                            <Cell key={`cell-${index}`} fill={config.color} fillOpacity={0.8 - (index * 0.15)} />
                                                                        ))}
                                                                    </Bar>
                                                                </BarChart>
                                                            </ResponsiveContainer>
                                                        </div>
                                                    </div>
                                                    <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Amostra</span>
                                                        <span className="text-xs font-black text-slate-800">{q.totalResponses}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* FOOTER */}
            <footer className="h-14 bg-slate-900 border-t border-white/5 flex items-center justify-between px-10 shrink-0 print:hidden">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">SRE BI_NODE ONLINE</span>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={handleGeneratePDF} className="flex items-center gap-2 text-[9px] font-black text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest">
                        <Printer size={14} /> Imprimir Relatório Estratégico
                    </button>
                </div>
            </footer>

            {/* MODAL */}
            {selectedMember && (
                <div className="fixed inset-0 z-[100] flex items-center justify-end bg-slate-900/60 backdrop-blur-sm animate-fade-in p-6 lg:p-12 print:hidden">
                    <div className="w-full max-w-2xl bg-white h-full rounded-[4rem] shadow-2xl flex flex-col overflow-hidden animate-slide-left relative">
                        <button onClick={() => setSelectedMember(null)} className="absolute top-10 right-10 p-4 hover:bg-rose-50 hover:text-rose-500 text-slate-400 rounded-2xl transition-all z-20">
                            <X size={32} />
                        </button>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-12 lg:p-16 space-y-12">
                            <div className="flex items-center gap-10">
                                <div className="w-40 h-40 rounded-[3rem] bg-slate-100 overflow-hidden border-4 border-indigo-50 shadow-xl">
                                    {selectedMember.avatar_url ? <img src={selectedMember.avatar_url} alt="" className="w-full h-full object-cover" /> : <UserIcon className="w-full h-full p-8 text-slate-300" />}
                                </div>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3"><span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border ${selectedMember.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>{selectedMember.status}</span><span className="text-xs font-black text-indigo-600 uppercase tracking-widest">{selectedMember.role}</span></div>
                                    <h3 className="text-4xl font-black text-slate-900 leading-none uppercase tracking-tighter">{selectedMember.name}</h3>
                                    <div className="flex items-center gap-3 text-slate-400 text-xs font-bold uppercase"><MapPin size={14} /> {selectedMember.unit} • {(selectedMember as any).neighborhood || "Área Não Definida"}</div>
                                </div>
                            </div>
                            <div className="space-y-8">
                                <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-3 border-b border-slate-100 pb-4"><Brain size={24} className="text-indigo-600" /> Inteligência de Censo (Respostas)</h4>
                                <div className="grid grid-cols-1 gap-4">
                                    {dynamicFilterConfigs.map(config => (
                                        <div key={config.id} className="flex justify-between items-center p-6 bg-indigo-50/30 rounded-3xl border border-indigo-100/50">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{config.text}</span>
                                            {/* SRE FIX: Lookup by ID */}
                                            <span className="text-xs font-black text-indigo-700 uppercase italic">{(selectedMember as any).socialData?.[config.id] || "Pendente"}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="pt-10 flex gap-4">
                                <button className="flex-1 py-5 bg-slate-900 text-white rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3"><Mail size={16} /> Enviar Alerta</button>
                                <button className="flex-1 py-5 bg-white border-2 border-slate-200 text-slate-900 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-slate-50 transition-all flex items-center justify-center gap-3"><Phone size={16} /> Contato WhatsApp</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DemographicAnalysis;
