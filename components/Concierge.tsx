
import React, { useState, useEffect } from 'react';
import { 
    UserCheck, Package, Clock, Shield, Search, Plus, 
    X, Save, Loader2, Trash2, Phone, Truck, UserPlus, 
    CheckCircle, AlertTriangle, LogIn, LogOut, Box, Activity,
    Smartphone, Zap, QrCode
} from 'lucide-react';
import api from '../services/api';
import { SystemInfo } from '../types';

interface ConciergeProps {
    systemInfo: SystemInfo;
}

const Concierge = ({ systemInfo }: ConciergeProps) => {
    const [activeTab, setActiveTab] = useState<'VISITORS' | 'INVITATIONS' | 'DELIVERIES'>('VISITORS');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Stats
    const [stats, setStats] = useState({ visitorsActive: 0, invitationsPending: 0, deliveriesPending: 0 });

    useEffect(() => { loadData(); }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            let route = '';
            switch(activeTab) {
                case 'VISITORS': route = 'visitors'; break;
                case 'INVITATIONS': route = 'resident/invitations'; break; // Admin also views all
                case 'DELIVERIES': route = 'deliveries'; break;
            }
            
            const res = await api.get(`/${route}`);
            const list = res.data.data || [];
            setData(list);

            // Calc Stats
            if (activeTab === 'VISITORS') {
                setStats(prev => ({ ...prev, visitorsActive: list.filter((i: any) => i.status === 'IN_CLUSTER').length }));
            } else if (activeTab === 'INVITATIONS') {
                setStats(prev => ({ ...prev, invitationsPending: list.filter((i: any) => i.status === 'AUTHORIZED').length }));
            } else {
                setStats(prev => ({ ...prev, deliveriesPending: list.filter((i: any) => i.status === 'PENDING').length }));
            }
        } catch (e) { setData([]); }
        finally { setLoading(false); }
    };

    const handleOpenCreate = () => {
        if (activeTab === 'VISITORS') {
            setEditingItem({ name: '', document: '', unit: '', phone: '', status: 'IN_CLUSTER', arrival_time: new Date().toISOString() });
        } else {
            setEditingItem({ courier: '', company: '', unit: '', recipient: '', status: 'PENDING', arrival_time: new Date().toISOString() });
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: any) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const route = activeTab === 'VISITORS' ? 'visitors' : 'deliveries';
            if (editingItem.id) await api.put(`/${route}/${editingItem.id}`, editingItem);
            else await api.post(`/${route}`, editingItem);
            setIsModalOpen(false);
            loadData();
        } finally { setIsSaving(false); }
    };

    const handleCheckInInvite = async (invite: any) => {
        if (!confirm(`Confirmar entrada de ${invite.guest_name}?`)) return;
        try {
            // Converte convite em registro de visitante ativo
            await api.post('/visitors', {
                name: invite.guest_name,
                document: invite.guest_document,
                unit: invite.unit || 'HUB',
                status: 'IN_CLUSTER',
                arrival_time: new Date().toISOString(),
                invitation_id: invite.id
            });
            // Marca convite como concluído
            await api.delete(`/resident/invitations/${invite.id}`); 
            setActiveTab('VISITORS');
            loadData();
        } catch (e) { alert("Falha no check-in."); }
    };

    const handleUpdateStatus = async (item: any, newStatus: string) => {
        const route = activeTab === 'VISITORS' ? 'visitors' : 'deliveries';
        await api.put(`/${route}/${item.id}`, { ...item, status: newStatus });
        loadData();
    };

    const primaryColor = systemInfo.primaryColor || '#4f46e5';

    const filteredData = data.filter(item => {
        const term = searchTerm.toLowerCase();
        if (activeTab === 'VISITORS') {
            return (item.name?.toLowerCase().includes(term) || item.unit?.toLowerCase().includes(term) || item.document?.includes(term));
        } else if (activeTab === 'INVITATIONS') {
            return (item.guest_name?.toLowerCase().includes(term) || item.guest_document?.includes(term));
        } else {
            return (item.recipient?.toLowerCase().includes(term) || item.unit?.toLowerCase().includes(term) || item.company?.toLowerCase().includes(term));
        }
    });

    return (
        <div className="space-y-6 animate-fade-in pb-12 h-full flex flex-col relative">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl overflow-hidden relative shrink-0 border border-white/5">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="relative z-10 flex items-center gap-6">
                    <div className="p-4 bg-indigo-600 rounded-2xl shadow-xl" style={{ backgroundColor: primaryColor }}><Shield size={28}/></div>
                    <div>
                        <h2 className="text-2xl font-black tracking-tightest uppercase leading-none">Portaria Central</h2>
                        <p className="text-indigo-400 text-[9px] font-black uppercase tracking-[0.3em] mt-2 opacity-80">SRE Security Gateway V5.0</p>
                    </div>
                </div>
                
                {/* HUD RÁPIDO */}
                <div className="flex gap-4 relative z-10">
                     <div className="px-5 py-3 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center min-w-[100px]">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Visitantes</span>
                        <span className="text-xl font-black text-white">{stats.visitorsActive}</span>
                     </div>
                     <div className="px-5 py-3 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center min-w-[100px]">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Convites</span>
                        <span className="text-xl font-black text-white">{stats.invitationsPending}</span>
                     </div>
                </div>
            </div>

            <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shrink-0">
                <button onClick={() => setActiveTab('VISITORS')} className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${activeTab === 'VISITORS' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`} style={activeTab === 'VISITORS' ? { color: primaryColor } : {}}>
                    <UserPlus size={16}/> Visitantes Ativos
                </button>
                <button onClick={() => setActiveTab('INVITATIONS')} className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${activeTab === 'INVITATIONS' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`} style={activeTab === 'INVITATIONS' ? { color: primaryColor } : {}}>
                    <QrCode size={16}/> Pré-Autorizados
                </button>
                <button onClick={() => setActiveTab('DELIVERIES')} className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${activeTab === 'DELIVERIES' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`} style={activeTab === 'DELIVERIES' ? { color: primaryColor } : {}}>
                    <Package size={16}/> Encomendas
                </button>
            </div>

            <div className="bg-white rounded-[3rem] shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col min-h-0">
                <div className="p-6 border-b border-slate-100 bg-white sticky top-0 z-20 flex justify-between items-center gap-4">
                    <div className="relative flex-1 max-w-md group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={16}/>
                        <input className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase focus:bg-white focus:border-indigo-500 transition-all outline-none" placeholder={`BUSCAR NO TERMINAL...`} value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
                    </div>
                    {activeTab !== 'INVITATIONS' && (
                        <button onClick={handleOpenCreate} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-indigo-600 transition-all flex items-center gap-2 active:scale-95" style={{ backgroundColor: primaryColor }}>
                            <Plus size={14}/> Registrar {activeTab === 'VISITORS' ? 'Entrada' : 'Recebimento'}
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    {loading ? <div className="p-20 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={40} style={{ color: primaryColor }}/></div> : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {filteredData.map(item => (
                                <div key={item.id} className="bg-white border border-slate-200 rounded-[2rem] p-6 hover:shadow-xl transition-all group relative flex flex-col justify-between min-h-[220px]">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`p-3 rounded-2xl ${activeTab === 'VISITORS' ? 'bg-indigo-50 text-indigo-600' : activeTab === 'INVITATIONS' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                            {activeTab === 'VISITORS' ? <UserCheck size={20}/> : activeTab === 'INVITATIONS' ? <Zap size={20}/> : <Truck size={20}/>}
                                        </div>
                                        <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase border ${item.status === 'IN_CLUSTER' || item.status === 'AUTHORIZED' || item.status === 'PENDING' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 animate-pulse' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                            {item.status === 'IN_CLUSTER' ? 'NO LOCAL' : item.status === 'AUTHORIZED' ? 'PRÉ-APROVADO' : item.status === 'PENDING' ? 'AGUARDANDO' : 'FINALIZADO'}
                                        </span>
                                    </div>
                                    
                                    <div className="space-y-1 mb-6">
                                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight line-clamp-1">
                                            {activeTab === 'VISITORS' ? item.name : activeTab === 'INVITATIONS' ? item.guest_name : item.company}
                                        </h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                            <Box size={10} /> Unid. {item.unit || 'HUB'}
                                        </p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                                            <Clock size={10} /> 
                                            {activeTab === 'INVITATIONS' 
                                                ? `VÁLIDO PARA: ${new Date(item.visit_date).toLocaleDateString()}` 
                                                : `${new Date(item.arrival_time).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})} • ${new Date(item.arrival_time).toLocaleDateString('pt-BR')}`
                                            }
                                        </p>
                                        {(activeTab === 'VISITORS' || activeTab === 'INVITATIONS') && <p className="text-[9px] font-mono text-slate-400 bg-slate-50 px-2 py-0.5 rounded w-fit mt-1">DOC: {item.document || item.guest_document}</p>}
                                        {activeTab === 'DELIVERIES' && <p className="text-[9px] font-black text-slate-600 mt-1">PARA: {item.recipient}</p>}
                                    </div>

                                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                                        <div className="flex gap-1">
                                            <button onClick={() => api.delete(`/${activeTab === 'INVITATIONS' ? 'resident/invitations' : activeTab.toLowerCase()}/${item.id}`).then(loadData)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"><Trash2 size={14}/></button>
                                        </div>
                                        {activeTab === 'INVITATIONS' ? (
                                            <button onClick={() => handleCheckInInvite(item)} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg flex items-center gap-2">
                                                <LogIn size={12}/> Confirmar Entrada
                                            </button>
                                        ) : ((item.status === 'IN_CLUSTER' || item.status === 'PENDING') ? (
                                            <button onClick={() => handleUpdateStatus(item, activeTab === 'VISITORS' ? 'COMPLETED' : 'PICKED_UP')} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg flex items-center gap-2">
                                                {activeTab === 'VISITORS' ? <LogOut size={12}/> : <CheckCircle size={12}/>} {activeTab === 'VISITORS' ? 'Saída' : 'Baixa'}
                                            </button>
                                        ) : (
                                            <span className="text-[9px] font-black text-slate-300 uppercase italic">Concluído</span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {filteredData.length === 0 && (
                                <div className="col-span-full py-32 text-center opacity-30">
                                    <Activity size={48} className="mx-auto mb-4 text-slate-400"/>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Nenhuma atividade registrada.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {isModalOpen && editingItem && (
                <div className="sie-editor-overlay">
                    <div className="sie-modal-container !h-auto !max-w-2xl self-center">
                        <div className="h-20 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-white/5 rounded-t-[1.5rem]">
                            <div className="flex items-center gap-5">
                                <div className="p-3.5 bg-indigo-600 rounded-xl shadow-xl" style={{ backgroundColor: primaryColor }}><Shield size={22}/></div>
                                <div><h3 className="font-black text-xl uppercase tracking-tighter leading-none">Protocolo de Acesso</h3><p className="text-indigo-400 text-[9px] font-black uppercase mt-1.5 tracking-widest opacity-80">SRE Security Gateway</p></div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="p-3.5 hover:bg-rose-500 hover:text-white text-slate-400 rounded-xl transition-all border border-white/5"><X size={24} /></button>
                            </div>
                        </div>

                        <div className="p-10 bg-[#fdfdfe] rounded-b-[1.5rem]">
                            <form onSubmit={handleSave} className="space-y-8">
                                {activeTab === 'VISITORS' ? (
                                    <>
                                        <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Visitante / Prestador</label><input required className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-lg focus:bg-white focus:border-indigo-500 transition-all outline-none uppercase" value={editingItem.name} onChange={e => setEditingItem({...editingItem, name: e.target.value.toUpperCase()})} /></div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">RG / CPF</label><input className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-lg outline-none focus:border-indigo-500" value={editingItem.document} onChange={e => setEditingItem({...editingItem, document: e.target.value})} /></div>
                                            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unid. Destino</label><input required className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-lg outline-none focus:border-indigo-500 uppercase" value={editingItem.unit} onChange={e => setEditingItem({...editingItem, unit: e.target.value.toUpperCase()})} /></div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Empresa / Transportadora</label><input required className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-lg focus:bg-white focus:border-indigo-500 transition-all uppercase" value={editingItem.company} onChange={e => setEditingItem({...editingItem, company: e.target.value.toUpperCase()})} /></div>
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Destinatário</label><input required className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-lg outline-none focus:border-indigo-500 uppercase" value={editingItem.recipient} onChange={e => setEditingItem({...editingItem, recipient: e.target.value.toUpperCase()})} /></div>
                                            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unid.</label><input required className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-lg outline-none focus:border-indigo-500 uppercase" value={editingItem.unit} onChange={e => setEditingItem({...editingItem, unit: e.target.value.toUpperCase()})} /></div>
                                        </div>
                                    </>
                                )}
                                <div className="pt-6 border-t border-slate-100 flex gap-4">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600">Cancelar</button>
                                    <button type="submit" disabled={isSaving} className="flex-[2] py-4 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 active:scale-95" style={{ backgroundColor: primaryColor }}>
                                        {isSaving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Registrar Entrada
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Concierge;
