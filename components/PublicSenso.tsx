
import React, { useState, useEffect } from 'react';
import { Loader2, Key, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import CensusRegister from './CensusRegister';
import { formatCPF, validateCPF } from '../utils/cpf';

const SYSTEM_TEXTS = {
    TITLE_GOVERNANCE: "Segurança & Acesso",
    LBL_ROLE: "Tipo de Perfil",
    LBL_ACCOUNT_STATUS: "Status da Conta",
    LBL_NEW_PASSWORD: "Criar Senha de Acesso",
    LBL_ACTIVE_ONLINE: "Ativo / Online",
    LBL_PENDING: "Pendente de Aprovação"
};

const PublicSenso = () => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [survey, setSurvey] = useState<any>(null);
    const [systemInfo, setSystemInfo] = useState<any>(null);
    const [cpf, setCpf] = useState('');
    
    // SRE: Estado tipado implicitamente como any para flexibilidade no formulário dinâmico, 
    // mas com valores iniciais definidos para evitar undefined.
    const [userData, setUserData] = useState<any>({
        name: '', birth_date: '', gender: '', rg: '', 
        password: '', status: 'PENDING', unit: '', 
        phone: '', email: '', cep: '', street: '', number: '', neighborhood: '', city: '', state: ''
    });
    
    const [answers, setAnswers] = useState<any>({});
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Extract ID from URL: /census/:id
    const surveyId = window.location.pathname.split('/').pop();

    useEffect(() => {
        const init = async () => {
            if (!surveyId) return;
            try {
                // SRE: Fetch paralelo para performance otimizada
                const [resSurvey, resInfo] = await Promise.all([
                    api.get(`/surveys/public/${surveyId}`),
                    api.get('/public/system-info')
                ]);
                
                setSurvey(resSurvey.data || resSurvey);
                setSystemInfo(resInfo.data);
            } catch (e) {
                setError("Censo não encontrado ou inativo.");
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [surveyId]);

    // SRE Fix TS2345: Tratamento de undefined para string vazia
    useEffect(() => {
        if (systemInfo?.shortName) {
            setUserData((prev: any) => ({ ...prev, unit: systemInfo.shortName || '' }));
        }
    }, [systemInfo]);

    const handleCheckCPF = async () => {
        if (!validateCPF(cpf)) {
            setError("CPF Inválido");
            return;
        }
        setLoading(true);
        try {
            const res = await api.get(`/surveys/public/check-resident/${cpf.replace(/\D/g, '')}`);
            if (res.data.found) {
                setUserData((prev: any) => ({ 
                    ...prev, 
                    ...res.data, 
                    password: '', // Segurança: Limpa hash vindo do banco se existir
                    unit: systemInfo?.shortName || res.data.unit || '' // Força a unidade do sistema
                }));
            }
            setStep(2);
            setError('');
        } catch (e) {
            // Flow for new resident
            setStep(2);
            setError('');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const payload = {
                cpf: cpf,
                userData: {
                    ...userData,
                    role: 'RESIDENT', // Força papel de residente
                    unit: systemInfo?.shortName || userData.unit // Garante consistência
                },
                answers: answers
            };
            
            await api.post(`/surveys/public/${surveyId}/submit`, payload);
            setSuccess(true);
        } catch (e) {
            setError("Erro ao enviar. Verifique os dados.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-indigo-600" size={48}/></div>;
    
    if (success) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
            <div className="bg-white p-12 rounded-[3rem] shadow-xl text-center max-w-lg">
                <CheckCircle2 size={64} className="text-emerald-500 mx-auto mb-6" />
                <h2 className="text-2xl font-black text-slate-800 uppercase mb-4">Registro Confirmado</h2>
                <p className="text-slate-500 mb-8">Seus dados foram sincronizados com sucesso no sistema {systemInfo?.shortName || 'S.I.E'}.</p>
                <button onClick={() => window.location.reload()} className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold uppercase">Novo Acesso</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center py-12 px-4 sm:px-6">
            <div className="w-full max-w-3xl bg-white rounded-[3rem] shadow-2xl overflow-hidden border border-slate-200">
                <div className="bg-slate-900 p-10 text-white text-center relative overflow-hidden">
                    <div className="relative z-10">
                        <h1 className="text-3xl font-black uppercase tracking-tighter">{survey?.title || 'Censo Digital'}</h1>
                        <p className="text-indigo-400 font-bold uppercase tracking-widest text-xs mt-2">Atualização Cadastral Obrigatória</p>
                    </div>
                </div>

                <div className="p-8 sm:p-12">
                    {error && (
                        <div className="mb-8 p-4 bg-rose-50 text-rose-600 rounded-2xl flex items-center gap-3 font-bold text-sm uppercase">
                            <AlertTriangle size={20}/> {error}
                        </div>
                    )}

                    {step === 1 && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="text-center space-y-4">
                                <ShieldCheck size={48} className="text-indigo-600 mx-auto" />
                                <h3 className="text-xl font-black text-slate-800 uppercase">Identificação Segura</h3>
                                <p className="text-slate-500 text-sm max-w-md mx-auto">Informe seu CPF para iniciarmos a validação de identidade no cluster.</p>
                            </div>
                            <div className="max-w-xs mx-auto space-y-4">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">CPF (Apenas Números)</label>
                                <input 
                                    className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-center text-xl font-black tracking-widest outline-none focus:border-indigo-500 transition-all"
                                    value={cpf}
                                    onChange={e => setCpf(formatCPF(e.target.value))}
                                    placeholder="000.000.000-00"
                                    maxLength={14}
                                />
                                <button onClick={handleCheckCPF} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-700 transition-all flex items-center justify-center gap-3">
                                    Continuar <ArrowRight size={16}/>
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-8 animate-fade-in">
                            <CensusRegister currentStep={2} formData={userData} setFormData={setUserData} />
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Celular / WhatsApp</label>
                                    <input className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-5 font-bold" value={userData.phone || ''} onChange={e => setUserData({...userData, phone: e.target.value})} placeholder="(00) 00000-0000" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail</label>
                                    <input className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-5 font-bold" value={userData.email || ''} onChange={e => setUserData({...userData, email: e.target.value})} type="email" />
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Unidade / Grupo</label>
                                    <input 
                                        className="w-full h-14 bg-slate-100 border-2 border-slate-100 text-slate-500 rounded-xl px-5 font-black uppercase cursor-not-allowed" 
                                        value={userData.unit || ''} 
                                        readOnly
                                        placeholder="UNIDADE BLOQUEADA"
                                    />
                                    <p className="text-[8px] text-slate-400 font-bold uppercase ml-1">Vínculo Automático: {systemInfo?.shortName}</p>
                                </div>
                            </div>

                            <button onClick={() => setStep(3)} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-700 transition-all mt-8">
                                Próxima Etapa
                            </button>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="space-y-6">
                                {(survey?.questions || []).map((q: any, idx: number) => (
                                    <div key={idx} className="space-y-3">
                                        <label className="text-sm font-black text-slate-800 uppercase block">{q.text}</label>
                                        {q.type === 'text' && (
                                            <input className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-5 text-sm" value={answers[q.id] || ''} onChange={e => setAnswers({...answers, [q.id]: e.target.value})} />
                                        )}
                                        {q.type === 'select' && (
                                            <select className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-5 text-sm" value={answers[q.id] || ''} onChange={e => setAnswers({...answers, [q.id]: e.target.value})}>
                                                <option value="">Selecione...</option>
                                                {q.options?.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                                            </select>
                                        )}
                                        {q.type === 'boolean' && (
                                            <div className="flex gap-4">
                                                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
                                                    <input type="radio" name={q.id} value="SIM" checked={answers[q.id] === 'SIM'} onChange={() => setAnswers({...answers, [q.id]: 'SIM'})} className="accent-indigo-600"/>
                                                    <span className="text-xs font-bold uppercase">Sim</span>
                                                </label>
                                                <label className="flex items-center gap-2 cursor-pointer bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
                                                    <input type="radio" name={q.id} value="NAO" checked={answers[q.id] === 'NAO'} onChange={() => setAnswers({...answers, [q.id]: 'NAO'})} className="accent-indigo-600"/>
                                                    <span className="text-xs font-bold uppercase">Não</span>
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => setStep(4)} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-700 transition-all mt-8">
                                Revisar Dados
                            </button>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-8 animate-fade-in">
                            <div className="space-y-8">
                                <div className="flex items-center gap-4 px-2 border-l-4 border-slate-900 pl-4">
                                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em]">{SYSTEM_TEXTS.TITLE_GOVERNANCE}</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{SYSTEM_TEXTS.LBL_ROLE}</label>
                                        <select disabled className="w-full h-14 bg-slate-100 border-2 border-slate-100 rounded-2xl px-5 text-[10px] font-black uppercase appearance-none opacity-60 cursor-not-allowed" value="RESIDENT">
                                            <option value="RESIDENT">Morador / Associado</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{SYSTEM_TEXTS.LBL_ACCOUNT_STATUS}</label>
                                        <select disabled className="w-full h-14 bg-slate-100 border-2 border-slate-100 rounded-2xl px-5 text-[10px] font-black uppercase appearance-none opacity-60" value={userData.status}>
                                            <option value="ACTIVE">{SYSTEM_TEXTS.LBL_ACTIVE_ONLINE}</option>
                                            <option value="PENDING">{SYSTEM_TEXTS.LBL_PENDING}</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5 md:col-span-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{SYSTEM_TEXTS.LBL_NEW_PASSWORD}</label>
                                        <div className="relative">
                                            <Key className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                            <input type="password" className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 text-sm focus:bg-white focus:border-indigo-500 outline-none transition-all" value={userData.password} onChange={e => setUserData({ ...userData, password: e.target.value })} placeholder="••••••••" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button onClick={handleSubmit} className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-emerald-700 transition-all shadow-xl active:scale-95 mt-10">
                                Finalizar Cadastro
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PublicSenso;
