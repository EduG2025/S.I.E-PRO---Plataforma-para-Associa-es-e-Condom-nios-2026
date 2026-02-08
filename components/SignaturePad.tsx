
import React, { useRef, useState } from 'react';
/* SRE FIX: Added missing 'ShieldCheck' icon to imports */
import { Eraser, CheckCircle2, X, Save, MousePointer2, ShieldCheck } from 'lucide-react';

interface SignaturePadProps {
    onSave: (signatureBase64: string) => void;
    onClose: () => void;
    title?: string;
}

const SignaturePad = ({ onSave, onClose, title }: SignaturePadProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    
    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        const rect = canvas.getBoundingClientRect();
        const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
        const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#020617';
        setIsDrawing(true);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = ('touches' in e) ? e.touches[0].clientX - rect.left : (e as React.MouseEvent).clientX - rect.left;
        const y = ('touches' in e) ? e.touches[0].clientY - rect.top : (e as React.MouseEvent).clientY - rect.top;

        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => setIsDrawing(false);

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
    };

    const handleSave = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            onSave(canvas.toDataURL('image/png'));
            onClose();
        }
    };

    return (
        <div className="sie-editor-overlay">
            <div className="sie-modal-container !h-auto !max-w-2xl self-center border border-white/10 shadow-[0_50px_100px_rgba(0,0,0,0.6)]">
                <div className="h-20 px-8 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-white/5 rounded-t-[var(--sie-radius)]">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-indigo-600 rounded-xl"><MousePointer2 size={18}/></div>
                        <h3 className="font-black text-sm uppercase tracking-widest">{title || 'Assinatura Digitalizada'}</h3>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-rose-500 rounded-xl transition-all"><X size={24} /></button>
                </div>
                
                <div className="p-10 bg-slate-50 flex flex-col items-center">
                    <canvas 
                        ref={canvasRef}
                        width={500}
                        height={250}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="bg-white border-4 border-slate-200 rounded-[2.5rem] shadow-inner cursor-crosshair touch-none"
                    />
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-8 flex items-center gap-2">
                        <ShieldCheck size={12} className="text-emerald-500"/> Este rastro será injetado no Dossiê de Governança
                    </p>
                </div>

                <div className="p-8 bg-white border-t border-slate-100 flex justify-between items-center rounded-b-[var(--sie-radius)]">
                    <button onClick={clearCanvas} className="px-8 py-3.5 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-rose-500 transition-colors flex items-center gap-2">
                        <Eraser size={16}/> Limpar Canvas
                    </button>
                    <div className="flex gap-4">
                        <button onClick={onClose} className="px-8 py-3.5 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors">Cancelar</button>
                        <button onClick={handleSave} className="px-10 py-3.5 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-2 active:scale-95">
                            <CheckCircle2 size={16}/> Confirmar Identidade
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SignaturePad;
