
import React, { useState, useEffect, useMemo } from 'react';
import { 
    Scale, Plus, Gavel, CheckCircle2, XCircle, 
    Clock, Loader2, Sparkles, Brain, Save, X, 
    ChevronRight, BarChart3, Info, Trash2,
    PieChart as PieIcon, TrendingUp, History
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { collectiveService } from '../services/api';
import { SystemInfo, User } from '../types';

interface Decision {
    id: number;
    title: string;
    description: string;
    ai_analysis: string;
    status: 'OPEN' | 'CLOSED' | 'EXECUTED';
    due_date: string;
    total_votes: number;
    my_vote?: 'YES' | 'NO' | 'ABSTAIN';
}

const DecisionCard = ({ decision, onVote, onDelete, votingId, canManage }: any) => {
    const [results, setResults] = useState<any[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [loadingResults, setLoadingResults] = useState(false);

    const loadResults = async () => {
        if (showResults) { setShowResults(false); return; }
        setLoadingResults(true);
        try {
            const res = await collectiveService.getResults(decision.id);
            const data = res.data.data.map((r: any) => ({
                name: r.choice === 'YES' ? 'Sim' : r.choice === 'NO' ? 'Não' : 'Abstenção',
                value: r.count,
                color: r.choice === 'YES' ? '#10b981' : r.choice === 'NO' ? '#ef4444' : '#64748b'
            }));
            setResults(data);
            setShowResults(true);
        } catch (e) { console.error("Results fail"); }
        finally { setLoadingResults(false); }
    };

    return (
        <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:border-indigo-300 transition-all group">
            <div className="p-10 flex-1 space-y-8">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase border ${decision.status === 'OPEN' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                            {decision.status === 'OPEN' ? 'Pleito Ativo' : 'Encerrada'}
                        </span>
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mt-3 leading-tight">{decision.title}</h3>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        {canManage && <button onClick={() => onDelete(decision.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button>}
                        <div className="text-right">
                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Encerramento</p>
                            <p className="text-xs font-black text-slate-600 mt-1 flex items-center gap-2 justify-end"><Clock size={12}/> {new Date(decision.due_date).toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>

                <p className="text-xs text-slate-500 font-medium leading-relaxed uppercase">{decision.description}</p>

                {/* IA ANALYSIS - ESTABILIDADE SOCIAL */}
                <div className="bg-indigo-50/50 rounded-[2.5rem] border border-indigo-100 p-8 space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-5"><Brain size={100}/></div>
                    <div className="flex items-center gap-3 relative z-10">
                        <Sparkles size={16} className="text-indigo-600 animate-pulse"/>
                        <h4 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Diagnóstico Social (Advisor IA)</h4>
                    </div>
                    <div className="text-[11px] font-medium text-indigo-900/80 uppercase leading-loose prose max-w-none relative z-10" dangerouslySetInnerHTML={{ __html: decision.ai_analysis }} />
                </div>

                {showResults && results.length > 0 && (
                    <div className="h-48 w-full animate-fade-in flex items-center bg-slate-50 rounded-[2rem] p-6 border border-slate-100">
                         <ResponsiveContainer width="40%" height="100%">
                            <PieChart>
                                <Pie data={results} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5}>
                                    {results.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                         </ResponsiveContainer>
                         <div className="flex-1 space-y-2 ml-6">
                            {results.map((r, i) => (
                                <div key={i} className="flex justify-between items-center text-[10px] font-black uppercase">
                                    <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full" style={{backgroundColor: r.color}}/> {r.name}</span>
                                    <span className="text-slate-500">{r.value} votos</span>
                                </div>
                            ))}
                         </div>
                    </div>
                )}

                {decision.status === 'OPEN' && (
                    <div className="grid grid-cols-3 gap-4 pt-4">
                        <button onClick={() => onVote(decision.id, 'YES')} disabled={votingId === decision.id} className={`py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex flex-col items-center gap-2 border-2 ${decision.my_vote === 'YES' ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-emerald-300 hover:text-emerald-600'}`}>
                            {votingId === decision.id ? <Loader2 className="animate-spin" size={14}/> : <CheckCircle2 size={16}/>} <span>Favorável</span>
                        </button>
                        <button onClick={() => onVote(decision.id, 'NO')} disabled={votingId === decision.id} className={`py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex flex-col items-center gap-2 border-2 ${decision.my_vote === 'NO' ? 'bg-rose-600 border-rose-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-rose-300 hover:text-rose-600'}`}>
                            {votingId === decision.id ? <Loader2 className="animate-spin" size={14}/> : <XCircle size={16}/>} <span>Contrário</span>
                        </button>
                        <button onClick={() => onVote(decision.id, 'ABSTAIN')} disabled={votingId === decision.id} className={`py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex flex-col items-center gap-2 border-2 ${decision.my_vote === 'ABSTAIN' ? 'bg-slate-800 border-slate-800 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'}`}>
                            <span className="opacity-50">---</span> <span>Abstenção</span>
                        </button>
                    </div>
                )}
            </div>
            <div className="px-10 py-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-white rounded-lg shadow-sm text-indigo-600"><TrendingUp size={14}/></div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{decision.total_votes} Votos Coletados</span>
                </div>
                <button onClick={loadResults} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2 hover:translate-x-1 transition-all">
                    {loadingResults ? <Loader2 className="animate-spin" size={12}/> : <PieIcon size={14}/>} 
                    {showResults ? 'Ocultar Consensus' : 'Ver Consensus'}
                </button>
            </div>
        </div>
    );
};

const CollectiveDecisions = ({ systemInfo, currentUser }: { systemInfo: SystemInfo, currentUser: User | null }) => {
    const [decisions, setDecisions] = useState<Decision[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [newDecision, setNewDecision] = useState({ title: '', description: '', due_date: '' });
    const [votingId, setVotingId] = useState<number | null>(null);

    useEffect(() => { loadDecisions(); }, []);

    const loadDecisions = async () => {
        setLoading(true);
        try {
            const res = await collectiveService.getDecisions();
            setDecisions(res.data.data || []);
        } catch (e) { console.error("Collective fail"); }
        finally { setLoading(false); }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await collectiveService.createDecision(newDecision);
            setIsModalOpen(false);
            setNewDecision({ title: '', description: '', due_date: '' });
            loadDecisions();
        } catch (e) { alert("Erro ao protocolar pleito."); }
        finally { setIsSaving(false); }
    };

    const handleVote = async (id: number, choice: any) => {
        setVotingId(id);
        try {
            await collectiveService.castVote(id, choice);
            loadDecisions();
        } catch (e) { alert("Falha ao computar voto."); }
        finally { setVotingId(null); }
    };

    const primaryColor = systemInfo.primaryColor || '#4f46e5';

    return (
        <div className="flex-1 flex flex-col h-full animate-fade-in bg-slate-50 gap-6 p-[var(--sie-viewport-padding)]">
            <header className="bg-slate-900 rounded-[var(--sie-radius)] p-8 text-white shadow-xl shrink-0 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="flex items-center gap-5 relative z-10">
                    <div className="p-4 bg-indigo-600 rounded-2xl shadow-xl" style={{ backgroundColor: primaryColor }}><Scale size={28}/></div>
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tight">Decisões Coletivas</h2>
                        <p className="text-indigo-400 text-[10px] font-black uppercase mt-2 tracking-widest">SRE Democratic Ledger Protocol</p>
                    </div>
                </div>
                {currentUser?.role === 'ADMIN' && (
                    <button onClick={() => setIsModalOpen(true)} className="px-10 py-4 bg-white text-slate-900 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-2xl hover:bg-indigo-50 transition-all flex items-center gap-3 relative z-10 sie-button">
                        <Plus size={18}/> Protocolar Pleito
                    </button>
                )}
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {loading ? <div className="p-20 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={40}/></div> : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 pb-10">
                        {decisions.map(decision => (
                            <DecisionCard 
                                key={decision.id} 
                                decision={decision} 
                                onVote={handleVote} 
                                onDelete={(id:number) => collectiveService.deleteDecision(id).then(loadDecisions)}
                                votingId={votingId}
                                canManage={currentUser?.role === 'ADMIN'}
                            />
                        ))}
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="sie-editor-overlay">
                    <div className="sie-modal-container !h-auto !max-w-2xl self-center border border-white/10 shadow-2xl">
                        <form onSubmit={handleCreate}>
                            <div className="h-24 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 rounded-t-[2rem] border-b border-white/5 shadow-2xl relative z-20">
                                <h3 className="font-black text-xl uppercase tracking-tighter">Novo Pleito SRE</h3>
                                <button type="button" onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-rose-500 rounded-xl transition-all"><X size={24}/></button>
                            </div>
                            <div className="p-10 space-y-8 bg-white rounded-b-[2rem]">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Título da Proposta</label>
                                    <input required className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-sm font-black uppercase outline-none focus:border-indigo-500 shadow-inner" placeholder="EX: REVITALIZAÇÃO DO CLUBE" value={newDecision.title} onChange={e => setNewDecision({...newDecision, title: e.target.value.toUpperCase()})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contexto e Justificativa</label>
                                    <textarea required rows={6} className="w-full bg-slate-50 border border-slate-200 rounded-[2rem] p-6 text-sm font-medium uppercase outline-none focus:bg-white focus:border-indigo-500 transition-all shadow-inner" value={newDecision.description} onChange={e => setNewDecision({...newDecision, description: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data de Encerramento</label>
                                    <input type="datetime-local" required className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-sm font-black outline-none focus:border-indigo-500 shadow-inner" value={newDecision.due_date} onChange={e => setNewDecision({...newDecision, due_date: e.target.value})} />
                                </div>
                                <button type="submit" disabled={isSaving} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50">
                                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} Protocolar Pleito
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CollectiveDecisions;
