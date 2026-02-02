import React, { useState, useEffect, useRef } from 'react';
import { userService, systemService, unitService, storageService } from '../services/api';
import { normalizeCPF, validateCPF, formatCPF } from '../utils/cpf';
import { User, ResidentType, PreferredChannel, UserRole, UserStatus, SystemInfo, TerritorialUnit } from '../types';
import {
    Loader2, CheckCircle2, UserPlus, ShieldCheck, X,
    Smartphone, Mail, MapPin, User as UserIcon, ArrowRight, Zap,
    Fingerprint, Info, Save, Camera, ScanLine, Upload, Building,
    Shield, Key, Radio, UserCheck, Globe, Smartphone as WhatsAppIcon,
    Search, Home, Navigation, AlertTriangle, ZapOff, Download,
    ChevronLeft, ChevronRight, Eye, EyeOff, ClipboardCheck, ClipboardPaste, UserSearch, Calendar
} from 'lucide-react';

const formatCEP = (v: string) => v.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2').substring(0, 9);
const formatDateMask = (v: string) => v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2').replace(/(\d{2})(\d)/, '$1/$2').substring(0, 10);

const toISODate = (v: string): string | null => {
    if (!v) return null;
    if (v.includes('-') && v.length === 10) return v;
    const parts = v.split('/');
    if (parts.length !== 3) return null;
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const y = parseInt(parts[2], 10);
    const date = new Date(y, m - 1, d);
    if (date.getFullYear() !== y || date.getMonth() + 1 !== m || date.getDate() !== d) return null;
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
};

const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) { u8arr[n] = bstr.charCodeAt(n); }
    return new File([u8arr], filename, { type: mime });
};

