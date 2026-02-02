
import React, { useState, useEffect } from 'react';
import { AgendaEvent, SystemInfo } from '../types';
import { agendaService } from '../services/api';
import { 
    Calendar as CalendarIcon, ChevronRight, X, Plus, Clock, Loader2, Trash2, Edit2, Save, MapPin, Activity, AlertCircle, CheckCircle2
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
          const sorted = [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
          alert("✅ Marco sincronizado.");
      } catch (err) {
          alert("Erro ao salvar.");
      } finally { setIsSaving(false); }
  };

  const getEventConfig = (type: AgendaEvent['type']) => {
      switch(type) {
          case 'MEETING': return { color: 'bg-indigo-600', icon: CalendarIcon, label: 'Reunião' };
          case 'MAINTENANCE': return { color: 'bg-amber-500', icon: Activity, label: 'Manutenção' };
          case 'DEADLINE': return { color: 'bg-rose-600', icon: AlertCircle, label: 'Prazo' };
          default: return { color: 'bg-emerald-600', icon: CheckCircle2, label: 'Evento' };
      }
  };

  const primaryColor = systemInfo.primaryColor || '#4f46e5';

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-6 animate-fade-in overflow-hidden h-full relative">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-900 p-8 rounded-[2rem] text-white shadow-xl shrink-0">
            <div>
                <h2 className="text-3xl font-black tracking-tightest leading-none">Agenda {systemInfo.shortName}</h2>
                <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mt-2">Fluxo Temporal de Gestão</p>
            </div>
            <button onClick={handleOpenCreate} className="px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-indigo-50 transition-all active:scale-95 shrink-0" style={{ backgroundColor: primaryColor }}>
                <Plus size={20}/> Injetar Marco
            </button>
        </div>

        <div className="bg-white rounded-[3rem] shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col min-h-0">
            {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center p-20">
                    <Loader2 className="animate-spin text-indigo-600" size={48} style={{ color: primaryColor }}/>
                    <p className="mt-4 font-black uppercase text-[10px] tracking-widest text-slate-300">Sincronizando...</p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto p-6 lg:p-12 custom-scrollbar">
                    <div className="max-w-5xl mx-auto space-y-8 relative">
                        <div className="absolute left-[39px] md:left-[49px] top-4 bottom-4 w-1 bg-slate-100 rounded-full hidden sm:block"></div>
                        {events.map((event) => {
                            const config = getEventConfig(event.type);
                            const Icon = config.icon;
                            return (
                                <div key={event.id} className="relative flex flex-col sm:flex-row gap-6 md:gap-10 group animate-fade-in">
                                    <div className={`w-20 h-20 md:w-24 md:h-24 rounded-[2rem] shrink-0 flex items-center justify-center shadow-2xl z-10 transition-transform group-hover:scale-110 border-4 border-white ${config.color}`} style={event.type === 'MEETING' ? { backgroundColor: primaryColor } : {}}>
                                        <Icon size={28} className="text-white"/>
                                    </div>
                                    <div className="flex-1 bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-100 hover:border-indigo-200 transition-all hover:shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden group/card">
                                        <div className="space-y-4 flex-1">
                                            <div className="flex flex-wrap items-center gap-4">
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-4 py-1 rounded-full text-white ${config.color}`} style={event.type === 'MEETING' ? { backgroundColor: primaryColor } : {}}>{config.label}</span>
                                                <span className="text-[10px] font-black text-slate-400 flex items-center gap-2"><Clock size={12}/> {new Date(event.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <h4 className="font-black text-xl md:text-2xl text-slate-800 tracking-tight leading-none uppercase">{event.title}</h4>
                                            <p className="text-slate-500 font-medium leading-relaxed max-w-2xl text-sm uppercase">{event.description}</p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-3xl font-black text-slate-800 tracking-tightest leading-none">{new Date(event.date).getDate()}</p>
                                            <p className="text-[10px] font-black uppercase text-slate-400 mt-1">{new Date(event.date).toLocaleDateString('pt-BR', { month: 'short' })}</p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default Timeline;
