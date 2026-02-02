import React, { useState, ChangeEvent, FormEvent } from 'react';
import { censusService } from '../services/api';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

interface SocioProfileProps {
    registryId?: number;
}

// Interface para organizar os dados do formulário
interface FormData {
    income: string;
    education: string;
    household: number;
    employment: string;
    benefits: boolean;
    additional: string;
}

const SocioProfile = ({ registryId }: SocioProfileProps) => {
    const initialState: FormData = {
        income: '',
        education: '',
        household: 1,
        employment: '',
        benefits: false,
        additional: ''
    };

    const [formData, setFormData] = useState<FormData>(initialState);
    const [isLoading, setIsLoading] = useState(false);
    const [profileId, setProfileId] = useState<number | null>(null);
    const [error, setError] = useState('');

    // Função única para lidar com mudanças em qualquer input
    const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        
        setFormData(prev => ({
            ...prev,
            [name]: val
        }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!registryId) {
            setError('ID de registro não encontrado.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            const payload = {
                income_range: formData.income,
                education_level: formData.education,
                household_size: Number(formData.household),
                employment_status: formData.employment,
                social_benefits: formData.benefits,
                additional: { notes: formData.additional }
            };

            const res = await censusService.createProfile(registryId, payload);
            setProfileId(res.data.profileId || null);
        } catch (err: any) {
            setError(err?.response?.data?.error || 'Erro ao processar perfil socioeconômico.');
        } finally {
            setIsLoading(false);
        }
    };

    if (profileId) return (
        <div className="p-8 bg-white rounded-lg shadow-sm border border-emerald-100 text-center animate-in fade-in zoom-in duration-300">
            <CheckCircle2 size={48} className="text-emerald-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800">Perfil criado com sucesso!</h3>
            <p className="text-slate-500">ID do Perfil: <span className="font-mono font-bold text-indigo-600">{profileId}</span></p>
        </div>
    );

    return (
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow-md border border-slate-100">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Perfil Socioeconômico</h2>

            {error && (
                <div className="flex items-center gap-2 p-3 text-sm text-rose-600 bg-rose-50 rounded border border-rose-100">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Renda Mensal</label>
                    <select 
                        name="income" 
                        value={formData.income} 
                        onChange={handleChange} 
                        className="w-full p-2.5 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        required
                    >
                        <option value="">Selecione...</option>
                        <option value="Ate 1 SM">Até 1 Salário Mínimo</option>
                        <option value="1-3 SM">1 a 3 Salários Mínimos</option>
                        <option value="Mais de 3 SM">Mais de 3 Salários Mínimos</option>
                    </select>
                </div>

                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Escolaridade</label>
                    <select 
                        name="education" 
                        value={formData.education} 
                        onChange={handleChange} 
                        className="w-full p-2.5 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        required
                    >
                        <option value="">Selecione...</option>
                        <option value="Fundamental">Ensino Fundamental</option>
                        <option value="Medio">Ensino Médio</option>
                        <option value="Superior">Ensino Superior</option>
                    </select>
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Membros da Família</label>
                <input 
                    name="household"
                    type="number" 
                    min={1} 
                    value={formData.household} 
                    onChange={handleChange} 
                    className="w-full p-2.5 border rounded-md" 
                />
            </div>

            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-md">
                <input 
                    id="benefits"
                    name="benefits"
                    type="checkbox" 
                    checked={formData.benefits} 
                    onChange={handleChange}
                    className="w-4 h-4 text-indigo-600 rounded"
                />
                <label htmlFor="benefits" className="text-sm font-medium text-slate-700 cursor-pointer">
                    Recebe algum benefício social? (Bolsa Família, etc)
                </label>
            </div>

            <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Observações Adicionais</label>
                <textarea 
                    name="additional"
                    placeholder="Alguma informação relevante..." 
                    value={formData.additional} 
                    onChange={handleChange} 
                    className="w-full p-2.5 border rounded-md min-h-[100px]" 
                />
            </div>

            <button 
                type="submit" 
                disabled={isLoading} 
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-semibold rounded-md transition-colors flex justify-center items-center gap-2"
            >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Salvar Perfil'}
            </button>
        </form>
    );
};

export default SocioProfile;