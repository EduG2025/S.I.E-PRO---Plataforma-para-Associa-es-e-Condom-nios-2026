
import React, { useState, useEffect, useRef } from 'react';
import { 
    Car, Plus, Search, Loader2, Trash2, Edit2, X, Save, 
    ShieldCheck, AlertCircle, Info, Smartphone, UserCheck, 
    ScanLine, Camera, Zap, ShieldAlert
} from 'lucide-react';
import { api, userService } from '../services/api';
import { SystemInfo, User } from '../types';

interface Vehicle {
    id: number;
    plate: string;
    brand: string;
    model: string;
    color: string;
    unit: string;
    status: string;
}

const VehicleManagement = ({ systemInfo }: { systemInfo: SystemInfo }) => {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isScanning, setIsScanning] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingVehicle, setEditingVehicle] = useState<any>({ plate: '', brand: '', model: '', unit: '', status: 'AUTHORIZED' });

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const vRes = await api.get('/vehicles');
            setVehicles(vRes.data.data || []);
        } catch (e) { console.error("Falha ao carregar veículos."); }
        finally { setIsLoading(false); }
    };

    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setIsSaving(true);
        try {
            if (editingVehicle.id) await api.put(`/vehicles/${editingVehicle.id}`, editingVehicle);
            else await api.post('/vehicles', editingVehicle);
            setIsModalOpen(false);
            loadData();
        } catch (e) { alert("Erro ao salvar veículo."); }
        finally { setIsSaving(false); }
    };

    const startLPR = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsScanning(true);
            }
        } catch (e) { alert("Câmera bloqueada."); }
    };

    const processLPR = async () => {
        if (!videoRef.current || !canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        ctx?.drawImage(videoRef.current, 0, 0);
        
        const image = canvasRef.current.toDataURL('image/jpeg');
        setIsSaving(true);
        
        try {
            const res = await api.post('/ai/vision-lpr', { image });
            const data = res.data;
            setEditingVehicle({
                ...editingVehicle,
                plate: data.plate || '',
                brand: data.brand || '',
                model: data.model || '',
                color: data.color || ''
            });
            if (data.status === 'AUTHORIZED') {
                alert(`✅ VEÍCULO IDENTIFICADO: ${data.plate}\nPROPRIETÁRIO: ${data.owner_info?.unit || 'MORADOR'}`);
            }
        } catch (e) { alert("Falha no reconhecimento LPR."); }
        finally {
            setIsSaving(false);
            stopCamera();
        }
    };

    const stopCamera = () => {
        if (videoRef.current?.srcObject) {
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
        }
        setIsScanning(false);
    };

    const primaryColor = systemInfo.primaryColor || '#4f46e5';

    return (
        <div className="flex-1 flex flex-col h-full animate-fade-in bg-slate-50 gap-6 p-[var(--sie-viewport-padding)]">
            <header className="bg-slate-900 p-8 rounded-[var(--sie-radius)] text-white shadow-xl shrink-0 flex flex-col md:flex-row justify-between items-center gap-6 overflow-hidden relative border border-white/5">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="flex items-center gap-5 relative z-10">
                    <div className="p-4 bg-indigo-600 rounded-2xl shadow-xl" style={{ backgroundColor: primaryColor }}><Car size={28}/></div>
                    <div>
                        <h2 className="text-3xl font-black tracking-tightest uppercase leading-none">Frota do Cluster</h2>
                        <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mt-2 opacity-80">SRE Vehicle Access Control • Neural LPR</p>
                    </div>
                </div>
                <div className="flex gap-4 relative z-10">
                    <button onClick={startLPR} className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-2xl hover:bg-indigo-500 transition-all active:scale-95 flex items-center gap-3">
                        <ScanLine size={20}/> Scan LPR
                    </button>
                    <button onClick={() => { setEditingVehicle({ plate: '', brand: '', model: '', unit: '', status: 'AUTHORIZED' }); setIsModalOpen(true); }} className="px-10 py-4 bg-white text-slate-900 rounded-xl font-black text-[11px] uppercase tracking-widest shadow-2xl hover:bg-indigo-50 transition-all flex items-center gap-3">
                        <Plus size={20}/> Novo Registro
                    </button>
                </div>
            </header>

            <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex-1 overflow-hidden flex flex-col relative">
                <div className="p-6 border-b border-slate-100 bg-white sticky top-0 z-20 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="relative w-full md:w-96 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18}/>
                        <input className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase focus:bg-white focus:border-indigo-500 transition-all outline-none" placeholder="Filtrar por Placa ou Unidade..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                    {isLoading ? <div className="p-20 text-center"><Loader2 className="animate-spin text-indigo-600 mx-auto" size={40}/></div> : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {vehicles.filter(v => v.plate.includes(searchTerm.toUpperCase())).map(v => (
                                <div key={v.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="p-3 bg-slate-50 text-slate-400 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner"><Car size={24}/></div>
                                        <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase border ${v.status === 'AUTHORIZED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                                            {v.status}
                                        </span>
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-800 tracking-tightest mb-1">{v.plate}</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-6">{v.brand} {v.model} • UNID. {v.unit}</p>
                                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                        <button onClick={() => { setEditingVehicle(v); setIsModalOpen(true); }} className="p-3 text-slate-300 hover:text-indigo-600 bg-white border border-slate-100 rounded-xl"><Edit2 size={16}/></button>
                                        <button onClick={() => api.delete(`/vehicles/${v.id}`).then(loadData)} className="p-3 text-slate-300 hover:text-rose-600 bg-white border border-slate-100 rounded-xl"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* SCANNER LPR OVERLAY */}
            {isScanning && (
                <div className="fixed inset-0 z-[11000] bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 animate-fade-in">
                    <div className="relative w-full max-w-4xl aspect-video rounded-[3rem] overflow-hidden border-4 border-white/20 shadow-[0_0_100px_rgba(79,70,229,0.3)]">
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover grayscale brightness-110" />
                        <div className="absolute inset-0 pointer-events-none border-[60px] border-black/60">
                            <div className="w-full h-full border-2 border-indigo-500/50 relative">
                                <div className="absolute top-1/2 left-0 right-0 h-1 bg-indigo-500 shadow-[0_0_30px_#6366f1] animate-[scan_2s_infinite]" />
                                <div className="absolute top-0 left-0 p-8">
                                    <span className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest">Alinhamento Neural</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-6 mt-12">
                        <button onClick={stopCamera} className="p-6 bg-white/5 text-white rounded-full hover:bg-rose-600 transition-all border border-white/10"><X size={32}/></button>
                        <button onClick={processLPR} disabled={isSaving} className="px-16 py-6 bg-white text-slate-950 rounded-[2.5rem] font-black uppercase text-xs tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-4">
                            {isSaving ? <Loader2 size={24} className="animate-spin"/> : <Zap size={24} className="fill-slate-950" />}
                            Processar Placa
                        </button>
                    </div>
                </div>
            )}

            {isModalOpen && (
                <div className="sie-editor-overlay">
                    <div className="sie-modal-container !h-auto !max-w-2xl self-center shadow-2xl">
                        <form onSubmit={handleSave}>
                            <div className="h-24 px-10 bg-slate-900 text-white flex justify-between items-center rounded-t-[2.5rem] border-b border-white/5">
                                <h3 className="font-black text-xl uppercase tracking-tighter">Protocolar Veículo</h3>
                                <button type="button" onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-rose-500 rounded-xl transition-all"><X size={24}/></button>
                            </div>
                            <div className="p-10 space-y-8 bg-white rounded-b-[2.5rem]">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Placa</label>
                                        <input required className="w-full h-16 bg-slate-50 border border-slate-200 rounded-xl px-6 text-xl font-black uppercase outline-none focus:border-indigo-500 shadow-inner" value={editingVehicle.plate} onChange={e => setEditingVehicle({...editingVehicle, plate: e.target.value.toUpperCase()})} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unidade</label>
                                        <input required className="w-full h-16 bg-slate-50 border border-slate-200 rounded-xl px-6 text-sm font-black uppercase outline-none focus:border-indigo-500 shadow-inner" value={editingVehicle.unit} onChange={e => setEditingVehicle({...editingVehicle, unit: e.target.value.toUpperCase()})} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Marca / Modelo</label>
                                        <input className="w-full h-16 bg-slate-50 border border-slate-200 rounded-xl px-6 text-sm font-bold uppercase outline-none" value={editingVehicle.brand} onChange={e => setEditingVehicle({...editingVehicle, brand: e.target.value.toUpperCase()})} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Estado de Acesso</label>
                                        <select className="w-full h-16 bg-slate-50 border border-slate-200 rounded-xl px-6 text-[10px] font-black uppercase" value={editingVehicle.status} onChange={e => setEditingVehicle({...editingVehicle, status: e.target.value})}>
                                            <option value="AUTHORIZED">AUTORIZADO</option>
                                            <option value="BLOCKED">BLOQUEADO</option>
                                            <option value="VISITOR">VISITANTE</option>
                                        </select>
                                    </div>
                                </div>
                                <button type="submit" disabled={isSaving} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-indigo-600 transition-all flex items-center justify-center gap-3">
                                    {isSaving ? <Loader2 className="animate-spin" size={20}/> : <Save size={20}/>} Confirmar Sincronia
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
            <style>{` @keyframes scan { 0% { top: 10%; } 50% { top: 90%; } 100% { top: 10%; } } `}</style>
        </div>
    );
};

export default VehicleManagement;
