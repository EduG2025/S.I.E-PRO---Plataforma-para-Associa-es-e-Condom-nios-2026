
import React, { useState, useEffect, useMemo } from 'react';
import { api, authService, systemService, planService } from '../services/api';
import { User, SystemInfo } from '../types';
import {
  Wallet, Calendar, ShoppingBag, MessageSquare, Lock,
  Brain, Sparkles, ArrowRight, Loader2,
  ShieldCheck, Bell, Fingerprint, QrCode,
  FileText, Clock, Signal, Home, Activity, Zap, Receipt, Download, ChevronRight, Star,
  PlusCircle, CreditCard, Megaphone, Smartphone
} from 'lucide-react';

const ResidentDashboard = ({ onNavigate, systemInfo }: { onNavigate: (tab: string) => void, systemInfo: SystemInfo }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const loadPortal = async () => {
      try {
        const [userRes, portalRes] = await Promise.all([
          authService.me(),
          api.get('/resident/dashboard')
        ]);
        setCurrentUser(userRes.data);
        setData(portalRes.data);
      } catch (e) {
        console.error("Resident Hub Offline");
      } finally {
        setLoading(false);
      }
    };
    loadPortal();
  }, []);

  const isModuleEnabled = (id: string) => {
    const settings = systemInfo.resident_ui_settings;
    if (!settings) return true;
    const module = (settings as any[]).find(m => m.id === id);
    return module ? module.enabled : true;
  };

  const primaryColor = systemInfo.primaryColor || '#4f46e5';

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center p-20 h-full">
      <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
      <p className="text-slate-400 font-black animate-pulse text-[10px] uppercase tracking-widest">Sincronizando Terminal...</p>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col space-y-8 animate-fade-in max-w-[1400px] mx-auto pb-20 px-4 lg:px-0 h-full overflow-y-auto no-scrollbar">

      {/* WELCOME HUD SRE PREMIUM */}
      <div className="bg-slate-900 rounded-[3rem] lg:rounded-[4rem] p-10 lg:p-14 relative overflow-hidden shadow-2xl border border-white/5 shrink-0">
        <div className="absolute top-0 right-0 w-[50rem] h-[50rem] bg-indigo-600/10 rounded-full blur-[140px] -mr-60 -mt-80 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-12">
           <div className="flex flex-col md:flex-row items-center gap-10 text-center md:text-left">
              <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-[2.5rem] lg:rounded-[3.5rem] bg-slate-800 border-4 border-white/10 overflow-hidden shadow-2xl relative flex items-center justify-center">
                  {currentUser?.avatar_url ? (
                      <img src={currentUser.avatar_url} className="w-full h-full object-cover" alt="Profile" />
                  ) : (
                      <div className="w-full h-full flex items-center justify-center bg-indigo-600 text-white font-black text-4xl">
                         {currentUser?.name.charAt(0)}
                      </div>
                  )}
                  <div className="absolute bottom-1 right-1 w-6 h-6 bg-emerald-500 border-4 border-slate-900 rounded-full animate-pulse"></div>
              </div>
              <div className="space-y-4">
                  <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.5em] leading-none">Membro SRE Ativo</p>
                  <h1 className="text-4xl lg:text-5xl font-black text-white uppercase tracking-tightest leading-none">Olá, {currentUser?.name.split(' ')[0]}!</h1>
                  <div className="flex items-center gap-4 text-slate-400 justify-center md:justify-start">
                      <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                        <Home size={16} className="text-indigo-500" /> 
                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-300">Unidade {currentUser?.unit || 'HUB'}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                        <Smartphone size={16} className="text-emerald-500" /> 
                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-300">Bio-ID Ok</span>
                      </div>
                  </div>
              </div>
           </div>
           <div className="flex flex-col gap-4 w-full lg:w-auto">
                <button onClick={() => onNavigate('wallet')} className="px-12 py-6 bg-white text-indigo-950 rounded-[2.5rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4 group">
                    <QrCode size={24} className="group-hover:rotate-12 transition-transform" /> Acessar Digital Pass
                </button>
           </div>
        </div>
      </div>

      {/* QUICK ACTIONS BAR */}
      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 shrink-0">
          {[
              { id: 'wallet', label: 'Autorizar Visitante', icon: PlusCircle, color: 'bg-emerald-600' },
              { id: 'reservations', label: 'Reservar Área', icon: Calendar, color: 'bg-indigo-600' },
              { id: 'finance', label: 'Ver Faturas', icon: CreditCard, color: 'bg-amber-600' },
              { id: 'neural_chat', label: 'Mentor Neural', icon: Brain, color: 'bg-fuchsia-600' },
              { id: 'communication', label: 'Mural de Avisos', icon: Megaphone, color: 'bg-slate-900' }
          ].map(action => (
              <button 
                key={action.id} 
                onClick={() => onNavigate(action.id)}
                className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all whitespace-nowrap active:scale-95 shrink-0 group hover:border-indigo-200"
              >
                  <div className={`p-3 rounded-2xl ${action.color} text-white shadow-lg group-hover:scale-110 transition-transform`}><action.icon size={20}/></div>
                  <span className="text-[11px] font-black uppercase tracking-widest text-slate-700 pr-4">{action.label}</span>
              </button>
          ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch shrink-0">
        {/* PERSONAL LEDGER WIDGET */}
        {isModuleEnabled('finance') && (
            <div className="lg:col-span-8 bg-white rounded-[3.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row relative group hover:border-indigo-300 transition-all">
                <div className="p-12 bg-slate-900 text-white flex-1 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5"><Receipt size={250}/></div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-6">Exposição Ledger Pendente</p>
                        <h2 className="text-5xl font-black uppercase tracking-tightest leading-none">R$ {data?.pendingBalance || '0,00'}</h2>
                        <div className="mt-10 flex items-center gap-3">
                             <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                             <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Protocolo de Cobrança em Aberto</p>
                        </div>
                    </div>
                </div>
                <div className="p-12 flex-1 flex flex-col justify-between bg-white border-l border-slate-100">
                    <div className="space-y-8">
                        <div className="flex justify-between items-center">
                            <h4 className="text-xs font-black uppercase text-slate-800 tracking-widest flex items-center gap-2"><Clock size={16} className="text-indigo-600"/> Próximo Vencimento</h4>
                            <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[8px] font-black border border-amber-100 uppercase">Atenção</span>
                        </div>
                        <div className="flex items-baseline gap-2">
                             <span className="text-6xl font-black text-slate-900 tracking-tightest">10</span>
                             <span className="text-xl font-black text-slate-300 uppercase tracking-widest">/ AGOSTO</span>
                        </div>
                        <div className="space-y-2">
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-600 w-[65%]" style={{ backgroundColor: primaryColor }}></div>
                            </div>
                            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Limite de Quitação sem encargos</p>
                        </div>
                    </div>
                    <button onClick={() => onNavigate('finance')} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 mt-10">
                        <CreditCard size={20}/> Quitar Ledger Agora
                    </button>
                </div>
            </div>
        )}

        {/* NOTICES WALL MINI */}
        <div className="lg:col-span-4 bg-white rounded-[3.5rem] p-12 border border-slate-200 flex flex-col justify-between relative overflow-hidden group shadow-sm hover:border-indigo-300 transition-all">
            <div className="absolute top-0 right-0 p-8 opacity-5"><Bell size={150}/></div>
            <div className="relative z-10">
                <div className="flex justify-between items-center mb-10">
                    <h4 className="text-xl font-black uppercase tracking-tight text-slate-800">Mural Interno</h4>
                    <span className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner"><Bell size={20}/></span>
                </div>
                <div className="space-y-8">
                    {data?.recentNotices?.slice(0, 3).map((n: any) => (
                        <div key={n.id} className="border-l-4 border-indigo-600 pl-6 py-1 group/item cursor-pointer">
                            <p className="text-[11px] font-black uppercase text-slate-800 leading-tight group-hover/item:text-indigo-600 transition-colors">{n.title}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase mt-2 tracking-widest">{new Date(n.created_at).toLocaleDateString()}</p>
                        </div>
                    ))}
                    {!data?.recentNotices?.length && (
                        <div className="py-10 text-center opacity-20">
                            <Activity size={32} className="mx-auto mb-3"/>
                            <p className="text-[10px] font-black uppercase tracking-widest">Sem novos avisos.</p>
                        </div>
                    )}
                </div>
            </div>
            <button onClick={() => onNavigate('communication')} className="w-full py-5 bg-slate-50 text-slate-500 rounded-[1.5rem] font-black text-[9px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all flex items-center justify-center gap-2 mt-12 border border-slate-100">
                Arquivo do Mural <ChevronRight size={14}/>
            </button>
        </div>
      </div>

      {/* CORE MODULES GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-10">
        {[
          { id: 'reservations', label: 'Agendamentos', desc: 'Salões e Churrasqueiras', icon: Calendar, color: 'text-emerald-600', bg: 'bg-emerald-50', enabled: isModuleEnabled('reservations') },
          { id: 'marketplace', label: 'Marketplace', desc: 'Comércio Local Ativo', icon: ShoppingBag, color: 'text-orange-600', bg: 'bg-orange-50', enabled: isModuleEnabled('marketplace') },
          { id: 'suggestions', label: 'Ouvidoria', desc: 'Canal de Co-Gestão', icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-50', enabled: true },
          { id: 'neural_chat', label: 'Advisor IA', desc: 'Mentoria em Tempo Real', icon: Brain, color: 'text-purple-600', bg: 'bg-purple-50', enabled: isModuleEnabled('neural_chat') }
        ].map((widget) => widget.enabled && (
          <div key={widget.id} 
               onClick={() => onNavigate(widget.id)}
               className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-2xl hover:border-indigo-300 transition-all cursor-pointer group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-600/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-150"></div>
            <div className={`p-5 rounded-[1.75rem] w-fit ${widget.bg} ${widget.color} group-hover:scale-110 transition-transform shadow-inner mb-8 relative z-10`}>
                <widget.icon size={28} />
            </div>
            <div className="relative z-10">
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{widget.label}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1.5">{widget.desc}</p>
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-50">
                    <span className="text-[8px] font-black uppercase text-slate-300 group-hover:text-indigo-600 transition-colors">Acessar Protocolo</span>
                    <ArrowRight size={16} className="text-slate-200 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResidentDashboard;
