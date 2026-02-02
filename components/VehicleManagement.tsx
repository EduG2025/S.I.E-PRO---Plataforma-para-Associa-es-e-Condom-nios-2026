import React, { useState, useEffect } from 'react';
import { 
    Car, Plus, Search, Loader2, Trash2, Edit2, X, Save, 
    ShieldCheck, AlertCircle, Info, Smartphone, UserCheck 
} from 'lucide-react';
import { api, userService } from '../services/api';
import { SystemInfo, User } from '../types';

interface Vehicle {
    id: number;
    plate: string;
    brand: string;
    model: string;
    color: string;
    unit: string;
    status: string;
}

const VehicleManagement = ({ systemInfo }: { systemInfo: SystemInfo }) => {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingVehicle, setEditingVehicle] = useState<any>({ plate: '', brand: '', model: '', unit: '', status: 'AUTHORIZED' });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [vRes, uRes] = await Promise.all([
                api.get('/community/vehicles'),
                userService.getAll(1, 1000)
            ]);
            setVehicles(vRes.data.data || []);
            setUsers(uRes.data.data || []);
        } catch (e) { console.error("Falha ao carregar veículos."); }
        finally { setIsLoading(false); }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (editingVehicle.id) await api.put(`/community/vehicles/${editingVehicle.id}`, editingVehicle);
            else await api.post('/community/vehicles', editingVehicle);
            setIsModalOpen(false);
            loadData();
        } catch (e) { alert("Erro ao salvar veículo."); }
        finally { setIsSaving(false); }
    };

    const primaryColor = systemInfo.primaryColor || '#4f46e5';

    return (
        <div className="flex-1 flex flex-col space-y-6 animate-fade-in h-full">
            <header className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl shrink-0 flex flex-col md:flex-row justify-between items-center gap-6 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="relative z-10 flex items-center gap-5">
                    <div className="p-4 bg-indigo-600 rounded-2xl shadow-xl" style={{ backgroundColor: primaryColor }}><Car size={28}/></div>
                    <div>
                        <h2 className="text-3xl font-black tracking-tightest uppercase">Frota do Cluster</h2>
                        <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mt-2">SRE Vehicle Access Control</p>
                    </div>
                </div>
                <button onClick={() => { setEditingVehicle({ plate: '', brand: '', model: '', unit: '', status: 'AUTHORIZED' }); setIsModalOpen(true); }} className="px-10 py-4 bg-white text-slate-900 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-2xl hover:bg-indigo-50 transition-all flex items-center gap-3 relative z-10">
                    <Plus size={20}/> Cadastrar Veículo
                </button>
            </header>

            <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm flex-1 overflow-hidden flex flex-col min-h-0">
                <div className="p-8 border-b bg-slate-50/30 flex justify-between items-center shrink-0">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                        <input className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-[11px] font-black uppercase focus:border-indigo-500 shadow-inner" placeholder="Filtrar por Placa ou Unidade..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{vehicles.length} Veículos Mapeados</span>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                    {isLoading ? <div className="p-20 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={40}/></div> : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {vehicles.filter(v => v.plate.includes(searchTerm.toUpperCase())).map(v => (
                                <div key={v.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="p-3 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all"><Car size={24}/></div>
                                        <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase border ${v.status === 'AUTHORIZED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>{v.status}</span>
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-800 tracking-tightest mb-1">{v.plate}</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-6">{v.brand} {v.model} • UNID. {v.unit}</p>
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                        <button onClick={() => { setEditingVehicle(v); setIsModalOpen(true); }} className="p-2 text-slate-300 hover:text-indigo-600"><Edit2 size={16}/></button>
                                        <button onClick={async () => { if(confirm("Remover veículo?")) { await api.delete(`/community/vehicles/${v.id}`); loadData(); } }} className="p-2 text-slate-300 hover:text-rose-600"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {isModalOpen && (
                <div className="sie-editor-overlay">
                    <div className="sie-modal-container !h-auto !max-w-2xl self-center">
                        <form onSubmit={handleSave}>
                            <div className="h-20 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 rounded-t-[3rem]">
                                <h3 className="font-black text-xl uppercase tracking-tighter">Dossiê de Veículo</h3>
                                <button type="button" onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-rose-500 rounded-xl transition-all"><X size={24}/></button>
                            </div>
                            <div className="p-10 space-y-6 bg-white">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Placa (Identificador)</label>
                                        <input required className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-lg font-black uppercase outline-none focus:border-indigo-500" value={editingVehicle.plate} onChange={e => setEditingVehicle({...editingVehicle, plate: e.target.value.toUpperCase()})} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unidade Vínculo</label>
                                        <input required className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-sm font-black uppercase outline-none focus:border-indigo-500" value={editingVehicle.unit} onChange={e => setEditingVehicle({...editingVehicle, unit: e.target.value.toUpperCase()})} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Marca / Modelo</label>
                                        <input className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-sm font-bold uppercase outline-none focus:border-indigo-500" value={editingVehicle.brand} onChange={e => setEditingVehicle({...editingVehicle, brand: e.target.value.toUpperCase()})} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estado de Acesso</label>
                                        <select className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-[10px] font-black uppercase outline-none" value={editingVehicle.status} onChange={e => setEditingVehicle({...editingVehicle, status: e.target.value})}>
                                            <option value="AUTHORIZED">AUTORIZADO (BRANCO)</option>
                                            <option value="BLOCKED">BLOQUEADO (RESTRIÇÃO)</option>
                                            <option value="VISITOR">VISITANTE (TEMPORÁRIO)</option>
                                        </select>
                                    </div>
                                </div>
                                <button type="submit" disabled={isSaving} className="w-full py-6 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-indigo-600 transition-all">
                                    {isSaving ? <Loader2 className="animate-spin mx-auto" /> : 'Sincronizar Veículo'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VehicleManagement;