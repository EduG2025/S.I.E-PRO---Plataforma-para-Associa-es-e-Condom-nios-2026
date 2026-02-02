
import React from 'react';

interface CensusRegisterProps {
    currentStep: number;
    formData: any;
    setFormData: (data: any) => void;
}

const formatDateMask = (value: string) => {
    return value
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '$1/$2')
        .replace(/(\d{2})(\d)/, '$1/$2')
        .replace(/(\d{4})\d+?$/, '$1');
};

const CensusRegister = ({ currentStep, formData, setFormData }: CensusRegisterProps) => {
    if (currentStep !== 2) return null;

    return (
        <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-8 py-10">
            <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                <input 
                    required 
                    className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-lg font-black uppercase outline-none focus:border-indigo-500 transition-all" 
                    value={formData.name || ''} 
                    onChange={e => setFormData({ ...formData, name: e.target.value })} 
                />
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data Nascimento</label>
                <input 
                    className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 font-black" 
                    value={formData.birth_date || ''} 
                    onChange={e => setFormData({ ...formData, birth_date: formatDateMask(e.target.value) })} 
                    placeholder="DD/MM/AAAA" 
                    maxLength={10} 
                />
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gênero</label>
                <select 
                    className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 font-black uppercase outline-none focus:border-indigo-500 transition-all" 
                    value={formData.gender || ''} 
                    onChange={e => setFormData({ ...formData, gender: e.target.value })}
                >
                    <option value="">Selecione...</option>
                    <option value="MALE">Masculino</option>
                    <option value="FEMALE">Feminino</option>
                    <option value="OTHER">Outro</option>
                    <option value="PREFER_NOT_TO_SAY">Prefiro não informar</option>
                </select>
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">RG</label>
                <input 
                    className="w-full h-16 bg-slate-50 border border-slate-200 rounded-2xl px-6 font-black uppercase" 
                    value={formData.rg || ''} 
                    onChange={e => setFormData({ ...formData, rg: e.target.value })} 
                />
            </div>
        </div>
    );
};

export default CensusRegister;
