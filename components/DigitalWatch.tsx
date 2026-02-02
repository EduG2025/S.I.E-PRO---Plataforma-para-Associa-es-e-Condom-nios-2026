
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
    Shield, Video, Lock, Loader2, Camera, ScanLine, 
    UserCheck, X, Plus, Trash2, Edit2, Save, Settings, Monitor, Globe,
    Maximize2, Zap, Activity, Radio, MapPin, Play, Pause, RefreshCw, Eye, EyeOff, ChevronRight, Clock, Tv,
    History, LayoutGrid, ShieldCheck, ZapOff, Wifi
} from 'lucide-react';
import { cameraService } from '../services/api';
import { CameraDevice, SystemInfo } from '../types';

interface DigitalWatchProps {
  systemInfo: SystemInfo;
}

const DigitalWatch = ({ systemInfo }: DigitalWatchProps) => {
  const [activeTab, setActiveTab] = useState<'SURVEILLANCE' | 'FACE_ID' | 'SETUP'>('SURVEILLANCE');
  const [loading, setLoading] = useState(true);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [gridSize, setGridSize] = useState<1 | 4 | 9>(4);
  const [isPatrolMode, setIsPatrolMode] = useState(false);
  const [patrolInterval, setPatrolInterval] = useState(10);
  const [patrolOffset, setPatrolOffset] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCamera, setNewCamera] = useState<Partial<CameraDevice>>({ name: '', url: '', location: '', status: 'ACTIVE' });
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<'MATCH' | 'DENIED' | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const patrolTimerRef = useRef<any>(null);

  const loadCameras = useCallback(async () => {
    setLoading(true);
    try {
        const res = await cameraService.getAll();
        setCameras(res.data.data || []);
    } catch (e) {
        console.error("Central Offline.");
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => { loadCameras(); }, [loadCameras]);

  useEffect(() => {
    if (isPatrolMode && cameras.length > gridSize) {
        patrolTimerRef.current = setInterval(() => {
            setPatrolOffset(prev => (prev + gridSize) % cameras.length);
        }, patrolInterval * 1000);
    } else {
        if (patrolTimerRef.current) clearInterval(patrolTimerRef.current);
    }
    return () => { if (patrolTimerRef.current) clearInterval(patrolTimerRef.current); };
  }, [isPatrolMode, cameras.length, gridSize, patrolInterval]);

  const handleAddCamera = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCamera.name || !newCamera.url) return;
    setIsSaving(true);
    try {
        await cameraService.create(newCamera);
        setIsModalOpen(false);
        setNewCamera({ name: '', url: '', location: '', status: 'ACTIVE' });
        loadCameras();
    } finally { setIsSaving(false); }
  };

  const handleDeleteCamera = async (id: string | number) => {
    if (!confirm("Remover este feed de monitoramento?")) return;
    try {
        await cameraService.delete(id);
        loadCameras();
    } catch (e) { alert("Falha ao remover."); }
  };

  const startBiometricScan = async () => {
    setIsScanning(true);
    setScanResult(null);
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        if (videoRef.current) videoRef.current.srcObject = stream;
        setTimeout(() => {
            setScanResult(Math.random() > 0.3 ? 'MATCH' : 'DENIED');
            setIsScanning(false);
        }, 3500);
    } catch (e) {
        alert("Acesso negado aos sensores biométricos.");
        setIsScanning(false);
    }
  };

  const displayedCameras = cameras.slice(patrolOffset, patrolOffset + gridSize);

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-6 animate-fade-in pb-10 h-full relative">
      {/* HEADER DA CENTRAL */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl overflow-hidden relative shrink-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/5 rounded-full blur-[100px] -mr-40 -mt-40"></div>
          <div className="relative z-10 flex items-center gap-5">
               <div className="p-4 bg-indigo-600 rounded-2xl shadow-xl" style={{ backgroundColor: systemInfo.primaryColor }}><Monitor size={28}/></div>
               <div>
                  <h2 className="text-3xl font-black tracking-tighter leading-none uppercase">{systemInfo.shortName} Vision</h2>
                  <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mt-2 opacity-80">Central de Vigilância Digital • V5.0</p>
               </div>
          </div>
          <div className="flex bg-white/5 backdrop-blur-xl rounded-2xl p-1.5 border border-white/10 relative z-10">
             {[
                { id: 'SURVEILLANCE', label: 'Monitoramento', icon: Video }, 
                { id: 'FACE_ID', label: 'Identidade Facial', icon: ScanLine },
                { id: 'SETUP', label: 'Dispositivos', icon: Settings }
             ].map(tab => (
                 <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`} style={activeTab === tab.id ? { backgroundColor: systemInfo.primaryColor } : {}}>
                     <tab.icon size={16}/> {tab.label}
                 </button>
             ))}
          </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
          {activeTab === 'SURVEILLANCE' && (
              <div className="space-y-6 animate-fade-in">
                  {/* CONTROLES DE GRADE */}
                  <div className="flex justify-between items-center px-4 bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm mb-6">
                      <div className="flex gap-4 items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Layout de Central:</span>
                        <div className="flex bg-slate-100 p-1 rounded-xl">
                            {[1, 4, 9].map(size => (
                                <button key={size} onClick={() => setGridSize(size as any)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${gridSize === size ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{size === 1 ? 'Solo' : size === 4 ? '2x2' : '3x3'}</button>
                            ))}
                        </div>
                      </div>
                      <div className="flex gap-4 items-center">
                        <button onClick={() => setIsPatrolMode(!isPatrolMode)} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${isPatrolMode ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'}`}>
                           {isPatrolMode ? 'Patrulha Ativa' : 'Ativar Patrulha'}
                        </button>
                      </div>
                  </div>

                  <div className={`grid gap-6 ${gridSize === 1 ? 'grid-cols-1' : gridSize === 4 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
                      {displayedCameras.map((cam, idx) => (
                          <div key={cam.id} className="bg-slate-950 rounded-[2.5rem] border border-slate-800 overflow-hidden group relative shadow-2xl h-fit ring-1 ring-white/5 hover:ring-indigo-500/50 transition-all">
                              <div className="aspect-video bg-black relative">
                                  <iframe src={cam.url} className="w-full h-full border-none opacity-90 grayscale-[0.3] group-hover:grayscale-0 transition-all" title={cam.name} />
                                  <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full text-[9px] font-black text-white uppercase tracking-widest border border-white/10 flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 bg-rose-600 rounded-full animate-pulse"></div>
                                      FEED 0{idx + patrolOffset + 1} • LIVE
                                  </div>
                                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-all">
                                      <button className="p-3 bg-white/10 backdrop-blur-xl text-white rounded-xl border border-white/20 hover:bg-indigo-600"><Maximize2 size={18}/></button>
                                  </div>
                              </div>
                              <div className="p-6 bg-slate-900/95 flex justify-between items-center border-t border-white/5">
                                  <div>
                                      <h4 className="text-xs font-black text-white uppercase tracking-tight">{cam.name}</h4>
                                      <p className="text-[9px] text-slate-500 uppercase mt-1 flex items-center gap-1.5"><MapPin size={10}/> {cam.location}</p>
                                  </div>
                                  <div className="flex gap-3">
                                      <div className="p-2 bg-white/5 rounded-lg text-emerald-400"><Wifi size={14}/></div>
                                  </div>
                              </div>
                          </div>
                      ))}
                      {cameras.length === 0 && (
                          <div className="col-span-full py-40 text-center bg-slate-900/50 rounded-[4rem] border-2 border-dashed border-slate-800">
                              <Video size={64} className="mx-auto text-slate-800 mb-6 opacity-20"/>
                              <p className="font-black uppercase text-[10px] text-slate-600 tracking-[0.4em]">Nenhum dispositivo mapeado no cluster.</p>
                          </div>
                      )}
                  </div>
              </div>
          )}

          {activeTab === 'FACE_ID' && (
              <div className="bg-slate-950 rounded-[4rem] p-16 text-white shadow-2xl border border-slate-800 animate-scale-in flex flex-col items-center justify-center min-h-[600px] relative overflow-hidden">
                  <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                  
                  <div className="relative z-10 flex flex-col items-center gap-12 text-center">
                      <div className="space-y-4">
                          <h3 className="text-5xl font-black uppercase tracking-tightest leading-none">Autenticação <br/> Biométrica</h3>
                          <p className="text-indigo-400 text-xs font-black uppercase tracking-[0.4em]">Protocolo SRE Vision Identity</p>
                      </div>

                      <div className="relative">
                          <div className={`w-80 h-80 rounded-full border-4 ${scanResult === 'MATCH' ? 'border-emerald-500' : scanResult === 'DENIED' ? 'border-rose-500' : 'border-indigo-500/30'} flex items-center justify-center overflow-hidden bg-black shadow-[0_0_100px_rgba(79,70,229,0.2)]`}>
                              <video ref={videoRef} autoPlay playsInline className={`w-full h-full object-cover grayscale brightness-110 ${isScanning ? 'animate-pulse' : ''}`} />
                              {isScanning && <div className="absolute inset-0 flex items-center justify-center"><div className="w-full h-1 bg-indigo-500 shadow-[0_0_30px_#6366f1] animate-[scan_2s_infinite]"></div></div>}
                          </div>
                          {scanResult === 'MATCH' && <div className="absolute -bottom-6 bg-emerald-500 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase shadow-2xl animate-bounce">Acesso Autorizado</div>}
                          {scanResult === 'DENIED' && <div className="absolute -bottom-6 bg-rose-500 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase shadow-2xl animate-shake">Identidade Não Localizada</div>}
                      </div>

                      <button onClick={startBiometricScan} disabled={isScanning} className="px-14 py-7 bg-indigo-600 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-indigo-500 transition-all active:scale-95 disabled:opacity-50">
                        {isScanning ? 'Varredura em Curso...' : 'Iniciar Reconhecimento'}
                      </button>
                  </div>
              </div>
          )}

          {activeTab === 'SETUP' && (
              <div className="animate-fade-in space-y-8">
                  <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-8">
                      <div className="flex items-center gap-6">
                          <div className="p-5 bg-indigo-50 text-indigo-600 rounded-[2rem] shadow-inner"><Monitor size={32}/></div>
                          <div>
                              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Gestão de Dispositivos</h3>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Configuração de canais de feed Vision</p>
                          </div>
                      </div>
                      <button onClick={() => setIsModalOpen(true)} className="px-12 py-5 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all flex items-center gap-3">
                          <Plus size={20}/> Registrar Feed
                      </button>
                  </div>

                  <div className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden">
                      <table className="w-full text-left">
                          <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                              <tr><th className="p-8">Identificação</th><th className="p-8">Localização</th><th className="p-8">URL do Fluxo</th><th className="p-8 text-center">Estado</th><th className="p-8 text-right">Ações</th></tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                              {cameras.map(cam => (
                                  <tr key={cam.id} className="hover:bg-slate-50 transition-all group">
                                      <td className="p-8 font-black text-slate-800 uppercase text-sm">{cam.name}</td>
                                      <td className="p-8 font-bold text-slate-400 text-[10px] uppercase tracking-widest">{cam.location}</td>
                                      <td className="p-8 font-mono text-[10px] text-indigo-600 max-w-xs truncate">{cam.url}</td>
                                      <td className="p-8 text-center"><span className="px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 text-[8px] font-black uppercase tracking-widest">Ativo</span></td>
                                      <td className="p-8 text-right">
                                          <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all">
                                              <button onClick={() => handleDeleteCamera(cam.id)} className="p-3 bg-white border border-slate-200 text-slate-300 hover:text-rose-600 rounded-xl shadow-sm"><Trash2 size={16}/></button>
                                          </div>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          )}
      </div>

      {/* MODAL DE ADIÇÃO DE CÂMERA */}
      {isModalOpen && (
          <div className="sie-editor-overlay">
              <div className="sie-modal-container !h-auto !max-w-2xl self-center">
                  <form onSubmit={handleAddCamera}>
                      <div className="h-20 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-white/5">
                          <div className="flex items-center gap-5">
                              <div className="p-3.5 bg-indigo-600 rounded-xl shadow-xl"><Video size={22}/></div>
                              <h4 className="font-black text-xl tracking-tight uppercase">Novo Feed de Vídeo</h4>
                          </div>
                          <button type="button" onClick={() => setIsModalOpen(false)} className="p-3.5 hover:bg-rose-500 hover:text-white text-slate-400 rounded-xl transition-all border border-white/5"><X size={24}/></button>
                      </div>
                      <div className="p-12 space-y-8 bg-[#fdfdfe]">
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identificação da Lente</label>
                              <input required className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-sm focus:bg-white focus:border-indigo-500 transition-all uppercase" placeholder="Ex: PORTÃO PRINCIPAL 01" value={newCamera.name} onChange={e => setNewCamera({...newCamera, name: e.target.value})} />
                          </div>
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Localização Física</label>
                              <input required className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-sm focus:bg-white focus:border-indigo-500 transition-all uppercase" placeholder="Ex: SETOR ALFA - EXTERNO" value={newCamera.location} onChange={e => setNewCamera({...newCamera, location: e.target.value})} />
                          </div>
                          <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">URL de Fluxo (RTSP / HTTP / IP)</label>
                              <input required className="w-full font-black h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-sm focus:bg-white focus:border-indigo-500 transition-all" placeholder="http://ip-da-camera:porta/feed" value={newCamera.url} onChange={e => setNewCamera({...newCamera, url: e.target.value})} />
                          </div>
                          <div className="pt-4 border-t border-slate-100 flex gap-4">
                              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors">Cancelar</button>
                              <button type="submit" disabled={isSaving} className="flex-[2] py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-600 transition-all">
                                  {isSaving ? <Loader2 className="animate-spin" /> : 'Registrar Dispositivo'}
                              </button>
                          </div>
                      </div>
                  </form>
              </div>
          </div>
      )}

      <style>{`
        @keyframes scan { 0% { transform: translateY(-160px); } 100% { transform: translateY(160px); } }
      `}</style>
    </div>
  );
};

export default DigitalWatch;
