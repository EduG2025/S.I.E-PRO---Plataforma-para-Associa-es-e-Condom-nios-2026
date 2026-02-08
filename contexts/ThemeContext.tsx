import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { studioService } from '../services/api';
import { DualDesignSystem, DesignTokens } from '../types';

interface ThemeContextType {
    designSystem: DualDesignSystem | null;
    currentTokens: DesignTokens | null;
    setDesignSystem: React.Dispatch<React.SetStateAction<DualDesignSystem | null>>;
    isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: React.PropsWithChildren<{}>) => {
    const [designSystem, setDesignSystem] = useState<DualDesignSystem | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isMobileView, setIsMobileView] = useState(window.innerWidth < 1024);

    useEffect(() => {
        const handleResize = () => setIsMobileView(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const loadTokens = async () => {
            try {
                const res = await studioService.getTokens();
                setDesignSystem(res.data);
            } catch (e) {
                console.error("[SRE THEME] Token Load Fail", e);
            } finally {
                setIsLoading(false);
            }
        };
        loadTokens();
    }, []);

    const currentTokens = useMemo(() => {
        if (!designSystem) return null;
        return isMobileView ? designSystem.mobile : designSystem.desktop;
    }, [designSystem, isMobileView]);

    // INJEÇÃO SOBERANA DE CSS
    useEffect(() => {
        if (!currentTokens) return;
        const root = document.documentElement;
        
        // Atributos de Geometria
        root.style.setProperty('--sie-radius', `${currentTokens.borderRadius}px`);
        root.style.setProperty('--sie-padding-inner', `${currentTokens.containerPadding}px`);
        root.style.setProperty('--sie-viewport-padding', `${currentTokens.viewportPadding}px`);
        root.style.setProperty('--sie-border-spacing', `${currentTokens.borderSpacing}px`);
        root.style.setProperty('--sie-footer-h', `${currentTokens.footerHeight}px`);
        
        // Atributos de Tipografia
        root.style.setProperty('--sie-font-base', `${currentTokens.fontSizeBase}px`);
        root.style.setProperty('--sie-font-scale', `${currentTokens.fontScale || 1.2}`);
        root.style.setProperty('--sie-font-weight-heading', `${currentTokens.fontWeightHeading || 900}`);
        root.style.setProperty('--sie-letter-spacing', `${(currentTokens.letterSpacingBase || 0) / 100}em`);
        
        // Atributos de Componentes
        root.style.setProperty('--sie-input-h', `${currentTokens.inputHeight || 56}px`);
        root.style.setProperty('--sie-button-radius', `${currentTokens.buttonRadius ?? currentTokens.borderRadius}px`);
        root.style.setProperty('--sie-button-weight', `${currentTokens.buttonWeight || 900}`);
        root.style.setProperty('--sie-input-border-w', `${currentTokens.inputBorderWidth || 1}px`);
        root.style.setProperty('--sie-card-border-w', `${currentTokens.cardBorderWidth || 1}px`);
        root.style.setProperty('--sie-glass-opacity', `${(currentTokens.glassOpacity || 96) / 100}`);
        root.style.setProperty('--sie-form-overlap', `${currentTokens.formOverlapOffset}px`);

        // Cores e Temas
        root.style.setProperty('--sie-primary', currentTokens.primaryColor);
        root.style.setProperty('--sie-success', currentTokens.successColor || '#10b981');
        root.style.setProperty('--sie-danger', currentTokens.dangerColor || '#ef4444');
        root.style.setProperty('--sie-warning', currentTokens.warningColor || '#f59e0b');
        root.style.setProperty('--sie-surface', currentTokens.surfaceColor || '#f8fafc');
        
        // Sidebar
        root.style.setProperty('--sie-sidebar-width', `${currentTokens.sidebarWidth}px`);
        root.style.setProperty('--sie-sidebar-bg', currentTokens.sidebarBg || '#020617');
        root.style.setProperty('--sie-sidebar-border', currentTokens.sidebarBorderColor || 'rgba(255,255,255,0.08)');
        root.style.setProperty('--sie-sidebar-text', currentTokens.sidebarTextColor || '#94a3b8');
        root.style.setProperty('--sie-sidebar-active', currentTokens.sidebarActiveColor || currentTokens.primaryColor);
        root.style.setProperty('--sie-sidebar-hover', currentTokens.sidebarHoverColor || 'rgba(255,255,255,0.05)');

        // Sombras
        const si = currentTokens.shadowIntensity || 0.1;
        const csi = currentTokens.cardShadowIntensity || si;
        root.style.setProperty('--sie-shadow-opacity', `${si}`);
        root.style.setProperty('--sie-shadow', `0 ${si * 10}px ${si * 15}px -3px rgba(0, 0, 0, ${si * 2})`);
        root.style.setProperty('--sie-shadow-lg', `0 ${csi * 20}px ${csi * 25}px -5px rgba(0, 0, 0, ${csi * 2})`);

        // Layout
        root.style.setProperty('--sie-title-align', currentTokens.centerTitle ? 'center' : 'left');
        root.style.setProperty('--sie-title-justify', currentTokens.centerTitle ? 'center' : 'flex-start');
        root.style.setProperty('--sie-mobile-menu-type', currentTokens.mobileMenuType || 'SIDEBAR');
        root.style.setProperty('--sie-mobile-menu-side', currentTokens.mobileMenuSide || 'left');

    }, [currentTokens]);

    return (
        <ThemeContext.Provider value={{ designSystem, currentTokens, setDesignSystem, isLoading }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) throw new Error("useTheme must be used within a ThemeProvider");
    return context;
};