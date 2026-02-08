
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Shield, Zap, Brain, Layout, ArrowRight, Globe, 
    Fingerprint, Landmark, Radio, Lock, Cpu, Terminal, ShieldCheck
} from 'lucide-react';
import { SystemInfo } from '../types';
import api from '../services/api';

const FeatureCard = ({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) => (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-10 md:p-14 rounded-[3.5rem] hover:border-indigo-500/50 transition-all group hover:bg-white/10 flex flex-col h-full">
        <div className="p-4 bg-indigo-600/10 rounded-2xl w-fit text-indigo-400 mb-8 group-hover:scale-110 transition-transform">
            <Icon size={32} />
        </div>
        <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-4">{title}</h3>
        <p className="text-slate-400 text-sm font-medium leading-relaxed uppercase tracking-wide opacity-80">{desc}</p>
    </div>
);

const LandingPage = ({ systemInfo }: { systemInfo: SystemInfo }) => {
    const navigate = useNavigate();
    const [realStats, setRealStats] = useState({
        activeMembers: '...',
        neuralNodes: '...',
        latency: '...',
        integrity: '...'
    });

    useEffect(() => {
        const loadStats = async () => {
            try {
                const res = await api.get('/public/stats');
                setRealStats({
                    activeMembers: `${res.data.activeMembers} ATIVOS`,
                    neuralNodes: `${res.data.neuralNodes} ONLINE`,
                    latency: res.data.latency,
                    integrity: res.data.integrity
                });
            } catch (e) {
                console.error("Public stats sync failed.");
            }
        };
        loadStats();
    }, []);

    const primaryColor = systemInfo.primaryColor || '#4f46e5';

    return (
        <div className="w-screen min-h-screen bg-[#020617] text-white font-sans overflow-x-hidden selection:bg-indigo-600 flex flex-col relative">
            {/* SRE Background Layer */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[60rem] h-[60rem] bg-indigo-600/10 rounded-full blur-[150px] -mr-40 -mt-40"></div>
                <div className="absolute bottom-0 left-0 w-[50rem] h-[50rem] bg-emerald-600/5 rounded-full blur-[120px] -ml-20 -mb-20"></div>
                <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>
            </div>

            {/* Navigation Sovereignty */}
            <nav className="fixed top-0 left-0 right-0 z-[100] h-24 px-8 md:px-16 flex justify-between items-center border-b border-white/5 backdrop-blur-2xl bg-[#020617]/50">
                <div className="flex items-center gap-5">
                    <div className="p-3.5 bg-indigo-600 rounded-xl shadow-2xl shadow-indigo-500/20">
                        <Fingerprint size={28} />
                    </div>
                    <span className="font-black text-2xl tracking-tightest uppercase hidden sm:inline">
                        {systemInfo.shortName} <span className="text-indigo-500 italic">PRO</span>
                    </span>
                </div>
                <div className="flex items-center gap-8">
                    <button onClick={() => navigate('/login')} className="hidden md:block text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 hover:text-white transition-colors">Cluster Status: Online</button>
                    <button onClick={() => navigate('/login')} className="px-10 py-3.5 bg-white text-indigo-950 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 transition-all active:scale-95 shadow-xl flex items-center gap-3">
                        <Lock size={16}/> Acessar Terminal
                    </button>
                </div>
            </nav>

            <main className="relative z-10 flex-1 flex flex-col pt-24">
                {/* Hero Section */}
                <section className="min-h-[90vh] flex flex-col items-center justify-center px-8 md:px-16 text-center py-20 max-w-[1600px] mx-auto w-full">
                    <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-indigo-600/10 border border-indigo-500/20 rounded-full text-indigo-400 animate-fade-in mb-12">
                        <Radio size={14} className="animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">SRE Active Governance Protocol V27.0</span>
                    </div>
                    
                    <h1 className="text-6xl md:text-[10rem] font-black tracking-tightest leading-[0.85] uppercase max-w-7xl">
                        Gestão Coletiva <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-emerald-400 to-indigo-600">Soberana</span>
                    </h1>
                    
                    <p className="max-w-4xl mx-auto text-slate-400 text-sm md:text-2xl font-medium uppercase tracking-[0.2em] leading-relaxed opacity-80 mt-12">
                        O Kernel definitivo para Associações e Condomínios de Alta Performance. <br className="hidden md:block" />
                        Inteligência neural, biometria e resiliência tática em tempo real.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center gap-8 pt-20 w-full max-w-3xl">
                        <button 
                            onClick={() => navigate('/login')}
                            className="flex-1 px-14 py-8 bg-indigo-600 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-[0_30px_60px_rgba(79,70,229,0.4)] hover:bg-indigo-500 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-4"
                        >
                            Comando Master <ArrowRight size={20} />
                        </button>
                        <button 
                            onClick={() => navigate('/census/1')}
                            className="flex-1 px-14 py-8 bg-white/5 border border-white/10 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] hover:bg-white/10 transition-all backdrop-blur-xl flex items-center justify-center gap-4"
                        >
                            Censo Digital <Globe size={20} />
                        </button>
                    </div>

                    {/* Stats HUD */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-16 pt-32 w-full">
                        {[
                            { label: 'Neural Nodes', val: realStats.neuralNodes, sub: 'Cluster Active' },
                            { label: 'Integridade', val: realStats.integrity, sub: 'SRE Protocol' },
                            { label: 'Membros Ledger', val: realStats.activeMembers, sub: 'Active Entities' },
                            { label: 'Resposta', val: realStats.latency, sub: 'Neural Latency' }
                        ].map((stat, i) => (
                            <div key={i} className="text-center space-y-3 group">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em] group-hover:text-indigo-400 transition-colors">{stat.label}</p>
                                <p className="text-4xl font-black text-white font-mono">{stat.val}</p>
                                <p className="text-[8px] font-bold text-slate-600 uppercase tracking-[0.3em]">{stat.sub}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Tactical Features Section */}
                <section className="px-8 md:px-16 py-40 bg-white/[0.02] border-y border-white/5 w-full">
                    <div className="max-w-[1400px] mx-auto space-y-24">
                        <div className="flex flex-col md:flex-row justify-between items-end gap-12">
                            <div className="space-y-6">
                                <h2 className="text-5xl md:text-6xl font-black uppercase tracking-tightest">Pilares Estratégicos</h2>
                                <p className="text-slate-500 text-xs font-black uppercase tracking-[0.4em]">Tecnologia de Missão Crítica para a Vida Real</p>
                            </div>
                            <div className="w-40 h-2 bg-indigo-600 rounded-full mb-2"></div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                            <FeatureCard 
                                icon={Brain} 
                                title="Advisor Neural" 
                                desc="Assistência legislativa e técnica via Gemini 3 Pro integrada ao regimento interno do seu cluster em tempo real." 
                            />
                            <FeatureCard 
                                icon={Shield} 
                                title="Escudo Watchdog" 
                                desc="Monitoramento de perímetro geo-fenced com raio de pânico e protocolos automáticos de resiliência ativa." 
                            />
                            <FeatureCard 
                                icon={Landmark} 
                                title="Ledger Soberano" 
                                desc="Transparência total com trilhas de auditoria imutáveis, controle financeiro absoluto e BI demográfico de última geração." 
                            />
                        </div>
                    </div>
                </section>

                <footer className="py-32 px-12 text-center opacity-30 mt-auto border-t border-white/5 w-full bg-[#020617]">
                    <div className="flex justify-center gap-14 mb-14">
                        <Cpu size={32} />
                        <Terminal size={32} />
                        <ShieldCheck size={32} />
                    </div>
                    <p className="text-[12px] font-black uppercase tracking-[0.6em]">{systemInfo.name}</p>
                    <p className="text-[10px] font-bold uppercase tracking-widest mt-4">© 2025 SRE MASTER CLUSTER ALPHA • BUILD 255.1.02</p>
                </footer>
            </main>
        </div>
    );
};

export default LandingPage;
