
import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { api } from '../services/api';

const ServerClock = () => {
    const [time, setTime] = useState<Date>(new Date());
    const [offset, setOffset] = useState<number>(0);
    const [synced, setSynced] = useState(false);

    useEffect(() => {
        const syncTime = async () => {
            try {
                const start = Date.now();
                // SRE FIX: Updated endpoint to /time (bypassing settings sub-route issues)
                const res = await api.get('/time');
                const end = Date.now();
                const latency = (end - start) / 2;
                
                // Hora do Servidor estimada = Hora recebida + Latência de volta
                const serverTime = res.data.serverTime + latency;
                const localTime = Date.now();
                
                // Diferença a ser somada ao relógio local para obter a hora do servidor
                const timeOffset = serverTime - localTime;
                
                setOffset(timeOffset);
                setSynced(true);
            } catch (e) {
                console.error("NTP Sync Failed", e);
            }
        };

        syncTime();
        // Ressincroniza a cada 5 minutos
        const syncInterval = setInterval(syncTime, 5 * 60 * 1000); 

        // Atualiza o display a cada segundo
        const tickInterval = setInterval(() => {
            setTime(new Date(Date.now() + offset));
        }, 1000);

        return () => {
            clearInterval(syncInterval);
            clearInterval(tickInterval);
        };
    }, [offset]);

    return (
        <div className="flex items-center gap-2 px-4 py-3 bg-slate-900/50 rounded-xl border border-white/5 text-slate-400 select-none">
            <Clock size={14} className={synced ? "text-emerald-500" : "text-amber-500 animate-pulse"} />
            <div className="flex flex-col leading-none">
                <span className="text-[10px] font-black font-mono text-white tracking-widest">
                    {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <span className="text-[7px] font-bold uppercase mt-0.5 opacity-60">
                    {synced ? 'SRE SYNC' : 'LOCAL'}
                </span>
            </div>
        </div>
    );
};

export default ServerClock;
