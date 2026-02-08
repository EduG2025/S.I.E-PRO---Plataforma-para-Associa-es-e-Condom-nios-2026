import React, { useState, useEffect } from 'react';
import { 
    Gavel, Play, Download, Trash2, Edit2, Plus, 
    X, Save, Loader2
} from 'lucide-react';
import { assemblyService } from '../services/api';
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

    const [activeSession, setActiveSession] = useState<any>(null);

    const isManager = currentUser?.role === 'ADMIN' || currentUser?.role === 'COUNCIL' || currentUser?.role === 'PRESIDENT';

    useEffect(() => { loadAssemblies(); }, []);

    const loadAssemblies = async () => {
        setLoading(true);
        try {
            const res = await assemblyService.getAll();
            const list = res.data?.data || (Array.isArray(res.data) ? res.data : []);
            setAssemblies(list);
        } catch (err) {
            setAssemblies([]);
        } finally { setLoading(false); }
    };

    const handleOpenCreate = () => {
        setEditingAssembly({ title: '', description: '', date: new Date().toISOString().slice(0, 16), status: 'SCHEDULED' });
        setIsModalOpen(true);
    };

    const handleSave = async (e: any) => {
        if (e) e.preventDefault();
        setIsSaving(true);
        try {
            if (editingAssembly.id) await assemblyService.update(editingAssembly.id, editingAssembly);
            else await assemblyService.create(editingAssembly);
            setIsModalOpen(false);
            loadAssemblies();
        } catch (error) {
            console.error("FALHA AO COMMITAR ASSEMBLEIA");
        } finally { setIsSaving(false); }
    };

    const handleDelete = async (id: number | string) => {
        if (!confirm("Excluir esta assembleia permanentemente?")) return;
        await assemblyService.delete(id);
        loadAssemblies();
    };

    const handleStartLive = (assembly: any) => {
        setActiveSession(assembly);
        setActiveTab('LIVE');
    };

    const primaryColor = systemInfo?.primaryColor || '#4f46e5';

    if (loading) return <div className="h-full flex items-center justify-center p-20"><Loader2 className="animate-spin text-indigo-600" /></div>;

    return (
        <div className="flex-1 flex flex-col h-full animate-fade-in bg-slate-50 gap-6 p-[var(--sie-viewport-padding)]">
            <header className="bg-slate-900 rounded-[var(--sie-radius)] p-8 text-white shadow-xl shrink-0 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="flex items-center gap-5 relative z-10">
                    <div className="p-4 bg-indigo-600 rounded-2xl shadow-xl" style={{ backgroundColor: primaryColor }}><Gavel size={28}/></div>
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tight">Assembleia Digital</h2>
                        <p className="text-indigo-400 text-[10px] font-black uppercase mt-2 tracking-widest">SRE Legislative Control Suite</p>
                    </div>
                </div>
                <div className="flex bg-white/5 p-1 rounded-2xl relative z-10 border border-white/10">
                    <button onClick={() => setActiveTab('HISTORY')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'HISTORY' ? 'bg-white text-indigo-900 shadow-lg' : 'text-slate-400 hover:text-white'}`}>Histórico</button>
                    <button onClick={() => setActiveTab('LIVE')} disabled={!activeSession} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'LIVE' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-500 hover:text-white disabled:opacity-50'}`}>Ao Vivo</button>
                </div>
            </header>

            <div className="flex-1 bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col relative">
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {activeTab === 'HISTORY' && (
                        <div className="space-y-6 pb-10">
                            {isManager && (
                                <div className="flex justify-end">
                                    <button onClick={handleOpenCreate} className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-xl hover:bg-indigo-600 transition-all"><Plus size={20}/> Agendar Sessão</button>
                                </div>
                            )}
                            {assemblies.map(ass => (
                                <div key={ass.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 hover:border-indigo-200 transition-all flex justify-between items-center group shadow-sm hover:shadow-md">
                                    <div className="flex items-center gap-6">
                                        <div className="p-5 rounded-[2rem] bg-indigo-50 text-indigo-600"><Gavel size={28}/></div>
                                        <div>
                                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">{ass.title}</h3>
                                            <p className="text-[9px] text-slate-400 font-black uppercase mt-1 tracking-[0.2em]">{new Date(ass.date).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                        {ass.status === 'SCHEDULED' && <button onClick={() => handleStartLive(ass)} className="p-3 bg-indigo-600 text-white rounded-xl font-black text-[9px] uppercase shadow-lg hover:bg-indigo-500 transition-all"><Play size={14}/></button>}
                                        <button onClick={() => handleDelete(ass.id)} className="p-3 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {isModalOpen && editingAssembly && (
                <div className="sie-editor-overlay">
                    <div className="sie-modal-container !h-auto !max-w-2xl self-center border border-white/10 shadow-2xl">
                        <form onSubmit={handleSave}>
                            <div className="h-24 px-10 bg-slate-900 text-white flex justify-between items-center rounded-t-[var(--sie-radius)] border-b border-white/5">
                                <h3 className="font-black text-xl uppercase tracking-tighter">Configurar Assembleia</h3>
                                <button type="button" onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-rose-500 rounded-xl transition-all"><X size={24}/></button>
                            </div>
                            <div className="p-12 space-y-8 bg-white rounded-b-[2rem]">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Título do Evento</label>
                                    <input required className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-sm font-black uppercase outline-none focus:border-indigo-500 transition-all shadow-inner" value={editingAssembly.title || ''} onChange={e => setEditingAssembly({...editingAssembly, title: e.target.value.toUpperCase()})} />
                                </div>
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data & Hora</label>
                                        <input type="datetime-local" required className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-xs font-black uppercase outline-none focus:border-indigo-500" value={editingAssembly.date || ''} onChange={e => setEditingAssembly({...editingAssembly, date: e.target.value})} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estado de Fluxo</label>
                                        <select 
                                            className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-[10px] font-black uppercase outline-none focus:border-indigo-500 cursor-pointer" 
                                            value={editingAssembly.status || ''} 
                                            onChange={e => setEditingAssembly({...editingAssembly, status: e.target.value})}
                                        >
                                            <option value="SCHEDULED">Agendada</option>
                                            <option value="FINISHED">Finalizada</option>
                                            <option value="CANCELLED">Cancelada</option>
                                        </select>
                                    </div>
                                </div>
                                <button type="submit" disabled={isSaving} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 disabled:opacity-50">
                                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />} Salvar Protocolo
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AssemblyManager;