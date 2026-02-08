
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { SystemProvider } from './contexts/SystemContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import AppRoutes from './routes';

/**
 * S.I.E PRO - BOOTSTRAP MASTER V25.0
 * Orquestrador global de contextos e roteamento.
 */
const App = () => {
    return (
        <BrowserRouter>
            <SystemProvider>
                <ThemeProvider>
                    <AuthProvider>
                        <AppRoutes />
                    </AuthProvider>
                </ThemeProvider>
            </SystemProvider>
        </BrowserRouter>
    );
};

export default App;
