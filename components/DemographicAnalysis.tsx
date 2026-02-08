import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import {
    Users, Loader2, Search, X, User as UserIcon, Brain, 
    ShieldCheck, Activity, TrendingUp, Filter, Printer, 
    RefreshCw, Download, Sparkles, Eye, MoreHorizontal, 
    MapPin, Landmark, ShoppingBag, Users2,
    Play, FilterX, Zap, AlertCircle, FileText, BarChart3
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
    Cell
} from 'recharts';
import { SystemInfo, User, Incident } from '../types';
import { demographicsService, mapService, surveyService, aiService } from '../services/api';

const SmartMap = lazy(() => import('./SmartMap'));

interface TacticalActionHubProps {
  count: number;
  searchQuery: string;
  onLaunchCampaign: () => void;
  onPrintReport: () => void;
}

const TacticalActionHub = ({ count, searchQuery, onLaunchCampaign, onPrintReport }: TacticalActionHubProps) => {
  if (count === 0) return null;

  return (
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[3000] flex items-center gap-6 bg-slate-900/95 backdrop-blur-2xl border border-white/10 p-4 pl-8 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-slide-up print:hidden">
      <div className="flex items-center gap-4 border-r border-white/10 pr-6">
        <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-500/20">
          <Users size={20} />
        </div>
        <div>
          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none">Cluster Filtrado</p>
          <p className="text-xl font-black text-white leading-none mt-1">{count} <span className="text-xs text-slate-400 font-bold uppercase">Alvos</span></p>
        </div>
      </div>

      <div className="flex gap-3 pr-4">
        <button 
          onClick={onLaunchCampaign}
          className="flex items-center gap-3 px-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-lg shadow-emerald-500/20"
        >
          <Zap size={16} fill="white" />
          Lançar Campanha
        </button>

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

const DemographicAnalysis = ({ systemInfo, onNavigate }: { systemInfo: SystemInfo, onNavigate: (tab: string) => void }) => {
    const [activeTab, setActiveTab] = useState<'MAP' | 'DASHBOARD' | 'KPI360'>('MAP');
    const [selectedMember, setSelectedMember] = useState<User | null>(null);
    const [units, setUnits] = useState<User[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [dynamicFilterConfigs, setDynamicFilterConfigs] = useState<any[]>([]);
    const [aiDiagnosis, setAiDiagnosis] = useState<string>("Pronto para análise neural do cluster.");
    const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const [resStats, resUnits, resSurveys] = await Promise.all([
                    demographicsService.getStats(),
                    mapService.getUnits(),
                    surveyService.getAll()
                ]);
                setStats(resStats.data);
                setUnits(resUnits.data.data || []);
                
                const surveys = resSurveys.data?.data || [];
                const filterables = surveys.flatMap((s: any) =>
                    (s.questions || []).filter((q: any) => q.filterable || q.mapping_tag)
                );
                setDynamicFilterConfigs(filterables);
            } catch (e) { console.error("Sync Fail"); }
            finally { setIsLoading(false); }
        };
        load();
    }, []);

    // MOTOR DE BUSCA TÁTICA V7.0 - Varre metadados civis e respostas do censo
    const tacticalResults = useMemo(() => {
        const term = searchQuery.toLowerCase().trim();
        return units.map(user => {
            let matchType: 'CIVIL' | 'CENSUS' | 'NONE' = 'NONE';
            let matchLabel = '';

            // 1. Busca em Identidade Civil
            const civilMatch = !term || 
                user.name?.toLowerCase().includes(term) || 
                user.unit?.toLowerCase().includes(term) ||
                user.cpf_cnpj?.includes(term);

            if (civilMatch) {
                matchType = 'CIVIL';
                matchLabel = 'Identidade';
            }

            // 2. Busca Profunda em Respostas do Censo (socialData)
            const socialData = (user as any).socialData || {};
            const matchedKey = Object.keys(socialData).find(key => 
                String(socialData[key]).toLowerCase().includes(term)
            );

            if (matchedKey && !civilMatch) {
                matchType = 'CENSUS';
                const question = dynamicFilterConfigs.find(q => q.id === matchedKey);
                matchLabel = question ? question.text.slice(0, 15) + '...' : 'Censo';
            }

            if (!term) matchType = 'CIVIL';

            return { user, matchType, matchLabel };
        }).filter(r => r.matchType !== 'NONE');
    }, [units, searchQuery, dynamicFilterConfigs]);

    const handleLaunchCampaign = () => {
        const campaignData = {
            name: `CAMPANHA: ${searchQuery.toUpperCase() || 'SEGMENTO TÁTICO'}`,
            targetIds: tacticalResults.map(r => r.user.id)
        };
        sessionStorage.setItem('pending_tactical_campaign', JSON.stringify(campaignData));
        onNavigate('messenger_bridge');
    };

    const handlePrintReport = () => window.print();

    const handleRunNeuralAnalysis = async () => {
        setIsAiAnalyzing(true);
        try {
            const summary = { total: tacticalResults.length, query: searchQuery };
            const prompt = `Analise este segmento de moradores: ${JSON.stringify(summary)}. Gere um diagnóstico de 3 frases em PT-BR sobre impacto social.`;
            const res = await aiService.chat(prompt);
            setAiDiagnosis(res.data.text);
        } catch (e) { setAiDiagnosis("Erro na conexão neural."); }
        finally { setIsAiAnalyzing(false); }
    };

    const primaryColor = systemInfo.primaryColor || '#4f46e5';

    return (
        <div className="flex-1 flex flex-col h-full animate-fade-in bg-slate-50 gap-6 p-[var(--sie-viewport-padding)]">
            
            {/* HEADER TÁTICO */}
            <header className="bg-slate-900 rounded-[var(--sie-radius)] p-8 text-white shadow-xl shrink-0 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden border border-white/5 print:hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="flex items-center gap-5 relative z-10">
                    {/* BarChart3 added to lucide-react import and used here */}
                    <div className="p-4 bg-indigo-600 rounded-2xl shadow-xl" style={{ backgroundColor: primaryColor }}><BarChart3 size={28}/></div>
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">Observatório Territorial</h2>
                        <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mt-2 opacity-80">SRE Tactical Intelligence Hub</p>
                    </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 items-center relative z-10 w-full md:w-auto">
                    <div className="relative group w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                        <input 
                            type="text" 
                            placeholder="BUSCA PROFUNDA (NOME, UNIDADE, RESPOSTA CENSO...)" 
                            value={searchQuery} 
                            onChange={(e) => setSearchQuery(e.target.value)} 
                            className="w-full h-12 pl-12 pr-4 bg-white/10 border border-white/20 rounded-xl text-[10px] font-black uppercase text-white placeholder:text-slate-400 focus:bg-white/20 outline-none transition-all shadow-inner" 
                        />
                    </div>
                    
                    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
                        <button onClick={() => setActiveTab('MAP')} className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'MAP' ? 'bg-white text-indigo-900 shadow-lg' : 'text-slate-400 hover:text-white'}`}>Mapa</button>
                        <button onClick={() => setActiveTab('DASHBOARD')} className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'DASHBOARD' ? 'bg-white text-indigo-900 shadow-lg' : 'text-slate-400 hover:text-white'}`}>Dados</button>
                    </div>
                </div>
            </header>

            {/* ÁREA DE CONTEÚDO */}
            <div className="flex-1 bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col relative print:p-0 print:border-none">
                
                {activeTab === 'MAP' && (
                    <div className="flex-1 relative rounded-[2rem] overflow-hidden bg-slate-100 print:hidden">
                        <Suspense fallback={<div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-indigo-600" /></div>}>
                            <SmartMap 
                                systemInfo={systemInfo} 
                                activeLayers={{ residents: true, incidents: false, heatmap: false, surveys: false }} 
                                onSelectEntity={setSelectedMember} 
                                filteredData={tacticalResults.map(r => r.user)} 
                            />
                        </Suspense>
                        <TacticalActionHub 
                            count={tacticalResults.length} 
                            searchQuery={searchQuery} 
                            onLaunchCampaign={handleLaunchCampaign} 
                            onPrintReport={handlePrintReport} 
                        />
                    </div>
                )}

                {activeTab === 'DASHBOARD' && (
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* LISTAGEM PARA RELATÓRIO */}
                        <div className="overflow-x-auto custom-scrollbar flex-1">
                            <table className="w-full text-left border-separate border-spacing-0 print:table">
                                <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest sticky top-0 z-10 print:bg-white print:text-black">
                                    <tr>
                                        <th className="p-6 border-b">Membro / Unidade</th>
                                        <th className="p-6 border-b text-center">Correspondência</th>
                                        <th className="p-6 border-b text-center">Status</th>
                                        <th className="p-6 border-b text-right print:hidden">Dossiê</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {tacticalResults.map(res => (
                                        <tr key={res.user.id} className="hover:bg-slate-50 transition-colors group">
                                            <td className="p-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center shadow-inner shrink-0 print:hidden">
                                                        {res.user.avatar_url ? <img src={res.user.avatar_url} className="w-full h-full object-cover" /> : <UserIcon className="text-slate-300" size={16}/>}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-slate-800 uppercase leading-none">{res.user.name}</p>
                                                        <p className="text-[9px] font-bold text-indigo-600 mt-1 uppercase">Unidade: {res.user.unit || '---'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-6 text-center">
                                                <div className="flex flex-col items-center gap-1">
                                                    <span className={`px-2 py-0.5 rounded-md text-[7px] font-black uppercase ${res.matchType === 'CENSUS' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500'}`}>
                                                        {res.matchType}
                                                    </span>
                                                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">{res.matchLabel}</span>
                                                </div>
                                            </td>
                                            <td className="p-6 text-center">
                                                <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase border ${res.user.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                                    {res.user.status}
                                                </span>
                                            </td>
                                            <td className="p-6 text-right print:hidden">
                                                <button onClick={() => setSelectedMember(res.user)} className="p-2 bg-white border border-slate-200 text-slate-300 hover:text-indigo-600 rounded-xl hover:border-indigo-200 transition-all shadow-sm">
                                                    <Eye size={14}/>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* ANALYTICS AI (DASHBOARD ONLY) */}
                        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6 shrink-0 print:hidden">
                             <div className="lg:col-span-8 p-8 bg-slate-950 rounded-[2.5rem] text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-5"><Brain size={120}/></div>
                                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                                    <div className="space-y-4">
                                        <h4 className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><Sparkles size={16} className="text-indigo-400"/> Diagnóstico Neural do Segmento</h4>
                                        <p className="text-[11px] font-medium leading-relaxed italic text-slate-400 max-w-xl">"{aiDiagnosis}"</p>
                                    </div>
                                    <button onClick={handleRunNeuralAnalysis} disabled={isAiAnalyzing} className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all flex items-center gap-2">
                                        {isAiAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />} Analisar Cluster
                                    </button>
                                </div>
                             </div>
                             <div className="lg:col-span-4 p-8 bg-indigo-50 rounded-[2.5rem] border border-indigo-100 flex flex-col justify-between">
                                 <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Amostragem</p>
                                 <div className="flex items-end gap-3">
                                     <h3 className="text-4xl font-black text-indigo-900">{tacticalResults.length}</h3>
                                     <p className="text-[10px] font-bold text-indigo-600 uppercase mb-1.5">Entidades</p>
                                 </div>
                             </div>
                        </div>
                    </div>
                )}
            </div>

            {/* PRINT CSS OVERRIDE */}
            <style>{`
                @media print {
                    @page { margin: 1cm; size: A4; }
                    body { background: white !important; }
                    .print\\:hidden { display: none !important; }
                    .bg-white { background: white !important; }
                    aside, header, nav { display: none !important; }
                    main { padding: 0 !important; margin: 0 !important; width: 100% !important; }
                    table { border-collapse: collapse !important; width: 100% !important; }
                    th, td { border: 1px solid #eee !important; padding: 10px !important; }
                    tr { page-break-inside: avoid; }
                }
            `}</style>
        </div>
    );
};

export default DemographicAnalysis;