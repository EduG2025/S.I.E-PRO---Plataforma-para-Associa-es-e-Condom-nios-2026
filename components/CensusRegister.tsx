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
    ChevronLeft, ChevronRight, Eye, EyeOff, ClipboardCheck, ClipboardPaste, UserSearch, Calendar,
    LocateFixed
} from 'lucide-react';

const formatCEP = (v: string) => v.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2').substring(0, 9);

const formatDateMask = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '$1/$2')
        .replace(/(\d{2})(\d)/, '$1/$2')
        .replace(/(\d{4})\d+?$/, '$1');
};

const toISODate = (v: string): string | null => {
    if (!v) return null;
    if (v.includes('-') && v.length === 10) return v;
    const parts = v.split('/');
    if (parts.length !== 3) return null;
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const y = parseInt(parts[2], 10);
    if (y < 1900 || y > 2100) return null;
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

// SRE GEOCODING UTILITY - Isolated for synchronous calls
const fetchCoordinates = async (addressData: any) => {
    if (!addressData.street || !addressData.number || !addressData.city || !addressData.state) return null;
    try {
        const query = `${addressData.street}, ${addressData.number}, ${addressData.city}, ${addressData.state}, Brasil`;
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`, {
            headers: { 'User-Agent': 'SIE-PRO-System/1.0' }
        });
        const data = await res.json();
        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lng: parseFloat(data[0].lon)
            };
        }
    } catch (e) {
        console.warn("Geocoding service unavailable");
    }
    return null;
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
        birth_date: '',
        rg: '', issuing_authority: '', gender: '', profession: '',
        cep: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '',
        unit: '', unit_type: 'CASA' as 'LOTE' | 'CASA' | 'CHACARA' | 'COMERCIO',
        resident_type: 'TITULAR' as ResidentType, voting_rights: 1,
        role: 'RESIDENT' as UserRole | string,
        status: 'PENDING' as UserStatus,
        password: '', confirmPassword: '',
        email: '', phone: '', whatsapp: '', preferred_channel: 'WHATSAPP' as PreferredChannel,
        avatar_url: '', coordinates: { lat: 0, lng: 0 },
        lgpd_consent: false
    });

    const [isLoading, setIsLoading] = useState(false);
    const [isSearchingCEP, setIsSearchingCEP] = useState(false);
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState('');
    const [successId, setSuccessId] = useState<number | null>(null);
    const [availableUnits, setAvailableUnits] = useState<TerritorialUnit[]>([]);
    const [systemSettings, setSystemSettings] = useState<SystemInfo | null>(null);
    const [isCheckingCpf, setIsCheckingCpf] = useState(false);
    const [verifiedExistingUser, setVerifiedExistingUser] = useState<User | null>(null);

    const [cameraActive, setCameraActive] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const bootProtocol = async () => {
            try {
                const [resSystem, resUnits] = await Promise.all([
                    systemService.getInfo().catch((e) => ({ data: { data: {} } })),
                    unitService.getAll().catch((e) => ({ data: { data: [] } }))
                ]);
                setAvailableUnits(resUnits.data.data || []);
                const sys = resSystem.data?.data || resSystem.data;
                setSystemSettings(sys);
                if (sys) {
                    setFormData(prev => ({
                        ...prev,
                        cep: formatCEP(sys.cep || ''),
                        street: sys.street || '',
                        neighborhood: sys.neighborhood || '',
                        city: sys.city || '',
                        state: sys.state || '',
                        coordinates: (prev.coordinates.lat === 0) ? (sys.coordinates || { lat: 0, lng: 0 }) : prev.coordinates
                    }));
                }
                const params = new URLSearchParams(window.location.search);
                const cpfParam = params.get('cpf');
                if (cpfParam) setFormData(prev => ({ ...prev, cpf_cnpj: formatCPF(cpfParam) }));
            } catch (e) { console.error("SRE_KERNEL_FAILURE: Fatal Boot", e); }
        };
        bootProtocol();
    }, []);

    // SRE GEOCODING ENGINE (Background Listener)
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (formData.street && formData.number && formData.city && formData.state && !isGeocoding) {
                setIsGeocoding(true);
                const coords = await fetchCoordinates(formData);
                if (coords) {
                    setFormData(prev => ({ ...prev, coordinates: coords }));
                }
                setIsGeocoding(false);
            }
        }, 1500);
        return () => clearTimeout(timer);
    }, [formData.street, formData.number, formData.city, formData.state, formData.neighborhood]);

    const handleCEPBlur = async (cepInput?: string) => {
        const raw = cepInput || formData.cep;
        const cep = raw.replace(/\D/g, '');
        if (cep.length !== 8) return;
        setIsSearchingCEP(true);
        try {
            const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await res.json();
            if (!data.erro) {
                setFormData(p => ({ ...p, street: data.logradouro, neighborhood: data.bairro, city: data.localidade, state: data.uf }));
                setError('');
            } else { setError('CEP não localizado.'); }
        } catch (e) { setError('Falha no serviço de CEP.'); }
        finally { setIsSearchingCEP(false); }
    };

    const handleCpfCheck = async () => {
        const cpfClean = normalizeCPF(formData.cpf_cnpj);
        if (!validateCPF(cpfClean)) { setError('CPF INVÁLIDO OU INCOMPLETO PARA O PROTOCOLO SRE.'); return; }
        setError('');
        setIsCheckingCpf(true);
        try {
            const res = await userService.getAll(1, 1, cpfClean);
            const userFound = res.data.data.find((u: User) => normalizeCPF(u.cpf_cnpj) === cpfClean);
            if (userFound) {
                setVerifiedExistingUser(userFound);
                const displayDate = userFound.birth_date ? userFound.birth_date.slice(0, 10).split('-').reverse().join('/') : '';
                let existingCoords = { lat: 0, lng: 0 };
                try { existingCoords = typeof userFound.coordinates === 'string' ? JSON.parse(userFound.coordinates) : userFound.coordinates; } catch(e) {}
                setFormData(prev => ({
                    ...prev, ...userFound, cpf_cnpj: formatCPF(userFound.cpf_cnpj), birth_date: displayDate, password: '', confirmPassword: '',
                    unit: systemSettings?.shortName || userFound.unit || '', coordinates: existingCoords || prev.coordinates
                }));
                setError(`MEMBRO LOCALIZADO: ${userFound.name}. ATUALIZAÇÃO DISPONÍVEL.`);
            } else { setError('IDENTIDADE NÃO REGISTRADA. INICIANDO NOVO PROTOCOLO.'); }
            setCurrentStep(1);
        } catch (e) { setError('FALHA DE REDE AO VERIFICAR IDENTIDADE.'); }
        finally { setIsCheckingCpf(false); }
    };

    const stopCamera = () => { if (videoRef.current?.srcObject) { (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop()); setCameraActive(false); } };
    const startCamera = async () => { try { const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } }); if (videoRef.current) { videoRef.current.srcObject = stream; setCameraActive(true); } } catch (e) { alert("Câmera indisponível ou permissão negada."); } };
    const capturePhoto = () => { if (videoRef.current && canvasRef.current) { const ctx = canvasRef.current.getContext('2d'); canvasRef.current.width = videoRef.current.videoWidth; canvasRef.current.height = videoRef.current.videoHeight; ctx?.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height); setFormData({ ...formData, avatar_url: canvasRef.current.toDataURL('image/jpeg', 0.7) }); stopCamera(); } };

    const nextStep = () => {
        if (currentStep === 0) return handleCpfCheck();
        if (currentStep === 1 && !formData.avatar_url) return setError('Foto de perfil (Vision ID) é obrigatória.');
        if (currentStep === 2) { if (!formData.name) return setError('Nome completo é obrigatório.'); if (formData.birth_date.length !== 10) return setError('Data de nascimento incompleta (DD/MM/AAAA).'); }
        if (currentStep === 3 && (!formData.unit || !formData.cep)) return setError('Unidade e CEP são obrigatórios.');
        setError('');
        setCurrentStep(prev => Math.min(prev + 1, 4));
    };

    const prevStep = () => { setError(''); setCurrentStep(prev => Math.max(prev - 1, 0)); };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!verifiedExistingUser || (formData.password || formData.confirmPassword)) { if (formData.password !== formData.confirmPassword) return setError('Senhas não conferem.'); }
        if (!formData.lgpd_consent) return setError('Necessário aceitar os Termos LGPD.');
        const isoBirthDate = toISODate(formData.birth_date);
        if (!isoBirthDate && formData.birth_date) { setError('Data de nascimento inválida.'); return; }
        
        setIsLoading(true);

        // SRE SYNC: Force coordinate fetch if missing (Race condition fix)
        let finalCoordinates = formData.coordinates;
        if ((!finalCoordinates || (finalCoordinates.lat === 0 && finalCoordinates.lng === 0)) && formData.street && formData.number) {
             const fetched = await fetchCoordinates(formData);
             if (fetched) finalCoordinates = fetched;
        }

        let finalAvatarUrl = formData.avatar_url;
        const cpfClean = normalizeCPF(formData.cpf_cnpj);
        if (formData.avatar_url.startsWith('data:')) {
            const filename = `${cpfClean}_${Date.now()}_avatar.jpeg`;
            try { const file = dataURLtoFile(formData.avatar_url, filename); const uploadRes = await storageService.upload(file); finalAvatarUrl = uploadRes.data.url; } 
            catch (uploadError: any) { setError('Falha ao enviar imagem. Tente novamente.'); setIsLoading(false); return; }
        }
        try {
            const basePayload = {
                ...formData, name: formData.name.toUpperCase(), username: formData.username || cpfClean, cpf_cnpj: cpfClean,
                birth_date: isoBirthDate, active: 1, role: 'RESIDENT', unit: formData.unit || formData.complement,
                address: `${formData.street}, ${formData.number}`, avatar_url: finalAvatarUrl, 
                coordinates: finalCoordinates // Use forced/resolved coordinates
            };
            const { confirmPassword, ...payloadWithoutConfirmation } = basePayload;
            let finalPayload: any = payloadWithoutConfirmation;
            if (!finalPayload.password) { const { password, ...safePayload } = finalPayload; finalPayload = safePayload; }
            let res;
            if (verifiedExistingUser && verifiedExistingUser.id) { res = await userService.update(verifiedExistingUser.id, finalPayload); } 
            else { res = await userService.create(finalPayload); }
            setSuccessId(res.data.id || res.data.data?.id);
        } catch (err: any) { setError(err?.response?.data?.error || 'Erro na sincronização com o Kernel.'); } 
        finally { setIsLoading(false); }
    };

    const renderStepIndicator = () => (
        <div className="flex justify-between mb-12 relative px-4 max-w-4xl mx-auto">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-100 -translate-y-1/2 z-0"></div>
            {steps.map((s) => (
                <div key={s.id} className="relative z-10 flex flex-col items-center flex-1">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 border-4 ${currentStep >= s.id ? 'bg-indigo-600 text-white border-indigo-100 shadow-lg scale-110' : 'bg-white text-slate-300 border-slate-50'}`}>
                        <s.icon size={24} />
                    </div>
                    <span className={`text-[9px] font-black uppercase mt-3 tracking-widest text-center ${currentStep >= s.id ? 'text-indigo-600' : 'text-slate-400'}`}>{s.title}</span>
                </div>
            ))}
        </div>
    );

    const renderContent = () => {
        switch (currentStep) {
            case 0: return (
                    <div className="animate-fade-in space-y-10 text-center max-w-lg mx-auto py-20">
                        <UserSearch size={64} className="mx-auto text-indigo-500 mb-6" />
                        <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tight">Validação de Identidade</h3>
                        <p className="text-slate-500 font-medium text-sm">Informe seu CPF para verificarmos seu cadastro.</p>
                        <div className="space-y-2 relative">
                            <input required className="w-full h-16 bg-white border border-slate-300 rounded-2xl px-6 text-2xl font-mono font-black outline-none focus:border-indigo-500 transition-all text-center tracking-wider" value={formData.cpf_cnpj} onChange={e => setFormData({ ...formData, cpf_cnpj: formatCPF(e.target.value) })} maxLength={14} placeholder="000.000.000-00" disabled={isCheckingCpf} />
                            {isCheckingCpf && <Loader2 className="absolute right-4 top-1/2 mt-3 -translate-y-1/2 animate-spin text-indigo-500" size={20} />}
                        </div>
                        {verifiedExistingUser && <div className='p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-bold text-sm mt-8'><ClipboardCheck size={20} className='inline mr-2' /> Usuário **{verifiedExistingUser.name}** encontrado.</div>}
                    </div>
                );
            case 1: return (
                    <div className="animate-fade-in space-y-10">
                        <div className="bg-slate-50 p-6 md:p-12 rounded-[4rem] border border-slate-100 flex flex-col items-center gap-10 shadow-inner relative overflow-hidden">
                            <div className="relative">
                                <div className="w-56 h-56 rounded-[3.5rem] bg-slate-200 border-4 border-white shadow-2xl overflow-hidden flex items-center justify-center ring-8 ring-slate-100/50 relative">
                                    {formData.avatar_url ? (<img src={formData.avatar_url} className="w-full h-full object-cover" alt="Avatar" />) : cameraActive ? (<div className="relative w-full h-full"><video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover grayscale brightness-110" /><div className="absolute inset-0 border-[30px] border-black/30 rounded-[3rem] pointer-events-none"></div></div>) : (<UserIcon size={80} className="text-slate-300" />)}
                                </div>
                                {cameraActive && (<button type="button" onClick={() => capturePhoto()} className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-10 py-3 bg-indigo-600 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-2xl border-4 border-white active:scale-95 transition-all">Capturar</button>)}
                            </div>
                            <div className="flex flex-wrap justify-center gap-4 pt-6">
                                {!cameraActive ? (<button type="button" onClick={() => startCamera()} className="px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-[10px] uppercase flex items-center gap-3 shadow-sm hover:bg-indigo-50 hover:text-indigo-600 transition-all tracking-widest"><Camera size={20} /> Câmera</button>) : (<button type="button" onClick={() => stopCamera()} className="px-8 py-4 bg-rose-50 text-rose-600 rounded-2xl font-black text-[10px] uppercase flex items-center gap-2 border border-rose-100 tracking-widest"><ZapOff size={20} /> Parar</button>)}
                                <label className="px-8 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-[10px] uppercase flex items-center gap-3 cursor-pointer shadow-sm hover:bg-emerald-50 hover:text-emerald-600 transition-all tracking-widest"><Upload size={20} /> Arquivo <input type="file" className="hidden" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) { const r = new FileReader(); r.onloadend = () => setFormData({ ...formData, avatar_url: r.result as string }); r.readAsDataURL(file); } }} /></label>
                            </div>
                        </div>
                    </div>
                );
            case 2: return (
                    <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-8 py-10">
                        <div className="md:col-span-2 space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label><input required className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-lg font-black uppercase outline-none focus:border-indigo-500 transition-all" value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
                        <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data Nascimento</label><input className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 font-black outline-none focus:border-indigo-500 transition-all" value={formData.birth_date || ''} onChange={e => setFormData({ ...formData, birth_date: formatDateMask(e.target.value) })} placeholder="DD/MM/AAAA" maxLength={10} /></div>
                        <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gênero</label><div className="relative"><select className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 font-black uppercase outline-none focus:border-indigo-500 transition-all appearance-none" value={formData.gender || ''} onChange={e => setFormData({ ...formData, gender: e.target.value })}><option value="">Selecione...</option><option value="MALE">Masculino</option><option value="FEMALE">Feminino</option><option value="OTHER">Outro</option><option value="PREFER_NOT_TO_SAY">Prefiro não informar</option></select><div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400"><svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg></div></div></div>
                        <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">RG</label><input className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 font-black uppercase outline-none focus:border-indigo-500 transition-all" value={formData.rg || ''} onChange={e => setFormData({ ...formData, rg: e.target.value })} /></div>
                    </div>
                );
            case 3: return (
                    <div className="animate-fade-in space-y-12">
                        <div className="flex items-center gap-4 border-l-4 border-emerald-500 pl-4 justify-between">
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-[0.4em]">Localização</h4>
                            {isGeocoding && <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg text-[9px] font-black uppercase animate-pulse"><LocateFixed size={12}/> Geolocalizando...</div>}
                            {!isGeocoding && formData.coordinates.lat !== 0 && <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg text-[9px] font-black uppercase"><CheckCircle2 size={12}/> GPS Ok</div>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo</label><select className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 font-black uppercase outline-none focus:border-emerald-500 transition-all" value={formData.unit_type} onChange={e => setFormData({ ...formData, unit_type: e.target.value as any })}><option value="CASA">Casa</option><option value="LOTE">Lote</option><option value="CHACARA">Chácara</option><option value="COMERCIO">Comércio</option></select></div>
                            <div className="md:col-span-2 space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Grupo / Unidade</label><div className="relative"><input required list="units-list" className="w-full h-16 bg-indigo-50 border border-indigo-200 rounded-2xl px-6 text-lg font-black uppercase text-indigo-700 outline-none focus:border-indigo-500 transition-all" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value, complement: e.target.value })} placeholder="EX: LOTE 15" /><datalist id="units-list">{availableUnits.map(u => <option key={u.id} value={u.label}>{u.street_name}</option>)}</datalist><Home className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-300" size={20} /></div></div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CEP</label><div className="relative"><input className="w-full font-black h-16 bg-white border border-slate-200 rounded-2xl px-6 text-lg focus:border-emerald-500 outline-none transition-all" value={formData.cep} onChange={e => setFormData({ ...formData, cep: formatCEP(e.target.value) })} onBlur={e => handleCEPBlur(e.target.value)} maxLength={9} />{isSearchingCEP && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-emerald-500" size={20} />}</div></div>
                            <div className="space-y-2 md:col-span-3"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Logradouro</label><input className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-sm font-black outline-none focus:bg-white focus:border-indigo-500 transition-all uppercase" value={formData.street} onChange={e => setFormData({ ...formData, street: e.target.value })} /></div>
                            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Número</label><input className="w-full h-16 bg-white border border-slate-200 rounded-2xl px-6 text-sm font-black focus:bg-white focus:border-indigo-500 outline-none transition-all uppercase" value={formData.number} onChange={e => setFormData({ ...formData, number: e.target.value })} placeholder="S/N" /></div>
                            <div className="space-y-2 md:col-span-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bairro</label><input className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-base uppercase outline-none" value={formData.neighborhood} onChange={e => setFormData({ ...formData, neighborhood: e.target.value })} /></div>
                            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cidade</label><input className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-base uppercase outline-none" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} /></div>
                        </div>
                    </div>
                );
            case 4: return (
                    <div className="animate-fade-in space-y-12">
                        <div className="flex items-center gap-4 border-l-4 border-slate-900 pl-4"><h4 className="text-sm font-black text-slate-800 uppercase tracking-[0.4em]">Segurança</h4></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha {verifiedExistingUser && "(Opcional)"}</label><div className="relative"><Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} /><input type={showPass ? "text" : "password"} required={!verifiedExistingUser} className="w-full h-16 pl-12 bg-white border border-slate-200 rounded-2xl px-6 font-bold outline-none focus:border-indigo-500 transition-all" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} /><button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-indigo-600 transition-colors">{showPass ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>
                            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirmar Senha</label><input type={showPass ? "text" : "password"} required={!verifiedExistingUser} className="w-full h-16 bg-white border border-slate-200 rounded-2xl px-6 font-bold outline-none focus:border-indigo-500 transition-all" value={formData.confirmPassword} onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })} /></div>
                            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp</label><div className="relative"><Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} /><input className="w-full h-16 pl-12 bg-slate-50 border border-slate-200 rounded-2xl px-6 outline-none focus:bg-white focus:border-indigo-500 transition-all" value={formData.whatsapp} onChange={e => setFormData({ ...formData, whatsapp: e.target.value })} /></div></div>
                            <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vínculo</label><select className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 font-bold uppercase outline-none" value={formData.resident_type} onChange={e => setFormData({ ...formData, resident_type: e.target.value as ResidentType })}><option value="TITULAR">Titular</option><option value="INQUILINO">Inquilino</option><option value="DEPENDENTE">Dependente</option></select></div>
                            <div className="md:col-span-2 p-6 bg-indigo-50 border border-indigo-100 rounded-2xl shadow-inner mt-4"><label className="flex items-start gap-4 cursor-pointer pt-1"><input type="checkbox" checked={formData.lgpd_consent} onChange={e => setFormData({ ...formData, lgpd_consent: e.target.checked })} required className="mt-1 w-5 h-5 rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0" /><span className="text-[10px] font-black text-indigo-900 uppercase tracking-widest leading-relaxed">Aceito os Termos LGPD e autorizo o processamento de dados para governança.</span></label></div>
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    if (successId) return (
        <div className="flex flex-col items-center justify-center p-10 md:p-20 text-center animate-scale-in min-h-[600px] bg-white rounded-[3rem] shadow-2xl">
            <div className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl border-8 border-emerald-100"><CheckCircle2 size={48} /></div>
            <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none">{verifiedExistingUser ? "Censo Atualizado" : "Protocolo Ativo"}</h3>
            <p className="text-slate-500 font-medium mt-4 mb-10 text-[11px] uppercase tracking-widest">REGISTRO SRE: <span className='text-indigo-600 font-black'>#{successId}</span></p>
            <button onClick={() => onClose ? onClose() : window.location.reload()} className="px-14 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:bg-indigo-600 transition-all">Encerrar Sessão</button>
        </div>
    );

    return (
        <div className="sie-modal-container max-w-6xl w-full self-center overflow-hidden flex flex-col h-[90vh] shadow-2xl rounded-[3rem] bg-white">
            <div className="h-24 px-6 md:px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 shadow-lg relative z-20 rounded-t-[3rem]">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-indigo-600 rounded-2xl shadow-xl border border-white/10" style={{ backgroundColor: primaryColor }}>
                        {currentStep === 0 ? <UserSearch size={28} /> : <Fingerprint size={28} />}
                    </div>
                    <div><h3 className="font-black text-xl md:text-2xl uppercase leading-none tracking-tight">Censo S.I.E</h3><p className="text-indigo-400 text-[9px] font-black uppercase mt-1.5 tracking-[0.3em] opacity-80">V260.4 • {verifiedExistingUser ? "Atualização" : "Novo Registro"}</p></div>
                </div>
                {onClose && <button onClick={onClose} className="p-3 md:p-4 hover:bg-rose-500 rounded-full transition-all border border-white/5"><X size={28} /></button>}
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-16 custom-scrollbar bg-[#fcfdfe] relative">
                <div className='max-w-4xl mx-auto'>
                    {renderStepIndicator()}
                    <form onSubmit={(e) => { e.preventDefault(); if (currentStep === 4) handleSubmit(e); else nextStep(); }} className="pb-10">
                        {error && (<div className={`bg-rose-50 text-rose-600 p-6 rounded-2xl text-[10px] font-black uppercase text-center border border-rose-100 flex items-center justify-center gap-4 mb-8 ${currentStep !== 0 && 'animate-shake'} tracking-widest`}><AlertTriangle size={20} /> {error}</div>)}
                        {renderContent()}
                        <div className="mt-12 flex justify-between gap-6 pt-10 border-t border-slate-100 max-w-4xl">
                            {currentStep > 0 ? (<button type="button" onClick={prevStep} className="px-6 md:px-10 py-4 md:py-5 bg-white border border-slate-200 text-slate-400 rounded-2xl font-black text-[10px] uppercase flex items-center gap-3 hover:text-slate-600 transition-all tracking-widest"><ChevronLeft size={20} /> Voltar</button>) : (<div />)}
                            {currentStep < 4 ? (
                                <button type="button" onClick={nextStep} disabled={isCheckingCpf || (currentStep === 0 && !formData.cpf_cnpj)} className={`ml-auto px-6 md:px-10 py-4 md:py-5 ${isCheckingCpf ? 'bg-slate-300' : 'bg-slate-900 hover:bg-indigo-600'} text-white rounded-2xl font-black text-[10px] uppercase flex items-center gap-3 transition-all shadow-xl tracking-widest`}>
                                    {isCheckingCpf ? <Loader2 className="animate-spin" size={20} /> : <>{currentStep === 0 ? 'Verificar' : 'Continuar'} <ChevronRight size={20} /></>}
                                </button>
                            ) : (
                                <button type="submit" disabled={isLoading || ((formData.password || formData.confirmPassword) && formData.password !== formData.confirmPassword) || !formData.lgpd_consent} style={{ backgroundColor: primaryColor }} className="ml-auto py-5 px-10 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:brightness-110 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50">
                                    {isLoading ? <Loader2 className="animate-spin" size={24} /> : <><UserCheck size={24} /> {verifiedExistingUser ? "Salvar" : "Comitar"}</>}
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />
        </div>
    );
};

export default CensusRegister;