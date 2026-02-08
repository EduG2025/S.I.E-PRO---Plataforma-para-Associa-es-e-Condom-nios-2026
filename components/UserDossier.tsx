
import React, { useState } from 'react';
/* SRE FIX: Added missing 'Clock' icon to imports */
import { Brain, Sparkles, Loader2, ShieldCheck, Activity, TrendingUp, AlertTriangle, FileText, User, Zap, Landmark, Smartphone, MapPin, Clock } from 'lucide-react';
import { aiService } from '../services/api';
import { User as UserType } from '../types';

interface UserDossierProps {
    user: UserType;
    onClose: () => void;
}

const UserDossier = ({ user, onClose }: UserDossierProps) => {
    const [dossier, setDossier] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const handleRunAnalysis = async () => {
        setLoading(true);
        try {
            const res = await aiService.generateUserDossier(user.id);
            setDossier(res.data.text);
        } catch (e) {
            setDossier("ERRO NO HANDSHAKE NEURAL. O ADVISOR NÃO CONSEGUIU PROCESSAR OS LEDGERS.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col gap-10 animate-fade-in">
            {/* HUD SUPERIOR - STATUS DE IDENTIDADE */}
            <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-8 shadow-2xl border border-white/5">
                <div className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-indigo-600/5 rounded-full blur-[100px] -mr-20 -mt-20"></div>
                
                <div className="flex items-center gap-10 relative z-10">
                    <div className="w-24 h-24 rounded-[2.5rem] bg-slate-800 border-4 border-white/10 overflow-hidden shadow-2xl relative flex items-center justify-center group">
                        {user.avatar_url ? (
                            <img src={user.avatar_url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Identity" />
                        ) : (
                            <User size={40} className="text-slate-500" />
                        )}
                        <div className="absolute inset-0 bg-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>
                    <div>
                        <p className="text-indigo-400 text-[9px] font-black uppercase tracking-[0.5em] leading-none mb-3">Identidade Ledger</p>
                        <h2 className="text-4xl font-black uppercase tracking-tightest leading-none">{user.name}</h2>
                        <div className="flex gap-4 mt-4">
                            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-300">Unidade {user.unit || 'HUB'}</span>
                            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-300">CPF {user.cpf_cnpj}</span>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-3 relative z-10">
                    <div className="flex gap-2">
                        <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400"><ShieldCheck size={20}/></div>
                        <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400"><Smartphone size={20}/></div>
                        <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-400"><Zap size={20}/></div>
                    </div>
                    <p className="text-[8px] font-black uppercase text-slate-500 tracking-[0.4em]">SRE Bio-Verified Protocol</p>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-10 pb-10">
                {/* COLUNA ESQUERDA - INFOS RÁPIDAS */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm space-y-8">
                        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-3">
                            <Activity size={16} className="text-indigo-600"/> Atributos do Cadastro
                        </h4>
                        <div className="space-y-4">
                            {[
                                { label: 'Ocupação', val: user.profession || 'Não Informado', icon: FileText },
                                { label: 'Vínculo', val: user.resident_type || 'Titular', icon: Landmark },
                                { label: 'Localização', val: user.neighborhood || 'Cluster Central', icon: MapPin },
                                { label: 'Nascimento', val: new Date(user.birth_date!).toLocaleDateString('pt-BR'), icon: Clock }
                            ].map((attr, i) => (
                                <div key={i} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-indigo-300 transition-all">
                                    <div className="p-2 bg-white rounded-lg text-slate-300 group-hover:text-indigo-600 transition-colors shadow-sm"><attr.icon size={14}/></div>
                                    <div className="min-w-0">
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{attr.label}</p>
                                        <p className="text-xs font-black text-slate-700 uppercase truncate">{attr.val}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-900 p-8 rounded-[3.5rem] border border-white/5 text-white flex flex-col items-center justify-center text-center gap-6 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-indigo-600/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <Brain size={48} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                        <div>
                            <h5 className="text-lg font-black uppercase tracking-tight"> Advisor Neural</h5>
                            <p className="text-[9px] font-black text-slate-400 uppercase mt-2 tracking-widest">Invoque o Advisor para um diagnóstico preditivo baseado no histórico ledger.</p>
                        </div>
                        <button 
                            onClick={handleRunAnalysis}
                            disabled={loading}
                            className="w-full py-5 bg-white text-indigo-950 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                            {loading ? <Loader2 size={18} className="animate-spin"/> : <Sparkles size={18}/>}
                            Executar Análise Gemini
                        </button>
                    </div>
                </div>

                {/* COLUNA DIREITA - CONTEÚDO IA */}
                <div className="lg:col-span-8 bg-white rounded-[4rem] border border-slate-200 shadow-sm p-12 lg:p-16 flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-5"><Brain size={300}/></div>
                    
                    {!dossier && !loading && (
                        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-20 grayscale">
                             <FileText size={120} className="mb-8" />
                             <p className="text-xl font-black uppercase tracking-[0.5em]">Aguardando Comando de Síntese</p>
                        </div>
                    )}

                    {loading && (
                        <div className="flex-1 flex flex-col items-center justify-center gap-8 animate-pulse">
                            <div className="relative">
                                <div className="w-24 h-24 border-8 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
                                <Brain size={32} className="absolute inset-0 m-auto text-indigo-600" />
                            </div>
                            <div className="text-center">
                                <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Cruzando Ledgers...</h4>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-3">Análise multissetorial em curso via SRE Neural Pool</p>
                            </div>
                        </div>
                    )}

                    {dossier && !loading && (
                        <div className="animate-fade-in flex-1">
                             <div className="flex items-center gap-5 mb-12 pb-8 border-b border-slate-100">
                                 <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl"><Sparkles size={32}/></div>
                                 <div>
                                     <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Dossiê Estratégico</h4>
                                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Gerado em tempo real • Protocolo SRE V11.0</p>
                                 </div>
                             </div>
                             
                             <div className="prose prose-slate max-w-none">
                                <div 
                                    className="text-lg text-slate-700 font-medium leading-relaxed uppercase italic border-l-8 border-indigo-600 pl-10 py-4 bg-slate-50 rounded-r-3xl shadow-inner"
                                    dangerouslySetInnerHTML={{ __html: dossier }}
                                />
                             </div>

                             <div className="mt-16 grid grid-cols-2 gap-8">
                                 <div className="p-8 bg-emerald-50 rounded-[2.5rem] border border-emerald-100 flex gap-5 shadow-sm">
                                     <div className="p-3 bg-white rounded-xl text-emerald-600 shadow-sm shrink-0"><TrendingUp size={24}/></div>
                                     <div>
                                         <h5 className="text-[11px] font-black text-emerald-950 uppercase tracking-widest">Recomendação</h5>
                                         <p className="text-[10px] text-emerald-700 font-bold uppercase mt-1 leading-relaxed">Manter elegibilidade tática e fomento para cargos de conselho.</p>
                                     </div>
                                 </div>
                                 <div className="p-8 bg-indigo-50 rounded-[2.5rem] border border-indigo-100 flex gap-5 shadow-sm">
                                     <div className="p-3 bg-white rounded-xl text-indigo-600 shadow-sm shrink-0"><ShieldCheck size={24}/></div>
                                     <div>
                                         <h5 className="text-[11px] font-black text-indigo-950 uppercase tracking-widest">Compliance</h5>
                                         <p className="text-[10px] text-indigo-700 font-bold uppercase mt-1 leading-relaxed">Identidade verificada via Bio-ID em {new Date().toLocaleDateString()}.</p>
                                     </div>
                                 </div>
                             </div>
                        </div>
                    )}

                    <div className="mt-auto pt-10 border-t border-slate-100 flex justify-end gap-6 shrink-0">
                        <button onClick={onClose} className="px-10 py-5 text-slate-400 font-black text-[11px] uppercase tracking-widest hover:text-slate-600 transition-colors">Fechar Dossiê</button>
                        <button onClick={() => window.print()} className="px-14 py-5 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl hover:bg-indigo-600 transition-all flex items-center gap-4 active:scale-95">
                            <FileText size={20}/> Exportar para Ledger Físico
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDossier;
