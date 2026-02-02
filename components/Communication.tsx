
import React, { useState, useEffect } from 'react';
import { Notice, User, SystemInfo, ScheduledBroadcast } from '../types';
import { communicationService, userService, api } from '../services/api';
import { 
    MessageSquare, Clock, Plus, Trash2, Edit2, X, Save, Loader2, 
    Megaphone, MessageCircle, Send, Users, Shield, AlertTriangle,
    Info, ChevronRight, Share2, CheckCircle2, UserCheck, Smartphone, 
    Search, Zap, Calendar, History, Sparkles, Brain, ArrowRight
} from 'lucide-react';

interface CommunicationProps {
  systemInfo: SystemInfo;
}

const Communication = ({ systemInfo }: CommunicationProps) => {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [schedules, setSchedules] = useState<ScheduledBroadcast[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isWABroadcastOpen, setIsWABroadcastOpen] = useState(false);
  const [activeWAMode, setActiveWAMode] = useState<'DIRECT' | 'SCHEDULE'>('DIRECT');
  const [isSaving, setIsSaving] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Partial<Notice> | null>(null);

  // Form States para Messenger Gateway
  const [waType, setWaType] = useState<'ROLE' | 'USER' | 'DIRECT'>('ROLE');
  const [waMessage, setWaMessage] = useState('');
  const [waTargetRole, setWaTargetRole] = useState('ALL');
  const [waTargetUserId, setWaTargetUserId] = useState('');
  const [waDirectNumber, setWaDirectNumber] = useState('55');
  const [scheduledAt, setScheduledAt] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
      try {
          setIsLoading(true);
          const [noticesRes, usersRes, schedRes] = await Promise.all([
              communicationService.getNotices(),
              userService.getAll(1, 1000), // Pega maior amostragem para busca
              communicationService.getSchedules()
          ]);
          setNotices(noticesRes.data?.data || []);
          setUsers(usersRes.data?.data || []);
          setSchedules(schedRes.data?.data || []);
      } catch (e) {
          setNotices([]);
      } finally { setIsLoading(false); }
  };

  const handleSendWABroadcast = async () => {
      if (!waMessage.trim()) return alert("O corpo da mensagem é obrigatório.");
      
      if (activeWAMode === 'SCHEDULE') {
          if (!scheduledAt) return alert("Defina data e hora para automação.");
          setIsSaving(true);
          try {
              const targetVal = waType === 'ROLE' ? waTargetRole : waType === 'USER' ? waTargetUserId : waDirectNumber;
              await communicationService.createSchedule({
                  message: waMessage,
                  targetType: waType,
                  targetValue: targetVal,
                  scheduledAt: scheduledAt
              });
              alert("✅ Agendamento protocolado com sucesso.");
              setIsWABroadcastOpen(false);
              loadData();
          } finally { setIsSaving(false); }
          return;
      }

      // Envio Direto
      setIsSaving(true);
      try {
          await api.post('/communication/whatsapp-broadcast', {
              message: waMessage,
              targetType: waType,
              targetRole: waTargetRole,
              userId: waTargetUserId,
              directNumber: waDirectNumber.replace(/\D/g, ''),
              footer: systemInfo?.whatsapp_config?.footer || systemInfo?.shortName
          });
          alert("✅ Protocolo de envio processado pelo Gateway.");
          setIsWABroadcastOpen(false);
          setWaMessage('');
          loadData();
      } catch (e: any) {
          alert(`🛑 Erro de Gateway: ${e.response?.data?.error || "Timeout"}`);
      } finally { setIsSaving(false); }
  };

  const handleSaveNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNotice?.title || !editingNotice?.content) return;
    setIsSaving(true);
    try {
        if (editingNotice.id) await communicationService.updateNotice(editingNotice.id, editingNotice);
        else await communicationService.sendNotice(editingNotice);
        setIsModalOpen(false);
        setEditingNotice(null);
        loadData();
    } finally { setIsSaving(false); }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-6 animate-fade-in pb-12 h-full relative">
        {/* HEADER GERAL */}
        <header className="flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl shrink-0 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
            <div className="relative z-10 flex items-center gap-5">
                <div className="p-4 bg-indigo-600 rounded-2xl shadow-xl"><Megaphone size={28}/></div>
                <div>
                    <h2 className="text-3xl font-black tracking-tighter leading-none uppercase">Comunicação Ativa</h2>
                    <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mt-2">Mural S.I.E PRO & Messenger Gateway</p>
                </div>
            </div>
            <div className="flex gap-4 relative z-10">
                <button onClick={() => setIsWABroadcastOpen(true)} className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-2xl transition-all flex items-center gap-3 active:scale-95 border border-emerald-500/50">
                    <MessageCircle size={18}/> Messenger Gateway
                </button>
                <button 
                  onClick={() => { 
                    setEditingNotice({ title: '', content: '', urgency: 'LOW', date: new Date().toISOString().split('T')[0] }); 
                    setIsModalOpen(true); 
                  }} 
                  className="px-8 py-4 bg-white text-slate-950 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-2xl hover:bg-indigo-50 transition-all flex items-center gap-2 active:scale-95"
                >
                    <Plus size={18}/> Novo Aviso
                </button>
            </div>
        </header>

        {/* ÁREA DE CONTEÚDO */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-12">
            
            {/* FILA DE AGENDAMENTO (SRE DASHBOARD) */}
            {schedules.length > 0 && (
                <section className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden animate-slide-up">
                    <div className="p-8 border-b bg-slate-50/50 flex justify-between items-center">
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                            <Clock size={18} className="text-indigo-600"/> Fila de Automação Ativa
                        </h4>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                            <span className="text-[9px] font-black text-slate-400 uppercase">Heartbeat Online</span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                <tr>
                                    <th className="p-6 border-b">Alvo</th>
                                    <th className="p-6 border-b">Conteúdo</th>
                                    <th className="p-6 border-b">Execução</th>
                                    <th className="p-6 border-b">Estado</th>
                                    <th className="p-6 border-b text-right">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {schedules.map(s => (
                                    <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="p-6"><span className="text-[10px] font-black text-slate-700 uppercase bg-slate-100 px-3 py-1 rounded-lg">{s.target_type}: {s.target_value}</span></td>
                                        <td className="p-6 text-xs text-slate-500 truncate max-w-xs uppercase font-medium">{s.message_body}</td>
                                        <td className="p-6 text-[10px] font-black text-indigo-600">{new Date(s.scheduled_at).toLocaleString('pt-BR')}</td>
                                        <td className="p-6">
                                            <span className={`px-4 py-1 rounded-lg text-[9px] font-black uppercase border ${s.status === 'SENT' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : s.status === 'FAILED' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                                {s.status === 'PENDING' ? 'Aguardando' : s.status === 'SENT' ? 'Enviado' : 'Falha'}
                                            </span>
                                        </td>
                                        <td className="p-6 text-right">
                                            <button onClick={() => communicationService.deleteSchedule(s.id).then(loadData)} className="p-3 text-slate-300 hover:text-rose-600 transition-colors bg-white rounded-xl shadow-sm border border-slate-100">
                                                <Trash2 size={16}/>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {/* MURAL DE AVISOS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-10">
                {notices.map(notice => (
                    <div key={notice.id} className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col min-h-[320px]">
                        <div className={`absolute top-0 left-0 w-2.5 h-full ${notice.urgency === 'HIGH' ? 'bg-rose-500 shadow-[0_0_15px_#ef4444]' : notice.urgency === 'MEDIUM' ? 'bg-amber-500' : 'bg-indigo-500'}`}></div>
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-3">
                                <span className="px-4 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl text-[9px] font-black uppercase tracking-widest">Protocolo #{notice.id}</span>
                                {notice.urgency === 'HIGH' && <span className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-[8px] font-black uppercase tracking-widest"><AlertTriangle size={10}/> Urgente</span>}
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                                <button onClick={() => { setEditingNotice(notice); setIsModalOpen(true); }} className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 rounded-xl shadow-sm"><Edit2 size={18}/></button>
                                <button onClick={() => { if(confirm("Remover aviso oficial?")) communicationService.deleteNotice(notice.id).then(loadData); }} className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-rose-600 rounded-xl shadow-sm"><Trash2 size={18}/></button>
                            </div>
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-4 leading-tight">{notice.title}</h3>
                        <p className="text-slate-500 font-medium leading-relaxed mb-10 line-clamp-6 uppercase text-xs flex-1">{notice.content}</p>
                        <div className="pt-6 border-t border-slate-50 flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            <div className="flex items-center gap-2"><Clock size={14}/> Publicado em: {new Date(notice.date).toLocaleDateString('pt-BR')}</div>
                            <button className="text-indigo-600 hover:underline flex items-center gap-2">Detalhes <ArrowRight size={12}/></button>
                        </div>
                    </div>
                ))}
                {notices.length === 0 && !isLoading && (
                    <div className="col-span-full py-40 text-center bg-slate-50 rounded-[4rem] border-2 border-dashed border-slate-200">
                        <Megaphone size={64} className="mx-auto text-slate-200 mb-6 opacity-20"/>
                        <p className="font-black uppercase text-[10px] text-slate-400 tracking-[0.4em]">Mural limpo. Nenhum aviso pendente no cluster.</p>
                    </div>
                )}
            </div>
        </div>

        {/* MODAL: MESSENGER GATEWAY (IMERSIVO) */}
        {isWABroadcastOpen && (
            <div className="sie-editor-overlay">
                <div className="sie-modal-container !h-[90vh] !max-w-5xl">
                    <div className="h-24 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-white/5 shadow-2xl relative z-20">
                        <div className="flex items-center gap-6">
                            <div className="p-4 bg-emerald-600 rounded-[1.5rem] shadow-xl animate-pulse"><MessageCircle size={28}/></div>
                            <div>
                                <h3 className="font-black text-2xl uppercase tracking-tighter leading-none">Messenger Gateway</h3>
                                <p className="text-emerald-400 text-[10px] font-black uppercase mt-2 tracking-widest opacity-80">JennyAI Active Bridge • Protocolo SRE V5.0</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10 mr-4">
                                <button onClick={() => setActiveWAMode('DIRECT')} className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeWAMode === 'DIRECT' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Envio Imediato</button>
                                <button onClick={() => setActiveWAMode('SCHEDULE')} className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${activeWAMode === 'SCHEDULE' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Agendar Fluxo</button>
                            </div>
                            <button onClick={handleSendWABroadcast} disabled={isSaving} className={`px-8 py-3.5 ${activeWAMode === 'DIRECT' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-indigo-600 hover:bg-indigo-500'} text-white rounded-xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center gap-3 shadow-xl active:scale-95`}>
                                {isSaving ? <Loader2 className="animate-spin" size={16}/> : activeWAMode === 'DIRECT' ? <Send size={16}/> : <Calendar size={16}/>} 
                                {activeWAMode === 'DIRECT' ? 'Disparar Agora' : 'Programar Automação'}
                            </button>
                            <button onClick={() => setIsWABroadcastOpen(false)} className="p-4 hover:bg-rose-500 hover:text-white text-slate-400 rounded-2xl transition-all border border-white/5 ml-4"><X size={28} /></button>
                        </div>
                    </div>

                    <div className="flex-1 flex overflow-hidden bg-[#fdfdfe]">
                        {/* Sidebar de Instruções e Variáveis */}
                        <div className="w-[340px] bg-slate-50 border-r p-10 flex flex-col gap-8 shrink-0">
                            <div className="space-y-4">
                                <h5 className="text-[11px] font-black uppercase text-slate-900 tracking-widest flex items-center gap-2"><Sparkles size={14} className="text-emerald-500"/> Variáveis Ativas</h5>
                                <p className="text-[10px] text-slate-500 font-medium leading-relaxed uppercase">Use as tags abaixo para personalizar sua mensagem para cada morador.</p>
                                <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                                    <code className="text-emerald-600 font-black text-xs">{"{nome}"}</code>
                                    <p className="text-[9px] text-slate-400 uppercase mt-1">Insere o primeiro nome do membro.</p>
                                </div>
                            </div>
                            
                            <div className="p-6 bg-amber-50 border border-amber-100 rounded-[2rem] space-y-4">
                                <h6 className="text-[10px] font-black text-amber-900 uppercase tracking-widest flex items-center gap-2"><Shield size={14}/> Segurança SRE</h6>
                                <p className="text-[9px] text-amber-800 font-medium leading-relaxed uppercase">O Gateway JennyAI possui cadência de 3s entre disparos para evitar bloqueios de SPAM e garantir integridade da rota.</p>
                            </div>

                            <div className="mt-auto pt-6 border-t border-slate-200">
                                <div className="flex items-center gap-4 opacity-40">
                                    <Brain size={24} className="text-indigo-600"/>
                                    <div>
                                        <p className="text-[9px] font-black text-slate-900 uppercase">Neural Dispatch</p>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase">SRE Architecture</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Área Principal do Form */}
                        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                            <div className="max-w-3xl mx-auto space-y-12">
                                
                                {/* Seleção de Destino */}
                                <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-200 space-y-8">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Protocolo de Destino</label>
                                        <div className="grid grid-cols-3 gap-4">
                                            {[
                                                { id: 'ROLE', label: 'Por Cargo', icon: Shield },
                                                { id: 'USER', label: 'Membro Específico', icon: UserCheck },
                                                { id: 'DIRECT', label: 'Número Direto', icon: Smartphone }
                                            ].map(opt => (
                                                <button key={opt.id} onClick={() => setWaType(opt.id as any)} className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 ${waType === opt.id ? 'bg-white border-emerald-500 text-emerald-600 shadow-xl scale-105' : 'bg-white/50 border-slate-100 text-slate-400 hover:border-slate-200'}`}>
                                                    <opt.icon size={24}/><span className="text-[9px] font-black uppercase tracking-tight">{opt.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {waType === 'ROLE' && (
                                        <div className="animate-fade-in space-y-2">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Filtro de Hierarquia</label>
                                            <select className="w-full h-14 bg-white border border-slate-200 rounded-xl px-6 text-sm font-black uppercase shadow-sm outline-none focus:border-emerald-500" value={waTargetRole} onChange={e => setWaTargetRole(e.target.value)}>
                                                <option value="ALL">Todos os Membros Ativos</option>
                                                <option value="ADMIN">Apenas Administradores</option>
                                                <option value="RESIDENT">Apenas Moradores</option>
                                                <option value="COUNCIL">Corpo Diretivo / Conselho</option>
                                            </select>
                                        </div>
                                    )}

                                    {waType === 'USER' && (
                                        <div className="animate-fade-in space-y-2">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Selecionar Membro Localizado</label>
                                            <select className="w-full h-14 bg-white border border-slate-200 rounded-xl px-6 text-sm font-black uppercase shadow-sm outline-none focus:border-emerald-500" value={waTargetUserId} onChange={e => setWaTargetUserId(e.target.value)}>
                                                <option value="">Escolha um membro do cluster...</option>
                                                {users.map(u => <option key={u.id} value={u.id}>{u.name} (UNID. {u.unit})</option>)}
                                            </select>
                                        </div>
                                    )}

                                    {waType === 'DIRECT' && (
                                        <div className="animate-fade-in space-y-2">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Entrada Manual de Telefone</label>
                                            <input className="w-full h-14 bg-white border border-slate-200 rounded-xl px-6 text-lg font-black shadow-sm outline-none focus:border-emerald-500" placeholder="Ex: 5511999998888" value={waDirectNumber} onChange={e => setWaDirectNumber(e.target.value)} />
                                        </div>
                                    )}

                                    {activeWAMode === 'SCHEDULE' && (
                                        <div className="animate-fade-in space-y-2 p-6 bg-indigo-50 border border-indigo-100 rounded-[2rem]">
                                            <label className="text-[9px] font-black text-indigo-600 uppercase tracking-widest ml-1">Execução Temporal (Data/Hora)</label>
                                            <input type="datetime-local" className="w-full h-14 bg-white border border-indigo-200 rounded-xl px-6 text-base font-black shadow-sm outline-none focus:border-indigo-500" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
                                        </div>
                                    )}
                                </div>

                                {/* Corpo da Mensagem */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Conteúdo do Disparo</label>
                                        <span className="text-[9px] font-bold text-slate-300 uppercase">{waMessage.length} caracteres</span>
                                    </div>
                                    <textarea 
                                        rows={8} 
                                        className="w-full bg-white border border-slate-200 rounded-[2.5rem] p-10 text-lg font-medium shadow-sm focus:border-emerald-500 transition-all outline-none uppercase leading-relaxed placeholder:text-slate-200" 
                                        placeholder="Digite a mensagem oficial aqui... Lembre-se: use {nome} para humanizar o contato." 
                                        value={waMessage} 
                                        onChange={e => setWaMessage(e.target.value)}
                                    />
                                    
                                    {/* PREVIEW DO FOOTER */}
                                    <div className="px-10 py-6 bg-slate-50 border border-slate-100 rounded-3xl flex justify-between items-center opacity-60 grayscale">
                                        <div className="flex items-center gap-3">
                                            <Info size={14}/>
                                            <span className="text-[9px] font-black uppercase">Rodapé: {systemInfo?.whatsapp_config?.footer || systemInfo?.shortName}</span>
                                        </div>
                                        <span className="text-[8px] font-bold uppercase">Sincronizado via Configurações</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 border-t bg-slate-50 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-3"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SRE Active Bridge v525.0 (READY)</span></div>
                        <div className="flex gap-4">
                            <button onClick={() => setIsWABroadcastOpen(false)} className="px-8 py-3.5 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors">Abortar</button>
                            <button onClick={handleSendWABroadcast} disabled={isSaving || !waMessage.trim()} className={`px-12 py-3.5 ${activeWAMode === 'DIRECT' ? 'bg-emerald-600 shadow-emerald-500/20' : 'bg-indigo-600 shadow-indigo-500/20'} text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 transition-all`}>
                                {isSaving ? 'Sincronizando...' : activeWAMode === 'DIRECT' ? 'Executar Disparo' : 'Confirmar Automação'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* MODAL: MURAL DE AVISOS (LEGACY ENHANCED) */}
        {isModalOpen && editingNotice && (
            <div className="sie-editor-overlay">
                <div className="sie-modal-container !h-auto !max-w-3xl self-center">
                    <form onSubmit={handleSaveNotice} className="flex flex-col h-full overflow-hidden">
                        <div className="h-20 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-white/5">
                            <div className="flex items-center gap-5">
                                <div className="p-3.5 bg-indigo-600 rounded-xl shadow-xl"><Megaphone size={22}/></div>
                                <div>
                                    <h3 className="font-black text-xl uppercase tracking-tighter leading-none">Aviso Oficial</h3>
                                    <p className="text-indigo-400 text-[9px] font-black uppercase mt-1.5 tracking-widest opacity-80">Protocolo de Publicação - {systemInfo.shortName}</p>
                                </div>
                            </div>
                            <button type="button" onClick={() => setIsModalOpen(false)} className="p-3.5 hover:bg-rose-500 hover:text-white text-slate-400 rounded-xl transition-all"><X size={28}/></button>
                        </div>
                        <div className="p-10 space-y-8 bg-[#fdfdfe]">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Título do Comunicado</label>
                                <input required className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-xl focus:bg-white focus:border-indigo-500 transition-all outline-none uppercase" value={editingNotice.title} onChange={e => setEditingNotice({...editingNotice, title: e.target.value})} placeholder="Assunto..." />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Conteúdo Detalhado</label>
                                <textarea rows={6} required className="w-full font-medium bg-slate-50 border border-slate-200 rounded-[2rem] p-8 text-base focus:bg-white focus:border-indigo-500 transition-all outline-none uppercase leading-relaxed" value={editingNotice.content} onChange={e => setEditingNotice({...editingNotice, content: e.target.value})} placeholder="Escreva o comunicado oficial..." />
                            </div>
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Urgência Visual</label>
                                    <select className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-[10px] font-black uppercase outline-none" value={editingNotice.urgency} onChange={e => setEditingNotice({...editingNotice, urgency: e.target.value})}>
                                        <option value="LOW">Baixa (Informativo)</option>
                                        <option value="MEDIUM">Média (Importante)</option>
                                        <option value="HIGH">Crítica (Urgente)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Data do Aviso</label>
                                    <input type="date" required className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-sm font-black outline-none" value={editingNotice.date} onChange={e => setEditingNotice({...editingNotice, date: e.target.value})} />
                                </div>
                            </div>
                            <button type="submit" disabled={isSaving} className="w-full py-6 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:bg-indigo-600 transition-all active:scale-95">
                                {isSaving ? <Loader2 className="animate-spin" /> : 'Publicar no Mural'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default Communication;
