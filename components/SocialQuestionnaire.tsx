import React, { useEffect, useState, useMemo } from 'react';
import { User, Survey, SurveyQuestion } from '../types';
import { AlertTriangle, Activity, Loader2, Save, RefreshCw, ClipboardCheck, History, X, ChevronRight, FileText, Sparkles, Brain } from 'lucide-react';
import { surveyService } from '../services/api';
import { normalizeCPF } from '../utils/cpf';

interface SocialQuestionnaireProps {
  user: User;
  onSave: (data: any) => void;
  onCancel: () => void;
}

const SocialQuestionnaire = ({ user, onSave, onCancel }: SocialQuestionnaireProps) => {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [activeSurvey, setActiveSurvey] = useState<Survey | null>(null);
  const [historicalResponses, setHistoricalResponses] = useState<any[]>([]);
  const [selectedResponseIndex, setSelectedResponseIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { initDossier(); }, [user.id, user.cpf_cnpj]);

  const initDossier = async () => {
    setLoading(true);
    setError(null);
    try {
      const cleanCPF = normalizeCPF(user.cpf_cnpj);
      const [surveysRes, responsesRes] = await Promise.all([
        surveyService.getAll(),
        surveyService.getResponsesByCpf(cleanCPF)
      ]);
      
      const allSurveys = surveysRes.data?.data || [];
      const responses = responsesRes.data?.data || [];
      setHistoricalResponses(responses);

      if (responses.length > 0) {
          const latest = responses[0];
          const surveyStructure = allSurveys.find((s: Survey) => s.id === latest.survey_id);
          setActiveSurvey(surveyStructure || allSurveys[0] || null);
          setFormData(latest.answers || {});
      } else {
          const currentActive = allSurveys.find((s: Survey) => s.type === 'CENSUS' && s.status === 'ACTIVE') || allSurveys[0];
          setActiveSurvey(currentActive || null);
          setFormData(user.socialData || {});
      }
    } catch (e) { setError("O Kernel não conseguiu sincronizar o Ledger Social."); } 
    finally { setLoading(false); }
  };

  // SRE FIX: Protocolo de resiliência para garantir que as questões sejam sempre tratadas como array
  const safeQuestions = useMemo(() => {
    if (!activeSurvey?.questions) return [];
    if (Array.isArray(activeSurvey.questions)) return activeSurvey.questions;
    try {
        const parsed = JSON.parse(activeSurvey.questions as string);
        return Array.isArray(parsed) ? parsed : [];
    } catch (e) { return []; }
  }, [activeSurvey?.questions]);

  const calculateRisk = () => {
      let risk = 0;
      // SRE FIX: Uso de safeQuestions para evitar erro de iteração em string
      if (safeQuestions.length === 0) return 0;
      safeQuestions.forEach(q => {
          const val = formData[q.id];
          if (!val) return;
          const valStr = String(val).toUpperCase();
          if (q.mapping_tag === 'FINANCE' && (valStr.includes('BAIXA') || valStr.includes('2 SM'))) risk += 40;
          if (q.mapping_tag === 'HEALTH' && valStr === 'SIM') risk += 30;
          if (q.mapping_tag === 'GOV_AID' && valStr === 'SIM') risk += 20;
      });
      return Math.min(risk, 100);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 animate-pulse">
      <Loader2 className="animate-spin text-indigo-600 mb-6" size={56}/>
      <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">Consultando Ledger Territorial...</p>
    </div>
  );

  return (
    <div className="h-full flex flex-col lg:flex-row gap-10 animate-fade-in">
      
      {/* Coluna de Histórico */}
      <div className="w-full lg:w-[380px] flex flex-col gap-6 shrink-0">
          <div className="bg-slate-900 p-10 rounded-[3rem] border border-white/5 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10"><Brain size={140} /></div>
            <div className="relative z-10 space-y-4">
                <div className="px-4 py-1.5 bg-indigo-500/20 border border-indigo-500/30 rounded-full w-fit">
                    <span className="text-[9px] font-black uppercase tracking-widest text-indigo-300">Identity Audit Hub</span>
                </div>
                <h3 className="font-black text-2xl tracking-tight uppercase">Dossiê Social</h3>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[3.5rem] border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
              <h5 className="text-[11px] font-black uppercase text-slate-400 tracking-widest mb-8 flex items-center gap-3">
                  <History size={16} className="text-indigo-600"/> Linha do Tempo
              </h5>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-3">
                  {historicalResponses.length > 0 ? historicalResponses.map((resp, idx) => (
                      <button 
                        key={resp.id} 
                        onClick={() => { setSelectedResponseIndex(idx); setFormData(resp.answers || {}); }}
                        className={`w-full p-6 rounded-[2rem] border text-left transition-all group ${selectedResponseIndex === idx ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl scale-[1.02]' : 'bg-slate-50 border-slate-100 hover:border-indigo-200'}`}
                      >
                          <div className="flex justify-between items-start mb-3">
                              <span className={`text-[8px] font-black uppercase px-3 py-1 rounded-lg ${selectedResponseIndex === idx ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-600'}`}>Snapshot #{resp.id}</span>
                              <ChevronRight size={16} className={selectedResponseIndex === idx ? 'text-white' : 'text-slate-300'}/>
                          </div>
                          <p className={`text-sm font-black uppercase truncate ${selectedResponseIndex === idx ? 'text-white' : 'text-slate-800'}`}>Sincronização Digital</p>
                          <p className={`text-[10px] font-bold mt-2 ${selectedResponseIndex === idx ? 'text-indigo-200' : 'text-slate-400'}`}>{new Date(resp.created_at).toLocaleDateString('pt-BR')} • {new Date(resp.created_at).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</p>
                      </button>
                  )) : (
                      <div className="py-20 text-center opacity-30">
                          <AlertTriangle size={48} className="mx-auto text-slate-400 mb-4"/>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sem registros no Ledger</p>
                      </div>
                  )}
              </div>

              <div className={`mt-8 p-8 rounded-[2.5rem] border flex flex-col items-center justify-center text-center shadow-inner ${calculateRisk() > 60 ? 'bg-rose-50 border-rose-100' : 'bg-emerald-50 border-emerald-100'}`}>
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Score de Risco Territorial</p>
                  <div className="flex items-center gap-4">
                      <Activity size={32} className={calculateRisk() > 60 ? 'text-rose-500' : 'text-emerald-500'} />
                      <h4 className={`text-4xl font-black ${calculateRisk() > 60 ? 'text-rose-600' : 'text-emerald-600'}`}>{calculateRisk()}%</h4>
                  </div>
              </div>
          </div>
      </div>

      {/* Grid de Respostas */}
      <div className="flex-1 bg-white p-12 rounded-[4rem] border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          <div className="flex justify-between items-center mb-12 pb-8 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-6">
                  <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100 shadow-inner"><ClipboardCheck size={32}/></div>
                  <div>
                      <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tight">{activeSurvey?.title || 'Protocolo de Resposta'}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Dados auditados e protegidos por protocolo SRE</p>
                  </div>
              </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pr-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pb-20">
                  {/* SRE FIX: Renderização via safeQuestions para evitar erro de iteração em string */}
                  {safeQuestions.map((q, idx) => (
                      <div key={q.id} className="space-y-4 group border-l-2 border-slate-100 pl-8 hover:border-indigo-500 transition-all">
                          <label className="flex items-center gap-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">
                              <span className="w-8 h-8 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-[10px] text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-all">{(idx + 1).toString().padStart(2, '0')}</span>
                              {q.text}
                          </label>
                          <div className="p-6 bg-slate-50 border border-slate-100 rounded-2xl group-hover:bg-white group-hover:border-indigo-200 group-hover:shadow-lg transition-all">
                                <p className="text-base font-black text-slate-800 uppercase leading-none">{String(formData[q.id] || 'NÃO INFORMADO')}</p>
                                <div className="mt-4 flex items-center gap-3 opacity-40">
                                    <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 uppercase">TAG: {q.mapping_tag}</span>
                                </div>
                          </div>
                      </div>
                  ))}
                  {(safeQuestions.length === 0) && (
                      <div className="col-span-full py-40 text-center opacity-30">
                          <FileText size={64} className="mx-auto text-slate-400 mb-6"/>
                          <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Nenhum snapshot de dados localizado.</p>
                      </div>
                  )}
              </div>
          </div>

          <div className="mt-auto pt-10 border-t border-slate-100 flex justify-end gap-6 shrink-0">
            <button onClick={onCancel} className="px-10 py-5 text-slate-400 font-black text-[11px] uppercase tracking-widest hover:text-slate-600">Fechar</button>
            <button onClick={() => onSave(formData)} className="px-14 py-5 bg-slate-950 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-widest shadow-2xl hover:bg-indigo-600 transition-all active:scale-95 flex items-center gap-4">
              <Save size={20}/> Sincronizar Dossiê
            </button>
          </div>
      </div>
    </div>
  );
};

export default SocialQuestionnaire;