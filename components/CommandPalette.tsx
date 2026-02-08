
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Search, Command, X, ArrowRight, User, 
    LayoutGrid, Wallet, ShieldAlert, Cpu, Brain,
    MessageSquare, Gavel, Calendar, Smartphone,
    Fingerprint, Terminal
} from 'lucide-react';
import { MENU_ITEMS } from '../constants';
import { userService } from '../services/api';
import { User as UserType } from '../types';

const CommandPalette = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [members, setMembers] = useState<UserType[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 100);
            loadMembers();
        } else {
            setQuery('');
        }
    }, [isOpen]);

    const loadMembers = async () => {
        try {
            const res = await userService.getAll(1, 10);
            setMembers(res.data.data || []);
        } catch (e) {}
    };

    const filteredModules = MENU_ITEMS.filter(item => 
        item.label.toLowerCase().includes(query.toLowerCase()) ||
        item.category.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 6);

    const filteredMembers = members.filter(m => 
        m.name.toLowerCase().includes(query.toLowerCase()) ||
        m.unit?.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 4);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-md flex items-start justify-center pt-[15vh] px-4 animate-fade-in" onClick={onClose}>
            <div 
                className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.5)] overflow-hidden border border-slate-200 animate-scale-in"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-8 border-b border-slate-100 flex items-center gap-6 bg-slate-50/50">
                    <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-xl">
                        <Terminal size={20} />
                    </div>
                    <input 
                        ref={inputRef}
                        className="flex-1 bg-transparent border-none outline-none font-black text-xl uppercase tracking-tighter text-slate-800 placeholder:text-slate-300"
                        placeholder="Comando Tático ou Busca de Membro..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                    />
                    <div className="px-3 py-1 bg-slate-200 text-slate-500 rounded-lg text-[10px] font-black uppercase">ESC</div>
                </div>

                <div className="max-h-[60vh] overflow-y-auto p-6 custom-scrollbar space-y-8">
                    {/* MODULOS */}
                    <div className="space-y-3">
                        <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Navegação de Kernel</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {filteredModules.map(item => (
                                <button 
                                    key={item.id}
                                    // SRE FIX: Navegação para o terminal correta
                                    onClick={() => { navigate(item.id === 'dashboard' ? '/terminal' : `/terminal/${item.id}`); onClose(); }}
                                    className="flex items-center gap-4 p-4 hover:bg-indigo-50 rounded-2xl transition-all group border border-transparent hover:border-indigo-100"
                                >
                                    <div className="p-2.5 bg-slate-100 text-slate-400 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                        <item.icon size={18} />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-xs font-black text-slate-800 uppercase tracking-tight">{item.label}</p>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase">{item.category}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* MEMBROS */}
                    {filteredMembers.length > 0 && (
                        <div className="space-y-3">
                            <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] ml-2">Entidades (Ledger)</h4>
                            <div className="space-y-2">
                                {filteredMembers.map(member => (
                                    <button 
                                        key={member.id}
                                        // SRE FIX: Navegação para a base de usuários no terminal
                                        onClick={() => { navigate('/terminal/users'); onClose(); }}
                                        className="w-full flex items-center justify-between p-4 hover:bg-emerald-50 rounded-2xl transition-all border border-transparent hover:border-emerald-100 group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center">
                                                {member.avatar_url ? <img src={member.avatar_url} className="w-full h-full object-cover" /> : <User size={18} className="text-slate-300"/>}
                                            </div>
                                            <div className="text-left">
                                                <p className="text-xs font-black text-slate-800 uppercase leading-none">{member.name}</p>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Unid. {member.unit} • {member.role}</p>
                                            </div>
                                        </div>
                                        <ArrowRight size={14} className="text-slate-200 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-center gap-8 opacity-40">
                    <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div><span className="text-[8px] font-black uppercase">↑↓ Navegar</span></div>
                    <div className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div><span className="text-[8px] font-black uppercase">↵ Entrar</span></div>
                </div>
            </div>
        </div>
    );
};

export default CommandPalette;
