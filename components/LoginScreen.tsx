
import React, { useState, useEffect, useRef } from 'react';
import { User, SystemInfo } from '../types';
import { authService } from '../services/api';
import { 
    Lock, ArrowRight, ArrowLeft, Loader2, Fingerprint, Shield, Zap,
    Mail, Smartphone, ShieldAlert, User as UserIcon, Globe
} from 'lucide-react';
import * as CPFUtils from '../utils/cpf';

interface LoginScreenProps {
    onLoginSuccess: (user: User, token: string) => void;
    systemInfo: SystemInfo;
}

const LoginScreen = ({ onLoginSuccess, systemInfo }: LoginScreenProps) => {
    const [view, setView] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
    const [loginIdentifier, setLoginIdentifier] = useState('');
    const [loginPass, setLoginPass] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [auditLogs, setAuditLogs] = useState<string[]>(["[SYSTEM] Kernel Boot OK"]);
    const [credentialType, setCredentialType] = useState<'CPF' | 'EMAIL' | 'UNKNOWN'>('UNKNOWN');

    const logEndRef = useRef<HTMLDivElement>(null);
    const primaryColor = systemInfo.primaryColor || '#4f46e5';

    const addLog = (msg: string) => {
        setAuditLogs(prev => [...prev.slice(-6), `[${new Date().toLocaleTimeString()}] ${msg}`]);
    };

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [auditLogs]);

    useEffect(() => {
        const input = loginIdentifier.trim();
        if (!input) { setCredentialType('UNKNOWN'); return; }
        if (input.includes('@')) setCredentialType('EMAIL');
        else if (input.replace(/\D/g, '').length >= 4) setCredentialType('CPF');
        else setCredentialType('UNKNOWN');
    }, [loginIdentifier]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        addLog(`[AUTH] Validando ${credentialType}...`);

        try {
            const response = await authService.login({ 
                username: loginIdentifier.trim(), 
                password: loginPass 
            });
            
            addLog(`[SUCCESS] Sincronizado: ${response.data.user.name}`);
            
            setTimeout(() => {
                onLoginSuccess(response.data.user, response.data.token);
            }, 800);

        } catch (err: any) {
            const status = err.response?.status;
            const errorKey = err.response?.data?.error;
            
            if (status === 404 || errorKey === 'MEMBRO_NAO_LOCALIZADO') {
                setError('MEMBRO NÃO LOCALIZADO.');
                addLog(`[WARN] Identidade não localizada.`);
            } else if (status === 401 || errorKey === 'CREDENCIAIS_INVALIDAS') {
                setError('CHAVE INCORRETA.');
                addLog(`[DENIED] Falha na credencial.`);
            } else {
                setError('FALHA DE COMUNICAÇÃO.');
                addLog(`[ERROR] Timeout de rede.`);
            }
            setIsLoading(false);
        }
    };

    const handleIdentifierChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (/^\d+$/.test(val.replace(/\D/g, '')) && !val.includes('@')) {
            setLoginIdentifier(CPFUtils.formatCPF(val));
        } else {
            setLoginIdentifier(val);
        }
    };

    return (
        <div className="min-h-screen h-dvh bg-[#020617] flex items-center justify-center p-4 sm:p-6 lg:p-10 relative overflow-hidden">
            <div className="absolute inset-0 z-0 opacity-[0.03] sm:opacity-[0.05]" 
                 style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
            
            <div className="w-full max-w-6xl flex flex-col lg:flex-row bg-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] sm:rounded-[3.5rem] shadow-2xl overflow-hidden relative z-10 animate-fade-in min-h-[500px] lg:min-h-[650px]">
                
                <div className="hidden lg:flex lg:w-5/12 p-12 xl:p-20 flex-col border-r border-white/5 justify-center bg-gradient-to-br from-indigo-600/5 to-transparent">
                    <div className="space-y-10">
                        <div className="w-24 h-24 bg-slate-900 border border-white/10 rounded-3xl flex items-center justify-center text-white shadow-2xl relative">
                            {systemInfo.logoUrl ? (
                                <img src={systemInfo.logoUrl} className="w-full h-full object-contain p-4" alt="Logo" />
                            ) : (
                                <Shield size={42} style={{ color: primaryColor }} />
                            )}
                            <div className="absolute -bottom-2 -right-2 p-2 bg-indigo-600 text-white rounded-xl shadow-xl">
                                <Zap size={14} fill="currentColor"/>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            <h1 className="text-3xl xl:text-4xl font-black text-white uppercase tracking-tightest leading-none">
                                {systemInfo.name}
                            </h1>
                            <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.5em] opacity-70">
                                {systemInfo.shortName} • PORTAL DE ACESSO
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-black/40 border border-white/5 rounded-2xl p-6 font-mono text-[10px] text-indigo-300 space-y-2 h-36 overflow-y-auto custom-scrollbar shadow-inner">
                                {auditLogs.map((log, i) => <div key={i} className="opacity-80 border-b border-white/5 pb-1">{log}</div>)}
                                <div ref={logEndRef} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 bg-[#f8fafc] p-8 sm:p-12 lg:p-24 rounded-t-[3rem] lg:rounded-t-none lg:rounded-l-[5rem] shadow-inner flex flex-col justify-center relative">
                    
                    <div className="lg:hidden flex flex-col items-center mb-10 text-center">
                         <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center mb-4 shadow-xl border border-slate-200">
                             {systemInfo.logoUrl ? (
                                <img src={systemInfo.logoUrl} className="w-full h-full object-contain p-2" alt="Logo" />
                             ) : (
                                <Shield size={28} style={{ color: primaryColor }} />
                             )}
                         </div>
                         <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">{systemInfo.shortName}</h2>
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Portal do Membro</p>
                    </div>

                    {view === 'LOGIN' ? (
                        <form onSubmit={handleLogin} className="max-w-md mx-auto w-full space-y-8 sm:space-y-10">
                            <div className="space-y-3 sm:space-y-4">
                                <h2 className="text-3xl sm:text-4xl font-black text-slate-800 tracking-tightest uppercase leading-none">Identidade</h2>
                                <p className="text-slate-400 font-bold uppercase text-[9px] sm:text-[10px] tracking-widest leading-relaxed">
                                    Acesse o terminal de {systemInfo.shortName} via E-mail ou CPF.
                                </p>
                            </div>

                            {error && (
                                <div className="bg-rose-50 text-rose-600 p-4 sm:p-5 rounded-2xl text-[9px] sm:text-[10px] font-black uppercase text-center border border-rose-100 flex items-center justify-center gap-3 animate-shake">
                                    <ShieldAlert size={18}/> {error}
                                </div>
                            )}
                            
                            <div className="space-y-5 sm:space-y-6">
                                <div className="space-y-2 sm:space-y-3">
                                    <label className="block text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Identificador</label>
                                    <div className="relative group">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-slate-100 text-slate-400 group-focus-within:text-indigo-600 transition-all">
                                            {credentialType === 'EMAIL' ? <Mail size={18}/> : <Fingerprint size={18}/>}
                                        </div>
                                        <input 
                                            type="text" 
                                            value={loginIdentifier} 
                                            onChange={handleIdentifierChange}
                                            placeholder="E-mail ou CPF" 
                                            required 
                                            className="w-full pl-16 pr-6 py-5 sm:py-6 bg-white border border-slate-200 rounded-[1.75rem] sm:rounded-[2rem] font-black text-base sm:text-lg focus:border-indigo-500 outline-none transition-all shadow-sm" 
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2 sm:space-y-3">
                                    <label className="block text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">Chave de Acesso</label>
                                    <div className="relative group">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-slate-100 text-slate-400 group-focus-within:text-indigo-600 transition-all"><Lock size={18}/></div>
                                        <input 
                                            type="password" 
                                            value={loginPass} 
                                            onChange={e => setLoginPass(e.target.value)} 
                                            placeholder="••••••••" 
                                            required 
                                            className="w-full pl-16 pr-6 py-5 sm:py-6 bg-white border border-slate-200 rounded-[1.75rem] sm:rounded-[2rem] font-black text-base sm:text-lg focus:border-indigo-500 outline-none transition-all shadow-sm" 
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <button 
                                    type="submit" 
                                    disabled={isLoading} 
                                    style={{ backgroundColor: primaryColor }}
                                    className="w-full py-6 sm:py-8 text-white rounded-[2.2rem] sm:rounded-[2.5rem] font-black text-xs sm:text-sm uppercase tracking-[0.3em] shadow-2xl hover:brightness-110 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50"
                                >
                                    {isLoading ? <Loader2 className="animate-spin" size={24}/> : <>Entrar no Terminal <ArrowRight size={24}/></>}
                                </button>
                            </div>

                            <p className="text-[8px] sm:text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] text-center pt-4 border-t border-slate-100">
                                {systemInfo.name} • PRIVACIDADE ASSEGURADA
                            </p>
                        </form>
                    ) : (
                        <div className="max-w-md mx-auto w-full animate-fade-in space-y-10 text-center">
                            <button onClick={() => setView('LOGIN')} className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 mb-10 hover:text-indigo-600 transition-all"><ArrowLeft size={18}/> Voltar</button>
                            <div className="p-10 bg-indigo-50 rounded-[3rem] border border-indigo-100 shadow-inner">
                                <Zap size={48} className="text-indigo-600 mx-auto mb-6 animate-pulse"/>
                                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Solicitação Protocolada</h3>
                                <p className="text-[11px] text-slate-500 font-bold uppercase mt-4 leading-relaxed tracking-widest">
                                    Sua identidade está sendo validada pelo administrativo de {systemInfo.shortName}.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoginScreen;
