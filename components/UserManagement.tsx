import React, { useState, useEffect, useCallback } from 'react';
import { User, SystemInfo } from '../types';
import { userService, systemService } from '../services/api';
import {
    Search, Edit2, Plus, Loader2, Users, Shield, Heart, User as UserIcon,
    Fingerprint, Trash2, Zap, ChevronRight, ChevronLeft, CheckCircle2, X
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

    return (
        <div className="flex-1 flex flex-col min-h-0 space-y-4 md:space-y-6 animate-fade-in h-full relative">

            {/* SRE: Header Compacto (Redução de 40% em mobile) */}
            <div className="flex flex-row justify-between items-center bg-slate-900 px-5 py-4 md:p-8 rounded-2xl md:rounded-[2.5rem] text-white shadow-xl shrink-0 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="flex items-center gap-3 md:gap-5 relative z-10">
                    <div className="p-2.5 md:p-4 bg-indigo-600 rounded-xl md:rounded-2xl shadow-lg shrink-0">
                        <Fingerprint size={20} className="md:w-6 md:h-6" />
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-sm md:text-2xl font-black tracking-tight uppercase leading-none truncate">Membros & Identidades</h2>
                        <p className="hidden md:block text-indigo-400 text-[10px] font-black uppercase tracking-widest mt-2 opacity-80">Base Cadastral • {systemInfo.shortName}</p>
                    </div>
                </div>
                <div className="relative z-10">
                    <button
                        onClick={() => setEditingUser({ id: `temp_${Date.now()}`, name: '', role: 'MORADOR', status: 'ACTIVE', active: 1, cpf_cnpj: '', username: '', phone: '', email: '', unit: '', address: '', coordinates: { lat: -23.5505, lng: -46.6333 } } as any)}
                        className="px-4 py-2.5 md:px-8 md:py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl md:rounded-2xl font-black text-[9px] md:text-[11px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-xl active:scale-95"
                        style={{ backgroundColor: primaryColor }}
                    >
                        <Plus size={16} className="md:w-5 md:h-5" /> <span className="hidden sm:inline">Novo Registro</span><span className="sm:hidden">Novo</span>
                    </button>
                </div>
            </div>

            {/* CONTAINER DE LISTAGEM - ARREDONDAMENTO NORMALIZADO */}
            <div className="bg-white rounded-[2rem] md:rounded-[3rem] shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col min-h-0">
                <div className="p-4 md:p-8 border-b bg-slate-50/30 shrink-0 flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:w-96">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                        <input
                            type="text"
                            placeholder="PESQUISAR..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-12 h-12 md:h-14 bg-white border border-slate-200 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold shadow-sm focus:border-indigo-500 transition-all uppercase outline-none"
                        />
                    </div>
                    <div className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
                        {['ALL', 'ADMIN', 'MORADOR', 'DIRETORIA'].map(role => (
                            <button
                                key={role}
                                onClick={() => setFilterRole(role)}
                                className={`px-4 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${filterRole === role ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white text-slate-400 border-slate-100'}`}
                                style={filterRole === role ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
                            >
                                {role === 'ALL' ? 'Todos' : role}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left border-separate border-spacing-0">
                        <thead className="bg-slate-50 text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest border-b sticky top-0 z-10 backdrop-blur-md">
                            <tr className="bg-white/95">
                                <th className="p-4 md:p-8 border-b">Identidade</th>
                                <th className="hidden md:table-cell p-8 border-b">Documento</th>
                                <th className="hidden lg:table-cell p-8 border-b text-center">Perfil</th>
                                <th className="p-4 md:p-8 border-b text-center">Estado</th>
                                <th className="p-4 md:p-8 border-b text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {isLoading ? (
                                <tr><td colSpan={5} className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-indigo-600" size={40} /></td></tr>
                            ) : filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="p-4 md:p-8">
                                        <div className="flex items-center gap-3 md:gap-5">
                                            <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-[1.25rem] overflow-hidden bg-slate-100 border-2 border-white shadow-md flex items-center justify-center shrink-0">
                                                {user.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" alt="Avatar" /> : <UserIcon size={20} className="text-slate-300 md:w-6 md:h-6" />}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs md:text-base font-black text-slate-800 uppercase truncate">{user.name}</p>
                                                <p className="text-[8px] md:text-[10px] text-slate-400 font-bold uppercase mt-0.5 md:mt-1 truncate">Unid. {user.unit || '---'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="hidden md:table-cell p-8">
                                        <p className="text-[11px] font-black text-slate-600 font-mono">{user.cpf_cnpj}</p>
                                    </td>
                                    <td className="hidden lg:table-cell p-8 text-center">
                                        <span className="text-[9px] font-black uppercase text-indigo-600 px-3 py-1.5 bg-indigo-50 rounded-lg border border-indigo-100">
                                            {getRoleLabel(user.role as string)}
                                        </span>
                                    </td>
                                    <td className="p-4 md:p-8 text-center">
                                        <span className={`px-2.5 py-1 md:px-4 md:py-1.5 rounded-lg text-[7px] md:text-[9px] font-black uppercase border ${user.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="p-4 md:p-8 text-right">
                                        <div className="flex justify-end gap-1 md:gap-3">
                                            <button onClick={() => setEditingUser(user)} className="p-2 md:p-3 text-slate-300 hover:text-indigo-600 hover:bg-white rounded-xl transition-all shadow-sm md:shadow-none">
                                                <Edit2 size={16} className="md:w-5 md:h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {!isLoading && filteredUsers.length === 0 && (
                        <div className="py-32 text-center">
                            <Users size={48} className="mx-auto text-slate-100 mb-4" />
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Nenhum registro localizado no cluster.</p>
                        </div>
                    )}
                </div>

                {/* PAGINAÇÃO SLIM */}
                <div className="p-4 md:p-6 bg-slate-50/50 border-t flex justify-between items-center shrink-0">
                    <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        Total: {pagination.total} Membros
                    </span>
                    <div className="flex gap-2">
                        <button disabled={pagination.page <= 1} onClick={() => loadData(pagination.page - 1, search)} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 disabled:opacity-30"><ChevronLeft size={16} /></button>
                        <div className="flex items-center px-4 bg-white border border-slate-200 rounded-lg text-[9px] font-black text-slate-600">{pagination.page} / {pagination.pages}</div>
                        <button disabled={pagination.page >= pagination.pages} onClick={() => loadData(pagination.page + 1, search)} className="p-2 bg-white border border-slate-200 rounded-lg text-slate-400 disabled:opacity-30"><ChevronRight size={16} /></button>
                    </div>
                </div>
            </div>

            {editingUser && <UserModal user={editingUser} onClose={() => setEditingUser(null)} onSaveSuccess={() => { setEditingUser(null); loadData(pagination.page, search); }} />}
        </div>
    );
};

export default UserManagement;