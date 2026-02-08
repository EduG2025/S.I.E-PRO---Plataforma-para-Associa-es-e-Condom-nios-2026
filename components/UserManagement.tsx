import React, { useState, useEffect, useCallback } from 'react';
import { User, SystemInfo } from '../types';
import { userService, systemService } from '../services/api';
import {
    Search, Edit2, Plus, Loader2, Users, Shield, Heart, User as UserIcon,
    Fingerprint, Trash2, Zap, ChevronRight, ChevronLeft, CheckCircle2, X, Filter
} from 'lucide-react';
import UserModal from './UserModal';

interface UserManagementProps {
    systemInfo: SystemInfo;
}

const UserManagement = ({ systemInfo }: UserManagementProps) => {
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<any[]>([]);
    const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState('ALL');
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const loadData = useCallback(async (page: number, searchTerm: string = '') => {
        setIsLoading(true);
        try {
            const [usersRes, rolesRes] = await Promise.all([
                userService.getAll(page, 50, searchTerm),
                systemService.getRoles()
            ]);
            setUsers(usersRes.data.data || []);
            setRoles(rolesRes.data.data || []);
            setPagination(usersRes.data.pagination || { page: 1, total: 0, pages: 1 });
        } catch (e) { console.error("Falha ao carregar membros."); }
        finally { setIsLoading(false); }
    }, []);

    useEffect(() => { loadData(pagination.page, search); }, [pagination.page, search, loadData]);

    const filteredUsers = users.filter(u => filterRole === 'ALL' || u.role === filterRole);

    const getRoleLabel = (roleId: string) => {
        const role = roles.find(r => r.id === roleId);
        return role ? role.label : roleId;
    };

    const primaryColor = systemInfo.primaryColor || '#4f46e5';

    // Skeleton Row for Loading State
    const SkeletonRow = () => (
        <tr className="animate-pulse">
            <td className="p-4 md:p-6"><div className="flex items-center gap-4"><div className="w-10 h-10 bg-slate-200 rounded-xl"></div><div className="space-y-2"><div className="w-32 h-3 bg-slate-200 rounded"></div><div className="w-20 h-2 bg-slate-200 rounded"></div></div></div></td>
            <td className="hidden md:table-cell p-6"><div className="w-24 h-3 bg-slate-200 rounded"></div></td>
            <td className="hidden lg:table-cell p-6 text-center"><div className="w-20 h-6 bg-slate-200 rounded-lg mx-auto"></div></td>
            <td className="p-6 text-center"><div className="w-16 h-6 bg-slate-200 rounded-lg mx-auto"></div></td>
            <td className="p-6 text-right"><div className="w-8 h-8 bg-slate-200 rounded-lg ml-auto"></div></td>
        </tr>
    );

    return (
        <div className="flex-1 flex flex-col min-h-0 space-y-6 animate-fade-in h-full relative">

            {/* SRE: Header Compacto com Efeito Glass */}
            <div className="flex flex-row justify-between items-center bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl shrink-0 overflow-hidden relative border border-white/5">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] -mr-32 -mt-32"></div>
                <div className="flex items-center gap-6 relative z-10">
                    <div className="p-4 bg-indigo-600 rounded-2xl shadow-xl" style={{ backgroundColor: primaryColor }}>
                        <Fingerprint size={28} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black tracking-tightest uppercase leading-none">Identidade & Acesso</h2>
                        <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2 opacity-80 flex items-center gap-2">
                            <Shield size={12}/> Ledger de Membros V5.0
                        </p>
                    </div>
                </div>
                <div className="relative z-10">
                    <button
                        onClick={() => setEditingUser({ id: `temp_${Date.now()}`, name: '', role: 'RESIDENT', status: 'ACTIVE', active: 1, cpf_cnpj: '', username: '', phone: '', email: '', unit: '', address: '', coordinates: { lat: -23.5505, lng: -46.6333 } } as any)}
                        className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 transition-all shadow-xl hover:bg-indigo-50 active:scale-95"
                    >
                        <Plus size={18} /> Novo Registro
                    </button>
                </div>
            </div>

            {/* CONTAINER DE LISTAGEM - SOVEREIGN GRID */}
            <div className="bg-white rounded-[3rem] shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col min-h-0">
                
                {/* TOOLBAR */}
                <div className="p-6 border-b border-slate-100 bg-white flex flex-col md:flex-row gap-6 justify-between items-center z-20">
                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="FILTRAR IDENTIDADE..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-14 pr-4 h-14 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold shadow-inner focus:bg-white focus:border-indigo-500 outline-none transition-all uppercase placeholder:text-slate-400"
                        />
                    </div>
                    
                    {/* FILTROS EM ABAS (PILLS) */}
                    <div className="flex bg-slate-100 p-1.5 rounded-2xl overflow-x-auto no-scrollbar max-w-full">
                        {['ALL', 'ADMIN', 'RESIDENT', 'COUNCIL'].map(role => (
                            <button
                                key={role}
                                onClick={() => setFilterRole(role)}
                                className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${filterRole === role ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                                style={filterRole === role ? { color: primaryColor } : {}}
                            >
                                {role === 'ALL' ? 'Todos' : role === 'RESIDENT' ? 'Moradores' : role === 'COUNCIL' ? 'Conselho' : 'Admin'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar relative">
                    <table className="w-full text-left border-separate border-spacing-0">
                        <thead className="bg-white/90 backdrop-blur-md text-[9px] font-black text-slate-400 uppercase tracking-widest sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="p-6 border-b border-slate-100">Membro / Unidade</th>
                                <th className="hidden md:table-cell p-6 border-b border-slate-100">Documento</th>
                                <th className="hidden lg:table-cell p-6 border-b border-slate-100 text-center">Permissão</th>
                                <th className="p-6 border-b border-slate-100 text-center">Estado</th>
                                <th className="p-6 border-b border-slate-100 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                            ) : filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-indigo-50/30 transition-all group">
                                    <td className="p-4 md:p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-[1rem] overflow-hidden bg-slate-100 border border-slate-200 shadow-sm flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                                {user.avatar_url ? (
                                                    <img src={user.avatar_url} className="w-full h-full object-cover" alt="Avatar" />
                                                ) : (
                                                    <span className="text-lg font-black text-slate-300">{user.name.charAt(0)}</span>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-black text-slate-800 uppercase truncate leading-none">{user.name}</p>
                                                <div className="flex items-center gap-2 mt-1.5">
                                                    <span className="text-[9px] font-bold text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 uppercase tracking-widest">
                                                        Unid. {user.unit || '---'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="hidden md:table-cell p-6">
                                        <p className="text-[10px] font-mono font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg w-fit border border-slate-100">
                                            {user.cpf_cnpj || '---'}
                                        </p>
                                    </td>
                                    <td className="hidden lg:table-cell p-6 text-center">
                                        <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-lg border ${user.role === 'ADMIN' ? 'bg-purple-50 text-purple-600 border-purple-100' : 'bg-slate-50 text-slate-500 border-slate-100'}`}>
                                            {getRoleLabel(user.role as string)}
                                        </span>
                                    </td>
                                    <td className="p-6 text-center">
                                        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${user.status === 'ACTIVE' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${user.status === 'ACTIVE' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></div>
                                            <span className="text-[8px] font-black uppercase tracking-widest">{user.status === 'ACTIVE' ? 'Online' : 'Pendente'}</span>
                                        </div>
                                    </td>
                                    <td className="p-6 text-right">
                                        <button 
                                            onClick={() => setEditingUser(user)} 
                                            className="p-3 text-slate-400 hover:text-white hover:bg-indigo-600 rounded-xl transition-all opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 shadow-sm"
                                            title="Editar Dossiê"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {!isLoading && filteredUsers.length === 0 && (
                        <div className="py-32 text-center flex flex-col items-center">
                            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                <Users size={32} className="text-slate-300" />
                            </div>
                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Nenhum Registro</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">O filtro atual não retornou resultados.</p>
                        </div>
                    )}
                </div>

                {/* PAGINAÇÃO SLIM */}
                <div className="p-4 bg-white border-t border-slate-100 flex justify-between items-center shrink-0 z-20">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2">
                        Total: {pagination.total} Identidades
                    </span>
                    <div className="flex gap-2">
                        <button disabled={pagination.page <= 1} onClick={() => loadData(pagination.page - 1, search)} className="w-10 h-10 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-xl text-slate-500 hover:bg-white hover:border-indigo-200 disabled:opacity-30 disabled:hover:bg-slate-50 transition-all"><ChevronLeft size={16} /></button>
                        <div className="flex items-center px-6 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black text-slate-600">{pagination.page} / {pagination.pages}</div>
                        <button disabled={pagination.page >= pagination.pages} onClick={() => loadData(pagination.page + 1, search)} className="w-10 h-10 flex items-center justify-center bg-slate-50 border border-slate-200 rounded-xl text-slate-500 hover:bg-white hover:border-indigo-200 disabled:opacity-30 disabled:hover:bg-slate-50 transition-all"><ChevronRight size={16} /></button>
                    </div>
                </div>
            </div>

            {editingUser && <UserModal user={editingUser} onClose={() => setEditingUser(null)} onSaveSuccess={() => { setEditingUser(null); loadData(pagination.page, search); }} />}
        </div>
    );
};

export default UserManagement;