import React, { useState, useEffect } from 'react';
import { reservationService } from '../services/api';
import { SystemInfo } from '../types';
import { Calendar, Plus, X, Loader2, Clock, MapPin, User, CheckCircle, AlertTriangle, Trash2, Save, Info } from 'lucide-react';

interface ReservationsProps {
    systemInfo: SystemInfo;
}

const Reservations = ({ systemInfo }: ReservationsProps) => {
    const [reservations, setReservations] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [newRes, setNewRes] = useState({ area_name: 'SALÃO DE FESTAS', date: '', startTime: '10:00', endTime: '22:00' });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const res = await reservationService.getAll();
            const data = res.data?.data || (Array.isArray(res.data) ? res.data : []);
            setReservations(data);
        } catch (e) {
            console.error("[SRE] Falha ao listar reservas:", e);
            setReservations([]);
        } finally { setIsLoading(false); }
    };

    const handleSave = async (e: any) => {
        e.preventDefault();
        setIsSaving(true);
        setError('');
        try {
            await reservationService.create(newRes);
            setIsModalOpen(false);
            loadData();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Falha ao agendar reserva.');
        } finally { setIsSaving(false); }
    };

    const handleDelete = async (id: number) => {
        if(!confirm("Cancelar esta reserva?")) return;
        try {
            await reservationService.delete(id);
            loadData();
        } catch (e) {
            alert("Erro ao cancelar reserva.");
        }
    };

    const primaryColor = systemInfo.primaryColor || '#4f46e5';

    return (
        <div className="flex-1 flex flex-col h-full animate-fade-in bg-slate-50 gap-6 p-[var(--sie-viewport-padding)]">
            
            {/* HEADER MASTER */}
            <div className="bg-slate-900 rounded-[var(--sie-radius)] p-8 text-white shadow-xl shrink-0 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden border border-white/5">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="flex items-center gap-5 relative z-10">
                    <div className="p-4 bg-indigo-600 rounded-2xl shadow-xl" style={{ backgroundColor: primaryColor }}><Calendar size={28}/></div>
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">Reservas de Áreas</h2>
                        <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2 opacity-80">Kernel Resource Scheduler V25.9</p>
                    </div>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="px-10 py-4 bg-white text-slate-900 hover:bg-indigo-50 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-2xl transition-all active:scale-95 flex items-center gap-3 relative z-10 sie-button">
                    <Plus size={20}/> Novo Agendamento
                </button>
            </div>

            {/* CONTENT ISLAND */}
            <div className="flex-1 bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col relative">
                <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
                    {isLoading ? <div className="p-20 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={40} style={{ color: primaryColor }}/></div> : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {reservations.map(r => (
                                <div key={r.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col justify-between h-full sie-card !m-0">
                                    <button onClick={() => handleDelete(r.id)} className="absolute top-8 right-8 p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0 border border-transparent hover:border-rose-100"><Trash2 size={16}/></button>
                                    
                                    <div className="mb-6">
                                        <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-[1.25rem] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform mb-6" style={{ color: primaryColor, backgroundColor: primaryColor + '15' }}><Calendar size={24}/></div>
                                        <h3 className="font-black text-slate-800 uppercase tracking-tight text-sm leading-tight">{r.area_name}</h3>
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">{new Date(r.date).toLocaleDateString('pt-BR')}</p>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center gap-3">
                                            <Clock size={14} className="text-slate-300"/>
                                            <div><p className="text-[8px] font-black text-slate-400 uppercase">Período</p><p className="text-[10px] font-black text-slate-800">{r.startTime?.slice(0,5)} - {r.endTime?.slice(0,5)}</p></div>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-center gap-3">
                                            <User size={14} className="text-slate-300"/>
                                            <div><p className="text-[8px] font-black text-slate-400 uppercase">Solicitante</p><p className="text-[10px] font-black text-slate-800 truncate max-w-[120px]">{r.userName?.split(' ')[0] || 'Membro'}</p></div>
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                                        <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 uppercase tracking-widest">Confirmado</span>
                                        <div className="flex items-center gap-1.5 text-slate-300"><Info size={12}/><span className="text-[7px] font-black uppercase">ID #{r.id}</span></div>
                                    </div>
                                </div>
                            ))}
                            {reservations.length === 0 && (
                                <div className="col-span-full py-40 text-center bg-slate-50 rounded-[4rem] border-2 border-dashed border-slate-200">
                                    <Calendar size={64} className="mx-auto text-slate-200 mb-6 opacity-30"/>
                                    <p className="font-black uppercase text-[10px] text-slate-400 tracking-[0.4em]">Agenda de Áreas Limpa. Nenhum uso programado.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {isModalOpen && (
                <div className="sie-editor-overlay">
                    <div className="sie-modal-container !h-auto !max-w-2xl self-center">
                        <form onSubmit={handleSave}>
                            <div className="h-24 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 shadow-2xl relative z-20 border-b border-white/5 rounded-t-[var(--sie-radius)]">
                                <div className="flex items-center gap-5">
                                    <div className="p-3.5 bg-indigo-600 rounded-xl shadow-xl" style={{ backgroundColor: primaryColor }}><Calendar size={22}/></div>
                                    <div>
                                        <h3 className="font-black text-xl uppercase tracking-tighter leading-none">Reservar Espaço</h3>
                                        <p className="text-indigo-400 text-[9px] font-black uppercase mt-1.5 tracking-widest opacity-80">SRE Asset Allocation V5.0</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="p-3.5 hover:bg-rose-500 hover:text-white text-slate-400 rounded-xl transition-all border border-white/5"><X size={24}/></button>
                                </div>
                            </div>

                            <div className="p-12 custom-scrollbar bg-[#fdfdfe] relative space-y-8 rounded-b-[var(--sie-radius)]">
                                <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-200 shadow-inner space-y-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Selecione a Área Comum</label>
                                        <select className="w-full h-16 bg-white border border-slate-200 rounded-[1.5rem] px-8 text-sm font-black uppercase focus:border-indigo-500 transition-all shadow-sm appearance-none outline-none sie-input" value={newRes.area_name} onChange={e => setNewRes({...newRes, area_name: e.target.value})}>
                                            <option value="SALÃO DE FESTAS">Salão de Festas Master</option>
                                            <option value="CHURRASQUEIRA 01">Espaço Gourmet / Churrasqueira 01</option>
                                            <option value="CHURRASQUEIRA 02">Espaço Gourmet / Churrasqueira 02</option>
                                            <option value="QUADRA POLIESPORTIVA">Quadra Poliesportiva Hub</option>
                                            <option value="ACADEMIA">Fitness Center Cluster</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data do Protocolo</label>
                                        <input type="date" required className="w-full h-16 bg-white border border-slate-200 rounded-[1.5rem] px-8 text-lg font-black uppercase focus:border-indigo-500 transition-all shadow-sm sie-input" value={newRes.date} onChange={e => setNewRes({...newRes, date: e.target.value})} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Início</label>
                                            <input type="time" className="w-full h-16 bg-white border border-slate-200 rounded-[1.5rem] px-8 text-lg font-black focus:border-indigo-500 transition-all shadow-sm sie-input" value={newRes.startTime} onChange={e => setNewRes({...newRes, startTime: e.target.value})} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Término</label>
                                            <input type="time" className="w-full h-16 bg-white border border-slate-200 rounded-[1.5rem] px-8 text-lg font-black focus:border-indigo-500 transition-all shadow-sm sie-input" value={newRes.endTime} onChange={e => setNewRes({...newRes, endTime: e.target.value})} />
                                        </div>
                                    </div>
                                </div>
                                
                                {error && (
                                    <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl text-[10px] font-black uppercase border border-rose-100 flex items-center gap-3">
                                        <AlertTriangle size={16}/> {error}
                                    </div>
                                )}

                                <div className="flex gap-4">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors">Cancelar</button>
                                    <button type="submit" onClick={handleSave} disabled={isSaving} className="flex-[2] py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 sie-button">
                                        {isSaving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Confirmar
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reservations;