import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Survey, SystemInfo, ResidentType, PreferredChannel, UserRole, UserStatus, SurveyQuestion } from '../types';
import { api, systemService } from '../services/api';
import { normalizeCPF, validateCPF, formatCPF } from '../utils/cpf';
import {
    ShieldCheck, CheckCircle2, X, Fingerprint, Loader2, ChevronRight,
    AlertTriangle, ClipboardCheck, Camera, ScanLine, Upload,
    Zap, Sparkles, User, ArrowRight, Brain, Info, Key, Shield,
    UserCheck, Smartphone, MapPin, Building, Globe, Calendar,
    Video, Music, Image as ImageIcon, Play, Pause, RefreshCw, Volume2, ArrowLeft,
    FileSearch
} from 'lucide-react';
import OCRScanner from './OCRScanner';

/**
 * 🧠 S.I.E. PRO NUCLEUS - FUSÃO ADITIVA FINAL (V16.0)
 * Base: Passo 1 (Mission Critical Data & Logic - Governance/Detailed Fields)
 * Evolução: Passo 2 (OCR, Flow Logic, Safe Parsing)
 * Status: 100% Funcional e Integrado
 */

// --- HELPERS ---
const formatCEP = (v: string) => v.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2').substring(0, 9);
const formatDate = (v: string) => {
    return v.replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '$1/$2')
        .replace(/(\d{2})(\d)/, '$1/$2')
        .substring(0, 10);
};

const SYSTEM_TEXTS = {
    TITLE_SUCCESS: "Sincronizado",
    DESC_SUCCESS_1: "Sua participação fortalece o cluster ",
    DESC_SUCCESS_2: ".",
    BTN_END_SESSION: "Encerrar Sessão",
    TITLE_CENSUS: "Censo Digital",
    PROTOCOL_ID: "Protocolo SRE Sovereign V16.0 (Unified)",
    LBL_CPF: "Informe seu CPF",
    PLACEHOLDER_CPF: "000.000.000-00",
    BTN_START: "Iniciar Censo",
    ERR_CPF_INVALID: "CPF Inválido.",
    ERR_INVALID_LINK: "Protocolo de link inválido.",
    ERR_SURVEY_UNAVAILABLE: "Este formulário não está disponível.",
    ERR_IDENTITY_CHECK: "Erro ao validar identidade.",
    ERR_NETWORK_FAIL: "Erro de rede.",

    TITLE_IDENTITY: "Identificação Civil",
    LBL_FULL_NAME: "Nome Completo",
    PLACEHOLDER_NAME: "CONFORME DOCUMENTO",
    LBL_CPF_READONLY: "CPF (Único)",
    LBL_BIRTH_DATE: "Data de Nascimento (DD/MM/AAAA)",
    LBL_RG: "RG",
    LBL_ISSUER: "Emissor",
    PLACEHOLDER_ISSUER: "SSP/UF",
    LBL_GENDER: "Gênero",
    LBL_PROFESSION: "Profissão",
    PLACEHOLDER_PROFESSION: "OCUPAÇÃO",
    LBL_ADDRESS_FULL: "Endereço Residencial Completo",

    LBL_CEP: "CEP",
    LBL_STREET: "Rua / Logradouro",
    LBL_NUMBER: "Número",
    LBL_COMPLEMENT: "Complemento / Bloco",
    LBL_NEIGHBORHOOD: "Bairro",
    LBL_CITY: "Cidade",
    LBL_STATE: "Estado (UF)",
    PLACEHOLDER_CEP: "00000-000",
    PLACEHOLDER_NUMBER: "S/N",
    PLACEHOLDER_COMPLEMENT: "APTO 101, FUNDOS...",
    PLACEHOLDER_DATE: "DD/MM/AAAA",
    ALERT_CEP_FAIL: "CEP não encontrado ou serviço indisponível.",

    OPT_GENDER_MALE: "Masculino",
    OPT_GENDER_FEMALE: "Feminino",
    OPT_GENDER_OTHER: "Outro",
    OPT_GENDER_NA: "Não Informar",

    TITLE_UNIT: "Vínculo Habitacional",
    LBL_UNIT: "Unidade / Cluster",
    PLACEHOLDER_UNIT: "EX: BLOCO A 101",
    LBL_RESIDENT_TYPE: "Tipo de Residente",
    LBL_VOTING_RIGHTS: "Direito a Voto em Assembleia",

    OPT_RES_TITULAR: "Titular",
    OPT_RES_DEPENDENTE: "Dependente",
    OPT_RES_INQUILINO: "Inquilino",
    OPT_RES_RESPONSAVEL: "Responsável Legal",
    OPT_RES_OCUPANTE: "Ocupante",

    TITLE_GOVERNANCE: "Governança & Acesso",
    LBL_ROLE: "Cargo / Papel SRE",
    LBL_ACCOUNT_STATUS: "Estado de Conta",
    LBL_NEW_PASSWORD: "Nova Chave (Opcional)",
    LBL_ACTIVE_ONLINE: "Ativo (Online)",
    LBL_PENDING: "Pendente",

    TITLE_CONTACT: "Contato & Comunicação",
    LBL_EMAIL: "E-mail Principal",
    LBL_PHONE: "Telefone / Fixo",
    LBL_WHATSAPP: "WhatsApp Bridge",
    LBL_CHANNEL: "Canal Preferencial",
    PLACEHOLDER_CONTACT: "DDD + NÚMERO",

    OPT_CHANNEL_WA: "WhatsApp Messenger",
    OPT_CHANNEL_EMAIL: "E-mail Eletrônico",
    OPT_CHANNEL_APP: "App Mobile",

    TITLE_SOCIAL: "Módulos de Coleta",
    BTN_BACK_IDENTITY: "Voltar para Identidade",
    BTN_REVIEW_PROTOCOL: "Revisar Protocolo",
    ALERT_IDENTITY_REQUIRED: "Nome, Unidade e Data de Nascimento são obrigatórios.",

    RESP_SIM: "SIM",
    RESP_NAO: "NÃO",
    RESP_PLACEHOLDER: "Digite aqui...",

    TITLE_PHOTO: "Vision ID",
    SUBTITLE_PHOTO: "Protocolo Bio-ID Obrigatório",
    BTN_ACTIVATE_CAM: "Ativar Câmera",
    BTN_CAPTURE_FACE: "Capturar Face",
    BTN_UPLOAD_FILE: "Upload Arquivo",
    BTN_VALIDATE_ID: "Validar Identidade",
    ALERT_CAMERA_UNAVAILABLE: "Câmera indisponível.",

    TITLE_REVIEW: "Matriz de Dados",
    SUBTITLE_REVIEW: "SRE Identity Audit Hub",
    LBL_DIAGNOSIS: "Diagnóstico SRE",
    LBL_SYNC_LEDGER: "Sincronizando Ledger...",
    AI_AUDIT_FALLBACK: "PROTOCOLADO PARA AUDITORIA HUMANA.",
    BTN_REVIEW_PROTOCOL_SHORT: "Revisar Protocolo",
    BTN_COMMIT_CENSUS: "Comitar Censo Digital",
    LBL_CONTINUE_CHAIN: "Próxima Pesquisa",
    MSG_CHAINING: "Protocolo finalizado. Carregando próxima etapa do fluxo...",
    NEW_MEMBER_ALERT: "IDENTIDADE NÃO LOCALIZADA. Iniciando Protocolo de Primeiro Acesso.",
    OCR_BTN: "Preencher via Scanner de Documento"
};

