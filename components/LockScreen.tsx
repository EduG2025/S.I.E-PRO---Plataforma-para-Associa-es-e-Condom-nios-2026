
import React from 'react';
import { Lock, ShieldAlert, Phone, Mail, Globe } from 'lucide-react';

interface LockScreenProps {
    systemInfo: any;
}

const LockScreen = ({ systemInfo }: LockScreenProps) => {
    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-rose-900/20 via-slate-950 to-slate-950"></div>
            
            <div className="relative z-10 max-w-lg w-full bg-slate-900 border border-slate-800 p-12 rounded-[3rem] shadow-2xl flex flex-col items-center gap-8 animate-scale-in">
                <div className="w-24 h-24 bg-rose-500/10 rounded-full flex items-center justify-center border-4 border-rose-500 shadow-[0_0_50px_rgba(244,63,94,0.3)] animate-pulse">
                    <Lock size={48} className="text-rose-500" />
                </div>
                
                <div className="space-y-4">
                    <h1 className="text-3xl font-black text-white uppercase tracking-tight leading-none">Acesso Suspenso</h1>
                    <p className="text-slate-400 font-medium text-sm leading-relaxed uppercase tracking-widest">
                        O serviço para <span className="text-white font-bold">{systemInfo.shortName || 'ESTA CONTA'}</span> está temporariamente interrompido devido a pendências administrativas.
                    </p>
                </div>

                <div className="w-full bg-slate-950 rounded-2xl p-6 border border-slate-800 space-y-4">
                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                        <ShieldAlert size={14}/> Contate o Provedor
                    </p>
                    <div className="flex flex-col gap-3">
                        <a href="mailto:suporte@siepro.com.br" className="flex items-center justify-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-xl text-white text-xs font-bold uppercase transition-all">
                            <Mail size={16} /> suporte@siepro.com.br
                        </a>
                        <a href="https://wa.me/5511999999999" className="flex items-center justify-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-xl text-white text-xs font-bold uppercase transition-all">
                            <Phone size={16} /> Suporte Financeiro
                        </a>
                    </div>
                </div>

                <p className="text-[9px] text-slate-600 font-mono uppercase">Error Code: LICENSE_SUSPENDED_402</p>
            </div>
        </div>
    );
};

export default LockScreen;
