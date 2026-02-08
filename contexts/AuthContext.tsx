import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, api, systemService } from '../services/api';
import { User } from '../types';
import { useSystem } from './SystemContext';

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    permissions: string[];
    login: (token: string, user: User) => void;
    logout: () => void;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: React.PropsWithChildren<{}>) => {
    const { updateSystemInfo } = useSystem();
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [permissions, setPermissions] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadUser = async () => {
        const token = localStorage.getItem('sie_auth_token');
        if (!token) {
            setIsLoading(false);
            return;
        }

        try {
            // 1. Critical Auth Check (Identity) - Se falhar aqui, o token é inválido.
            const userRes = await authService.me();
            const validUser = userRes.data;
            
            setUser(validUser);
            setIsAuthenticated(true);

            // 2. Auxiliary Data (Soft Fail) - Se falhar, mantém o login mas com permissões limitadas.
            try {
                const [permsRes, sysFullRes] = await Promise.all([
                    api.get('/settings/permissions/my'),
                    systemService.getInfo()
                ]);

                setPermissions(permsRes.data.data || []);

                // Atualiza systemInfo com dados privilegiados
                if (sysFullRes.data) {
                    updateSystemInfo(sysFullRes.data);
                }
            } catch (auxError) {
                console.warn("[SRE AUTH] Falha na sincronização auxiliar (Modo Degradado Ativo):", auxError);
                // Em caso de falha nas permissões, mantém array vazio ou padrão básico se necessário
                if (!permissions.length) setPermissions([]); 
            }

        } catch (error) {
            console.error("[SRE AUTH] Sessão Inválida ou Expirada (Critical):", error);
            logout(); // Apenas aqui realizamos o logout forçado
        } finally {
            setIsLoading(false);
        }
    };

    const login = (token: string, newUser: User) => {
        localStorage.setItem('sie_auth_token', token);
        setUser(newUser);
        setIsAuthenticated(true);
        // O loadUser agora é seguro e não vai deslogar se a API de permissões engasgar
        loadUser();
    };

    const logout = () => {
        localStorage.removeItem('sie_auth_token');
        setUser(null);
        setPermissions([]);
        setIsAuthenticated(false);
    };

    const refreshUser = async () => {
        await loadUser();
    };

    useEffect(() => {
        loadUser();
    }, []);

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, isLoading, permissions, login, logout, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
};