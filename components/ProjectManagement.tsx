
import React, { useState, useEffect } from 'react';
import { CommunityProject, SystemInfo } from '../types';
import { projectService } from '../services/api';
import { 
  Plus, Search, Briefcase, TrendingUp, DollarSign, 
  Calendar, CheckCircle, Clock, Loader2, ChevronRight,
  Filter, BarChart3, Building2, ShieldAlert, X, Save,
  Users, MessageSquare, ThumbsUp, Camera, Landmark, Trash2, Edit2, Printer, Zap, Shield
} from 'lucide-react';

interface ProjectManagementProps {
    systemInfo: SystemInfo;
}

const ProjectManagement = ({ systemInfo }: ProjectManagementProps) => {
  const [projects, setProjects] = useState([] as CommunityProject[]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);

  useEffect(() => { loadProjects(); }, []);

  const loadProjects = async () => {
    setLoading(true);
    try {
      const res = await projectService.getAll();
      setProjects(res.data.data || []);
    } finally { setLoading(false); }
  };

  const handleOpenCreate = () => {
    setEditingProject({ title: '', description: '', budget: 0, spent: 0, progress: 0, startDate: new Date().toISOString().split('T')[0], category: 'INFRA', status: 'PLANNING' });
    setIsModalOpen(true);
  };

  const handleSave = async (e: any) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      if (editingProject.id) {
        await projectService.update(editingProject.id, editingProject);
      } else {
        await projectService.create(editingProject);
      }
      setIsModalOpen(false);
      loadProjects();
    } finally { setIsSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Excluir este projeto permanentemente?")) return;
    await projectService.delete(id);
    loadProjects();
  };

  const handlePrintReport = (project: any) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(`
            <html><head><title>Relatório S.I.E</title><style>body{font-family:sans-serif;padding:40px} .header{border-bottom:2px solid #333;margin-bottom:20px;padding-bottom:10px} .stat{display:flex;justify-content:space-between;padding:10px;background:#f9f9f9;margin-bottom:5px}</style></head>
            <body>
                <div class="header"><h1>Relatório de Projeto: ${project.title}</h1><p>Data: ${new Date().toLocaleDateString()}</p></div>
                <p><strong>Descrição:</strong> ${project.description}</p>
                <div class="stat"><span>Orçamento Aprovado:</span><span>R$ ${Number(project.budget).toLocaleString()}</span></div>
                <div class="stat"><span>Gasto Realizado:</span><span>R$ ${Number(project.spent).toLocaleString()}</span></div>
                <div class="stat"><span>Progresso Físico:</span><span>${project.progress}%</span></div>
                <div class="stat"><span>Status:</span><span>${project.status}</span></div>
            </body></html>
        `);
        printWindow.document.close();
        printWindow.print();
    }
  };

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={48} style={{ color: systemInfo.primaryColor }}/></div>;

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-6 animate-fade-in h-full relative">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-900 p-10 rounded-[3rem] text-white shadow-xl shrink-0 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="flex items-center gap-6 relative z-10">
            <div className="p-5 bg-indigo-600 rounded-[2rem] shadow-xl" style={{ backgroundColor: systemInfo.primaryColor }}><Building2 size={28}/></div>
            <div>
              <h2 className="text-3xl font-black tracking-tightest leading-none uppercase">Obras & Projetos</h2>
              <p className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.3em] mt-2 opacity-80">SRE Infrastructure Pipeline V5.0</p>
            </div>
        </div>
        <button onClick={handleOpenCreate} className="px-12 py-5 bg-white text-slate-950 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl hover:bg-indigo-50 transition-all active:scale-95 flex items-center gap-3 relative z-10">
          <Plus size={22}/> Novo Edital SRE
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {projects.map(project => (
                <div key={project.id} className="bg-white rounded-[3.5rem] border border-slate-200 p-10 shadow-sm hover:shadow-2xl transition-all flex flex-col h-full relative group">
                    <div className="absolute top-8 right-8 flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                        <button onClick={() => { setEditingProject(project); setIsModalOpen(true); }} className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 rounded-xl shadow-sm transition-all"><Edit2 size={18}/></button>
                        <button onClick={() => handlePrintReport(project)} className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-emerald-600 rounded-xl shadow-sm transition-all"><Printer size={18}/></button>
                        <button onClick={() => handleDelete(Number(project.id))} className="p-3 bg-white border border-slate-100 text-slate-400 hover:text-rose-600 rounded-xl shadow-sm transition-all"><Trash2 size={18}/></button>
                    </div>
                    
                    <div className="flex items-center gap-6 mb-8 mt-4">
                        <div className="w-16 h-16 bg-slate-950 text-white rounded-[1.5rem] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform" style={{ backgroundColor: systemInfo.primaryColor || '#020617' }}>
                            {project.category === 'INFRA' ? <Building2 size={32}/> : <Landmark size={32}/>}
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-slate-800 leading-none uppercase tracking-tight">{project.title}</h3>
                            <div className="flex items-center gap-3 mt-3">
                                <span className={`px-4 py-1 rounded-xl text-[8px] font-black uppercase border shadow-inner ${project.status === 'CONCLUÍDO' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`} style={project.status !== 'CONCLUÍDO' ? { color: systemInfo.primaryColor, borderColor: systemInfo.primaryColor + '40', backgroundColor: systemInfo.primaryColor + '10' } : {}}>{project.status}</span>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Início: {new Date(project.startDate).toLocaleDateString('pt-BR')}</span>
                            </div>
                        </div>
                    </div>

                    <p className="text-sm text-slate-500 font-medium leading-relaxed mb-10 flex-1 uppercase">{project.description}</p>

                    <div className="space-y-4 mb-10 bg-slate-50 p-8 rounded-[2rem] border border-slate-100 shadow-inner">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Execução Física</span>
                            <span className="text-base font-black text-indigo-600" style={{ color: systemInfo.primaryColor }}>{project.progress}%</span>
                        </div>
                        <div className="w-full h-4 bg-white rounded-full overflow-hidden border border-slate-200 shadow-inner">
                            <div className="h-full bg-indigo-600 shadow-[0_0_20px_rgba(79,70,229,0.5)] transition-all duration-1000" style={{ width: `${project.progress}%`, backgroundColor: systemInfo.primaryColor }}></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="p-6 bg-slate-50 rounded-[1.75rem] border border-slate-100 flex flex-col justify-center">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Capitais Aprovados</p>
                            <p className="text-xl font-black text-slate-800 tracking-tighter">R$ {Number(project.budget).toLocaleString('pt-BR')}</p>
                        </div>
                        <div className="p-6 bg-emerald-50 rounded-[1.75rem] border border-emerald-100 flex flex-col justify-center">
                            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Realizado Efetivo</p>
                            <p className="text-xl font-black text-emerald-800 tracking-tighter">R$ {Number(project.spent).toLocaleString('pt-BR')}</p>
                        </div>
                    </div>
                </div>
            ))}
            {projects.length === 0 && (
                <div className="col-span-full py-40 text-center bg-slate-50 rounded-[4rem] border-2 border-dashed border-slate-200">
                    <Building2 size={64} className="mx-auto text-slate-200 mb-6 opacity-30"/>
                    <p className="font-black uppercase text-[10px] text-slate-400 tracking-[0.4em]">Pipeline de Projetos Limpo. Nenhuma obra em curso.</p>
                </div>
            )}
        </div>
      </div>

      {isModalOpen && (
        <div className="sie-editor-overlay">
          <div className="sie-modal-container">
                <div className="h-20 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 shadow-2xl relative z-20 border-b border-white/5">
                    <div className="flex items-center gap-5">
                        <div className="p-3.5 bg-indigo-600 rounded-xl shadow-xl" style={{ backgroundColor: systemInfo.primaryColor }}><Zap size={22}/></div>
                        <div>
                            <h3 className="font-black text-xl uppercase tracking-tighter leading-none">Protocolar Empreendimento</h3>
                            <p className="text-indigo-400 text-[9px] font-black uppercase mt-1.5 tracking-widest opacity-80">SRE Infrastructure Planning Suite V5.0</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={handleSave} disabled={isSaving} className="px-10 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center gap-3 shadow-xl active:scale-95" style={{ backgroundColor: systemInfo.primaryColor }}>
                            {isSaving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Commitar Edital
                        </button>
                        <button onClick={() => setIsModalOpen(false)} className="p-3.5 hover:bg-rose-500 hover:text-white text-slate-400 rounded-xl transition-all border border-white/5"><X size={24}/></button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-[#fdfdfe] relative">
                    <form onSubmit={handleSave} className="max-w-5xl mx-auto space-y-12 pb-10">
                        <div className="bg-slate-50 p-12 rounded-[4rem] border border-slate-200 shadow-inner space-y-10">
                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Título do Empreendimento</label>
                                <input required className="w-full font-black h-20 bg-white border border-slate-200 rounded-[2rem] px-8 text-3xl focus:border-indigo-500 transition-all shadow-sm" placeholder="Ex: Revitalização do Pórtico Alfa..." value={editingProject.title} onChange={e => setEditingProject({...editingProject, title: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-3"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Orçamento Previsto (R$)</label><input type="number" className="w-full font-black h-16 bg-white border border-slate-200 rounded-[1.5rem] px-8 text-2xl shadow-sm focus:border-indigo-500" value={editingProject.budget} onChange={e => setEditingProject({...editingProject, budget: e.target.value})} /></div>
                                <div className="space-y-3"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Gasto Efetivado (R$)</label><input type="number" className="w-full font-black h-16 bg-white border border-slate-200 rounded-[1.5rem] px-8 text-2xl shadow-sm focus:border-indigo-500" value={editingProject.spent} onChange={e => setEditingProject({...editingProject, spent: e.target.value})} /></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-3"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Progresso Atual (%)</label><input type="number" min="0" max="100" className="w-full font-black h-16 bg-white border border-slate-200 rounded-[1.5rem] px-8 text-2xl shadow-sm focus:border-indigo-500" value={editingProject.progress} onChange={e => setEditingProject({...editingProject, progress: e.target.value})} /></div>
                                <div className="space-y-3"><label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Fase de Projeto</label>
                                    <select className="w-full font-black h-16 bg-white border border-slate-200 rounded-[1.5rem] px-8 text-sm uppercase appearance-none shadow-sm" value={editingProject.status} onChange={e => setEditingProject({...editingProject, status: e.target.value as any})}>
                                        <option value="PLANNING">Fase 01: Planejamento / Orçamentação</option>
                                        <option value="EM_EXECUÇÃO">Fase 02: Execução Física em Curso</option>
                                        <option value="CONCLUÍDO">Fase 03: Entrega e Finalização</option>
                                        <option value="CANCELADO">Protocolo de Cancelamento</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Descrição Técnica & Memorial</label>
                                <textarea rows={8} className="w-full font-medium bg-white border border-slate-200 rounded-[2.5rem] p-10 text-lg focus:border-indigo-500 transition-all shadow-sm uppercase leading-relaxed" placeholder="Detalhes técnicos, fornecedores e cronograma previsto..." value={editingProject.description} onChange={e => setEditingProject({...editingProject, description: e.target.value})} />
                            </div>
                        </div>
                        <div className="p-8 bg-indigo-900/5 border border-indigo-100 rounded-[3rem] flex flex-col md:flex-row gap-8 items-center shadow-sm">
                            <div className="flex items-center gap-6 flex-1">
                                <div className="p-4 bg-white rounded-2xl shadow-sm text-indigo-600" style={{ color: systemInfo.primaryColor }}><Shield size={28}/></div>
                                <div>
                                    <p className="text-base font-black text-indigo-950 uppercase tracking-tight">Transparência SRE</p>
                                    <p className="text-[10px] text-indigo-400 font-bold uppercase mt-1 tracking-widest">Os dados de execução física e financeira são auditáveis por todos os membros do Conselho.</p>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="p-8 border-t bg-slate-50 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocolo de Engenharia Ativo</span>
                    </div>
                    <div className="flex gap-4">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-3.5 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors">Abortar</button>
                        <button type="submit" onClick={handleSave} className="px-12 py-3.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl">Salvar Edital</button>
                    </div>
                </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManagement;
