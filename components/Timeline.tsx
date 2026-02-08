
import React, { useState, useEffect } from 'react';
import { AgendaEvent, SystemInfo } from '../types';
import { agendaService } from '../services/api';
import { 
    Calendar as CalendarIcon, ChevronRight, X, Plus, Clock, Loader2, Trash2, Edit2, Save, MapPin, Activity, AlertCircle, CheckCircle2,
    CalendarClock, ArrowDown
} from 'lucide-react';

interface TimelineProps {
  systemInfo: SystemInfo;
}

const Timeline = ({ systemInfo }: TimelineProps) => {
  const [events, setEvents] = useState([] as AgendaEvent[]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
      try {
          setLoading(true);
          const res = await agendaService.getAll();
          const data = res.data?.data || (Array.isArray(res.data) ? res.data : []);
          // Sort ASC for timeline view logic
          const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
          setEvents(sorted);
      } catch (e) {
          setEvents([]);
      } finally { setLoading(false); }
  };

  const handleOpenCreate = () => {
      setEditingEvent({ title: '', description: '', date: new Date().toISOString().slice(0, 16), type: 'MEETING' as const, status: 'UPCOMING' as const, location: '' });
      setIsModalOpen(true);
  };

  const handleSave = async (e: any) => {
      e.preventDefault();
      if (!editingEvent.title || !editingEvent.date) return;
      setIsSaving(true);
      try {
          if (editingEvent.id) {
              await agendaService.update(editingEvent.id, editingEvent);
          } else {
              await agendaService.create(editingEvent);
          }
          setIsModalOpen(false);
          loadData();
      } catch (err) {
          alert("Erro ao salvar.");
      } finally { setIsSaving(false); }
  };

  const handleDelete = async (id: number) => {
      if(!confirm("Remover este marco da agenda?")) return;
      try { await agendaService.delete(id); loadData(); } catch(e) { alert("Erro ao remover."); }
  };

  const getEventConfig = (type: AgendaEvent['type']) => {
      switch(type) {
          case 'MEETING': return { color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', icon: CalendarIcon, label: 'Reunião' };
          case 'MAINTENANCE': return { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: Activity, label: 'Manutenção' };
          case 'DEADLINE': return { color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', icon: AlertCircle, label: 'Prazo' };
          case 'EVENT': return { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: CalendarClock, label: 'Evento' };
          default: return { color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', icon: CheckCircle2, label: 'Geral' };
      }
  };

  const primaryColor = systemInfo.primaryColor || '#4f46e5';

  // Group events by Month/Year for cleaner timeline
  const groupedEvents = events.reduce((acc, event) => {
      const date = new Date(event.date);
      const key = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }).toUpperCase();
      if (!acc[key]) acc[key] = [];
      acc[key].push(event);
      return acc;
  }, {} as Record<string, AgendaEvent[]>);

  const now = new Date();

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-6 animate-fade-in overflow-hidden h-full relative">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-900 p-8 rounded-[3rem] text-white shadow-xl shrink-0 border border-white/5">
            <div>
                <h2 className="text-3xl font-black tracking-tightest leading-none">Agenda {systemInfo.shortName}</h2>
                <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mt-2">Fluxo Temporal de Gestão</p>
            </div>
            <button onClick={handleOpenCreate} className="px-10 py-4 bg-indigo-600 text-white rounded-xl font-black text-[11px] uppercase tracking-widest shadow-2xl hover:bg-indigo-50 transition-all active:scale-95 shrink-0 flex items-center gap-3" style={{ backgroundColor: primaryColor }}>
                <Plus size={18}/> Injetar Marco
            </button>
        </div>

        <div className="bg-white rounded-[3rem] shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col min-h-0 relative">
            {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center p-20">
                    <Loader2 className="animate-spin text-indigo-600" size={48} style={{ color: primaryColor }}/>
                    <p className="mt-4 font-black uppercase text-[10px] tracking-widest text-slate-300">Sincronizando Cronograma...</p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto p-8 lg:p-12 custom-scrollbar relative">
                    {/* Vertical Line */}
                    <div className="absolute left-[39px] md:left-[59px] top-12 bottom-12 w-0.5 bg-slate-100 rounded-full hidden sm:block z-0"></div>
                    
                    {Object.keys(groupedEvents).length === 0 && (
                         <div className="text-center py-20 opacity-30">
                             <CalendarIcon size={64} className="mx-auto mb-4 text-slate-400"/>
                             <p className="text-[10px] font-black uppercase tracking-widest">Nenhum evento no horizonte.</p>
                         </div>
                    )}

                    {Object.entries(groupedEvents).map(([month, monthEvents]) => (
                        <div key={month} className="mb-12 relative z-10 animate-slide-up">
                            <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md py-4 pl-16 mb-6 border-b border-slate-100">
                                <h3 className="text-sm font-black text-indigo-900 uppercase tracking-widest">{month}</h3>
                            </div>
                            
                            <div className="space-y-8">
                                {(monthEvents as AgendaEvent[]).map((event) => {
                                    const config = getEventConfig(event.type);
                                    const Icon = config.icon;
                                    const eventDate = new Date(event.date);
                                    const isPast = eventDate < now;
                                    
                                    return (
                                        <div key={event.id} className={`relative flex flex-col sm:flex-row gap-6 group ${isPast ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                                            {/* Marker */}
                                            <div className={`w-12 h-12 md:w-16 md:h-16 rounded-[1.25rem] shrink-0 flex items-center justify-center shadow-lg z-10 transition-transform group-hover:scale-110 border-4 border-white ${config.bg} ${config.color} ${isPast ? 'saturate-0' : ''}`}>
                                                <span className="text-lg md:text-xl font-black">{eventDate.getDate()}</span>
                                            </div>

                                            {/* Content Card */}
                                            <div className="flex-1 bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 hover:border-indigo-200 transition-all hover:shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden group/card">
                                                <div className="space-y-3 flex-1">
                                                    <div className="flex flex-wrap items-center gap-3">
                                                        <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border ${config.bg} ${config.color} ${config.border}`}>
                                                            {config.label}
                                                        </span>
                                                        <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1.5 uppercase">
                                                            <Clock size={12}/> {eventDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                                            {event.location && <> • <MapPin size={12}/> {event.location}</>}
                                                        </span>
                                                    </div>
                                                    <h4 className="font-black text-lg md:text-xl text-slate-800 tracking-tight leading-none uppercase">{event.title}</h4>
                                                    {event.description && <p className="text-slate-500 font-medium leading-relaxed max-w-2xl text-xs uppercase">{event.description}</p>}
                                                </div>
                                                
                                                <div className="flex gap-2 opacity-0 group-hover/card:opacity-100 transition-all transform translate-x-4 group-hover/card:translate-x-0">
                                                    <button onClick={() => { setEditingEvent(event); setIsModalOpen(true); }} className="p-3 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-white border border-transparent hover:border-slate-100 shadow-sm transition-all"><Edit2 size={16}/></button>
                                                    <button onClick={() => handleDelete(Number(event.id))} className="p-3 bg-slate-50 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-white border border-transparent hover:border-slate-100 shadow-sm transition-all"><Trash2 size={16}/></button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                    
                    {/* End of Timeline Indicator */}
                    <div className="absolute left-[39px] md:left-[59px] bottom-0 w-0.5 h-12 bg-gradient-to-b from-slate-100 to-transparent hidden sm:block"></div>
                </div>
            )}
        </div>

        {isModalOpen && (
            <div className="sie-editor-overlay">
                <div className="sie-modal-container !h-auto !max-w-xl self-center">
                    <form onSubmit={handleSave}>
                        <div className="h-20 px-8 bg-slate-900 text-white flex justify-between items-center shrink-0 rounded-t-[1.5rem] border-b border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg"><CalendarIcon size={20}/></div>
                                <h3 className="font-black text-lg uppercase tracking-tight">Evento de Agenda</h3>
                            </div>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-rose-500 rounded-xl transition-all border border-white/5"><X size={20}/></button>
                        </div>
                        <div className="p-8 bg-[#fdfdfe] space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Título do Marco</label>
                                <input required className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm font-black uppercase outline-none focus:border-indigo-500 transition-all" value={editingEvent.title} onChange={e => setEditingEvent({...editingEvent, title: e.target.value.toUpperCase()})} placeholder="EX: REUNIÃO DE CONSELHO" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data & Hora</label>
                                    <input type="datetime-local" required className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-bold uppercase outline-none focus:border-indigo-500" value={editingEvent.date} onChange={e => setEditingEvent({...editingEvent, date: e.target.value})} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
                                    <select className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-bold uppercase outline-none focus:border-indigo-500" value={editingEvent.type} onChange={e => setEditingEvent({...editingEvent, type: e.target.value})}>
                                        <option value="MEETING">Reunião</option>
                                        <option value="MAINTENANCE">Manutenção</option>
                                        <option value="EVENT">Evento Social</option>
                                        <option value="DEADLINE">Prazo Legal</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Localização (Opcional)</label>
                                <input className="w-full h-12 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs font-bold uppercase outline-none focus:border-indigo-500" value={editingEvent.location || ''} onChange={e => setEditingEvent({...editingEvent, location: e.target.value.toUpperCase()})} placeholder="SALÃO DE FESTAS..." />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição Detalhada</label>
                                <textarea rows={4} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-medium uppercase outline-none focus:border-indigo-500 resize-none shadow-inner" value={editingEvent.description} onChange={e => setEditingEvent({...editingEvent, description: e.target.value})} placeholder="DETALHES DO EVENTO..." />
                            </div>
                            <button type="submit" disabled={isSaving} className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 active:scale-95">
                                {isSaving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Sincronizar Agenda
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default Timeline;