// --- MULTIMEDIA ENGINE ---
const MultimediaCard = ({ question }: { question: SurveyQuestion }) => {
    return (
        <div className="w-full bg-white border border-slate-200 rounded-[2.5rem] md:rounded-[3.5rem] shadow-xl overflow-hidden animate-fade-in my-8 hover:shadow-2xl transition-all border-b-4 border-indigo-500/20">
            {question.media_url && (
                <div className="w-full bg-slate-950 relative overflow-hidden flex items-center justify-center min-h-[350px] md:min-h-[500px]">
                    <div
                        className="absolute inset-0 scale-125 blur-[60px] opacity-40 pointer-events-none"
                        style={{
                            backgroundImage: (question.media_type === 'image' || question.media_type === 'video') ? `url(${question.media_url})` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                        }}
                    ></div>
                    {question.media_type === 'video' && (
                        <video
                            src={question.media_url}
                            autoPlay={question.auto_play}
                            muted={question.auto_play}
                            controls
                            playsInline
                            className="relative z-10 w-full max-h-[70vh] object-contain shadow-[0_30px_60px_rgba(0,0,0,0.5)] transition-transform hover:scale-[1.01]"
                        />
                    )}
                    {question.media_type === 'image' && (
                        <img
                            src={question.media_url}
                            className="relative z-10 w-full max-h-[70vh] object-contain shadow-[0_30px_60px_rgba(0,0,0,0.5)] transition-transform hover:scale-[1.01]"
                            alt="Media Content"
                        />
                    )}
                    {question.media_type === 'audio' && (
                        <div className="p-12 md:p-20 flex flex-col items-center justify-center gap-6 bg-gradient-to-br from-indigo-900 via-slate-900 to-black text-white w-full h-full relative z-10">
                            <div className="p-8 bg-white/10 rounded-full animate-pulse shadow-[0_0_40px_rgba(79,70,229,0.3)]">
                                <Volume2 size={56} className="text-indigo-400" />
                            </div>
                            <p className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.3em] text-indigo-200">Protocolo de Áudio SRE</p>
                            <audio src={question.media_url} autoPlay={question.auto_play} controls className="mt-4 w-full max-w-md shadow-2xl rounded-full" />
                        </div>
                    )}
                </div>
            )}
            <div className="p-10 md:p-16 lg:p-20 space-y-8 bg-white">
                <h3 className="text-2xl md:text-4xl font-black text-slate-800 uppercase tracking-tightest leading-[1.1]">{question.text}</h3>
                {question.content_html && (
                    <div
                        className="text-slate-500 font-medium leading-relaxed uppercase text-sm md:text-lg border-l-8 border-indigo-600 pl-10 py-4 bg-slate-50 rounded-r-3xl"
                        dangerouslySetInnerHTML={{ __html: question.content_html }}
                    />
                )}
            </div>
        </div>
    );
};

