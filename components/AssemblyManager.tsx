import React, { useState, useEffect, useRef } from 'react';
import { 
    Gavel, Play, StopCircle, FileText, Download, Trash2, Edit2, 
    Plus, Search, Clock, Users, ChevronRight, X, Save, Sparkles, Printer, Loader2, ThumbsUp, ThumbsDown, CircleSlash, Send, MonitorPlay, BarChart3,
    FileSignature, BrainCircuit, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { assemblyService, aiService, documentService } from '../services/api';
import { User, SystemInfo } from '../types';

interface AssemblyManagerProps {
    currentUser?: User | null;
    systemInfo?: SystemInfo;
}

const AssemblyManager = ({ currentUser, systemInfo }: AssemblyManagerProps) => {
    const [assemblies, setAssemblies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'HISTORY' | 'LIVE'>('HISTORY');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAssembly, setEditingAssembly] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Live Session States
    const [activeSession, setActiveSession] = useState<any>(null);
    const [isGeneratingAta, setIsGeneratingAta] = useState(false);
    const [generatedAta, setGeneratedAta] = useState<string>('');
    const [messages, setMessages] = useState<any[]>([]);
    const [chatInput, setChatInput] = useState('');
    
    // Motor de Votação Reativo
    const [votingData, setVotingData] = useState({
        quorum: 0, 
        totalEligible: 452,
        topics: [
            { id: 1, title: 'Previsão Orçamentária 2025/2026', votes: { yes: 0, no: 0, abstain: 0 } },
            { id: 2, title: 'Fundo de Reserva para Manutenção Estrutural', votes: { yes: 0, no: 0, abstain: 0 } }
        ]
    });

    const isManager = currentUser?.role === 'ADMIN' || currentUser?.role === 'COUNCIL' || currentUser?.role === 'PRESIDENT' || currentUser?.role === 'SINDIC';

    useEffect(() => { loadAssemblies(); }, []);

    const loadAssemblies = async () => {
        setLoading(true);
        try {
            const res = await assemblyService.getAll();
            const list = res.data?.data || (Array.isArray(res.data) ? res.data : []);
            setAssemblies(list);
        } catch (err) {
            console.error("[SRE] Governança Offline:", err);
            setAssemblies([]);
        } finally { setLoading(false); }
    };

    const handleOpenCreate = () => {
        setEditingAssembly({ title: '', description: '', date: new Date().toISOString().slice(0, 16), status: 'SCHEDULED', topics: [] });
        setIsModalOpen(true);
    };

    const handleSave = async (e: any) => {
        if (e) e.preventDefault();
        setIsSaving(true);
        try {
            if (editingAssembly.id) {
                await assemblyService.update(editingAssembly.id, editingAssembly);
            } else {
                await assemblyService.create(editingAssembly);
            }
            setIsModalOpen(false);
            loadAssemblies();
        } catch (err) {
            alert("Falha ao salvar no Kernel.");
        } finally { setIsSaving(false); }
    };

    const handleDelete = async (id: number | string) => {
        if (!confirm("Excluir esta assembleia permanentemente?")) return;
        try {
            await assemblyService.delete(id);
            loadAssemblies();
        } catch (err) {
            alert("Erro ao remover registro.");
        }
    };

    const handleStartLive = (assembly: any) => {
        setActiveSession(assembly);
        setActiveTab('LIVE');
        setMessages([{ id: 1, user: 'SISTEMA', text: `Sessão "${assembly.title}" iniciada no Terminal.`, type: 'system' }]);
        setVotingData(prev => ({ ...prev, quorum: Math.floor(Math.random() * (150 - 80 + 1)) + 80 }));
    };

    const handleGenerateAta = async () => {
        if (!activeSession) return;
        setIsGeneratingAta(true);
        
        const chatContext = messages.filter(m => m.type === 'user').map(m => `${m.user}: ${m.text}`).join('\n');
        const votingContext = votingData.topics.map(t => `${t.title}: SIM(${t.votes.yes}), NÃO(${t.votes.no}), ABSTENSÃO(${t.votes.abstain})`).join('\n');
        
        const prompt = `
            ATUE COMO: Secretário Jurídico SRE.
            TAREFA: Gerar a ATA OFICIAL da assembleia "${activeSession.title}".
            
            CONTEÚDO DO DEBATE:
            ${chatContext}
            
            RESULTADOS DAS VOTAÇÕES:
            ${votingContext}
            
            REQUISITOS:
            1. Formato HTML Profissional.
            2. Inclua cabeçalho com data (${new Date(activeSession.date).toLocaleDateString()}) e quórum (${votingData.quorum} presentes).
            3. Resuma os principais pontos de discussão de forma neutra.
            4. Registre formalmente os resultados de cada pauta.
            5. Finalize com campo para assinaturas.
            RETORNE APENAS O HTML DO CORPO DA ATA.
        `;

        try {
            const res = await aiService.generateDocument(prompt, `Entidade: ${systemInfo?.name}`);
            setGeneratedAta(res.data.text);
            setMessages(prev => [...prev, { id: Date.now(), user: 'ADVISOR IA', text: 'Ata preliminar gerada com sucesso. Revise no painel de ata.', type: 'system' }]);
        } catch (e) {
            alert("Falha na geração neural da ata.");
        } finally {
            setIsGeneratingAta(false);
        }
    };

    const handleFinishAssembly = async () => {
        if (!confirm("Deseja encerrar a sessão e salvar a Ata oficial no Repositório?")) return;
        setIsSaving(true);
        try {
            // 1. Atualiza status da assembleia
            await assemblyService.update(activeSession.id, { 
                status: 'FINISHED',
                description: activeSession.description + "\n\nSESSÃO FINALIZADA VIA TERMINAL DIGITAL."
            });

            // 2. Salva a Ata como um documento oficial se existir
            if (generatedAta) {
                await documentService.create({
                    title: `ATA - ${activeSession.title}`,
                    content: generatedAta,
                    type: 'ATA',
                    status: 'APPROVED'
                });
            }

            alert("✅ ASSEMBLEIA ENCERRADA. Ata comitada no Hub de Documentos.");
            setActiveSession(null);
            setActiveTab('HISTORY');
            loadAssemblies();
        } catch (e) {
            alert("Erro ao encerrar sessão.");
        } finally {
            setIsSaving(false);
        }
    };

    const registerVote = (topicId: number, type: 'yes' | 'no' | 'abstain') => {
        setVotingData(prev => ({
            ...prev,
            topics: prev.topics.map(t => t.id === topicId ? { ...t, votes: { ...t.votes, [type]: t.votes[type] + 1 } } : t)
        }));
    };

    const handleSendMessage = (e?: any) => {
        if (e) e.preventDefault();
        if (!chatInput.trim()) return;
        const newMsg = { id: Date.now(), user: currentUser?.name || 'Membro S.I.E', text: chatInput, type: 'user' };
        setMessages(prev => [...prev, newMsg]);
        setChatInput('');
    };

    const primaryColor = systemInfo?.primaryColor || '#4f46e5';

    if (loading) return (
        <div className="h-full flex items-center justify-center p-20">
            <Loader2 className="animate-spin text-indigo-600 mb-4" size={48}/>
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em]">Sincronizando Sessões...</p>
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in pb-20 h-full relative">
            <header className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm gap-6 shrink-0">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tighter uppercase leading-none">Assembleia Digital</h2>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">Status: Conectado ao Kernel SRE</p>
                </div>
                <div className="flex bg-slate-100 p-1.5 rounded-2xl shadow-inner w-full md:w-auto">
                    <button onClick={() => setActiveTab('HISTORY')} className={`flex-1 md:flex-none px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'HISTORY' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500 hover:text-indigo-600'}`}>Histórico de Atas</button>
                    <button disabled={!activeSession} onClick={() => setActiveTab('LIVE')} className={`flex-1 md:flex-none px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'LIVE' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-400 opacity-50'}`}>Sessão em Curso</button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {activeTab === 'HISTORY' && (
                    <div className="space-y-6">
                        {isManager && (
                            <div className="flex justify-end">
                                <button onClick={handleOpenCreate} className="px-10 py-4 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all flex items-center gap-3 active:scale-95">
                                    <Plus size={20}/> Agendar Assembleia
                                </button>
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-4 pb-10">
                            {assemblies.length === 0 ? (
                                <div className="bg-white p-20 rounded-[4rem] border-2 border-dashed border-slate-100 text-center text-slate-300 font-black uppercase text-xs tracking-widest">
                                    <Gavel size={64} className="mx-auto mb-6 opacity-10" />
                                    Nenhuma assembleia registrada no log.
                                </div>
                            ) : (
                                assemblies.map(ass => (
                                    <div key={ass.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center group hover:border-indigo-300 transition-all">
                                        <div className="flex items-center gap-6">
                                            <div className={`p-5 rounded-[2rem] shadow-inner ${ass.status === 'FINISHED' ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                                <Gavel size={28}/>
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase leading-none">{ass.title}</h3>
                                                <div className="flex gap-4 mt-3">
                                                    <span className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2"><Clock size={14}/> {new Date(ass.date).toLocaleDateString('pt-BR')} às {new Date(ass.date).toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}</span>
                                                    <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase border ${ass.status === 'FINISHED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>{ass.status}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 mt-6 md:mt-0 opacity-0 group-hover:opacity-100 transition-all">
                                            {ass.status === 'SCHEDULED' && <button onClick={() => handleStartLive(ass)} className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg hover:bg-indigo-700 transition-all"><Play size={20}/></button>}
                                            <button onClick={() => { setEditingAssembly(ass); setIsModalOpen(true); }} className="p-4 bg-slate-100 text-slate-400 hover:text-indigo-600 rounded-2xl hover:bg-white transition-all shadow-sm"><Edit2 size={20}/></button>
                                            <button onClick={() => handleDelete(ass.id)} className="p-4 text-slate-300 hover:text-rose-600 transition-all"><Trash2 size={20}/></button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'LIVE' && activeSession && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-scale-in pb-10">
                        <div className="lg:col-span-8 space-y-8">
                            <div className="bg-slate-950 rounded-[3rem] p-12 text-white shadow-2xl border border-white/5 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-10 opacity-5"><BrainCircuit size={200}/></div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 px-4 py-2 bg-rose-500/10 text-rose-400 rounded-full w-fit border border-rose-500/20 mb-6">
                                        <div className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Painel Deliberativo Ativo</span>
                                    </div>
                                    <h3 className="text-4xl md:text-5xl font-black tracking-tightest leading-tight uppercase">{activeSession.title}</h3>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-1 gap-6">
                                {votingData.topics.map(topic => (
                                    <div key={topic.id} className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm">
                                        <h4 className="text-2xl font-black text-slate-800 tracking-tight mb-8 uppercase">{topic.title}</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <button onClick={() => registerVote(topic.id, 'yes')} className="p-8 bg-slate-50 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-[2.5rem] flex flex-col items-center gap-3 transition-all border border-transparent hover:border-emerald-100 shadow-sm active:scale-95">
                                                <ThumbsUp size={36}/><span className="text-xs font-black uppercase tracking-widest">{topic.votes.yes} Favoráveis</span>
                                            </button>
                                            <button onClick={() => registerVote(topic.id, 'no')} className="p-8 bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-[2.5rem] flex flex-col items-center gap-3 transition-all border border-transparent hover:border-rose-100 shadow-sm active:scale-95">
                                                <ThumbsDown size={36}/><span className="text-xs font-black uppercase tracking-widest">{topic.votes.no} Contrários</span>
                                            </button>
                                            <button onClick={() => registerVote(topic.id, 'abstain')} className="p-8 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-[2.5rem] flex flex-col items-center gap-3 transition-all border border-transparent hover:border-slate-200 shadow-sm active:scale-95">
                                                <CircleSlash size={36}/><span className="text-xs font-black uppercase tracking-widest">{topic.votes.abstain} Abstenções</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {generatedAta && (
                                <div className="bg-white p-12 rounded-[3.5rem] border-2 border-indigo-100 shadow-2xl animate-fade-in relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-6 bg-indigo-50 text-indigo-400 rounded-bl-[3rem]"><FileSignature size={24}/></div>
                                    <h4 className="text-xl font-black uppercase text-indigo-900 mb-8 flex items-center gap-3"><Sparkles size={20}/> Ata Preliminar (IA Ghostwriter)</h4>
                                    <div className="prose prose-indigo max-w-none border-l-4 border-indigo-500 pl-8 py-2 text-slate-700 bg-slate-50/50 rounded-r-2xl" dangerouslySetInnerHTML={{ __html: generatedAta }} />
                                    <div className="mt-10 flex gap-4">
                                        <button onClick={handleFinishAssembly} className="flex-1 py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3">
                                            <CheckCircle2 size={18}/> Comitar Ata Oficial
                                        </button>
                                        <button onClick={() => setGeneratedAta('')} className="px-8 py-5 bg-white border border-slate-200 text-slate-400 rounded-2xl font-black text-[10px] uppercase hover:text-rose-500 transition-all">Descartar</button>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <div className="lg:col-span-4 space-y-6">
                            {/* GOVERNANCE ACTIONS PANEL */}
                            <div className="bg-slate-900 rounded-[3.5rem] p-8 text-white shadow-xl space-y-6 border border-white/5">
                                <h5 className="text-[10px] font-black uppercase text-indigo-400 tracking-widest flex items-center gap-2">Controles de Governança</h5>
                                <button 
                                    onClick={handleGenerateAta} 
                                    disabled={isGeneratingAta}
                                    className="w-full py-5 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all border border-white/10"
                                >
                                    {isGeneratingAta ? <Loader2 size={16} className="animate-spin"/> : <Sparkles size={16} className="text-indigo-400"/>}
                                    Gerar Minuta com IA
                                </button>
                                <button 
                                    onClick={handleFinishAssembly}
                                    disabled={isSaving}
                                    className="w-full py-5 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-rose-900/40 transition-all active:scale-95"
                                >
                                    <StopCircle size={16}/> Encerrar Sessão
                                </button>
                            </div>

                            {/* CHAT PANEL */}
                            <div className="bg-white rounded-[3.5rem] border border-slate-200 shadow-sm flex flex-col h-[550px] overflow-hidden sticky top-8">
                                <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
                                    <h5 className="font-black uppercase text-[10px] tracking-widest text-slate-500">Debate em Tempo Real</h5>
                                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                                        <Users size={14}/><span className="text-[10px] font-black">{votingData.quorum} Ativos</span>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-8 space-y-5 custom-scrollbar bg-slate-50/20">
                                    {messages.map(m => (
                                        <div key={m.id} className={`p-5 rounded-2xl shadow-sm border animate-fade-in ${m.type === 'system' ? 'bg-indigo-50 border-indigo-100 text-indigo-600 text-center font-bold text-[10px] uppercase tracking-widest' : 'bg-white border-slate-100 text-slate-700'}`}>
                                            {m.type !== 'system' && <p className="text-[9px] font-black uppercase text-indigo-600 mb-1">{m.user}</p>}
                                            <p className="text-xs font-medium leading-relaxed uppercase">{m.text}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-6 border-t border-slate-100 bg-white shrink-0">
                                    <form onSubmit={handleSendMessage} className="flex gap-3">
                                        <input className="flex-1 bg-slate-50 border-slate-100 rounded-xl px-5 h-14 text-sm font-medium outline-none transition-all uppercase" placeholder="Mensagem..." value={chatInput} onChange={e => setChatInput(e.target.value)} />
                                        <button type="submit" className="p-4 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-700 transition-all"><Send size={20}/></button>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="sie-editor-overlay">
                    <div className="sie-modal-container">
                        <form onSubmit={handleSave} className="flex flex-col h-full overflow-hidden">
                            <div className="h-20 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 shadow-2xl relative z-20 border-b border-white/5">
                                <div className="flex items-center gap-5">
                                    <div className="p-3.5 bg-indigo-600 rounded-xl shadow-xl" style={{ backgroundColor: primaryColor }}><Gavel size={22}/></div>
                                    <div>
                                        <h3 className="font-black text-xl uppercase tracking-tighter leading-none">Configurar Assembleia</h3>
                                        <p className="text-indigo-400 text-[9px] font-black uppercase mt-1.5 tracking-widest opacity-80">SRE Legislative Control Suite V5.0</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button type="submit" disabled={isSaving} className="px-10 py-3.5 bg-indigo-600 hover:bg-indigo-50 text-white rounded-xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center gap-3 shadow-xl active:scale-95">
                                        {isSaving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Commitar Edital
                                    </button>
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="p-3.5 hover:bg-rose-500 hover:text-white text-slate-400 rounded-xl transition-all border border-white/5"><X size={24}/></button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-[#fdfdfe] relative">
                                <div className="max-w-4xl mx-auto space-y-12 pb-10">
                                    <div className="bg-slate-50 p-10 rounded-[3.5rem] border border-slate-200 shadow-inner space-y-10">
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Título do Evento</label>
                                            <input required className="w-full font-black h-16 bg-white border border-slate-200 rounded-[1.5rem] px-8 text-2xl focus:border-indigo-500 transition-all shadow-sm" placeholder="Ex: AGO - Eleição de Síndico 2025..." value={editingAssembly.title} onChange={e => setEditingAssembly({...editingAssembly, title: e.target.value})} />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                            <div className="space-y-3">
                                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Data & Hora Convocada</label>
                                                <input type="datetime-local" required className="w-full font-black h-16 bg-white border border-slate-200 rounded-[1.5rem] px-8 text-xl focus:border-indigo-500 transition-all shadow-sm" value={editingAssembly.date} onChange={e => setEditingAssembly({...editingAssembly, date: e.target.value})} />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Estado de Fluxo</label>
                                                <select className="w-full font-black h-16 bg-white border border-slate-200 rounded-[1.5rem] px-8 text-sm uppercase appearance-none shadow-sm" value={editingAssembly.status} onChange={e => setEditingAssembly({...editingAssembly, status: e.target.value as any})}>
                                                    <option value="SCHEDULED">Agendada / Em Edital</option>
                                                    <option value="FINISHED">Finalizada / Arquivada</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Pautas & Tópicos Deliberativos</label>
                                            <textarea rows={6} className="w-full font-medium bg-white border border-slate-200 rounded-[2.5rem] p-10 text-lg focus:border-indigo-500 transition-all shadow-sm uppercase leading-relaxed" placeholder="Descreva os itens da pauta com clareza..." value={editingAssembly.description} onChange={e => setEditingAssembly({...editingAssembly, description: e.target.value})} />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 border-t bg-slate-50 flex justify-between items-center shrink-0">
                                <div className="flex items-center gap-3"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocolo de Governança Sincronizado</span></div>
                                <div className="flex gap-4">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-3.5 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors">Fechar</button>
                                    <button type="submit" className="px-12 py-3.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl">Salvar Edital</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssemblyManager;