
import React, { useState, useEffect, useMemo } from 'react';
import { 
    QrCode, ShieldCheck, Plus, X, 
    Share2, Trash2, Loader2, Calendar, Smartphone, 
    Zap, Home, ArrowRight, UserCheck, CheckCircle2,
    Lock, Sparkles, Fingerprint, Activity, CreditCard,
    History, MapPin, Download, RefreshCw
} from 'lucide-react';
import { authService, walletService, systemService } from '../services/api';
import { User, SystemInfo } from '../types';

const DigitalWallet = ({ systemInfo }: { systemInfo: SystemInfo }) => {
    const [user, setUser] = useState<User | null>(null);
    const [invites, setInvites] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [activeView, setActiveView] = useState<'CARD' | 'INVITES' | 'HISTORY'>('CARD');
    const [newInvite, setNewInvite] = useState({ guest_name: '', guest_document: '', visit_date: new Date().toISOString().split('T')[0] });

    useEffect(() => {
        const load = async () => {
            try {
                const [uRes, iRes] = await Promise.all([
                    authService.me(),
                    walletService.getInvitations()
                ]);
                setUser(uRes.data);
                setInvites(iRes.data.data || []);
            } catch (e) { console.error("Wallet Sync Fail"); }
            finally { setLoading(false); }
        };
        load();
    }, []);

    const handleCreateInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await walletService.createInvitation(newInvite);
            setIsInviteModalOpen(false);
            const iRes = await walletService.getInvitations();
            setInvites(iRes.data.data || []);
            setNewInvite({ guest_name: '', guest_document: '', visit_date: new Date().toISOString().split('T')[0] });
        } catch (e) { alert("Falha ao gerar convite."); }
        finally { setIsSaving(false); }
    };

    const handleCancelInvite = async (id: number) => {
        if (!confirm("Revogar este acesso?")) return;
        try {
            await walletService.cancelInvitation(id);
            setInvites(invites.filter(i => i.id !== id));
        } catch (e) { alert("Erro ao cancelar."); }
    };

    const handleShare = (invite: any) => {
        const text = `*CONVITE S.I.E PRO*\nOlá ${invite.guest_name}! Seu acesso à unidade ${user?.unit} foi autorizado para o dia ${new Date(invite.visit_date).toLocaleDateString()}.\n\n*Código de Acesso:* ${invite.qr_code_hash}\n\n_Este convite é pessoal e intransferível._`;
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
    };

    const primaryColor = systemInfo.primaryColor || '#4f46e5';

    // RENDERIZADOR DINÂMICO DE IDENTITY PASS (Baseado no ID Studio)
    const renderSovereignID = () => {
        const template = systemInfo.module_metadata?.id_template?.front;
        if (!template || !user) return (
            <div className="bg-slate-950 rounded-[3rem] p-10 lg:p-14 text-white shadow-2xl border border-white/10 relative overflow-hidden transition-all duration-700 hover:scale-[1.02]">
                <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-indigo-600/10 rounded-full blur-[120px] -mr-40 -mt-60 pointer-events-none"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-10">
                    <div className="space-y-8 flex-1">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-600 rounded-xl shadow-xl"><Fingerprint size={24}/></div>
                            <h2 className="text-xl font-black uppercase tracking-tightest leading-none">{systemInfo.shortName} DIGITAL PASS</h2>
                        </div>
                        <h3 className="text-4xl lg:text-5xl font-black uppercase tracking-tightest leading-none">{user.name}</h3>
                        <div className="flex items-center gap-3 mt-4 text-slate-400">
                            <Home size={20} className="text-indigo-500" /> 
                            <span className="text-lg font-black uppercase tracking-widest">Unid. {user.unit || 'HUB'}</span>
                        </div>
                    </div>
                    <div className="shrink-0 bg-white p-6 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                        <QrCode size={140} className="text-slate-900" />
                    </div>
                </div>
            </div>
        );

        // Se houver template customizado, renderiza em escala reduzida
        return (
            <div className="relative w-full flex justify-center py-10 overflow-x-auto no-scrollbar">
                <div 
                    className="relative bg-white shadow-[0_50px_100px_rgba(0,0,0,0.3)] rounded-[24px] overflow-hidden shrink-0 origin-top transform scale-[0.6] sm:scale-[0.8] md:scale-100" 
                    style={{ width: '600px', height: '380px' }}
                >
                    {template.map((el: any) => {
                        const content = String(el.type === 'text-dynamic' ? (user as any)[el.field!] ?? '---' : (el.value ?? ''));
                        let displayContent = content;
                        if (el.field === 'birth_date' && content && content !== '---') {
                            try { displayContent = new Date(content).toLocaleDateString('pt-BR'); } catch(e) { displayContent = '---'; }
                        }
                        return (
                            <div key={el.id} className="absolute flex items-center overflow-visible" style={{ left: el.x, top: el.y, width: el.width, height: el.height, transform: `rotate(${el.rotation || 0}deg)`, ...el.style, justifyContent: el.style.textAlign === 'center' ? 'center' : el.style.textAlign === 'right' ? 'flex-end' : 'flex-start', whiteSpace: 'nowrap' }}>
                                {el.type.startsWith('text') && <span className="uppercase tracking-tight leading-none">{displayContent}</span>}
                                {el.type === 'image' && <img src={el.field === 'photoUrl' ? user.avatar_url : (el.field === 'logoUrl' ? systemInfo.logoUrl : el.value)} className="w-full h-full object-contain" alt="Pass" />}
                                {el.type === 'shape' && <div className="w-full h-full" style={{ backgroundColor: el.style.backgroundColor }} />}
                                {el.type === 'qrcode' && <div className="w-full h-full bg-slate-100 flex items-center justify-center border border-slate-200"><QrCode size={Math.min(el.width, el.height) * 0.7} className="text-slate-800" /></div>}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    if (loading) return (
        <div className="flex-1 flex flex-col items-center justify-center p-20 h-full">
            <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
            <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest animate-pulse">Sincronizando Wallet Ledger...</p>
        </div>
    );

    return (
        <div className="flex-1 flex flex-col space-y-8 animate-fade-in max-w-5xl mx-auto pb-20 px-4 h-full overflow-y-auto no-scrollbar">
            
            {/* TABS DE NAVEGAÇÃO INTERNA */}
            <div className="flex bg-slate-200/50 backdrop-blur-md p-1.5 rounded-3xl border border-slate-200 shrink-0 sticky top-0 z-50 mt-4">
                {[
                    { id: 'CARD', label: 'Passaporte', icon: Fingerprint },
                    { id: 'INVITES', label: 'Acessos', icon: UserCheck },
                    { id: 'HISTORY', label: 'Logs', icon: History }
                ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveView(tab.id as any)} className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${activeView === tab.id ? 'bg-white text-indigo-600 shadow-xl' : 'text-slate-500 hover:text-slate-700'}`}>
                        <tab.icon size={16}/> {tab.label}
                    </button>
                ))}
            </div>

            {activeView === 'CARD' && (
                <div className="space-y-12 animate-fade-in">
                    {/* ÁREA DE RENDERIZAÇÃO DO ID */}
                    <div className="flex flex-col items-center">
                        {renderSovereignID()}
                        <div className="mt-8 flex gap-4">
                             <button className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-xl hover:bg-indigo-600 transition-all active:scale-95">
                                 <Download size={16}/> Baixar Digital Pass
                             </button>
                             <button onClick={() => window.print()} className="p-4 bg-white border border-slate-200 text-slate-400 rounded-2xl hover:text-indigo-600 transition-all shadow-sm">
                                 <Share2 size={20}/>
                             </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-10">
                        <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-indigo-300 transition-all">
                            <div className="flex justify-between items-center mb-8">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Segurança Ativa</p>
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shadow-inner group-hover:scale-110 transition-transform"><ShieldCheck size={20}/></div>
                            </div>
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Censo Digital Concluído</h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-4 tracking-widest flex items-center gap-2">
                                <CheckCircle2 size={14} className="text-emerald-500"/> Sincronizado em {new Date().toLocaleDateString()}
                            </p>
                        </div>
                        <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-indigo-300 transition-all">
                            <div className="flex justify-between items-center mb-8">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ledger Verified</p>
                                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shadow-inner group-hover:scale-110 transition-transform"><Zap size={20}/></div>
                            </div>
                            <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Status de Elegibilidade</h3>
                            <p className="text-[10px] text-emerald-600 font-bold uppercase mt-4 tracking-widest flex items-center gap-2">
                                <Activity size={14} className="animate-pulse"/> Direito a Voto Habilitado
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {activeView === 'INVITES' && (
                <div className="bg-white rounded-[4rem] border border-slate-200 p-10 lg:p-14 shadow-sm animate-fade-in pb-20">
                     <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
                        <div>
                            <h4 className="text-3xl font-black text-slate-900 uppercase tracking-tightest leading-none">Gestão de Acessos</h4>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-3">Smart Guest Authorization Gateway</p>
                        </div>
                        <button onClick={() => setIsInviteModalOpen(true)} className="px-10 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-widest shadow-2xl hover:bg-indigo-600 active:scale-95 transition-all flex items-center gap-4">
                            <Plus size={20}/> Novo Convite
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {invites.map(invite => (
                            <div key={invite.id} className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 flex flex-col md:flex-row justify-between items-center group hover:bg-white hover:border-indigo-300 transition-all hover:shadow-xl">
                                <div className="flex items-center gap-6 flex-1 w-full">
                                    <div className="w-16 h-16 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-300 group-hover:text-indigo-600 transition-all">
                                        <UserCheck size={28}/>
                                    </div>
                                    <div>
                                        <h5 className="text-base font-black text-slate-800 uppercase tracking-tight">{invite.guest_name}</h5>
                                        <div className="flex flex-wrap gap-4 mt-1.5">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Calendar size={14} className="text-indigo-400"/> {new Date(invite.visit_date).toLocaleDateString()}</span>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Smartphone size={14} className="text-indigo-400"/> {invite.guest_document}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 mt-6 md:mt-0 w-full md:w-auto justify-end">
                                    <button onClick={() => handleShare(invite)} className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"><Share2 size={20}/></button>
                                    <button onClick={() => handleCancelInvite(invite.id)} className="p-4 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"><Trash2 size={20}/></button>
                                </div>
                            </div>
                        ))}
                        {invites.length === 0 && (
                            <div className="py-32 text-center opacity-30 flex flex-col items-center gap-6">
                                <Activity size={64} className="text-slate-300"/>
                                <p className="text-xs font-black uppercase tracking-[0.4em] text-slate-400">Nenhum acesso agendado no Ledger.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeView === 'HISTORY' && (
                <div className="bg-white rounded-[4rem] border border-slate-200 p-10 lg:p-14 shadow-sm animate-fade-in pb-20">
                     <div className="mb-12">
                        <h4 className="text-3xl font-black text-slate-900 uppercase tracking-tightest leading-none">Rastreio de Identidade</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-3">Log Forense de Handshakes Bio-ID</p>
                    </div>
                    <div className="p-10 border-2 border-dashed border-slate-100 rounded-[3rem] text-center space-y-4 opacity-40">
                         <History size={48} className="mx-auto text-slate-300"/>
                         <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Histórico de acesso será habilitado na V22.0</p>
                    </div>
                </div>
            )}

            {isInviteModalOpen && (
                <div className="sie-editor-overlay">
                    <div className="sie-modal-container !h-auto !max-w-2xl self-center border border-white/10 shadow-2xl">
                        <div className="h-24 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-white/5 rounded-t-[var(--sie-radius)]">
                            <div className="flex items-center gap-5">
                                <div className="p-3.5 bg-indigo-600 rounded-xl shadow-xl"><Smartphone size={22}/></div>
                                <div><h3 className="font-black text-xl uppercase tracking-tighter">Smart Guest Protocol</h3><p className="text-indigo-400 text-[9px] font-black uppercase mt-1.5 opacity-80">Autorização Prévia SRE</p></div>
                            </div>
                            <button onClick={() => setIsInviteModalOpen(false)} className="p-4 hover:bg-rose-500 hover:text-white text-slate-400 rounded-xl transition-all border border-white/5"><X size={28}/></button>
                        </div>
                        <div className="p-10 lg:p-14 bg-white rounded-b-[var(--sie-radius)]">
                            <form onSubmit={handleCreateInvite} className="space-y-10">
                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo do Visitante</label>
                                    <input required className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-8 text-xl font-black focus:border-indigo-500 transition-all outline-none uppercase shadow-inner" placeholder="EX: JOÃO DA SILVA" value={newInvite.guest_name} onChange={e => setNewInvite({...newInvite, guest_name: e.target.value.toUpperCase()})} />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">RG / CPF</label>
                                        <input required className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-8 text-xl font-black outline-none focus:border-indigo-500 shadow-inner" value={newInvite.guest_document} onChange={e => setNewInvite({...newInvite, guest_document: e.target.value})} />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Data Prevista</label>
                                        <input type="date" required className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-8 text-lg font-black outline-none focus:border-indigo-500 shadow-inner" value={newInvite.visit_date} onChange={e => setNewInvite({...newInvite, visit_date: e.target.value})} />
                                    </div>
                                </div>
                                <button type="submit" disabled={isSaving} className="w-full py-6 bg-slate-950 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50">
                                    {isSaving ? <Loader2 className="animate-spin" size={20}/> : <Zap size={20} fill="white"/>}
                                    Protocolar Autorização
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DigitalWallet;