const PublicSenso = () => {
    const [survey, setSurvey] = useState<Survey | null>(null);
    const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
    const [roles, setRoles] = useState<any[]>([]);
    const [step, setStep] = useState<'IDENTIFY' | 'FORM' | 'PHOTO' | 'REVIEW' | 'SUCCESS'>('IDENTIFY');
    const [currentSection, setCurrentSection] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
    const [error, setError] = useState('');
    const [cpfIdentifier, setCpfIdentifier] = useState('');
    const [aiSummary, setAiSummary] = useState('');
    const [isNewResident, setIsNewResident] = useState(false);
    const [isSearchingCEP, setIsSearchingCEP] = useState(false);
    const [isOCRScannerOpen, setIsOCRScannerOpen] = useState(false);

    // Payload Completo (Preserved from Step 1 for Critical Data)
    const [userData, setUserData] = useState({
        name: '',
        cpf_cnpj: '',
        birth_date: '',
        rg: '',
        issuing_authority: '',
        gender: '',
        unit: '',
        resident_type: 'TITULAR' as ResidentType,
        voting_rights: 1,
        role: 'RESIDENT' as string,
        status: 'PENDING' as UserStatus,
        password: '',
        email: '',
        phone: '',
        whatsapp: '',
        preferred_channel: 'WHATSAPP' as PreferredChannel,
        avatar_url: '',
        nationality: 'Brasileira',
        profession: '',
        cep: '',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
    });

    const [answers, setAnswers] = useState<Record<string, any>>({});
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [cameraActive, setCameraActive] = useState(false);

    useEffect(() => {
        const paths = window.location.pathname.split('/');
        const id = paths[paths.length - 1];
        if (id && id !== 'census') {
            loadSurvey(id);
            loadSystemInfo();
        } else { setError(SYSTEM_TEXTS.ERR_INVALID_LINK); }
    }, []);

    const loadSystemInfo = async () => {
        try {
            const [sysRes, rolesRes] = await Promise.all([
                api.get('/settings/system').catch(() => api.get('/public/system-info')),
                systemService.getRoles().catch(() => ({ data: { data: [] } }))
            ]);
            setSystemInfo(sysRes.data);
            setRoles(rolesRes.data.data || []);
        } catch (e) { console.error("Identity Core Offline"); }
    };

    const loadSurvey = async (id: string) => {
        setIsLoading(true);
        try {
            const res = await api.get(`/surveys/public/${id}`);
            setSurvey(res.data);
        } catch (e) {
            setError(SYSTEM_TEXTS.ERR_SURVEY_UNAVAILABLE);
        } finally { setIsLoading(false); }
    };

    const handleCEPBlur = async (cepValue: string) => {
        const cep = cepValue.replace(/\D/g, '');
        if (cep.length !== 8) return;
        setIsSearchingCEP(true);
        try {
            const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await res.json();
            if (!data.erro) {
                setUserData(p => ({
                    ...p,
                    street: data.logradouro,
                    neighborhood: data.bairro,
                    city: data.localidade,
                    state: data.uf
                }));
                setError('');
            } else { setError(SYSTEM_TEXTS.ALERT_CEP_FAIL); }
        } catch (e) { setError(SYSTEM_TEXTS.ALERT_CEP_FAIL); }
        finally { setIsSearchingCEP(false); }
    };

    const handleIdentify = async () => {
        const cleanCPF = normalizeCPF(cpfIdentifier);
        if (!validateCPF(cleanCPF)) { setError(SYSTEM_TEXTS.ERR_CPF_INVALID); return; }
        setIsLoading(true);
        setError('');
        try {
            const res = await api.get(`/surveys/public/check-resident/${cleanCPF}`);
            if (res.data && res.data.found) {
                setUserData({
                    ...userData,
                    name: res.data.name || '',
                    cpf_cnpj: cleanCPF,
                    unit: res.data.unit || '',
                    email: res.data.email || '',
                    phone: res.data.phone || '',
                    whatsapp: res.data.whatsapp || res.data.phone || '',
                    birth_date: res.data.birth_date ? formatDate(res.data.birth_date.slice(0, 10)) : '',
                    gender: res.data.gender || '',
                    rg: res.data.rg || '',
                    issuing_authority: res.data.issuing_authority || '',
                    avatar_url: res.data.avatar_url || '',
                    resident_type: res.data.resident_type || 'TITULAR',
                    voting_rights: res.data.voting_rights ?? 1,
                    role: res.data.role || 'RESIDENT',
                    status: res.data.status || 'PENDING',
                    profession: res.data.profession || '',
                    cep: res.data.cep || '',
                    street: res.data.street || '',
                    number: res.data.number || '',
                    complement: res.data.complement || '',
                    neighborhood: res.data.neighborhood || '',
                    city: res.data.city || '',
                    state: res.data.state || '',
                });
                setIsNewResident(false);
                setStep('FORM');
            } else {
                // New User Logic from Step 2: Force Photo
                setIsNewResident(true);
                setUserData({ ...userData, cpf_cnpj: cleanCPF });
                setError(SYSTEM_TEXTS.NEW_MEMBER_ALERT);
                setStep('PHOTO');
            }
        } catch (e) { setError(SYSTEM_TEXTS.ERR_IDENTITY_CHECK); }
        finally { setIsLoading(false); }
    };

    const handleOCRResult = (data: any) => {
        setUserData(prev => ({
            ...prev,
            name: data.nome || data.name || prev.name,
            rg: data.rg || prev.rg,
            birth_date: data.data_nascimento || data.birth_date || prev.birth_date,
            issuing_authority: data.orgao_emissor || prev.issuing_authority
        }));
    };

    // --- LOGIC ENGINE (Fused Step 1 & 2) ---
    const isQuestionVisible = (q: SurveyQuestion) => {
        if (!q.logic_parent_id) return true;
        const parentAnswer = answers[q.logic_parent_id];
        return String(parentAnswer) === String(q.logic_trigger_value);
    };

    const updateAnswer = (questionId: string, value: any) => {
        const newAnswers = { ...answers, [questionId]: value };

        // Safe parsing of questions for cleaning up child answers
        const questionsArray = Array.isArray(survey?.questions)
            ? survey?.questions
            : (typeof survey?.questions === 'string' ? JSON.parse(survey.questions || '[]') : []);

        questionsArray?.forEach((q: SurveyQuestion) => {
            if (q.logic_parent_id === questionId && String(value) !== String(q.logic_trigger_value)) {
                delete newAnswers[q.id];
            }
        });
        setAnswers(newAnswers);
    };

    const visibleQuestions = useMemo(() => {
        if (!survey?.questions) return [];
        // Step 2 Safer Parsing Protocol
        let questionsArray: SurveyQuestion[] = [];
        if (Array.isArray(survey.questions)) {
            questionsArray = survey.questions;
        } else {
            try {
                questionsArray = JSON.parse(survey.questions as string);
            } catch (e) {
                questionsArray = [];
            }
        }
        return questionsArray.filter(isQuestionVisible);
    }, [survey?.questions, answers]);

    const handleFinalReview = async () => {
        setStep('REVIEW');
        setIsGeneratingSummary(true);
        try {
            const res = await api.post(`/surveys/public/ai-summary`, {
                userData: userData,
                answers: answers
            });
            setAiSummary(res.data.text || SYSTEM_TEXTS.AI_AUDIT_FALLBACK);
        } catch (e) {
            setAiSummary(SYSTEM_TEXTS.AI_AUDIT_FALLBACK);
        } finally {
            setIsGeneratingSummary(false);
        }
    };

    const handleSubmit = async () => {
        setIsLoading(true);
        try {
            const payload = {
                cpf: normalizeCPF(cpfIdentifier),
                userData: {
                    ...userData,
                    active: 1,
                    status: isNewResident ? 'PENDING' : userData.status
                },
                answers: answers
            };
            const res = await api.post(`/surveys/public/${survey?.id}/submit`, payload);

            // Logic chaining from Step 2
            if (res.data?.next_survey_id) {
                setError(SYSTEM_TEXTS.MSG_CHAINING);
                setTimeout(() => {
                    window.location.href = `/census/${res.data.next_survey_id}`;
                }, 2000);
            } else {
                setStep('SUCCESS');
            }
        } catch (e: any) {
            alert(`${SYSTEM_TEXTS.ERR_NETWORK_FAIL}: ${e.response?.data?.error || ''}`);
        } finally { setIsLoading(false); }
    };

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            if (videoRef.current) { videoRef.current.srcObject = stream; setCameraActive(true); }
        } catch (e) { alert(SYSTEM_TEXTS.ALERT_CAMERA_UNAVAILABLE); }
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            canvasRef.current.width = videoRef.current.videoWidth;
            canvasRef.current.height = videoRef.current.videoHeight;
            ctx?.drawImage(videoRef.current, 0, 0);
            const b64 = canvasRef.current.toDataURL('image/jpeg', 0.8);
            setUserData({ ...userData, avatar_url: b64 });
            (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
            setCameraActive(false);
        }
    };

    const primaryColor = systemInfo?.primaryColor || '#4f46e5';

    if (step === 'SUCCESS') return (
        <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center text-white p-6">
            <div className="bg-white p-8 sm:p-16 rounded-[4rem] shadow-2xl max-w-lg w-full text-center animate-scale-in">
                <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl"><CheckCircle2 size={32} /></div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tight">{SYSTEM_TEXTS.TITLE_SUCCESS}</h2>
                <p className="text-slate-500 font-medium mt-4 mb-8 text-[10px] uppercase tracking-widest leading-relaxed">{SYSTEM_TEXTS.DESC_SUCCESS_1} {systemInfo?.shortName}{SYSTEM_TEXTS.DESC_SUCCESS_2}</p>
                <button onClick={() => window.location.href = '/'} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl active:scale-95 transition-all">{SYSTEM_TEXTS.BTN_END_SESSION}</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen w-full bg-[#f8fafc] flex flex-col relative overflow-x-hidden antialiased">
            {isLoading && (
                <div className="fixed inset-0 z-[9999] bg-white/80 backdrop-blur-md flex items-center justify-center">
                    <Loader2 size={48} className="animate-spin text-indigo-600" />
                </div>
            )}

            {/* STEP 2 OCR INTEGRATION */}
            {isOCRScannerOpen && (
                <OCRScanner
                    context="IDENTITY"
                    onClose={() => setIsOCRScannerOpen(false)}
                    onResult={handleOCRResult}
                    title="Validação de Identidade Civil"
                />
            )}

            <div className="flex-1 flex flex-col items-center">

                {/* STEP: IDENTIFY (Unified UI Step 2 + Logic Step 1 + Flow Step 2) */}
                {step === 'IDENTIFY' && (
                    <div className="bg-white border border-slate-100 rounded-[4rem] w-full max-w-xl p-8 sm:p-12 lg:p-20 text-center animate-fade-in shadow-2xl my-auto sm:my-20">
                        <div className="w-24 h-24 sm:w-32 sm:h-32 bg-slate-900 rounded-[2rem] mx-auto flex items-center justify-center text-white mb-8 shadow-2xl overflow-hidden">
                            {systemInfo?.logoUrl ? <img src={systemInfo.logoUrl} className="w-full h-full object-contain p-3" alt="Logo" /> : <Fingerprint size={40} />}
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-800 uppercase mb-2 tracking-tight">{SYSTEM_TEXTS.TITLE_CENSUS}</h2>
                        <div className="inline-block px-4 py-1.5 bg-indigo-50 border border-indigo-100 rounded-full mb-8">
                            <p className="text-indigo-600 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em]">{SYSTEM_TEXTS.PROTOCOL_ID}</p>
                        </div>

                        <div className="space-y-6">
                            <div className="relative group">
                                <label className="absolute -top-2.5 left-5 bg-white px-2 text-[9px] font-black text-slate-400 uppercase tracking-widest z-10">{SYSTEM_TEXTS.LBL_CPF}</label>
                                <input type="text" inputMode="numeric" value={cpfIdentifier} onChange={e => { setCpfIdentifier(formatCPF(e.target.value)); setError(''); }} className="w-full py-5 sm:py-7 px-6 bg-slate-50 border-2 border-slate-100 rounded-3xl text-center text-lg sm:text-xl font-black outline-none focus:bg-white focus:border-indigo-500 transition-all uppercase shadow-inner" placeholder={SYSTEM_TEXTS.PLACEHOLDER_CPF} maxLength={14} />
                                {validateCPF(normalizeCPF(cpfIdentifier)) && <div className="absolute right-5 top-1/2 -translate-y-1/2 text-emerald-500 animate-scale-in"><ShieldCheck size={24} /></div>}
                            </div>
                            <button onClick={handleIdentify} disabled={isLoading || !validateCPF(normalizeCPF(cpfIdentifier))} className="w-full py-5 sm:py-7 bg-slate-900 text-white rounded-2xl font-black text-[10px] sm:text-[11px] uppercase tracking-[0.3em] hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-2xl disabled:opacity-30">
                                {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>{SYSTEM_TEXTS.BTN_START} <ChevronRight size={18} /></>}
                            </button>
                            {error && <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 font-black text-[9px] uppercase shadow-sm animate-shake flex items-center justify-center gap-2 tracking-widest"><AlertTriangle size={14} /> {error}</div>}
                        </div>
                    </div>
                )}

                {step === 'FORM' && (
                    <div className="bg-white w-full max-w-6xl flex flex-col animate-fade-in shadow-2xl sm:rounded-[3rem] overflow-hidden border-b border-slate-100 sm:mb-10 min-h-screen sm:min-h-0">
                        <div className="shrink-0 border-b bg-slate-900 p-5 sm:p-8 flex justify-between items-center text-white sticky top-0 z-50">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-600 rounded-xl shadow-lg shrink-0" style={{ backgroundColor: primaryColor }}><ClipboardCheck size={20} /></div>
                                <div className="min-w-0">
                                    <h3 className="font-black text-sm sm:text-xl uppercase tracking-tight truncate">{survey?.title || SYSTEM_TEXTS.TITLE_CENSUS}</h3>
                                    <p className="text-[8px] sm:text-[9px] text-indigo-300 font-black uppercase mt-0.5 tracking-widest opacity-80">Etapa {currentSection + 1} de 2</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 sm:gap-6">
                                {/* ADDED FROM STEP 2: OCR BUTTON */}
                                {isNewResident && (
                                    <button onClick={() => setIsOCRScannerOpen(true)} className="hidden md:flex px-5 py-2.5 bg-white/10 border border-white/20 rounded-xl text-[9px] font-black uppercase items-center gap-2 hover:bg-white/20 transition-all">
                                        <ScanLine size={14} /> {SYSTEM_TEXTS.OCR_BTN}
                                    </button>
                                )}
                                <div className="hidden sm:block w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500 transition-all duration-700" style={{ width: `${currentSection === 0 ? 50 : 100}%`, backgroundColor: primaryColor }} />
                                </div>
                                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{currentSection === 0 ? '50%' : '100%'}</span>
                            </div>
                        </div>

                        <div className="p-6 sm:p-10 lg:p-14 bg-white">
                            {currentSection === 0 ? (
                                <div className="space-y-12 animate-fade-in max-w-5xl mx-auto pb-10">

                                    {/* IDENTIFICAÇÃO CIVIL - COMPLETE FIELDS FROM STEP 1 (MISSION CRITICAL) */}
                                    <div className="space-y-8">
                                        <div className="flex items-center gap-4 px-2 border-l-4 border-indigo-500 pl-4">
                                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">{SYSTEM_TEXTS.TITLE_IDENTITY}</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            <div className="space-y-1.5 md:col-span-2 lg:col-span-1">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{SYSTEM_TEXTS.LBL_FULL_NAME}</label>
                                                <input className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 text-sm font-black focus:bg-white focus:border-indigo-500 outline-none transition-all uppercase" value={userData.name} onChange={e => setUserData({ ...userData, name: e.target.value })} placeholder={SYSTEM_TEXTS.PLACEHOLDER_NAME} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{SYSTEM_TEXTS.LBL_CPF_READONLY}</label>
                                                <input readOnly className="w-full h-14 bg-slate-100 border-2 border-slate-100 rounded-2xl px-5 text-sm font-black outline-none opacity-60" value={formatCPF(userData.cpf_cnpj)} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{SYSTEM_TEXTS.LBL_BIRTH_DATE}</label>
                                                <div className="relative">
                                                    <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                                    <input
                                                        type="text"
                                                        inputMode="numeric"
                                                        className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 text-sm font-black outline-none focus:bg-white focus:border-indigo-500 transition-all"
                                                        value={userData.birth_date}
                                                        onChange={e => setUserData({ ...userData, birth_date: formatDate(e.target.value) })}
                                                        placeholder={SYSTEM_TEXTS.PLACEHOLDER_DATE}
                                                        maxLength={10}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{SYSTEM_TEXTS.LBL_RG}</label>
                                                <input className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 text-sm font-black outline-none focus:bg-white focus:border-indigo-500 transition-all" value={userData.rg} onChange={e => setUserData({ ...userData, rg: e.target.value })} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{SYSTEM_TEXTS.LBL_ISSUER}</label>
                                                <input className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 text-sm font-black outline-none focus:bg-white focus:border-indigo-500 uppercase" value={userData.issuing_authority} onChange={e => setUserData({ ...userData, issuing_authority: e.target.value })} placeholder={SYSTEM_TEXTS.PLACEHOLDER_ISSUER} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{SYSTEM_TEXTS.LBL_GENDER}</label>
                                                <select className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 text-[10px] font-black uppercase appearance-none" value={userData.gender} onChange={e => setUserData({ ...userData, gender: e.target.value })}>
                                                    <option value="">Selecione...</option>
                                                    <option value="MALE">{SYSTEM_TEXTS.OPT_GENDER_MALE}</option>
                                                    <option value="FEMALE">{SYSTEM_TEXTS.OPT_GENDER_FEMALE}</option>
                                                    <option value="OTHER">{SYSTEM_TEXTS.OPT_GENDER_OTHER}</option>
                                                    <option value="PREFER_NOT_TO_SAY">{SYSTEM_TEXTS.OPT_GENDER_NA}</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{SYSTEM_TEXTS.LBL_PROFESSION}</label>
                                                <input className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 text-sm font-black focus:bg-white focus:border-indigo-500 outline-none transition-all uppercase" value={userData.profession} onChange={e => setUserData({ ...userData, profession: e.target.value })} placeholder={SYSTEM_TEXTS.PLACEHOLDER_PROFESSION} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* ENDEREÇO ATÔMICO - COMPLETE FROM STEP 1 */}
                                    <div className="space-y-8">
                                        <div className="flex items-center gap-4 px-2 border-l-4 border-indigo-500 pl-4">
                                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">{SYSTEM_TEXTS.LBL_ADDRESS_FULL}</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{SYSTEM_TEXTS.LBL_CEP}</label>
                                                <div className="relative">
                                                    <input className="w-full h-14 bg-white border-2 border-slate-100 rounded-2xl px-5 text-sm font-black focus:bg-white focus:border-indigo-500 outline-none transition-all" value={userData.cep} onChange={e => setUserData({ ...userData, cep: formatCEP(e.target.value) })} onBlur={e => handleCEPBlur(e.target.value)} placeholder={SYSTEM_TEXTS.PLACEHOLDER_CEP} maxLength={9} />
                                                    {isSearchingCEP && <Loader2 size={18} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-indigo-500" />}
                                                </div>
                                            </div>
                                            <div className="space-y-1.5 md:col-span-3">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{SYSTEM_TEXTS.LBL_STREET}</label>
                                                <input className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 text-sm font-black outline-none focus:bg-white focus:border-indigo-500 transition-all uppercase" value={userData.street} onChange={e => setUserData({ ...userData, street: e.target.value })} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{SYSTEM_TEXTS.LBL_NUMBER}</label>
                                                <input className="w-full h-14 bg-white border-2 border-slate-100 rounded-2xl px-5 text-sm font-black focus:bg-white focus:border-indigo-500 outline-none transition-all uppercase" value={userData.number} onChange={e => setUserData({ ...userData, number: e.target.value })} placeholder={SYSTEM_TEXTS.PLACEHOLDER_NUMBER} />
                                            </div>
                                            <div className="space-y-1.5 md:col-span-1">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{SYSTEM_TEXTS.LBL_COMPLEMENT}</label>
                                                <input className="w-full h-14 bg-white border-2 border-slate-100 rounded-2xl px-5 text-sm font-black focus:bg-white focus:border-indigo-500 outline-none transition-all uppercase" value={userData.complement} onChange={e => setUserData({ ...userData, complement: e.target.value })} placeholder={SYSTEM_TEXTS.PLACEHOLDER_COMPLEMENT} />
                                            </div>
                                            <div className="space-y-1.5 md:col-span-1">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{SYSTEM_TEXTS.LBL_NEIGHBORHOOD}</label>
                                                <input className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 text-sm font-black outline-none focus:bg-white focus:border-indigo-500 transition-all uppercase" value={userData.neighborhood} onChange={e => setUserData({ ...userData, neighborhood: e.target.value })} />
                                            </div>
                                            <div className="space-y-1.5 md:col-span-1">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{SYSTEM_TEXTS.LBL_CITY} / {SYSTEM_TEXTS.LBL_STATE}</label>
                                                <div className="flex gap-2">
                                                    <input className="flex-1 h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 text-sm font-bold uppercase focus:bg-white focus:border-indigo-500 outline-none transition-all" value={userData.city} onChange={e => setUserData({ ...userData, city: e.target.value })} />
                                                    <input className="w-14 h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl text-center font-bold uppercase focus:bg-white focus:border-indigo-500 outline-none transition-all" value={userData.state} onChange={e => setUserData({ ...userData, state: e.target.value })} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* VÍNCULO HABITACIONAL */}
                                    <div className="space-y-8">
                                        <div className="flex items-center gap-4 px-2 border-l-4 border-emerald-500 pl-4">
                                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">{SYSTEM_TEXTS.TITLE_UNIT}</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{SYSTEM_TEXTS.LBL_UNIT}</label>
                                                <input className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 text-sm font-black focus:bg-white focus:border-indigo-500 transition-all uppercase" value={userData.unit} onChange={e => setUserData({ ...userData, unit: e.target.value })} placeholder={SYSTEM_TEXTS.PLACEHOLDER_UNIT} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{SYSTEM_TEXTS.LBL_RESIDENT_TYPE}</label>
                                                <select className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 text-[10px] font-black uppercase appearance-none" value={userData.resident_type} onChange={e => setUserData({ ...userData, resident_type: e.target.value as ResidentType })}>
                                                    <option value="TITULAR">{SYSTEM_TEXTS.OPT_RES_TITULAR}</option>
                                                    <option value="DEPENDENTE">{SYSTEM_TEXTS.OPT_RES_DEPENDENTE}</option>
                                                    <option value="INQUILINO">{SYSTEM_TEXTS.OPT_RES_INQUILINO}</option>
                                                    <option value="RESPONSAVEL">{SYSTEM_TEXTS.OPT_RES_RESPONSAVEL}</option>
                                                    <option value="OCUPANTE">{SYSTEM_TEXTS.OPT_RES_OCUPANTE}</option>
                                                </select>
                                            </div>
                                            <div className="flex items-end pb-2">
                                                <label className="flex items-center gap-4 cursor-pointer group">
                                                    <div className={`w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center ${userData.voting_rights === 1 ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-200 group-hover:border-indigo-300'}`} onClick={() => setUserData({ ...userData, voting_rights: userData.voting_rights === 1 ? 0 : 1 })}>
                                                        {userData.voting_rights === 1 && <ShieldCheck size={16} className="text-white" />}
                                                    </div>
                                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{SYSTEM_TEXTS.LBL_VOTING_RIGHTS}</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* GOVERNANÇA & ACESSO (STEP 1 CRITICAL) */}
                                    <div className="space-y-8">
                                        <div className="flex items-center gap-4 px-2 border-l-4 border-slate-900 pl-4">
                                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">{SYSTEM_TEXTS.TITLE_GOVERNANCE}</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{SYSTEM_TEXTS.LBL_ROLE}</label>
                                                <select className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 text-[10px] font-black uppercase appearance-none" value={userData.role} onChange={e => setUserData({ ...userData, role: e.target.value })}>
                                                    {roles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                                                </select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{SYSTEM_TEXTS.LBL_ACCOUNT_STATUS}</label>
                                                <select disabled className="w-full h-14 bg-slate-100 border-2 border-slate-100 rounded-2xl px-5 text-[10px] font-black uppercase appearance-none opacity-60" value={userData.status}>
                                                    <option value="ACTIVE">{SYSTEM_TEXTS.LBL_ACTIVE_ONLINE}</option>
                                                    <option value="PENDING">{SYSTEM_TEXTS.LBL_PENDING}</option>
                                                </select>
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{SYSTEM_TEXTS.LBL_NEW_PASSWORD}</label>
                                                <div className="relative">
                                                    <Key className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                                    <input type="password" className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 text-sm focus:bg-white focus:border-indigo-500 outline-none transition-all" value={userData.password} onChange={e => setUserData({ ...userData, password: e.target.value })} placeholder="••••••••" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* CONTATO & COMUNICAÇÃO (STEP 1 CRITICAL) */}
                                    <div className="space-y-8">
                                        <div className="flex items-center gap-4 px-2 border-l-4 border-emerald-600 pl-4">
                                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">{SYSTEM_TEXTS.TITLE_CONTACT}</h4>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{SYSTEM_TEXTS.LBL_EMAIL}</label>
                                                <input className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 text-sm font-black focus:bg-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300" value={userData.email} onChange={e => setUserData({ ...userData, email: e.target.value })} placeholder="SEU@EMAIL.COM" />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{SYSTEM_TEXTS.LBL_PHONE}</label>
                                                <input className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 text-sm font-black focus:bg-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300" value={userData.phone} onChange={e => setUserData({ ...userData, phone: e.target.value })} placeholder={SYSTEM_TEXTS.PLACEHOLDER_CONTACT} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{SYSTEM_TEXTS.LBL_WHATSAPP}</label>
                                                <input className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 text-sm font-black focus:bg-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-300" value={userData.whatsapp} onChange={e => setUserData({ ...userData, whatsapp: e.target.value })} placeholder={SYSTEM_TEXTS.PLACEHOLDER_CONTACT} />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{SYSTEM_TEXTS.LBL_CHANNEL}</label>
                                                <select className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 text-[10px] font-black uppercase appearance-none" value={userData.preferred_channel} onChange={e => setUserData({ ...userData, preferred_channel: e.target.value as PreferredChannel })}>
                                                    <option value="WHATSAPP">{SYSTEM_TEXTS.OPT_CHANNEL_WA}</option>
                                                    <option value="EMAIL">{SYSTEM_TEXTS.OPT_CHANNEL_EMAIL}</option>
                                                    <option value="APP">{SYSTEM_TEXTS.OPT_CHANNEL_APP}</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-10 flex gap-4">
                                        <button onClick={() => {
                                            if (!userData.name || !userData.unit || !userData.birth_date) return alert(SYSTEM_TEXTS.ALERT_IDENTITY_REQUIRED);
                                            setCurrentSection(1);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }} className="flex-1 py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl">Continuar <ArrowRight size={18} /></button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-12 animate-fade-in max-w-5xl mx-auto">
                                    {/* MÓDULOS DE COLETA - STEP 2 ENGINE with Safe Parsing */}
                                    <div className="space-y-10">
                                        {visibleQuestions.map((q, idx) => (
                                            <div key={q.id}>
                                                {q.type === 'multimedia' ? (
                                                    <MultimediaCard question={q} />
                                                ) : (
                                                    <div className="space-y-4 group border-l-4 border-slate-100 pl-8 focus-within:border-indigo-500 transition-all animate-fade-in py-4">
                                                        <h4 className="text-sm md:text-xl font-black text-slate-800 uppercase tracking-tight flex items-start gap-4 leading-snug">
                                                            <span className="text-[10px] text-indigo-500 bg-indigo-50 px-3 py-1 rounded-lg mt-1">{(idx + 1).toString().padStart(2, '0')}</span>
                                                            {q.text}
                                                        </h4>
                                                        {q.type === 'select' ? (
                                                            <div className="flex flex-wrap gap-3 mt-6">
                                                                {q.options?.map((opt: string) => (
                                                                    <button key={opt} onClick={() => updateAnswer(q.id, opt)} className={`py-4 px-8 rounded-2xl text-left font-black text-[10px] uppercase tracking-widest border transition-all active:scale-95 ${answers[q.id] === opt ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400'}`}>{opt}</button>
                                                                ))}
                                                            </div>
                                                        ) : q.type === 'boolean' ? (
                                                            <div className="flex gap-4 mt-6">
                                                                <button onClick={() => updateAnswer(q.id, 'SIM')} className={`flex-1 py-5 rounded-2xl font-black text-[11px] uppercase border transition-all ${answers[q.id] === 'SIM' ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400'}`}>{SYSTEM_TEXTS.RESP_SIM}</button>
                                                                <button onClick={() => updateAnswer(q.id, 'NÃO')} className={`flex-1 py-5 rounded-2xl font-black text-[11px] uppercase border transition-all ${answers[q.id] === 'NÃO' ? 'bg-rose-600 border-rose-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400'}`}>{SYSTEM_TEXTS.RESP_NAO}</button>
                                                            </div>
                                                        ) : (
                                                            <div className="relative mt-4">
                                                                {q.type === 'date' && <Calendar className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />}
                                                                <input
                                                                    type="text"
                                                                    inputMode={q.type === 'date' || q.type === 'number' ? "numeric" : "text"}
                                                                    value={answers[q.id] || ''}
                                                                    onChange={e => updateAnswer(q.id, q.type === 'date' ? formatDate(e.target.value) : e.target.value)}
                                                                    className="w-full h-16 bg-slate-50 border-2 border-slate-100 rounded-2xl px-8 text-base font-black uppercase focus:bg-white focus:border-indigo-500 outline-none shadow-inner transition-all placeholder:text-slate-300"
                                                                    placeholder={q.type === 'date' ? SYSTEM_TEXTS.PLACEHOLDER_DATE : SYSTEM_TEXTS.RESP_PLACEHOLDER}
                                                                    maxLength={q.type === 'date' ? 10 : undefined}
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-4 pt-10 border-t border-slate-100 pb-20">
                                        <button onClick={() => { setCurrentSection(0); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="py-5 px-8 bg-slate-100 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-2"><ArrowLeft size={16} /> Voltar</button>
                                        <button onClick={() => { if (isNewResident && !userData.avatar_url) setStep('PHOTO'); else handleFinalReview(); }} className="flex-1 py-6 bg-slate-900 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl">{SYSTEM_TEXTS.BTN_REVIEW_PROTOCOL} <ArrowRight size={18} /></button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* STEP: PHOTO (Restored Step 1 UI - Mission Critical Bio-ID, with Step 2 New Member Flow) */}
                {step === 'PHOTO' && (
                    <div className="bg-slate-950 w-full max-w-4xl min-h-screen sm:min-h-[750px] flex flex-col items-center justify-center text-center p-6 sm:p-14 sm:rounded-[4rem] shadow-2xl animate-fade-in relative overflow-hidden my-auto">
                        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
                        <div className="relative z-10 space-y-10 sm:space-y-14 w-full">
                            <div className="space-y-2">
                                <h3 className="text-4xl sm:text-6xl font-black text-white uppercase tracking-tightest leading-none">{SYSTEM_TEXTS.TITLE_PHOTO}</h3>
                                <p className="text-indigo-400 text-[8px] sm:text-xs font-black uppercase tracking-[0.4em] opacity-80">{SYSTEM_TEXTS.SUBTITLE_PHOTO}</p>
                            </div>
                            <div className="relative mx-auto">
                                <div className={`w-64 h-64 sm:w-96 sm:h-96 lg:w-[450px] lg:h-[450px] bg-black rounded-full border-4 sm:border-8 ${userData.avatar_url ? 'border-emerald-500' : 'border-indigo-500/30'} overflow-hidden relative shadow-[0_0_80px_rgba(79,70,229,0.3)]`}>
                                    {userData.avatar_url ? <img src={userData.avatar_url} className="w-full h-full object-cover" /> : <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover grayscale brightness-110" />}
                                    {!userData.avatar_url && <div className="absolute inset-0 pointer-events-none"><div className="absolute inset-x-0 h-1 bg-indigo-500 shadow-[0_0_20px_#6366f1] animate-[scan_3s_infinite]"></div></div>}
                                </div>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 justify-center">
                                {!userData.avatar_url ? (
                                    <>
                                        {!cameraActive ? (
                                            <button onClick={startCamera} className="px-10 py-5 bg-indigo-600 text-white rounded-2xl sm:rounded-[3rem] font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-indigo-500 transition-all flex items-center justify-center gap-3"><Camera size={20} /> {SYSTEM_TEXTS.BTN_ACTIVATE_CAM}</button>
                                        ) : (
                                            <button onClick={capturePhoto} className="px-10 py-5 bg-white text-slate-900 rounded-2xl sm:rounded-[3rem] font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-slate-100 transition-all flex items-center justify-center gap-3 border-4 border-indigo-50"><ScanLine size={20} /> {SYSTEM_TEXTS.BTN_CAPTURE_FACE}</button>
                                        )}
                                        <label className="px-10 py-5 bg-slate-800 text-white rounded-2xl sm:rounded-[3rem] font-black text-[10px] uppercase tracking-widest cursor-pointer hover:bg-slate-700 transition-all flex items-center justify-center gap-3 border border-white/5"><Upload size={20} /> {SYSTEM_TEXTS.BTN_UPLOAD_FILE} <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                            const f = e.target.files?.[0];
                                            if (f) { const r = new FileReader(); r.onloadend = () => setUserData({ ...userData, avatar_url: r.result as string }); r.readAsDataURL(f); }
                                        }} /></label>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => isNewResident ? setStep('FORM') : handleFinalReview()}
                                        className="px-16 py-6 sm:py-8 bg-emerald-600 text-white rounded-2xl sm:rounded-[4rem] font-black text-xs sm:text-base uppercase tracking-[0.3em] shadow-xl hover:bg-emerald-500 transition-all flex items-center justify-center gap-4 active:scale-95"
                                    >
                                        {isNewResident ? "Continuar Cadastro" : SYSTEM_TEXTS.BTN_VALIDATE_ID} <ArrowRight size={22} />
                                    </button>
                                )}
                            </div>
                            {isNewResident && <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-2xl text-[9px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Handshake Bio-ID Requerido para Primeiro Acesso</div>}
                        </div>
                    </div>
                )}

                {/* STEP: REVIEW (Step 1 Detailed Data + Step 2 AI Summary + Step 2 Chaining) */}
                {step === 'REVIEW' && (
                    <div className="bg-white w-full max-w-4xl p-8 sm:p-14 lg:p-20 sm:rounded-[4rem] shadow-2xl border-x sm:border border-slate-200 animate-fade-in relative overflow-hidden my-auto sm:my-10">
                        <div className="hidden sm:block absolute top-0 left-0 w-3 h-full bg-indigo-600" style={{ backgroundColor: primaryColor }}></div>
                        <div className="flex items-center gap-5 sm:gap-8 mb-10 sm:mb-16">
                            <div className="p-4 sm:p-7 bg-indigo-600 rounded-[1.25rem] sm:rounded-[2.5rem] text-white shadow-xl animate-pulse" style={{ backgroundColor: primaryColor }}><Brain size={24} /></div>
                            <div>
                                <h3 className="text-xl sm:text-4xl font-black text-slate-800 uppercase tracking-tight leading-none">{SYSTEM_TEXTS.TITLE_REVIEW}</h3>
                                <p className="text-[8px] sm:text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-1.5">{SYSTEM_TEXTS.SUBTITLE_REVIEW}</p>
                            </div>
                        </div>

                        <div className="space-y-8 sm:space-y-14">
                            <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 items-center p-6 sm:p-10 bg-slate-50 border border-slate-200 rounded-3xl sm:rounded-[4rem] shadow-inner text-center sm:text-left">
                                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-slate-200 border-2 sm:border-4 border-white shadow-xl overflow-hidden rounded-[1.5rem] sm:rounded-[3rem] shrink-0">
                                    {userData.avatar_url ? <img src={userData.avatar_url} className="w-full h-full object-cover" /> : <User size={40} className="text-slate-400 m-8 sm:m-10" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-xl sm:text-3xl font-black text-slate-900 uppercase leading-none mb-3 truncate">{userData.name}</h4>
                                    <div className="flex flex-wrap justify-center sm:justify-start gap-3">
                                        <span className="text-[8px] sm:text-[10px] font-black text-indigo-600 bg-white px-3 py-1.5 rounded-lg border border-indigo-100 uppercase tracking-widest">{SYSTEM_TEXTS.LBL_UNIT}. {userData.unit}</span>
                                        <span className="text-[8px] sm:text-[10px] font-black text-slate-400 bg-white px-3 py-1.5 rounded-lg border border-slate-100 uppercase tracking-widest">{formatCPF(cpfIdentifier)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 sm:p-14 bg-indigo-50 rounded-[2.5rem] sm:rounded-[4.5rem] border border-indigo-100 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-[0.03]"><Sparkles size={120} /></div>
                                <h4 className="text-[9px] sm:text-[11px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-4 sm:mb-8 flex items-center gap-2"><Zap size={14} /> {SYSTEM_TEXTS.LBL_DIAGNOSIS}</h4>
                                {isGeneratingSummary ? (
                                    <div className="flex items-center gap-4 animate-pulse py-4">
                                        <Loader2 className="animate-spin text-indigo-600" size={20} />
                                        <span className="text-xs sm:text-sm font-black text-indigo-400 uppercase tracking-widest">{SYSTEM_TEXTS.LBL_SYNC_LEDGER}</span>
                                    </div>
                                ) : <p className="text-indigo-900 text-lg sm:text-2xl font-medium leading-relaxed sm:leading-loose uppercase italic relative z-10">"{aiSummary}"</p>}
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 pb-6">
                                <button onClick={() => setStep('FORM')} className="order-2 sm:order-1 py-5 sm:py-8 bg-slate-100 text-slate-500 rounded-2xl sm:rounded-[2.5rem] font-black text-[10px] sm:text-xs uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95">{SYSTEM_TEXTS.BTN_REVIEW_PROTOCOL_SHORT}</button>
                                <button onClick={handleSubmit} disabled={isLoading} className="order-1 sm:order-2 flex-[2.5] py-5 sm:py-8 bg-slate-950 text-white rounded-2xl sm:rounded-[2.5rem] font-black text-[10px] sm:text-xs uppercase tracking-[0.3em] hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-95 disabled:opacity-30">
                                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : survey?.next_survey_id ? <>{SYSTEM_TEXTS.LBL_CONTINUE_CHAIN} <ChevronRight size={20} /></> : <><ShieldCheck size={20} /> {SYSTEM_TEXTS.BTN_COMMIT_CENSUS}</>}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <canvas ref={canvasRef} className="hidden" />
            <style>{`
                @keyframes scan { 0% { transform: translateY(-40px); } 100% { transform: translateY(440px); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in { animation: fadeIn 0.3s ease-out forwards; }
                @keyframes scaleIn { from { transform: scale(0.95); opacity: 0; } to { transform: scale(1); opacity: 1; } }
                .animate-scale-in { animation: scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .tracking-tightest { letter-spacing: -0.05em; }
                @media (max-width: 640px) {
                    input, select, textarea { font-size: 16px !important; }
                }
            `}</style>
        </div>
    );
};

export default PublicSenso;