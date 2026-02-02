import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, Loader2, ShieldCheck, Zap, ScanLine, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';
import api from '../services/api';

interface OCRScannerProps {
    onResult: (data: any) => void;
    onClose: () => void;
    context: 'IDENTITY' | 'SURVEY_CONFIG' | 'DOCUMENT';
    title?: string;
}

const OCRScanner = ({ onResult, onClose, context, title }: OCRScannerProps) => {
    const [mode, setMode] = useState<'IDLE' | 'CAMERA' | 'PROCESSING' | 'REVIEW'>('IDLE');
    const [image, setImage] = useState<string | null>(null);
    const [result, setResult] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const startCamera = async () => {
        try {
            setMode('CAMERA');
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (e) {
            alert("Acesso à câmera negado.");
            setMode('IDLE');
        }
    };

    const stopCamera = () => {
        const stream = videoRef.current?.srcObject as MediaStream;
        stream?.getTracks().forEach(t => t.stop());
    };

    const capture = () => {
        if (videoRef.current && canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            ctx?.drawImage(videoRef.current, 0, 0);
            const b64 = canvasRef.current.toDataURL('image/jpeg');
            setImage(b64);
            stopCamera();
            processImage(b64);
        }
    };

    const processImage = async (b64: string) => {
        setMode('PROCESSING');
        setIsLoading(true);
        try {
            const res = await api.post('/ai/ocr', { image: b64, context });
            setResult(res.data);
            setMode('REVIEW');
        } catch (e) {
            alert("Erro no processamento neural. Tente novamente.");
            setMode('IDLE');
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpload = (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const b64 = reader.result as string;
                setImage(b64);
                processImage(b64);
            };
            reader.readAsDataURL(file);
        }
    };

    /**
     * SRE UTILS: Formata valores complexos para exibição limpa
     * Resolve o bug de [object Object] em campos aninhados.
     */
    const formatOcrValue = (val: any): string => {
        if (val === null || val === undefined) return 'NÃO DETECTADO';
        if (Array.isArray(val)) return `${val.length} ENTIDADES LOCALIZADAS`;
        if (typeof val === 'object') {
            // Tenta achatar o objeto ou formatar propriedades chave
            return Object.entries(val)
                .map(([k, v]) => `${k.toUpperCase()}: ${String(v).toUpperCase()}`)
                .join(' • ') || 'ESTRUTURA COMPLEXA';
        }
        return String(val).toUpperCase();
    };

    return (
        <div className="fixed inset-0 bg-slate-950/98 z-[9999] flex items-center justify-center p-4 md:p-10 backdrop-blur-2xl animate-fade-in">
            <div className="bg-white w-full max-w-5xl h-[90vh] rounded-[3.5rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden border border-white/10 animate-scale-in">
                
                {/* Header SRE */}
                <div className="bg-slate-900 px-10 py-6 flex justify-between items-center shrink-0 border-b border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg animate-pulse"><Zap size={20} className="text-white" /></div>
                        <div>
                            <h2 className="text-white font-black text-xl tracking-tight uppercase">{title || 'Scanner Vision Ativo'}</h2>
                            <p className="text-indigo-400 text-[9px] font-black uppercase tracking-widest mt-1">Protocolo OCR Gemini V3 • Camada de Topo</p>
                        </div>
                    </div>
                    <button onClick={() => { stopCamera(); onClose(); }} className="p-3 bg-white/5 hover:bg-rose-500 hover:text-white rounded-2xl transition-all text-slate-400 border border-white/5"><X size={24} /></button>
                </div>

                <div className="flex-1 relative overflow-hidden flex bg-slate-50">
                    {mode === 'IDLE' && (
                        <div className="flex-1 flex flex-col items-center justify-center gap-8 p-12 text-center">
                            <div className="w-32 h-32 bg-indigo-50 text-indigo-600 rounded-[3rem] flex items-center justify-center shadow-inner relative">
                                <ScanLine size={64} className="animate-bounce" />
                                <div className="absolute inset-0 border-4 border-indigo-600/20 rounded-[3rem] animate-ping" />
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Pronto para Analisar</h3>
                                <p className="text-slate-500 font-medium text-sm max-w-md mx-auto">Posicione o documento oficial de forma plana e com iluminação direta para captura dos metadados biográficos.</p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-lg">
                                <button onClick={startCamera} className="flex-1 py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 active:scale-95"><Camera size={24}/> Ativar Lente</button>
                                <label className="flex-1 py-6 bg-white border border-slate-200 text-slate-800 rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-3 cursor-pointer shadow-sm active:scale-95">
                                    <Upload size={24}/> Carregar Arquivo <input type="file" className="hidden" accept="image/*" onChange={handleUpload} />
                                </label>
                            </div>
                        </div>
                    )}

                    {mode === 'CAMERA' && (
                        <div className="flex-1 flex flex-col relative">
                            <video ref={videoRef} autoPlay playsInline className="flex-1 object-cover grayscale brightness-110" />
                            <div className="absolute inset-0 pointer-events-none border-[60px] border-black/60 backdrop-blur-[2px]">
                                <div className="w-full h-full border-4 border-indigo-500/50 rounded-[3rem] relative shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]">
                                    <div className="absolute top-1/2 left-0 right-0 h-[3px] bg-indigo-500 shadow-[0_0_30px_#6366f1] animate-[scan_2s_infinite]" />
                                    <div className="absolute top-0 left-0 p-6">
                                        <p className="text-[10px] font-black text-white bg-indigo-600 px-3 py-1 rounded-lg uppercase tracking-widest">Enquadramento Biométrico</p>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-10">
                                <button onClick={() => { stopCamera(); setMode('IDLE'); }} className="p-6 bg-black/60 backdrop-blur-xl rounded-full text-white hover:bg-rose-600 transition-all border border-white/10 shadow-2xl"><X size={32}/></button>
                                <button onClick={capture} className="p-10 bg-white rounded-full shadow-[0_0_50px_rgba(255,255,255,0.3)] scale-125 hover:scale-110 transition-transform active:scale-90 border-8 border-indigo-50"><div className="w-6 h-6 bg-indigo-600 rounded-full animate-pulse shadow-inner"/></button>
                            </div>
                        </div>
                    )}

                    {mode === 'PROCESSING' && (
                        <div className="flex-1 flex flex-col items-center justify-center gap-8 p-12 bg-white">
                            <div className="relative">
                                <div className="w-24 h-24 border-8 border-slate-50 border-t-indigo-600 rounded-full animate-spin shadow-inner" />
                                <div className="absolute inset-0 flex items-center justify-center"><Zap size={32} className="text-indigo-600 animate-pulse"/></div>
                            </div>
                            <div className="text-center space-y-2">
                                <h4 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">Extraindo Entidades...</h4>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.4em] mt-2 animate-pulse">Consultando SRE Neural Bridge</p>
                            </div>
                        </div>
                    )}

                    {mode === 'REVIEW' && result && (
                        <div className="flex-1 flex flex-col md:flex-row animate-fade-in h-full">
                            <div className="w-full md:w-5/12 bg-slate-100 p-10 flex items-center justify-center overflow-hidden border-r border-slate-200">
                                {image && <img src={image} className="max-h-full rounded-[2.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.4)] object-contain border-8 border-white transform rotate-[-1deg]" alt="Scanned" />}
                            </div>
                            <div className="w-full md:w-7/12 p-12 overflow-y-auto bg-white custom-scrollbar flex flex-col">
                                <div className="flex items-center gap-4 mb-10 pb-6 border-b border-slate-100">
                                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><CheckCircle2 size={32}/></div>
                                    <div>
                                        <h4 className="font-black text-slate-800 uppercase text-xl tracking-tight">Dados Estruturados</h4>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Confirme as informações detectadas pela IA</p>
                                    </div>
                                </div>
                                <div className="space-y-6 flex-1">
                                    {Object.entries(result).map(([key, val]: any) => (
                                        <div key={key} className="space-y-1.5 p-5 bg-slate-50 rounded-3xl border border-slate-100 group hover:border-indigo-200 transition-all hover:bg-white hover:shadow-sm">
                                            <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest ml-1">{key.replace(/_/g, ' ')}</label>
                                            <p className="text-base font-black text-slate-800 leading-normal">{formatOcrValue(val)}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="pt-10 border-t border-slate-100 mt-auto flex gap-6">
                                    <button onClick={() => setMode('IDLE')} className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-all">Re-Scan</button>
                                    <button onClick={() => { onResult(result); onClose(); }} className="flex-[2.5] py-5 bg-indigo-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-3 active:scale-95">Sincronizar no Registro <ChevronRight size={20}/></button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <canvas ref={canvasRef} className="hidden" />
            </div>
            <style>{`
                @keyframes scan { 0% { top: 10%; } 50% { top: 90%; } 100% { top: 10%; } }
            `}</style>
        </div>
    );
};

export default OCRScanner;