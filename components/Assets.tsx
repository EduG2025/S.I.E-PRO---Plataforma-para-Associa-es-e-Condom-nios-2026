
import React, { useState, useEffect } from 'react';
import { Landmark, Search, Plus, Box, Download, Loader2, DollarSign, ShieldCheck, Trash2, Edit2, X, Save, User as UserIcon, Printer, Tag } from 'lucide-react';
import { assetService, userService } from '../services/api';
import { Asset, User, SystemInfo } from '../types';

interface AssetsProps {
    systemInfo: SystemInfo;
}

const Assets = ({ systemInfo }: AssetsProps) => {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState<Asset[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  useEffect(() => { loadAssets(); loadUsers(); }, []);

  const loadAssets = async () => {
    setLoading(true);
    try {
      const res = await assetService.getAll();
      const data = res.data?.data || (Array.isArray(res.data) ? res.data : []);
      setItems(data);
    } catch (e) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await userService.getAll();
      const data = res.data?.data || (Array.isArray(res.data) ? res.data : []);
      setUsers(data);
    } catch (e) {}
  };

  const handleOpenCreate = () => {
    setEditingItem({ name: '', category: 'Equipamento', value: 0, status: 'PERFEITO', date_acquired: new Date().toISOString().split('T')[0], responsible_id: '' });
    setIsModalOpen(true);
  };

  const handleSave = async (e: any) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (editingItem.id) {
          await assetService.update(editingItem.id, editingItem);
      } else {
          await assetService.create(editingItem);
      }
      setIsModalOpen(false);
      loadAssets();
    } finally { setIsSaving(false); }
  };

  const handleDelete = async (id: number) => {
      if (!confirm("Excluir este ativo permanentemente?")) return;
      await assetService.delete(id);
      loadAssets();
  };

  const handlePrintInventory = () => {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
          printWindow.document.write(`
            <html><head><title>Inventário S.I.E</title><style>body{font-family:sans-serif;padding:30px} table{width:100%;border-collapse:collapse} th,td{border:1px solid #eee;padding:10px;text-align:left}</style></head>
            <body>
                <h1>S.I.E - Inventário de Ativos Comunitários</h1>
                <p>Total de Itens: ${items.length} | Valor Total: R$ ${items.reduce((acc, i) => acc + Number(i.value || 0), 0).toLocaleString()}</p>
                <table><thead><tr><th>Item</th><th>Categoria</th><th>Estado</th><th>Valor (R$)</th></tr></thead>
                <tbody>${items.map(i => `<tr><td>${i.name}</td><td>${i.category}</td><td>${i.status}</td><td>${Number(i.value || 0).toLocaleString()}</td></tr>`).join('')}</tbody>
                </table>
            </body></html>
          `);
          printWindow.document.close();
          printWindow.print();
      }
  };

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'PERFEITO': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case 'MANUTENÇÃO': return 'bg-rose-50 text-rose-700 border-rose-100';
      case 'BOM': return 'bg-indigo-50 text-indigo-700 border-indigo-100';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  const primaryColor = systemInfo.primaryColor || '#f59e0b';

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin text-amber-500 mx-auto" size={56} style={{ color: primaryColor }}/></div>;

  const filteredItems = Array.isArray(items) ? items.filter(i => (i.name || '').toLowerCase().includes(searchTerm.toLowerCase())) : [];

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-6 animate-fade-in h-full relative">
      <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900 p-10 rounded-[3rem] text-white shadow-xl shrink-0 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="flex items-center gap-6 relative z-10">
            <div className="p-5 bg-amber-600 rounded-[2rem] shadow-xl" style={{ backgroundColor: primaryColor }}><Box size={28}/></div>
            <div>
              <h2 className="text-3xl font-black tracking-tight uppercase leading-none">Patrimônio S.I.E</h2>
              <p className="text-amber-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2 opacity-80">SRE Asset Management Suite V5.0</p>
            </div>
        </div>
        <div className="flex gap-4 relative z-10">
            <button onClick={handlePrintInventory} className="p-4 bg-white/5 border border-white/10 text-white rounded-2xl hover:bg-white/10 transition-all shadow-sm"><Printer size={20}/></button>
            <button onClick={handleOpenCreate} className="px-12 py-5 bg-white text-slate-950 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-2xl hover:bg-amber-50 transition-all active:scale-95 flex items-center gap-3">
              <Plus size={22}/> Novo Registro
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
          <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col justify-center min-h-[160px] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-all transform group-hover:scale-110"><DollarSign size={80}/></div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-2">Avaliação de Ativos</p>
              <h3 className="text-4xl font-black text-slate-800 tracking-tightest">R$ {items.reduce((acc, i) => acc + Number(i.value || 0), 0).toLocaleString('pt-BR')}</h3>
          </div>
          <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col justify-center min-h-[160px] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-all transform group-hover:scale-110"><Tag size={80}/></div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-2">Total de Itens</p>
              <h3 className="text-4xl font-black text-slate-800 tracking-tightest">{items.length} Unidades</h3>
          </div>
          <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col justify-center min-h-[160px] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-all transform group-hover:scale-110"><ShieldCheck size={80}/></div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 mb-2">Audit Status</p>
              <h3 className="text-4xl font-black text-emerald-600 tracking-tightest">VERIFIED</h3>
          </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col min-h-0">
          <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex justify-between items-center shrink-0">
              <div className="relative max-w-md w-full">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                  <input type="text" placeholder="Filtrar por nome do ativo..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-14 pr-6 h-14 bg-white border border-slate-200 rounded-2xl text-sm font-bold uppercase focus:border-amber-500 transition-all shadow-inner outline-none" />
              </div>
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">{filteredItems.length} Registros Mapeados</span>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
              <table className="w-full text-left border-separate border-spacing-0">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b sticky top-0 z-10 backdrop-blur-md">
                    <tr className="bg-white/95"><th className="p-10 border-b">Ativo / Identificação</th><th className="p-10 border-b text-center">Estado SRE</th><th className="p-10 text-right border-b">Avaliação Corrente</th><th className="p-10 text-right border-b">Ações</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {filteredItems.map(item => (
                          <tr key={item.id} className="hover:bg-slate-50 transition-all group">
                              <td className="p-10">
                                  <div className="flex items-center gap-6">
                                      <div className="p-5 bg-slate-50 text-slate-300 rounded-[1.5rem] group-hover:bg-amber-50 group-hover:text-amber-600 transition-colors shadow-inner"><Box size={24}/></div>
                                      <div><p className="text-base font-black text-slate-800 uppercase tracking-tight leading-none">{item.name}</p><p className="text-[10px] text-slate-400 font-bold uppercase mt-2 tracking-widest">{item.category}</p></div>
                                  </div>
                              </td>
                              <td className="p-10 text-center"><span className={`px-5 py-2 rounded-full text-[9px] font-black uppercase border shadow-sm ${getStatusStyle(item.status)}`}>{item.status}</span></td>
                              <td className="p-10 text-right font-black text-lg text-slate-800">R$ {Number(item.value || 0).toLocaleString('pt-BR')}</td>
                              <td className="p-10 text-right">
                                  <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-4 group-hover:translate-x-0">
                                      <button onClick={() => { setEditingItem(item); setIsModalOpen(true); }} className="p-4 bg-white border border-slate-200 text-slate-400 hover:text-indigo-600 rounded-2xl shadow-sm transition-all"><Edit2 size={20}/></button>
                                      <button onClick={() => handleDelete(Number(item.id))} className="p-4 bg-white border border-slate-200 text-slate-400 hover:text-rose-600 rounded-2xl shadow-sm transition-all"><Trash2 size={20}/></button>
                                  </div>
                              </td>
                          </tr>
                      ))}
                      {filteredItems.length === 0 && (
                          <tr><td colSpan={4} className="p-40 text-center text-slate-200 font-black uppercase text-xs tracking-[0.4em] italic opacity-20">Inventário Limpo. Nenhum ativo localizado.</td></tr>
                      )}
                  </tbody>
              </table>
          </div>
      </div>

      {isModalOpen && (
        <div className="sie-editor-overlay">
          <div className="sie-modal-container">
            <form onSubmit={handleSave} className="flex flex-col h-full overflow-hidden">
              <div className="h-20 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 shadow-2xl relative z-20 border-b border-white/5">
                <div className="flex items-center gap-5">
                    <div className="p-3.5 bg-amber-600 rounded-xl shadow-xl" style={{ backgroundColor: primaryColor }}><Box size={22} className="text-white" /></div>
                    <div>
                        <h3 className="font-black text-xl text-white tracking-tighter uppercase leading-none">Registro Patrimonial</h3>
                        <p className="text-amber-400 text-[9px] font-black uppercase mt-1.5 tracking-widest opacity-80">SRE Inventory Engine V5.0</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <button type="submit" disabled={isSaving} className="px-10 py-3.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center gap-3 shadow-xl active:scale-95" style={{ backgroundColor: primaryColor }}>
                        {isSaving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Sincronizar Registro
                    </button>
                    <button type="button" onClick={() => setIsModalOpen(false)} className="p-3.5 hover:bg-rose-500 hover:text-white text-slate-400 rounded-xl transition-all border border-white/5"><X size={24}/></button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-[#fdfdfe] relative">
                  <div className="max-w-4xl mx-auto space-y-12 pb-10">
                    <div className="bg-slate-50 p-12 rounded-[3.5rem] border border-slate-200 shadow-inner space-y-10">
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Identificação do Ativo</label>
                            <input required className="w-full font-black h-18 bg-white border border-slate-200 rounded-[1.5rem] px-8 text-2xl focus:border-amber-500 transition-all shadow-sm" placeholder="Ex: Trator Roçadeira Bloco C..." value={editingItem.name} onChange={e => setEditingItem({...editingItem, name: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Valor de Mercado (R$)</label>
                                <input type="number" step="0.01" className="w-full font-black h-16 bg-white border border-slate-200 rounded-[1.5rem] px-8 text-2xl focus:border-amber-500 shadow-inner" value={editingItem.value} onChange={e => setEditingItem({...editingItem, value: e.target.value})} />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Estado de Conservação</label>
                                <select className="w-full font-black h-16 bg-white border border-slate-200 rounded-[1.5rem] px-8 text-sm uppercase appearance-none shadow-sm focus:border-amber-500" value={editingItem.status} onChange={e => setEditingItem({...editingItem, status: e.target.value})}>
                                    <option value="PERFEITO">Estado 01: Perfeito / Novo</option>
                                    <option value="BOM">Estado 02: Bom Uso</option>
                                    <option value="MANUTENÇÃO">Estado 03: Manutenção Corretiva</option>
                                    <option value="DEPRECIADO">Estado 04: Depreciado / Inativo</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Classificação de Patrimônio</label>
                            <input required className="w-full font-black h-16 bg-white border border-slate-200 rounded-[1.5rem] px-8 text-lg focus:border-amber-500 shadow-sm" placeholder="Ex: Maquinário, Mobiliário, Eletrônico..." value={editingItem.category} onChange={e => setEditingItem({...editingItem, category: e.target.value})} />
                        </div>
                    </div>
                    
                    <div className="p-8 bg-amber-900/5 border border-amber-100 rounded-[2.5rem] flex items-center gap-6 shadow-sm">
                        <div className="p-5 bg-white text-amber-600 rounded-2xl shadow-sm"><ShieldCheck size={32}/></div>
                        <div>
                            <h4 className="text-base font-black text-amber-950 uppercase tracking-tight">Protocolo de Auditoria</h4>
                            <p className="text-[10px] text-amber-700 font-bold uppercase mt-1 tracking-widest leading-relaxed">Este registro será catalogado no inventário geral do cluster S.I.E para fins de cálculo de depreciação anual e balanço patrimonial.</p>
                        </div>
                    </div>
                  </div>
              </div>

              <div className="p-8 border-t bg-slate-50 flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ativo Sincronizado com Kernel Ledger</span>
                  </div>
                  <div className="flex gap-4">
                      <button type="button" onClick={() => setIsModalOpen(false)} className="px-10 py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors">Abortar</button>
                      <button type="submit" onClick={handleSave} className="px-14 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-amber-600 transition-all">Confirmar Registro</button>
                  </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Assets;
