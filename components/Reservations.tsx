
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
        <div className="flex-1 flex flex-col min-h-0 space-y-6 animate-fade-in h-full relative">
            <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900 p-8 rounded-[3rem] text-white shadow-xl shrink-0 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="flex items-center gap-5 relative z-10">
                    <div className="p-4 bg-indigo-600 rounded-2xl shadow-xl" style={{ backgroundColor: primaryColor }}><Calendar size={24}/></div>
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">Reservas de Áreas</h2>
                        <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2 opacity-80">Kernel Resource Scheduler V25.9</p>
                    </div>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-[11px] uppercase tracking-widest shadow-2xl transition-all active:scale-95 flex items-center gap-3 relative z-10" style={{ backgroundColor: primaryColor }}>
                    <Plus size={20}/> Novo Agendamento
                </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
                {isLoading ? <div className="p-20 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={40} style={{ color: primaryColor }}/></div> : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {reservations.map(r => (
                            <div key={r.id} className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                                <button onClick={() => handleDelete(r.id)} className="absolute top-8 right-8 p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 transform translate-x-4 group-hover:translate-x-0"><Trash2 size={18}/></button>
                                <div className="flex items-center gap-5 mb-8">
                                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-[1.25rem] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform" style={{ color: primaryColor, backgroundColor: primaryColor + '15' }}><Calendar size={28}/></div>
                                    <div>
                                        <h3 className="font-black text-slate-800 uppercase tracking-tight text-base leading-none">{r.area_name}</h3>
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">{new Date(r.date).toLocaleDateString('pt-BR')}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                                        <Clock size={16} className="text-slate-300"/>
                                        <div><p className="text-[8px] font-black text-slate-400 uppercase">Período</p><p className="text-[11px] font-black text-slate-800">{r.startTime?.slice(0,5)} - {r.endTime?.slice(0,5)}</p></div>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
                                        <User size={16} className="text-slate-300"/>
                                        <div><p className="text-[8px] font-black text-slate-400 uppercase">Solicitante</p><p className="text-[11px] font-black text-slate-800 truncate max-w-[80px]">{r.userName?.split(' ')[0] || 'Membro'}</p></div>
                                    </div>
                                </div>
                                <div className="mt-8 flex items-center justify-between">
                                    <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100 uppercase tracking-widest">Protocolado</span>
                                    <div className="flex items-center gap-1.5 text-slate-300"><Info size={12}/><span className="text-[8px] font-black uppercase">RESERVE ID #00{r.id}</span></div>
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

            {isModalOpen && (
                <div className="sie-editor-overlay">
                    <div className="sie-modal-container">
                        <form onSubmit={handleSave} className="flex flex-col h-full overflow-hidden">
                            <div className="h-20 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 shadow-2xl relative z-20 border-b border-white/5">
                                <div className="flex items-center gap-5">
                                    <div className="p-3.5 bg-indigo-600 rounded-xl shadow-xl" style={{ backgroundColor: primaryColor }}><Calendar size={22}/></div>
                                    <div>
                                        <h3 className="font-black text-xl uppercase tracking-tighter leading-none">Reservar Espaço Comum</h3>
                                        <p className="text-indigo-400 text-[9px] font-black uppercase mt-1.5 tracking-widest opacity-80">SRE Asset Allocation V5.0</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button type="submit" disabled={isSaving} className="px-10 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center gap-3 shadow-xl active:scale-95" style={{ backgroundColor: primaryColor }}>
                                        {isSaving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Commitar Agendamento
                                    </button>
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="p-3.5 hover:bg-rose-500 hover:text-white text-slate-400 rounded-xl transition-all border border-white/5"><X size={24}/></button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-[#fdfdfe] relative">
                                <div className="max-w-3xl mx-auto space-y-12 pb-10">
                                    <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-200 shadow-inner space-y-10">
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Selecione a Área Comum</label>
                                            <select className="w-full font-black h-16 bg-white border border-slate-200 rounded-[1.5rem] px-8 text-xl focus:border-indigo-500 transition-all shadow-sm appearance-none" value={newRes.area_name} onChange={e => setNewRes({...newRes, area_name: e.target.value})}>
                                                <option value="SALÃO DE FESTAS">Salão de Festas Master</option>
                                                <option value="CHURRASQUEIRA 01">Espaço Gourmet / Churrasqueira 01</option>
                                                <option value="CHURRASQUEIRA 02">Espaço Gourmet / Churrasqueira 02</option>
                                                <option value="QUADRA POLIESPORTIVA">Quadra Poliesportiva Hub</option>
                                                <option value="ACADEMIA">Fitness Center Cluster</option>
                                            </select>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Data do Protocolo</label>
                                            <input type="date" required className="w-full font-black h-16 bg-white border border-slate-200 rounded-[1.5rem] px-8 text-xl focus:border-indigo-500 transition-all shadow-sm" value={newRes.date} onChange={e => setNewRes({...newRes, date: e.target.value})} />
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                            <div className="space-y-3">
                                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Início do Uso</label>
                                                <input type="time" className="w-full font-black h-16 bg-white border border-slate-200 rounded-[1.5rem] px-8 text-2xl focus:border-indigo-500 transition-all shadow-sm" value={newRes.startTime} onChange={e => setNewRes({...newRes, startTime: e.target.value})} />
                                            </div>
                                            <div className="space-y-3">
                                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Término do Uso</label>
                                                <input type="time" className="w-full font-black h-16 bg-white border border-slate-200 rounded-[1.5rem] px-8 text-2xl focus:border-indigo-500 transition-all shadow-sm" value={newRes.endTime} onChange={e => setNewRes({...newRes, endTime: e.target.value})} />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="p-8 bg-amber-900/5 border border-amber-100 rounded-[2.5rem] flex items-start gap-6 shadow-sm">
                                        <div className="p-3 bg-white rounded-2xl text-amber-500 shadow-sm"><AlertTriangle size={24}/></div>
                                        <div>
                                            <h4 className="text-sm font-black text-amber-900 uppercase tracking-tight">Política de Cancelamento</h4>
                                            <p className="text-[10px] text-amber-700 font-bold uppercase mt-1 leading-relaxed">Cancelamentos devem ser realizados com no mínimo 48h de antecedência via terminal ou presencialmente na sede S.I.E.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 border-t bg-slate-50 flex justify-between items-center shrink-0">
                                <div className="flex items-center gap-3"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SRE Conflict Checker Online</span></div>
                                <div className="flex gap-4">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-3.5 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors">Fechar</button>
                                    <button type="submit" onClick={handleSave} className="px-12 py-3.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl">Confirmar</button>
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
