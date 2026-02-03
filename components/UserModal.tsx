import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, FinancialRecord, SystemInfo, ResidentType, PreferredChannel, UserRole } from '../types';
import { systemService, userService, financialService, aiService, planService, api, storageService } from '../services/api';
import { formatCPF, validateCPF, normalizeCPF } from '../utils/cpf';
import { FINANCIAL_CATEGORIES, DEFAULT_SYSTEM_INFO } from '../constants';
import {
    Save, X, Loader2, Users, Heart, Wallet, Brain,
    User as UserIcon, Plus, Trash2, AlertCircle, Sparkles,
    Camera, Upload, MapPin, Fingerprint, DollarSign,
    LocateFixed, Calendar, CreditCard, CheckCircle2, ArrowRight, ShieldCheck,
    Globe, Phone, Mail, MessageSquare, Shield, Hash, Map as MapIcon, Landmark,
    Contact, Bookmark, Scale, Lock, Info, Clock, FileText, Image as ImageIcon,
    History, FileCode, ChevronDown, CheckCircle, Eye, EyeOff
} from 'lucide-react';
import SocialQuestionnaire from './SocialQuestionnaire';

interface UserModalProps {
    user: User;
    onClose: () => void;
    onSaveSuccess: () => void;
}

// SRE GEOCODING UTILITY - Isolated for synchronous calls
const fetchCoordinates = async (addressData: any) => {
    if (!addressData.street || !addressData.number || !addressData.city || !addressData.state) return null;
    try {
        const query = `${addressData.street}, ${addressData.number}, ${addressData.city}, ${addressData.state}, Brasil`;
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`, {
            headers: { 'User-Agent': 'SIE-PRO-System/1.0' }
        });
        const data = await res.json();
        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon)
            };
        }
    } catch (e) {
        console.warn("Geocoding service unavailable");
    }
    return null;
};

const UserModal = ({ user, onClose, onSaveSuccess }: UserModalProps) => {
    const [activeTab, setActiveTab] = useState<'PERSONAL' | 'SOCIAL' | 'FINANCIAL' | 'AI_DOSSIER'>('PERSONAL');
    const [formData, setFormData] = useState<any>(() => ({
        ...user,
        birth_date: user.birth_date ? user.birth_date.slice(0, 10).split('-').reverse().join('/') : '',
        resident_type: (user as any).resident_type || 'TITULAR',
        voting_rights: (user as any).voting_rights ?? 1,
        preferred_channel: (user as any).preferred_channel || 'WHATSAPP',
        active: user.active ?? 1,
        coordinates: (user as any).coordinates || { lat: 0, lng: 0 }
    }));

    const [isSaving, setIsSaving] = useState(false);
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [userInvoices, setUserInvoices] = useState<FinancialRecord[]>([]);
    const [isLoadingFinance, setIsLoadingFinance] = useState(false);
    const [aiDossier, setAiDossier] = useState<string>('');
    const [isGeneratingDossier, setIsGeneratingDossier] = useState(false);
    const [tempPassword, setTempPassword] = useState('');

    const isTempUser = String(user.id).startsWith('temp_');

    const loadFinance = useCallback(async () => {
        if (isTempUser) return;
        setIsLoadingFinance(true);
        try {
            const res = await financialService.getAll({ user_id: user.id });
            setUserInvoices(res.data.data || []);
        } catch (e) {
            console.error("Erro ao carregar ledger do membro.");
        } finally {
            setIsLoadingFinance(false);
        }
    }, [user.id, isTempUser]);

    useEffect(() => {
        if (!isTempUser) loadFinance();
    }, [loadFinance, isTempUser]);

    // SRE GEOCODING ENGINE (Background)
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (formData.street && formData.number && formData.city && formData.state && !isGeocoding) {
                setIsGeocoding(true);
                const coords = await fetchCoordinates(formData);
                if (coords) {
                    setFormData(prev => ({ ...prev, coordinates: coords }));
                }
                setIsGeocoding(false);
            }
        }, 2000); 
        return () => clearTimeout(timer);
    }, [formData.street, formData.number, formData.city, formData.state]);


    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        // SRE SYNC: Force coordinate fetch if missing (Race condition fix)
        let finalCoordinates = formData.coordinates;
        if ((!finalCoordinates || (finalCoordinates.lat === 0 && finalCoordinates.lng === 0)) && formData.street && formData.number) {
             const fetched = await fetchCoordinates(formData);
             if (fetched) finalCoordinates = fetched;
        }

        try {
            const payload = { 
                ...formData,
                coordinates: finalCoordinates // Use forced/resolved coordinates
            };

            if (tempPassword.trim()) payload.password = tempPassword;
            
            if (isTempUser) {
                await userService.create(payload);
            } else {
                await userService.update(user.id, payload);
            }
            onSaveSuccess();
        } catch (e: any) {
            const msg = e.response?.data?.error === 'CPF_OU_USUARIO_JA_EXISTE' 
                ? "Este CPF ou Usuário já está registrado no cluster."
                : "Falha na sincronização com o Kernel.";
            alert(`🛑 ERRO SRE: ${msg}`);
        } finally {
            setIsSaving(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const res = await storageService.upload(file);
            setFormData({ ...formData, avatar_url: res.data.url });
        } catch (e) {
            alert("Falha no upload da mídia.");
        }
    };

    const handleCEPBlur = async () => {
        const cep = formData.cep?.replace(/\D/g, '');
        if (!cep || cep.length !== 8) return;
        try {
            const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await res.json();
            if (!data.erro) {
                setFormData(p => ({ 
                    ...p, street: data.logradouro, neighborhood: data.bairro, city: data.localidade, state: data.uf 
                }));
            }
        } catch (e) { console.error("CEP Fail"); }
    };

    return (
        <div className="sie-editor-overlay">
            <div className="sie-modal-container max-w-6xl h-[92vh]">
                
                <div className="h-24 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-white/5 shadow-2xl relative z-20">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-indigo-600 rounded-2xl shadow-xl"><Fingerprint size={24} /></div>
                        <div>
                            <h3 className="font-black text-2xl uppercase tracking-tighter leading-none">{formData.name || 'Nova Identidade Digital'}</h3>
                            <p className="text-indigo-400 text-[10px] font-black uppercase mt-2 tracking-widest opacity-80">SRE Identity Module • V15.5</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={handleSave} disabled={isSaving} className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center gap-4 shadow-2xl active:scale-95">
                            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Sincronizar Cadastro
                        </button>
                        <button onClick={onClose} className="p-4 hover:bg-rose-500 text-slate-400 rounded-2xl transition-all border border-white/5"><X size={28} /></button>
                    </div>
                </div>

                <div className="flex bg-slate-50 p-2 border-b shrink-0 gap-2 overflow-x-auto no-scrollbar">
                    {[
                        { id: 'PERSONAL', label: 'Dossiê Pessoal', icon: UserIcon },
                        { id: 'SOCIAL', label: 'Engajamento Social', icon: Heart },
                        { id: 'FINANCIAL', label: 'Ledger Financeiro', icon: Wallet },
                        { id: 'AI_DOSSIER', label: 'Análise Preditiva', icon: Brain }
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 min-w-[180px] py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-md border border-indigo-100' : 'text-slate-400 hover:bg-white/50'}`}>
                            <tab.icon size={14}/> {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#fdfdfe] p-10">
                    <div className="max-w-5xl mx-auto">
                        
                        {activeTab === 'PERSONAL' && (
                            <form className="space-y-12 animate-fade-in">
                                <div className="flex flex-col md:flex-row items-center gap-12 bg-slate-50 p-12 rounded-[3.5rem] border border-slate-100 shadow-inner">
                                    <div className="w-48 h-48 rounded-[3rem] bg-slate-200 border-4 border-white shadow-2xl overflow-hidden relative flex items-center justify-center">
                                        {formData.avatar_url ? (<img src={formData.avatar_url} className="w-full h-full object-cover" alt="Avatar" />) : (<UserIcon size={64} className="text-slate-300" />)}
                                    </div>
                                    <div className="flex-1 space-y-6">
                                        <h4 className="text-xl font-black uppercase text-slate-800">Handshake Biométrico</h4>
                                        <p className="text-xs text-slate-500 font-medium uppercase leading-relaxed max-w-md">Gerencie a imagem de identificação facial do membro para o protocolo de acesso Vision.</p>
                                        <label className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase flex items-center gap-3 cursor-pointer shadow-xl hover:bg-indigo-600 transition-all w-fit">
                                            <Upload size={18}/> Carregar Nova Identidade
                                            <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload}/>
                                        </label>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label><input className="w-full h-14 bg-white border border-slate-200 rounded-xl px-6 text-base font-black uppercase outline-none focus:border-indigo-500 shadow-sm" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CPF (Identificador Único)</label><input className="w-full h-14 bg-slate-100 border border-slate-200 rounded-xl px-6 text-base font-mono font-black" value={formData.cpf_cnpj || ''} onChange={e => setFormData({...formData, cpf_cnpj: formatCPF(e.target.value)})} /></div>
                                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail Corporativo</label><input className="w-full h-14 bg-white border border-slate-200 rounded-xl px-6 text-base outline-none focus:border-indigo-500 shadow-sm" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
                                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unidade / Lote</label><input className="w-full h-14 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl px-6 text-base font-black uppercase outline-none focus:bg-white shadow-inner" value={formData.unit || ''} onChange={e => setFormData({...formData, unit: e.target.value})} /></div>
                                </div>

                                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 space-y-6">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><MapIcon size={14}/> Endereço & Geolocalização</h4>
                                        {isGeocoding && <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded animate-pulse">GEOCODING...</span>}
                                        {!isGeocoding && formData.coordinates && formData.coordinates.lat !== 0 && <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded">GPS OK</span>}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CEP</label><input className="w-full h-14 bg-white border border-slate-200 rounded-xl px-6 text-sm font-black outline-none focus:border-indigo-500" value={formData.cep || ''} onChange={e => setFormData({...formData, cep: e.target.value})} onBlur={handleCEPBlur} placeholder="00000-000" /></div>
                                        <div className="space-y-2 md:col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Logradouro</label><input className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-sm font-black uppercase outline-none" value={formData.street || ''} onChange={e => setFormData({...formData, street: e.target.value})} /></div>
                                        <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Número</label><input className="w-full h-14 bg-white border border-slate-200 rounded-xl px-6 text-sm font-black outline-none focus:border-indigo-500" value={formData.number || ''} onChange={e => setFormData({...formData, number: e.target.value})} /></div>
                                        <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bairro</label><input className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-sm font-black uppercase outline-none" value={formData.neighborhood || ''} onChange={e => setFormData({...formData, neighborhood: e.target.value})} /></div>
                                        <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cidade / UF</label><input className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-sm font-black uppercase outline-none" value={`${formData.city || ''} - ${formData.state || ''}`} readOnly /></div>
                                    </div>
                                </div>

                                <div className="p-8 bg-slate-900 rounded-[2.5rem] border border-white/5 space-y-6">
                                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2"><Lock size={14}/> Segurança SRE</h4>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 text-white">Redefinir Chave de Acesso (Opcional)</label>
                                        <input type="password" placeholder="DEIXE EM BRANCO PARA NÃO ALTERAR" className="w-full h-14 bg-white/5 border border-white/10 rounded-xl px-6 font-bold text-white outline-none focus:border-indigo-500" value={tempPassword} onChange={e => setTempPassword(e.target.value)} />
                                    </div>
                                </div>
                            </form>
                        )}

                        {activeTab === 'SOCIAL' && <SocialQuestionnaire user={user} onSave={(d) => setFormData({...formData, socialData: d})} onCancel={() => setActiveTab('PERSONAL')} />}

                        {activeTab === 'FINANCIAL' && (
                            <div className="animate-fade-in space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="p-8 bg-emerald-50 border border-emerald-100 rounded-[2.5rem] shadow-inner text-center">
                                        <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-2">Liquidez Efetivada</p>
                                        <h4 className="text-3xl font-black text-emerald-800">R$ {userInvoices.filter(i => i.status === 'PAID').reduce((acc, i) => acc + Number(i.amount), 0).toLocaleString('pt-BR')}</h4>
                                    </div>
                                    <div className="p-8 bg-rose-50 border border-rose-100 rounded-[2.5rem] shadow-inner text-center">
                                        <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest mb-2">Exposição Pendente</p>
                                        <h4 className="text-3xl font-black text-rose-800">R$ {userInvoices.filter(i => i.status !== 'PAID').reduce((acc, i) => acc + Number(i.amount), 0).toLocaleString('pt-BR')}</h4>
                                    </div>
                                </div>

                                <div className="bg-white border border-slate-200 rounded-[2.5rem] overflow-hidden shadow-sm">
                                    <table className="w-full text-left border-separate border-spacing-0">
                                        <thead className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b">
                                            <tr><th className="p-6">Título / Ledger</th><th className="p-6 text-center">Vencimento</th><th className="p-6 text-right">Montante</th><th className="p-6 text-center">Estado</th></tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {userInvoices.map(inv => (
                                                <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="p-6 font-bold text-slate-700 uppercase text-xs">{inv.description}</td>
                                                    <td className="p-6 text-center text-slate-500 text-xs">{new Date(inv.date).toLocaleDateString('pt-BR')}</td>
                                                    <td className="p-6 text-right font-black text-slate-900">R$ {Number(inv.amount).toLocaleString('pt-BR')}</td>
                                                    <td className="p-6 text-center"><span className={`px-4 py-1.5 rounded-xl text-[8px] font-black uppercase border shadow-sm ${inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>{inv.status}</span></td>
                                                </tr>
                                            ))}
                                            {userInvoices.length === 0 && <tr><td colSpan={4} className="p-20 text-center text-slate-300 font-black uppercase text-[10px] tracking-widest italic">Sem lançamentos recentes.</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'AI_DOSSIER' && (
                            <div className="space-y-10 animate-fade-in">
                                <button onClick={async () => { setIsGeneratingDossier(true); try { const res = await aiService.generateUserDossier(user.id); setAiDossier(res.data.text); } catch (e) { alert("Falha ao gerar dossiê preditivo."); } finally { setIsGeneratingDossier(false); } }} className="w-full py-8 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-4 hover:bg-indigo-600 transition-all active:scale-95">
                                    {isGeneratingDossier ? <Loader2 className="animate-spin" size={24}/> : <Brain size={24}/>} Invocando Gemini Advisor
                                </button>
                                {aiDossier && <div className="p-12 bg-white border border-slate-200 shadow-inner rounded-[3.5rem] text-slate-700 leading-relaxed uppercase italic text-lg border-l-[10px] border-l-indigo-600"><Sparkles size={24} className="text-indigo-600 mb-6"/>{aiDossier}</div>}
                            </div>
                        )}
                    </div>
                </div>

                <footer className="h-16 bg-slate-50 border-t border-slate-200 px-10 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div><span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocolo Ledger Sincronizado</span></div>
                    <div className="flex items-center gap-2"><ShieldCheck size={14} className="text-indigo-600"/><span className="text-[9px] font-black uppercase text-slate-500">SRE Identity Guard Active</span></div>
                </footer>
            </div>
        </div>
    );
};

export default UserModal;