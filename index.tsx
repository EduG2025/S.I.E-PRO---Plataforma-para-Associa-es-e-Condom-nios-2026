import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

/**
 * 🏛️ S.I.E PRO — KERNEL MASTER V25.5
 * SRE BOOT TELEMETRY & INITIALIZATION PROTOCOL
 */
console.log("%c 🏛️ S.I.E PRO — KERNEL MASTER V25.5 ", "color: #ffffff; background: #4f46e5; padding: 8px; border-radius: 8px; font-weight: 900;");
console.log("%c PROTOCOLO SRE: Sincronia de DNA Visual Ativa. ", "color: #4f46e5; font-weight: 800;");

// SRE ERROR BOUNDARY - Protocolo de Resiliência de Interface
interface ErrorBoundaryProps { children?: React.ReactNode; }
interface ErrorBoundaryState { hasError: boolean; error: Error | null; }

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public props: ErrorBoundaryProps;
  state: ErrorBoundaryState = { hasError: false, error: null };

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("🛑 SRE CRITICAL CRASH:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '60px', background: '#020617', color: 'white', height: '100vh', fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.05, backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
          <div style={{ background: '#ef4444', padding: '30px 50px', borderRadius: '30px', marginBottom: '40px', boxShadow: '0 20px 50px rgba(239, 68, 68, 0.3)', position: 'relative', zIndex: 10 }}>
            <h1 style={{ margin: 0, fontWeight: 900, letterSpacing: '-0.05em', fontSize: '2rem' }}>FALHA DE KERNEL ATIVO</h1>
            <p style={{ margin: '10px 0 0 0', fontWeight: 800, fontSize: '10px', textTransform: 'uppercase', opacity: 0.8, letterSpacing: '0.3em' }}>SRE Critical Fault Detected</p>
          </div>
          <p style={{ color: '#94a3b8', maxWidth: '600px', lineHeight: '1.6', fontSize: '14px', fontWeight: 500, position: 'relative', zIndex: 10 }}>
            Ocorreu uma exceção não tratada no módulo de renderização. 
            Isso pode ser causado por inconsistência no cache do navegador ou falha de rede na sincronia de dados.
          </p>
          <div style={{ marginTop: '30px', position: 'relative', zIndex: 10, width: '100%', maxWidth: '800px' }}>
            <pre style={{ background: 'rgba(255,255,255,0.03)', padding: '25px', borderRadius: '25px', color: '#f87171', fontSize: '11px', overflow: 'auto', textAlign: 'left', border: '1px solid rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
              <code>{this.state.error?.toString()}</code>
            </pre>
          </div>
          <button 
            onClick={() => { localStorage.clear(); window.location.reload(); }}
            style={{ marginTop: '40px', padding: '18px 45px', background: 'white', color: '#020617', border: 'none', borderRadius: '15px', cursor: 'pointer', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', fontSize: '11px', transition: 'all 0.3s' }}
          >
            Reiniciar & Limpar Cache
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootEl = document.getElementById('root');
if (rootEl) {
  const root = createRoot(rootEl);
  root.render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
} else {
  console.error("🛑 SRE CRITICAL: Elemento #root não localizado no DOM.");
}
