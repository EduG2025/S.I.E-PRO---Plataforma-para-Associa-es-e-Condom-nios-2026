import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, systemService } from '../services/api';
import { SystemInfo } from '../types';
import { DEFAULT_SYSTEM_INFO } from '../constants';

interface SystemContextType {
    systemInfo: SystemInfo;
    isLoading: boolean;
    isSuspended: boolean;
    updateSystemInfo: (info: SystemInfo) => Promise<void>;
    reloadSystemInfo: () => Promise<void>;
    t: (term: string) => string;
}

const SystemContext = createContext<SystemContextType | undefined>(undefined);

export const SystemProvider = ({ children }: React.PropsWithChildren<{}>) => {
    const [systemInfo, setSystemInfo] = useState<SystemInfo>(DEFAULT_SYSTEM_INFO);
    const [isLoading, setIsLoading] = useState(true);
    const [isSuspended, setIsSuspended] = useState(false);

    const reloadSystemInfo = async () => {
        try {
            // Tenta endpoint público primeiro para velocidade
            const res = await api.get('/public/system-info');
            const info = res.data;
            
            if (info.license_status === 'SUSPENDED') {
                setIsSuspended(true);
            } else {
                setIsSuspended(false);
            }
            
            setSystemInfo(info || DEFAULT_SYSTEM_INFO);
        } catch (error) {
            console.error("[SRE SYSTEM] Boot Failure", error);
        } finally {
            setIsLoading(false);
        }
    };

    const updateSystemInfo = async (info: SystemInfo) => {
        setSystemInfo(info);
        // Opcional: Persistir no backend aqui se necessário, ou deixar para o componente Settings
    };

    const t = (term: string) => {
        const dict = systemInfo.dictionary || {};
        return dict[term.toUpperCase()] || term;
    };

    useEffect(() => {
        reloadSystemInfo();
    }, []);

    return (
        <SystemContext.Provider value={{ systemInfo, isLoading, isSuspended, updateSystemInfo, reloadSystemInfo, t }}>
            {children}
        </SystemContext.Provider>
    );
};

export const useSystem = () => {
    const context = useContext(SystemContext);
    if (!context) throw new Error("useSystem must be used within a SystemProvider");
    return context;
};