import React, { useState, useEffect } from 'react';
import { MarketItem, User, SystemInfo } from '../types';
import { marketplaceService, authService } from '../services/api';
import { 
  ShoppingBag, Search, Plus, Filter, 
  MessageCircle, Loader2,
  Tag, Utensils, Wrench, Package, X, Save, Sparkles, Phone
} from 'lucide-react';

interface MarketPlaceProps {
    systemInfo: SystemInfo;
}

const MarketPlace = ({ systemInfo }: MarketPlaceProps) => {
  const [items, setItems] = useState([] as MarketItem[]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL' as MarketItem['category'] | 'ALL');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  useEffect(() => { loadInitialData(); }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [itemsRes, userRes] = await Promise.all([
        marketplaceService.getAll(),
        authService.me()
      ]);
      setItems(itemsRes.data?.data || []);
      setCurrentUser(userRes.data);
    } catch (e) { setItems([]); }
    finally { setLoading(false); }
  };

  const handleSave = async (e: any) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      const payload = { ...editingItem };
      delete payload.created_at;
      delete payload.updated_at;
      
      if (payload.id) await marketplaceService.update(payload.id, payload);
      else await marketplaceService.create({ ...payload, merchant_id: currentUser?.id });
      
      setIsModalOpen(false);
      loadInitialData();
    } finally { setIsSaving(false); }
  };

  const filteredItems = items.filter(i => {
    const categoryMatch = activeCategory === 'ALL' || i.category === activeCategory;
    const searchMatch = (i.title || '').toLowerCase().includes(searchTerm.toLowerCase());
    return categoryMatch && searchMatch;
  });

  const primaryColor = systemInfo.primaryColor || '#10b981';

  return (
    <div className="flex-1 flex flex-col h-full animate-fade-in bg-slate-50 gap-6 p-[var(--sie-viewport-padding)]">
      
      {/* HEADER MASTER */}
      <div className="bg-slate-900 rounded-[var(--sie-radius)] p-8 text-white shadow-xl shrink-0 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden border border-white/5">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
          <div className="flex items-center gap-5 relative z-10">
              <div className="p-4 bg-emerald-600 rounded-2xl shadow-xl" style={{ backgroundColor: primaryColor }}><ShoppingBag size={28}/></div>
              <div>
                  <h1 className="text-2xl font-black uppercase tracking-tighter leading-none">Vitrine Comunitária</h1>
                  <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2 opacity-80">Economia Circular Ativa V2.0</p>
              </div>
          </div>
          <button onClick={() => { setEditingItem({ title: '', description: '', category: 'GOODS', price: '', whatsapp: '' }); setIsModalOpen(true); }} className="px-10 py-4 bg-white text-emerald-950 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-2xl hover:bg-emerald-50 transition-all active:scale-95 flex items-center gap-3 relative z-10 sie-button">
            <Plus size={18}/> Publicar Anúncio
          </button>
      </div>

      {/* CONTENT ISLAND */}
      <div className="flex-1 bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col relative">
          
          {/* TOOLBAR */}
          <div className="flex flex-col md:flex-row gap-6 mb-8 shrink-0">
              <div className="relative flex-1">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                  <input type="text" placeholder="BUSCAR NO CATÁLOGO LOCAL..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-14 pr-6 h-14 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-black uppercase shadow-inner focus:border-emerald-500 outline-none transition-all sie-input" />
              </div>
              <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100 overflow-x-auto no-scrollbar gap-1">
                 {['ALL', 'GOODS', 'FOOD', 'SERVICE'].map(cat => (
                     <button key={cat} onClick={() => setActiveCategory(cat as any)} className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeCategory === cat ? 'bg-white text-emerald-600 shadow-md border border-emerald-100' : 'text-slate-400 hover:text-slate-600'}`} style={activeCategory === cat ? { color: primaryColor } : {}}>{cat === 'ALL' ? 'Todos' : cat === 'GOODS' ? 'Produtos' : cat === 'FOOD' ? 'Alimentação' : 'Serviços'}</button>
                 ))}
              </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar pb-10">
              {loading ? <div className="p-20 text-center"><Loader2 className="animate-spin text-emerald-600 mx-auto" size={40}/></div> : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {filteredItems.map(item => (
                        <div key={item.id} className="bg-white rounded-[2.5rem] border border-slate-200 p-6 shadow-sm hover:shadow-xl transition-all flex flex-col h-full relative group hover:border-emerald-200 sie-card !m-0">
                            <div className="flex justify-between items-start mb-5">
                                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors shadow-inner" style={ { color: primaryColor } }>
                                    {item.category === 'FOOD' ? <Utensils size={20}/> : item.category === 'SERVICE' ? <Wrench size={20}/> : <Package size={20}/>}
                                </div>
                                <div className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl text-[10px] font-black border border-emerald-100 shadow-sm">R$ {Number(item.price || 0).toLocaleString('pt-BR')}</div>
                            </div>
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-2 truncate leading-tight">{item.title}</h3>
                            <p className="text-[9px] text-slate-400 font-bold uppercase mb-6 flex-1 line-clamp-3 leading-relaxed">{item.description}</p>
                            
                            <div className="pt-6 border-t border-slate-50 flex items-center justify-between mt-auto">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[8px] font-black text-slate-400 border border-slate-200">ID</div>
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-tight">Vendedor Local</span>
                                </div>
                                <a href={`https://wa.me/${(item.whatsapp || '').replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="p-3 bg-emerald-600 text-white rounded-xl shadow-lg hover:bg-emerald-500 transition-all active:scale-95" style={{ backgroundColor: primaryColor }}><Phone size={16}/></a>
                            </div>
                        </div>
                      ))}
                      {filteredItems.length === 0 && (
                          <div className="col-span-full py-40 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                              <ShoppingBag size={48} className="mx-auto text-slate-200 mb-6 opacity-30"/>
                              <p className="font-black uppercase text-[10px] text-slate-400 tracking-[0.4em]">Nenhum item localizado no cluster.</p>
                          </div>
                      )}
                  </div>
              )}
          </div>
      </div>

      {isModalOpen && editingItem && (
        <div className="sie-editor-overlay">
            <div className="sie-modal-container !h-auto !max-w-3xl self-center">
                <div className="h-24 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 shadow-2xl relative z-20 border-b border-white/5 rounded-t-[var(--sie-radius)]">
                    <div className="flex items-center gap-5">
                        <div className="p-3.5 bg-emerald-600 rounded-xl shadow-xl" style={{ backgroundColor: primaryColor }}><Tag size={22}/></div>
                        <div>
                            <h3 className="font-black text-xl uppercase tracking-tighter leading-none">Anunciar Oferta</h3>
                            <p className="text-emerald-400 text-[9px] font-black uppercase mt-1.5 tracking-widest opacity-80">Marketplace Core Suite V5.0</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={handleSave} disabled={isSaving} className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center gap-3 shadow-xl active:scale-95 sie-button" style={{ backgroundColor: primaryColor }}>
                            {isSaving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Commitar Anúncio
                        </button>
                        <button onClick={() => setIsModalOpen(false)} className="p-3.5 hover:bg-rose-500 hover:text-white text-slate-400 rounded-xl transition-all border border-white/5"><X size={24}/></button>
                    </div>
                </div>

                <div className="p-12 custom-scrollbar bg-[#fdfdfe] relative rounded-b-[var(--sie-radius)] space-y-8">
                    <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-200 shadow-inner space-y-8">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Título do Anúncio</label>
                            <input required className="w-full font-black h-16 bg-white border border-slate-200 rounded-2xl px-8 text-lg focus:border-emerald-500 transition-all shadow-sm sie-input" placeholder="Ex: Marmitex Fit / Aula de Tênis..." value={editingItem.title} onChange={e => setEditingItem({...editingItem, title: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria de Oferta</label>
                                <select className="w-full font-black h-14 bg-white border border-slate-200 rounded-xl px-6 text-xs uppercase appearance-none shadow-sm sie-input" value={editingItem.category} onChange={e => setEditingItem({...editingItem, category: e.target.value as any})}>
                                    <option value="GOODS">Bens de Consumo / Bazar</option>
                                    <option value="FOOD">Alimentação & Gastronomia</option>
                                    <option value="SERVICE">Serviços Profissionais</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Preço Sugerido (R$)</label>
                                <input type="number" step="0.01" className="w-full font-black h-14 bg-white border border-slate-200 rounded-xl px-6 text-lg shadow-sm focus:border-emerald-500 sie-input" value={editingItem.price} onChange={e => setEditingItem({...editingItem, price: e.target.value})} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição do Produto/Serviço</label>
                            <textarea rows={6} className="w-full font-medium bg-white border border-slate-200 rounded-[2rem] p-8 text-sm focus:border-emerald-500 transition-all shadow-sm uppercase leading-relaxed placeholder:text-slate-300" placeholder="Detalhes, diferenciais e horários..." value={editingItem.description} onChange={e => setEditingItem({...editingItem, description: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Canal de Contato (WhatsApp)</label>
                            <input className="w-full font-black h-14 bg-white border border-slate-200 rounded-xl px-6 text-sm shadow-sm sie-input" value={editingItem.whatsapp} onChange={e => setEditingItem({...editingItem, whatsapp: e.target.value})} placeholder="Ex: 11999998888" />
                        </div>
                    </div>
                    <div className="p-8 bg-emerald-900/5 border border-emerald-100 rounded-[2.5rem] flex items-center gap-6 shadow-sm">
                        <div className="p-4 bg-white text-emerald-600 rounded-2xl shadow-sm" style={{ color: primaryColor }}><Sparkles size={24}/></div>
                        <div>
                            <h4 className="text-sm font-black text-emerald-950 uppercase tracking-tight">Fomento Circular</h4>
                            <p className="text-[10px] text-emerald-700 font-bold uppercase mt-1 tracking-widest">Seu anúncio será visível para todos os membros ativos do cluster S.I.E PRO.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default MarketPlace;