const CensusRegister = ({ onClose, primaryColor = '#4f46e5' }: { onClose?: () => void, primaryColor?: string }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const steps = [
        { id: 0, title: 'Identidade', icon: UserSearch },
        { id: 1, title: 'Biometria', icon: Fingerprint },
        { id: 2, title: 'Civil', icon: UserIcon },
        { id: 3, title: 'Território', icon: MapPin },
        { id: 4, title: 'Acesso', icon: Shield }
    ];

    const [formData, setFormData] = useState({
        id: null as (string | number | null),
        name: '', username: '', cpf_cnpj: '',
        birth_date: '', rg: '', issuing_authority: '', gender: '', profession: '',
        cep: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '',
        unit: '', unit_type: 'CASA' as any, resident_type: 'TITULAR' as ResidentType, voting_rights: 1,
        role: 'RESIDENT', status: 'PENDING' as UserStatus,
        password: '', confirmPassword: '',
        email: '', phone: '', whatsapp: '', preferred_channel: 'WHATSAPP' as PreferredChannel,
        avatar_url: '', coordinates: { lat: 0, lng: 0 },
        lgpd_consent: false
    });

    const [isLoading, setIsLoading] = useState(false);
    const [isSearchingCEP, setIsSearchingCEP] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState('');
    const [successId, setSuccessId] = useState<number | null>(null);
    const [availableUnits, setAvailableUnits] = useState<TerritorialUnit[]>([]);
    const [systemSettings, setSystemSettings] = useState<SystemInfo | null>(null);
    const [isCheckingCpf, setIsCheckingCpf] = useState(false);
    const [verifiedExistingUser, setVerifiedExistingUser] = useState<User | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [cameraActive, setCameraActive] = useState(false);

    useEffect(() => {
        const boot = async () => {
            try {
                const [resSystem, resUnits] = await Promise.all([
                    systemService.getInfo(),
                    unitService.getAll()
                ]);
                setAvailableUnits(resUnits.data.data || []);
                const sys = resSystem.data;
                setSystemSettings(sys);
                if (sys) {
                    setFormData(prev => ({
                        ...prev,
                        cep: formatCEP(sys.cep || ''),
                        street: sys.street || '',
                        neighborhood: sys.neighborhood || '',
                        city: sys.city || '',
                        state: sys.state || ''
                    }));
                }
            } catch (e) {}
        };
        boot();
    }, []);

    const handleCpfCheck = async () => {
        const cpfClean = normalizeCPF(formData.cpf_cnpj);
        if (!validateCPF(cpfClean)) {
            setError('CPF INVÁLIDO OU INCOMPLETO PARA O PROTOCOLO SRE.');
            return;
        }

        setError('');
        setIsCheckingCpf(true);

        try {
            const res = await userService.getAll(1, 1, cpfClean);
            const userFound = res.data.data.find((u: User) => normalizeCPF(u.cpf_cnpj) === cpfClean);

            if (userFound) {
                setVerifiedExistingUser(userFound);
                const displayDate = userFound.birth_date ? userFound.birth_date.slice(0, 10).split('-').reverse().join('/') : '';
                setFormData(prev => ({ ...prev, ...userFound, cpf_cnpj: formatCPF(userFound.cpf_cnpj), birth_date: displayDate, password: '', confirmPassword: '' }));
                setError(`MEMBRO LOCALIZADO: ${userFound.name}. ATUALIZAÇÃO DISPONÍVEL.`);
            } else {
                setError('IDENTIDADE NÃO REGISTRADA. INICIANDO NOVO PROTOCOLO.');
            }
            setCurrentStep(1);
        } catch (e) {
            setError('FALHA DE REDE AO VERIFICAR IDENTIDADE.');
        } finally {
            setIsCheckingCpf(false);
        }
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            ctx?.drawImage(videoRef.current, 0, 0);
            setFormData({ ...formData, avatar_url: canvasRef.current.toDataURL('image/jpeg', 0.7) });
            if (videoRef.current.srcObject) (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
            setCameraActive(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const isoBirthDate = toISODate(formData.birth_date);
        if (!isoBirthDate && formData.birth_date) return setError('DATA DE NASCIMENTO INVÁLIDA.');
        if (!formData.lgpd_consent) return setError('ACEITE OS TERMOS LGPD.');

        setIsLoading(true);
        let finalAvatarUrl = formData.avatar_url;
        const cpfClean = normalizeCPF(formData.cpf_cnpj);

        if (formData.avatar_url.startsWith('data:')) {
            try {
                const file = dataURLtoFile(formData.avatar_url, `${cpfClean}_avatar.jpeg`);
                const uploadRes = await storageService.upload(file);
                finalAvatarUrl = uploadRes.data.url;
            } catch (e) { setIsLoading(false); return setError('FALHA NO UPLOAD DA BIOMETRIA.'); }
        }

        try {
            const payload = { ...formData, name: formData.name.toUpperCase(), cpf_cnpj: cpfClean, birth_date: isoBirthDate, avatar_url: finalAvatarUrl, active: 1 };
            let res;
            if (verifiedExistingUser?.id) res = await userService.update(verifiedExistingUser.id, payload);
            else res = await userService.create(payload);
            setSuccessId(res.data.id || res.data.data?.id);
        } catch (err: any) {
            setError(err?.response?.data?.error === 'CPF_OU_USUARIO_JA_EXISTE' ? 'ESTE CPF JÁ ESTÁ EM USO NO CLUSTER.' : 'ERRO DE SINCRONIA COM O KERNEL.');
        } finally { setIsLoading(false); }
    };

    if (successId) return (
        <div className="flex flex-col items-center justify-center p-20 text-center animate-scale-in bg-white rounded-[3rem] shadow-2xl">
            <CheckCircle2 size={64} className="text-emerald-500 mb-8" />
            <h3 className="text-3xl font-black uppercase">Protocolo Sincronizado</h3>
            <p className="text-slate-500 mt-4 mb-10 uppercase text-[11px] tracking-widest">REGISTRO SRE: <span className='text-indigo-600 font-black'>#{successId}</span></p>
            <button onClick={() => onClose ? onClose() : window.location.reload()} className="px-12 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Finalizar</button>
        </div>
    );

    return (
        <div className="sie-modal-container max-w-6xl w-full self-center flex flex-col h-[90vh] bg-white rounded-[3rem] overflow-hidden">
            <div className="h-24 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 z-20">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-indigo-600 rounded-2xl shadow-xl" style={{ backgroundColor: primaryColor }}><Fingerprint size={28} /></div>
                    <div><h3 className="font-black text-2xl uppercase">Censo S.I.E</h3><p className="text-indigo-400 text-[9px] font-black uppercase mt-1 tracking-widest opacity-80">Protocolo Territorial V260.4</p></div>
                </div>
                {onClose && <button onClick={onClose} className="p-4 hover:bg-rose-500 rounded-full transition-all"><X size={28} /></button>}
            </div>

            <div className="flex-1 overflow-y-auto p-16 custom-scrollbar bg-[#fcfdfe]">
                <div className='max-w-4xl mx-auto'>
                    <div className="flex justify-between mb-12 relative">
                        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-0"></div>
                        {steps.map(s => (
                            <div key={s.id} className="relative z-10 flex flex-col items-center flex-1">
                                <div className={`w-14 h-14 rounded-full flex items-center justify-center border-4 transition-all ${currentStep >= s.id ? 'bg-indigo-600 text-white border-indigo-100 shadow-lg scale-110' : 'bg-white text-slate-300 border-slate-50'}`}><s.icon size={24} /></div>
                                <span className={`text-[9px] font-black uppercase mt-3 tracking-widest ${currentStep >= s.id ? 'text-indigo-600' : 'text-slate-400'}`}>{s.title}</span>
                            </div>
                        ))}
                    </div>

                    <form onSubmit={e => { e.preventDefault(); if(currentStep === 4) handleSubmit(e); else currentStep === 0 ? handleCpfCheck() : setCurrentStep(prev => prev + 1); }}>
                        {error && <div className="bg-rose-50 text-rose-600 p-6 rounded-2xl text-[10px] font-black uppercase text-center border border-rose-100 mb-8 animate-shake"><AlertTriangle size={20} className="inline mr-2" /> {error}</div>}
                        
                        {currentStep === 0 && (
                            <div className="animate-fade-in space-y-8 text-center py-10">
                                <UserSearch size={64} className="mx-auto text-indigo-500 mb-4" />
                                <h3 className="text-2xl font-black uppercase">Verificação Cadastral</h3>
                                <input className="w-full h-20 bg-white border border-slate-300 rounded-3xl text-center text-3xl font-mono font-black outline-none focus:border-indigo-500 shadow-inner" value={formData.cpf_cnpj} onChange={e => setFormData({ ...formData, cpf_cnpj: formatCPF(e.target.value) })} placeholder="000.000.000-00" maxLength={14} />
                            </div>
                        )}

                        {currentStep === 1 && (
                            <div className="animate-fade-in flex flex-col items-center gap-10 py-10">
                                <div className="w-64 h-64 rounded-[4rem] bg-slate-100 border-4 border-white shadow-2xl overflow-hidden flex items-center justify-center relative ring-8 ring-slate-50">
                                    {formData.avatar_url ? <img src={formData.avatar_url} className="w-full h-full object-cover" /> : cameraActive ? <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover grayscale" /> : <UserIcon size={80} className="text-slate-300" />}
                                    {cameraActive && <button type="button" onClick={capturePhoto} className="absolute bottom-4 px-8 py-2 bg-indigo-600 text-white rounded-full font-black text-[10px] uppercase shadow-xl">Capturar</button>}
                                </div>
                                <div className="flex gap-4">
                                    <button type="button" onClick={async () => { try { const s = await navigator.mediaDevices.getUserMedia({ video: true }); if (videoRef.current) { videoRef.current.srcObject = s; setCameraActive(true); } } catch(e) { alert("Câmera indisponível."); } }} className="px-8 py-4 bg-white border border-slate-200 rounded-2xl font-black text-[10px] uppercase flex items-center gap-2 hover:bg-indigo-50 transition-all"><Camera size={18}/> Ativar Câmera</button>
                                </div>
                            </div>
                        )}

                        {currentStep === 2 && (
                            <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-8 py-10">
                                <div className="md:col-span-2 space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label><input required className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-lg font-black uppercase" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
                                <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data Nascimento</label><input className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 font-black" value={formData.birth_date} onChange={e => setFormData({ ...formData, birth_date: formatDateMask(e.target.value) })} placeholder="DD/MM/AAAA" maxLength={10} /></div>
                                <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">RG</label><input className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 font-black uppercase" value={formData.rg} onChange={e => setFormData({ ...formData, rg: e.target.value })} /></div>
                            </div>
                        )}

                        {currentStep === 3 && (
                            <div className="animate-fade-in grid grid-cols-1 md:grid-cols-4 gap-8 py-10">
                                <div className="md:col-span-2 space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unidade / Lote</label><input required className="w-full h-16 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-2xl px-6 text-2xl font-black uppercase" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value, complement: e.target.value })} placeholder="EX: LOTE 42" /></div>
                                <div className="md:col-span-2 space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail Principal</label><input type="email" required className="w-full h-16 bg-white border border-slate-200 rounded-2xl px-6 text-lg font-black" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} /></div>
                            </div>
                        )}

                        {currentStep === 4 && (
                            <div className="animate-fade-in space-y-8 py-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Chave de Acesso (Senha)</label><input type="password" required={!verifiedExistingUser} className="w-full h-16 bg-white border border-slate-200 rounded-2xl px-6 font-black" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} /></div>
                                    <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirmar Chave</label><input type="password" required={!verifiedExistingUser} className="w-full h-16 bg-white border border-slate-200 rounded-2xl px-6 font-black" value={formData.confirmPassword} onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })} /></div>
                                </div>
                                <label className="flex items-center gap-4 p-6 bg-indigo-50 border border-indigo-100 rounded-3xl cursor-pointer shadow-inner">
                                    <input type="checkbox" className="w-6 h-6 rounded-lg text-indigo-600" checked={formData.lgpd_consent} onChange={e => setFormData({ ...formData, lgpd_consent: e.target.checked })} />
                                    <span className="text-[10px] font-black text-indigo-900 uppercase tracking-widest leading-relaxed">Aceito o processamento soberano de dados conforme Protocolo LGPD SRE V2.0.</span>
                                </label>
                            </div>
                        )}

                        <div className="mt-12 flex justify-between pt-10 border-t border-slate-100">
                            {currentStep > 0 && <button type="button" onClick={() => setCurrentStep(prev => prev - 1)} className="px-10 py-5 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600">Voltar</button>}
                            <button type="submit" disabled={isLoading} className="ml-auto px-14 py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-600 transition-all flex items-center gap-3">
                                {isLoading ? <Loader2 className="animate-spin" size={16} /> : currentStep === 4 ? 'Sincronizar' : 'Continuar'} <ChevronRight size={18} />
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};

export default CensusRegister;
