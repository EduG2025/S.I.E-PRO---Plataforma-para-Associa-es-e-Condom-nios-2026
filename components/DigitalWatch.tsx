
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
    Shield, Video, Lock, Loader2, Camera, ScanLine, 
    UserCheck, X, Plus, Trash2, Edit2, Save, Settings, Monitor, Globe,
    Maximize2, Zap, Activity, Radio, MapPin, Play, Pause, RefreshCw, Eye, EyeOff, ChevronRight, Clock, Tv,
    History, LayoutGrid, ShieldCheck, ZapOff, Wifi, Sparkles, Brain
} from 'lucide-react';
import { cameraService, aiService, api } from '../services/api';
import { CameraDevice, SystemInfo } from '../types';

const DigitalWatch = ({ systemInfo }: { systemInfo: SystemInfo }) => {
  const [activeTab, setActiveTab] = useState<'SURVEILLANCE' | 'FACE_ID' | 'SETUP'>('SURVEILLANCE');
  const [loading, setLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [perimeterAnalysis, setPerimeterAnalysis] = useState('');
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [gridSize, setGridSize] = useState<4 | 9>(4);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => { 
      cameraService.getAll().then(res => {
          setCameras(res.data.data || []);
          setLoading(false);
      });
  }, []);

  const handleAnalyzePerimeter = async () => {
    if (!canvasRef.current) return;
    setIsAnalyzing(true);
    setPerimeterAnalysis('');
    
    // Captura snapshot da câmera simulada (ou real se configurada)
    const ctx = canvasRef.current.getContext('2d');
    canvasRef.current.width = 640;
    canvasRef.current.height = 360;
    ctx!.fillStyle = '#000';
    ctx!.fillRect(0,0,640,360);
    ctx!.fillStyle = '#fff';
    ctx!.font = '20px mono';
    ctx!.fillText(`SRE ANALYTICS FEED: ${new Date().toISOString()}`, 50, 180);
    
    const image = canvasRef.current.toDataURL('image/jpeg');
    
    try {
        const res = await api.post('/ai/analyze-perimeter', { image, location: 'ZONA_ALPHA' });
        setPerimeterAnalysis(res.data.analysis);
    } catch (e) { setPerimeterAnalysis("ERRO NO HANDSHAKE NEURAL."); }
    finally { setIsAnalyzing(false); }
  };

  const primaryColor = systemInfo.primaryColor || '#4f46e5';

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-6 animate-fade-in bg-slate-50 gap-6 p-[var(--sie-viewport-padding)]">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-900 p-8 rounded-[3.5rem] text-white shadow-xl overflow-hidden relative shrink-0 border border-white/5">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/5 rounded-full blur-[100px] -mr-40 -mt-40"></div>
          <div className="relative z-10 flex items-center gap-6">
               <div className="p-4 bg-indigo-600 rounded-2xl shadow-xl" style={{ backgroundColor: primaryColor }}><Monitor size={28}/></div>
               <div>
                  <h2 className="text-2xl font-black uppercase tracking-tightest leading-none">{systemInfo.shortName} Vision</h2>
                  <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mt-2 opacity-80 flex items-center gap-2">
                     <Radio size={12} className="text-rose-500 animate-pulse" /> Central de Vigilância Neural V28.0
                  </p>
               </div>
          </div>
          <div className="flex bg-white/5 backdrop-blur-xl rounded-2xl p-1.5 border border-white/10 relative z-10">
             {[
                { id: 'SURVEILLANCE', label: 'Câmeras', icon: Video }, 
                { id: 'FACE_ID', label: 'Vision AI', icon: ScanLine }
             ].map(tab => (
                 <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-8 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === tab.id ? 'bg-white text-indigo-900 shadow-xl' : 'text-slate-400 hover:text-white'}`}>
                     <tab.icon size={16}/> {tab.label}
                 </button>
             ))}
          </div>
      </div>

      <div className="flex-1 bg-white p-8 rounded-[4rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col relative">
        <canvas ref={canvasRef} className="hidden" />
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {activeTab === 'SURVEILLANCE' && (
              <div className="space-y-8 animate-fade-in pb-10">
                  <div className="flex justify-between items-center bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 shadow-inner">
                      <div className="flex gap-6 items-center">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Grid Operacional</span>
                        <div className="flex bg-white p-1 rounded-xl shadow-sm">
                            {[4, 9].map(size => (
                                <button key={size} onClick={() => setGridSize(size as any)} className={`px-6 py-2.5 rounded-lg text-[10px] font-black transition-all ${gridSize === size ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}>{size === 4 ? '2x2' : '3x3'}</button>
                            ))}
                        </div>
                      </div>
                      <button onClick={handleAnalyzePerimeter} disabled={isAnalyzing} className="px-8 py-3.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all flex items-center gap-3 active:scale-95 disabled:opacity-50">
                          {isAnalyzing ? <Loader2 size={16} className="animate-spin"/> : <Brain size={16}/>} Analisar Perímetro
                      </button>
                  </div>

                  {perimeterAnalysis && (
                      <div className="p-8 bg-indigo-950 rounded-[2.5rem] text-white shadow-2xl animate-slide-up border border-white/10 relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-6 opacity-5"><Sparkles size={80}/></div>
                          <h4 className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.5em] mb-4 flex items-center gap-2">
                             <Zap size={12} className="text-rose-500 animate-pulse"/> Alerta de Segurança Vision
                          </h4>
                          <p className="text-sm md:text-xl font-black tracking-tightest leading-tight uppercase italic text-indigo-50 border-l-4 border-indigo-500 pl-6">"{perimeterAnalysis}"</p>
                      </div>
                  )}

                  <div className={`grid gap-6 ${gridSize === 4 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
                      {cameras.slice(0, gridSize).map((cam) => (
                          <div key={cam.id} className="bg-slate-950 rounded-[2.5rem] border border-slate-800 overflow-hidden group relative shadow-2xl hover:ring-2 hover:ring-indigo-500 transition-all aspect-video">
                              <iframe src={cam.url} className="w-full h-full border-none opacity-80 group-hover:opacity-100 transition-opacity" title={cam.name} />
                              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full text-[9px] font-black text-white uppercase tracking-widest border border-white/10 flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 bg-rose-600 rounded-full animate-pulse"></div>
                                  {cam.name}
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DigitalWatch;
