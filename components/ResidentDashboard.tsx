import React, { useState, useEffect, useMemo } from 'react';
import { api, authService, systemService, planService } from '../services/api';
import { User, SystemInfo, ResidentUISetting } from '../types';
import {
  Wallet, Calendar, ShoppingBag, MessageSquare, Lock,
  Brain, Sparkles, ArrowRight, Loader2,
  ShieldCheck, Bell, Fingerprint, QrCode,
  FileText, ClipboardCheck, Timer, ChevronRight,
  Download, History, Receipt, CreditCard, ShieldAlert
} from 'lucide-react';

interface ResidentDashboardProps {
  onNavigate: (tab: string) => void;
  systemInfo: SystemInfo;
  permissions: string[];
}

const ResidentDashboard = ({ onNavigate, systemInfo, permissions }: ResidentDashboardProps) => {
  const [data, setData] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [uiManifest, setUiManifest] = useState<ResidentUISetting[]>([]);

  // RBAC Checks Locais
  const canUseMarket = permissions.includes('*') || permissions.includes('use_marketplace');
  const canUseReservations = permissions.includes('*') || permissions.includes('use_reservations');
  const canUseFinance = permissions.includes('*') || permissions.includes('view_finances');
  const canUseAI = permissions.includes('*') || permissions.includes('use_ai_chat');

  useEffect(() => {
    const loadResidentHub = async () => {
      try {
        const [userRes, portalRes, sysRes, subRes] = await Promise.all([
          authService.me(),
          api.get('/resident/dashboard'),
          systemService.getInfo(),
          planService.getMySubscription()
        ]);

        setCurrentUser(userRes.data);
        setData(portalRes.data);
        setSubscription(subRes.data.data);

        let rawSettings = sysRes.data?.resident_ui_settings;
        if (typeof rawSettings === 'string') {
          try { rawSettings = JSON.parse(rawSettings); } catch { rawSettings = []; }
        }
        setUiManifest(Array.isArray(rawSettings) ? rawSettings : []);
      } catch (e) {
        console.error("[SRE] Falha de Handshake Residencial");
      } finally {
        setLoading(false);
      }
    };
    loadResidentHub();
  }, []);

  const isModuleEnabledByAdmin = (id: string) => {
    if (!uiManifest || uiManifest.length === 0) return true;
    const widget = uiManifest.find(w => w.id === id);
    return widget ? widget.enabled : true;
  };

  if (loading) return (
    <div className="flex-1 flex flex-col items-center justify-center p-20 h-full">
      <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
      <p className="text-slate-400 font-black animate-pulse text-[10px] uppercase tracking-widest">Sincronizando Identidade...</p>
    </div>
  );

  const primaryColor = systemInfo.primaryColor || '#4f46e5';

  return (
    <div className="flex-1 flex flex-col space-y-8 animate-fade-in max-w-[1300px] mx-auto pb-10">

      <div className="bg-slate-900 rounded-[3rem] p-10 relative overflow-hidden shadow-2xl border border-white/5">
        <div className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-indigo-600/10 rounded-full blur-[100px] -mr-40 -mt-40"></div>
        <div className="relative z-10">
          <div className="px-5 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center gap-2 backdrop-blur-md w-fit mb-10">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">{systemInfo.shortName} • Acesso Protocolado Ativo</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tightest leading-none">Olá, {currentUser?.name.split(' ')[0]}</h1>
              <p className="text-slate-400 font-medium text-lg mt-4 uppercase tracking-widest flex items-center gap-3">
                <Fingerprint size={20} className="text-indigo-500" /> Unid. {currentUser?.unit || 'HUB'}
              </p>
            </div>
            <button onClick={() => onNavigate('settings')} className="px-6 py-3.5 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 font-black text-[9px] uppercase tracking-widest flex items-center gap-3 transition-all">
                <Lock size={14} /> Chaves de Segurança
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* FINANCEIRO */}
        {isModuleEnabledByAdmin('finance') && (
            <div className={`lg:col-span-2 bg-white rounded-[3.5rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row relative ${!canUseFinance && 'grayscale opacity-80'}`}>
                {!canUseFinance && (
                    <div className="absolute inset-0 z-50 bg-white/40 backdrop-blur-[2px] flex items-center justify-center">
                        <div className="bg-slate-900 text-white px-8 py-4 rounded-2xl flex items-center gap-4 shadow-2xl">
                            <Lock size={20} className="text-amber-400" />
                            <p className="text-[10px] font-black uppercase tracking-widest">Acesso Financeiro Bloqueado</p>
                        </div>
                    </div>
                )}
                <div className="p-10 bg-slate-900 text-white flex-1 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5"><Receipt size={180}/></div>
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Assinatura Ativa</p>
                        {subscription ? (
                            <>
                                <h2 className="text-3xl font-black uppercase tracking-tight leading-tight">{subscription.plan_name}</h2>
                                <div className="mt-8 flex items-baseline gap-2">
                                    <span className="text-4xl font-black text-white">R$ {Number(subscription.price).toLocaleString('pt-BR')}</span>
                                    <span className="text-xs text-indigo-300 uppercase font-black">/ {subscription.billing_cycle === 'monthly' ? 'Mês' : 'Ano'}</span>
                                </div>
                            </>
                        ) : (
                            <div className="py-10"><p className="text-indigo-200 italic">Sem ciclo de recorrência ativo.</p></div>
                        )}
                    </div>
                </div>
                <div className="p-10 flex-1 flex flex-col justify-between">
                    <div className="space-y-6">
                        <h4 className="text-xs font-black uppercase text-slate-800 tracking-widest flex items-center gap-2"><Calendar size={16} className="text-indigo-600"/> Próximo Vencimento</h4>
                        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 text-3xl font-black text-slate-800">
                             {subscription?.next_billing_date ? new Date(subscription.next_billing_date).toLocaleDateString('pt-BR') : '---'}
                        </div>
                    </div>
                    <button onClick={() => canUseFinance && onNavigate('finance')} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-3" style={{ backgroundColor: primaryColor }}>
                        <Download size={18}/> Detalhes do Ledger
                    </button>
                </div>
            </div>
        )}

        {/* OUVIDORIA */}
        {isModuleEnabledByAdmin('suggestions') && (
            <div className={`bg-indigo-50 rounded-[3.5rem] p-10 border border-indigo-100 flex flex-col justify-between relative overflow-hidden group ${!permissions.includes('send_suggestions') && 'opacity-50'}`}>
                <div className="absolute top-0 right-0 p-8 opacity-5"><MessageSquare size={120}/></div>
                <div className="relative z-10">
                    <h4 className="text-xl font-black uppercase tracking-tight leading-none text-indigo-900">Ouvidoria</h4>
                    <p className="text-indigo-600 text-[10px] font-bold mt-2 uppercase">Gestão Coletiva</p>
                </div>
                <button onClick={() => onNavigate('suggestions')} className="w-full py-5 bg-white text-indigo-900 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 mt-10">
                    Abrir Protocolo <ArrowRight size={16}/>
                </button>
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* RESERVAS */}
        {isModuleEnabledByAdmin('reservations') && (
          <div className={`bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-indigo-300 transition-all cursor-pointer relative ${!canUseReservations && 'opacity-60 grayscale'}`} onClick={() => canUseReservations && onNavigate('reservations')}>
            {!canUseReservations && <Lock size={16} className="absolute top-8 right-8 text-slate-400" />}
            <div className="flex justify-between items-start mb-6">
              <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-600 shadow-inner"><Calendar size={24} /></div>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Recursos Ativos</p>
              <h3 className="text-3xl font-black text-slate-800 tracking-tight">Reservas Online</h3>
            </div>
          </div>
        )}

        {/* MARKETPLACE */}
        {isModuleEnabledByAdmin('marketplace') && (
          <div className={`bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col justify-between group hover:border-indigo-300 transition-all cursor-pointer relative ${!canUseMarket && 'opacity-60 grayscale'}`} onClick={() => canUseMarket && onNavigate('marketplace')}>
            {!canUseMarket && <Lock size={16} className="absolute top-8 right-8 text-slate-400" />}
            <div className="flex justify-between items-start mb-6">
              <div className="p-3.5 rounded-2xl bg-amber-50 text-amber-600 shadow-inner"><ShoppingBag size={24} /></div>
            </div>
            <div>
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Economia Local</p>
              <h3 className="text-3xl font-black text-slate-800 tracking-tight">Marketplace</h3>
            </div>
          </div>
        )}

        {/* ACESSO DIGITAL */}
        {isModuleEnabledByAdmin('concierge') && (
          <div className="bg-slate-950 p-8 rounded-[2.5rem] text-white shadow-2xl flex flex-col justify-between group hover:scale-[1.01] transition-all cursor-pointer overflow-hidden relative" onClick={() => onNavigate('concierge')}>
            <div className="absolute top-0 right-0 p-6 opacity-5"><Fingerprint size={100} /></div>
            <div className="flex justify-between items-start mb-6 relative z-10">
              <div className="p-3.5 rounded-2xl bg-indigo-600 text-white shadow-lg" style={{ backgroundColor: primaryColor }}><QrCode size={24} /></div>
            </div>
            <div className="relative z-10">
              <p className="text-[9px] font-black uppercase text-indigo-400 tracking-widest mb-1">Identidade Segura</p>
              <h3 className="text-3xl font-black text-white tracking-tight">Digital Access</h3>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* MURAL */}
        {isModuleEnabledByAdmin('communication') && (
          <div className="lg:col-span-8 bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col h-full">
            <div className="flex justify-between items-center mb-10">
              <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-4">
                <Bell size={26} className="text-indigo-600" style={{ color: primaryColor }} /> Mural de Avisos
              </h4>
            </div>
            <div className="space-y-4 flex-1">
              {data?.recentNotices?.length > 0 ? data.recentNotices.map((n: any) => (
                <div key={n.id} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 group hover:bg-white hover:border-indigo-200 transition-all relative overflow-hidden">
                  <div className={`absolute top-0 left-0 w-1.5 h-full ${n.urgency === 'HIGH' ? 'bg-rose-500' : 'bg-indigo-400'}`} style={n.urgency !== 'HIGH' ? { backgroundColor: primaryColor } : {}}></div>
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="font-black text-slate-800 text-base uppercase leading-tight pr-4">{n.title}</h5>
                    <span className="text-[8px] font-black text-slate-400 uppercase">{new Date(n.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium uppercase leading-relaxed line-clamp-2">{n.content}</p>
                </div>
              )) : (
                <div className="py-20 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-100">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Mural limpo.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ADVISOR NEURAL */}
        {isModuleEnabledByAdmin('neural_chat') && (
          <div className={`lg:col-span-4 bg-indigo-600 p-10 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-between group cursor-pointer ${!canUseAI && 'grayscale pointer-events-none'}`} onClick={() => canUseAI && onNavigate('neural_chat')} style={{ backgroundColor: primaryColor }}>
            {!canUseAI && <Lock size={48} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-20" />}
            <div className="absolute top-0 right-0 p-8 opacity-5 transform scale-125"><Brain size={120} /></div>
            <div className="relative z-10">
              <div className="p-4 bg-white/10 rounded-2xl w-fit mb-10 backdrop-blur-md border border-white/10 shadow-2xl"><Sparkles size={28} className="text-indigo-200 animate-pulse" /></div>
              <h4 className="text-3xl lg:text-4xl font-black uppercase tracking-tightest leading-[0.9]">Advisor IA</h4>
              <p className="text-indigo-100 text-xs mt-6 font-medium leading-relaxed uppercase italic opacity-80 border-l-2 border-white/20 pl-4">
                Suporte normativo técnico via Gemini 3 Pro.
              </p>
            </div>
            <button className="mt-10 w-full py-5 bg-white text-indigo-950 rounded-[1.75rem] font-black text-[10px] uppercase tracking-[0.25em] shadow-2xl relative z-10 transition-all active:scale-95">
              {canUseAI ? 'Abrir Terminal' : 'Restrito'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResidentDashboard;