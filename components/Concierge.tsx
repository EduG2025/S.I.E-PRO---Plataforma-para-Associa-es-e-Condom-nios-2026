
import React, { useState, useEffect } from 'react';
import { 
    UserCheck, Package, Clock, Shield, Search, Plus, 
    X, Save, Loader2, Trash2, Phone, Truck, UserPlus, 
    CheckCircle, AlertTriangle 
} from 'lucide-react';
import api from '../services/api';
import { SystemInfo } from '../types';

interface ConciergeProps {
    systemInfo: SystemInfo;
}

const Concierge = ({ systemInfo }: ConciergeProps) => {
    const [activeTab, setActiveTab] = useState<'VISITORS' | 'DELIVERIES'>('VISITORS');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    useEffect(() => { loadData(); }, [activeTab]);

    const loadData = async () => {
        setLoading(true);
        try {
            const route = activeTab === 'VISITORS' ? 'visitors' : 'deliveries';
            const res = await api.get(`/${route}`);
            setData(res.data.data || []);
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

    const handleUpdateStatus = async (item: any, newStatus: string) => {
        const route = activeTab === 'VISITORS' ? 'visitors' : 'deliveries';
        await api.put(`/${route}/${item.id}`, { ...item, status: newStatus });
        loadData();
    };

    const primaryColor = systemInfo.primaryColor || '#4f46e5';

    return (
        <div className="space-y-8 animate-fade-in pb-12 h-full relative">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-900 p-8 rounded-[3rem] text-white shadow-xl overflow-hidden relative shrink-0">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="relative z-10">
                    <h2 className="text-3xl font-black tracking-tighter">Portaria Central</h2>
                    <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mt-1">SRE Concierge Suite</p>
                </div>
                <div className="flex bg-white/5 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 relative z-10">
                    <button onClick={() => setActiveTab('VISITORS')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === 'VISITORS' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`} style={activeTab === 'VISITORS' ? { backgroundColor: primaryColor } : {}}>
                        <UserPlus size={16}/> Visitantes
                    </button>
                    <button onClick={() => setActiveTab('DELIVERIES')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === 'DELIVERIES' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`} style={activeTab === 'DELIVERIES' ? { backgroundColor: primaryColor } : {}}>
                        <Package size={16}/> Encomendas
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-[3rem] shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col min-h-0">
                <div className="p-8 border-b flex justify-between items-center bg-slate-50/30 shrink-0">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                        <input className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-[11px] font-black uppercase focus:border-indigo-500 transition-all shadow-inner" placeholder={`Filtrar Fluxo de ${activeTab === 'VISITORS' ? 'Membros' : 'Cargas'}...`}/>
                    </div>
                    <button onClick={handleOpenCreate} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-indigo-600 transition-all flex items-center gap-3" style={{ backgroundColor: primaryColor }}>
                        <Plus size={18}/> Registrar Entrada
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {loading ? <div className="p-20 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={40} style={{ color: primaryColor }}/></div> : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b sticky top-0 z-10">
                                    <tr className="bg-white/95"><th className="p-8 border-b">{activeTab === 'VISITORS' ? 'Identidade / Destino' : 'Courier / Pacote'}</th><th className="p-8 border-b">Horário</th><th className="p-8 text-center border-b">Estado</th><th className="p-8 text-right border-b">Ações</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {data.map(item => (
                                        <tr key={item.id} className="hover:bg-slate-50 transition-all group">
                                            <td className="p-8"><div className="flex items-center gap-4"><div className="p-3 bg-slate-100 rounded-xl text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors" style={ { color: primaryColor } }>{activeTab === 'VISITORS' ? <UserCheck size={20}/> : <Truck size={20}/>}</div><div><p className="text-sm font-black text-slate-800">{activeTab === 'VISITORS' ? item.name : item.company}</p><p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Unid. {item.unit} • {activeTab === 'VISITORS' ? item.document : item.recipient}</p></div></div></td>
                                            <td className="p-8"><div className="flex items-center gap-2 text-xs font-bold text-slate-500"><Clock size={14}/> {new Date(item.arrival_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</div></td>
                                            <td className="p-8 text-center"><span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border shadow-sm ${item.status === 'COMPLETED' || item.status === 'PICKED_UP' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>{item.status === 'IN_CLUSTER' ? 'No Local' : item.status === 'COMPLETED' ? 'Finalizado' : item.status === 'PENDING' ? 'Aguardando Retirada' : 'Entregue'}</span></td>
                                            <td className="p-8 text-right"><div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">{activeTab === 'VISITORS' && item.status === 'IN_CLUSTER' && (<button onClick={() => handleUpdateStatus(item, 'COMPLETED')} className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-md">Registrar Saída</button>)}{activeTab === 'DELIVERIES' && item.status === 'PENDING' && (<button onClick={() => handleUpdateStatus(item, 'PICKED_UP')} className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-md">Entregar ao Morador</button>)}<button onClick={() => api.delete(`/${activeTab.toLowerCase()}/${item.id}`).then(loadData)} className="p-2 text-slate-300 hover:text-rose-500"><Trash2 size={16}/></button></div></td>
                                        </tr>
                                    ))}
                                    {data.length === 0 && (<tr><td colSpan={4} className="p-32 text-center text-slate-300 font-black uppercase text-[10px] tracking-widest italic">Nenhum fluxo registrado hoje.</td></tr>)}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {isModalOpen && editingItem && (
                <div className="sie-editor-overlay">
                    <div className="sie-modal-container">
                        <div className="h-20 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 shadow-2xl relative z-20 border-b border-white/5">
                            <div className="flex items-center gap-5">
                                <div className="p-3.5 bg-indigo-600 rounded-xl shadow-xl" style={{ backgroundColor: primaryColor }}><Shield size={22}/></div>
                                <div><h3 className="font-black text-xl uppercase tracking-tighter leading-none">Protocolo de Acesso</h3><p className="text-indigo-400 text-[9px] font-black uppercase mt-1.5 tracking-widest opacity-80">SRE Security Gateway V5.0</p></div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button onClick={handleSave} disabled={isSaving} className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-[11px] uppercase tracking-widest shadow-xl transition-all flex items-center gap-3" style={{ backgroundColor: primaryColor }}>
                                    {isSaving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Registrar Entrada
                                </button>
                                <button onClick={() => setIsModalOpen(false)} className="p-3.5 hover:bg-rose-500 hover:text-white text-slate-400 rounded-xl transition-all border border-white/5"><X size={24} /></button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-[#fdfdfe] relative">
                            <form onSubmit={handleSave} className="max-w-3xl mx-auto space-y-10">
                                <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-200 shadow-inner space-y-8">
                                    {activeTab === 'VISITORS' ? (
                                        <>
                                            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Visitante / Prestador</label><input required className="w-full font-black h-14 bg-white border border-slate-200 rounded-2xl px-6 text-lg focus:border-indigo-500 shadow-sm" value={editingItem.name} onChange={e => setEditingItem({...editingItem, name: e.target.value})} /></div>
                                            <div className="grid grid-cols-2 gap-8">
                                                <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">RG / CPF</label><input className="w-full font-black h-14 bg-white border border-slate-200 rounded-2xl px-6 text-lg" value={editingItem.document} onChange={e => setEditingItem({...editingItem, document: e.target.value})} /></div>
                                                <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unid. Destino</label><input required className="w-full font-black h-14 bg-white border border-slate-200 rounded-2xl px-6 text-lg" value={editingItem.unit} onChange={e => setEditingItem({...editingItem, unit: e.target.value})} /></div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Empresa / Transportadora</label><input required className="w-full font-black h-14 bg-white border border-slate-200 rounded-2xl px-6 text-lg" value={editingItem.company} onChange={e => setEditingItem({...editingItem, company: e.target.value})} /></div>
                                            <div className="grid grid-cols-2 gap-8">
                                                <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Destinatário</label><input required className="w-full font-black h-14 bg-white border border-slate-200 rounded-2xl px-6 text-lg" value={editingItem.recipient} onChange={e => setEditingItem({...editingItem, recipient: e.target.value})} /></div>
                                                <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unid.</label><input required className="w-full font-black h-14 bg-white border border-slate-200 rounded-2xl px-6 text-lg" value={editingItem.unit} onChange={e => setEditingItem({...editingItem, unit: e.target.value})} /></div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </form>
                        </div>
                        <div className="p-8 border-t bg-slate-50 flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-3"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status de Terminal: SRE ONLINE</span></div>
                            <div className="flex gap-4">
                                <button onClick={() => setIsModalOpen(false)} className="px-8 py-3.5 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600">Fechar</button>
                                <button onClick={handleSave} disabled={isSaving} className="px-12 py-3.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl">Confirmar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Concierge;
