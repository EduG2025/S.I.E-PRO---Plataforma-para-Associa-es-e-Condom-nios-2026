
import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, Send, Loader2, X, Trash2, CircleCheck, Info, Save } from 'lucide-react';
import { suggestionService } from '../services/api';
import { SystemInfo } from '../types';

interface SuggestionBoxProps {
    systemInfo: SystemInfo;
}

const SuggestionBox = ({ systemInfo }: SuggestionBoxProps) => {
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newSuggestion, setNewSuggestion] = useState({ title: '', content: '', category: 'SUGGESTION' });

  useEffect(() => { loadSuggestions(); }, []);

  const loadSuggestions = async () => {
    setIsLoading(true);
    try {
      const res = await suggestionService.getAll();
      const data = res.data?.data || (Array.isArray(res.data) ? res.data : []);
      setSuggestions(data);
    } catch (e) {
      setSuggestions([]);
    } finally { setIsLoading(false); }
  };

  const handleSave = async (e: any) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await suggestionService.create(newSuggestion);
      setIsModalOpen(false);
      setNewSuggestion({ title: '', content: '', category: 'SUGGESTION' });
      loadSuggestions();
    } catch (err) {
        alert("Erro ao enviar sugestão.");
    } finally { setIsSaving(false); }
  };

  const handleToggleStatus = async (id: number, currentStatus: string) => {
      try {
          await suggestionService.update(id, { status: currentStatus === 'RESOLVED' ? 'OPEN' : 'RESOLVED' });
          loadSuggestions();
      } catch (err) {
          alert("Falha ao atualizar status.");
      }
  };

  const handleDelete = async (id: number) => {
      if (!confirm("Remover esta manifestação?")) return;
      try {
          await suggestionService.delete(id);
          loadSuggestions();
      } catch (err) {
          alert("Falha ao excluir.");
      }
  };

  const primaryColor = systemInfo.primaryColor || '#4f46e5';

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-6 animate-fade-in h-full relative">
      <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900 p-10 rounded-[3rem] text-white shadow-xl shrink-0 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="flex items-center gap-6 relative z-10">
          <div className="p-4 bg-indigo-600 rounded-2xl shadow-xl" style={{ backgroundColor: primaryColor }}><MessageSquare size={28}/></div>
          <div>
            <h2 className="text-3xl font-black tracking-tighter uppercase leading-none">Ouvidoria Digital</h2>
            <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2 opacity-80">Canal Direto de Co-Gestão S.I.E</p>
          </div>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="px-12 py-5 bg-white text-slate-900 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl hover:bg-indigo-50 transition-all active:scale-95 flex items-center gap-3 relative z-10">
            <Plus size={22}/> Nova Manifestação
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pb-12">
        {isLoading ? <div className="p-20 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={48} style={{ color: primaryColor }}/></div> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {suggestions.map(s => (
                    <div key={s.id} className={`bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm group relative transition-all hover:shadow-xl hover:border-indigo-200 ${s.status === 'RESOLVED' ? 'opacity-60 bg-slate-50 border-dashed' : ''}`}>
                        <div className="absolute top-8 right-8 flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                            <button onClick={() => handleToggleStatus(s.id, s.status)} className={`p-2.5 rounded-xl border transition-all ${s.status === 'RESOLVED' ? 'bg-amber-50 text-amber-500 border-amber-100' : 'bg-emerald-50 text-emerald-500 border-emerald-100'}`} title="Concluir Fluxo">
                                <CircleCheck size={20}/>
                            </button>
                            <button onClick={() => handleDelete(s.id)} className="p-2.5 bg-rose-50 text-rose-400 border border-rose-100 rounded-xl hover:bg-rose-500 hover:text-white transition-all" title="Expurgar"><Trash2 size={20}/></button>
                        </div>
                        <div className="flex items-center gap-4 mb-8">
                            <span className="text-[9px] font-black uppercase text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100 tracking-widest" style={{ color: primaryColor, backgroundColor: primaryColor + '10', borderColor: primaryColor + '30' }}>{s.category}</span>
                            {s.status === 'RESOLVED' && <span className="text-[8px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Protocolo Encerrado</span>}
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight leading-tight mb-4 uppercase">{s.title}</h3>
                        <p className="text-sm text-slate-500 line-clamp-4 font-medium leading-relaxed uppercase">{s.content}</p>
                        
                        <div className="mt-10 pt-6 border-t border-slate-50 flex items-center gap-2">
                             <Info size={14} className="text-slate-300"/>
                             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ID SRE #742{s.id} • Ativo</span>
                        </div>
                    </div>
                ))}
                {suggestions.length === 0 && (
                    <div className="col-span-full py-40 text-center bg-slate-50 rounded-[4rem] border-2 border-dashed border-slate-200">
                        <MessageSquare size={64} className="mx-auto text-slate-200 mb-6 opacity-30"/>
                        <p className="font-black uppercase text-[10px] text-slate-400 tracking-[0.4em]">Ouvidoria Limpa. Nenhuma manifestação protocolada.</p>
                    </div>
                )}
            </div>
        )}
      </div>

      {isModalOpen && (
          <div className="sie-editor-overlay">
              <div className="sie-modal-container">
                    <div className="h-20 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 shadow-2xl relative z-20 border-b border-white/5">
                        <div className="flex items-center gap-5">
                            <div className="p-3.5 bg-indigo-600 rounded-xl shadow-xl" style={{ backgroundColor: primaryColor }}><Send size={22}/></div>
                            <div>
                                <h3 className="font-black text-xl uppercase tracking-tighter leading-none">Canal de Ouvidoria</h3>
                                <p className="text-indigo-400 text-[9px] font-black uppercase mt-1.5 tracking-widest opacity-80">SRE Transparência Digital V5.0</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button onClick={handleSave} disabled={isSaving} className="px-10 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center gap-3 shadow-xl active:scale-95" style={{ backgroundColor: primaryColor }}>
                                {isSaving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Commitar Manifestação
                            </button>
                            <button onClick={() => setIsModalOpen(false)} className="p-3.5 hover:bg-rose-500 hover:text-white text-slate-400 rounded-xl transition-all border border-white/5"><X size={24}/></button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-[#fdfdfe] relative">
                        <form onSubmit={handleSave} className="max-w-3xl mx-auto space-y-12 pb-10">
                            <div className="bg-slate-50 p-12 rounded-[3.5rem] border border-slate-200 shadow-inner space-y-10">
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Assunto Principal</label>
                                    <input required className="w-full font-black h-16 bg-white border border-slate-200 rounded-[1.5rem] px-8 text-2xl focus:border-indigo-500 transition-all shadow-sm" placeholder="Resumo breve da manifestação..." value={newSuggestion.title} onChange={e => setNewSuggestion({...newSuggestion, title: e.target.value})} />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Contexto Detalhado</label>
                                    <textarea rows={8} className="w-full font-medium bg-white border border-slate-200 rounded-[2rem] p-10 text-lg focus:border-indigo-500 transition-all shadow-sm uppercase leading-relaxed" placeholder="Descreva sua sugestão, crítica ou elogio com clareza técnica..." value={newSuggestion.content} onChange={e => setNewSuggestion({...newSuggestion, content: e.target.value})} />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Classificação de Fluxo</label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        {['SUGGESTION', 'COMPLAINT', 'PRAISE', 'OTHERS'].map(cat => (
                                            <button key={cat} type="button" onClick={() => setNewSuggestion({...newSuggestion, category: cat})} className={`py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all ${newSuggestion.category === cat ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg scale-[1.02]' : 'bg-white border-slate-100 text-slate-400 hover:bg-slate-50'}`} style={newSuggestion.category === cat ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}>{cat}</button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>

                    <div className="p-8 border-t bg-slate-50 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-3"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Terminal de Ouvidoria Sincronizado</span></div>
                        <div className="flex gap-4">
                            <button onClick={() => setIsModalOpen(false)} className="px-8 py-3.5 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors">Abortar</button>
                            <button onClick={handleSave} className="px-12 py-3.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl">Enviar</button>
                        </div>
                    </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default SuggestionBox;
