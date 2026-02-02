
import { userService } from './api';
import { User, UserRole, UserStatus } from '../types';
import { normalizeCPF, validateCPF } from '../utils/cpf';

/**
 * SRE Utils: Cálculo de idade cronológica
 */
const calculateAge = (dob: string | undefined): number | undefined => {
    if (!dob) return undefined;
    const birth = new Date(dob);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
    return age;
};

export const SensoResidentLinker = {
    /**
     * Resolve o destino de uma submissão de Senso.
     * Fluxo 1: Vincula ao morador existente.
     * Fluxo 2: Cria novo cadastro se CPF não existir.
     */
    async linkOrRegister(cpf: string, data: any): Promise<{ resident: User; action: 'LINKED' | 'CREATED' | 'ERROR' }> {
        const cleanCPF = normalizeCPF(cpf);
        
        if (!validateCPF(cleanCPF)) {
            throw new Error("CPF_INVALID_PROTOCOL");
        }

        try {
            const allUsers = await userService.getAll();
            const found = allUsers.data.data.find((u: User) => normalizeCPF(u.cpf_cnpj || '') === cleanCPF);
            
            // SRE: Idade calculada para persistência
            const age = calculateAge(data.birthDate);

            if (found) {
                // FLUXO 1: ATUALIZAÇÃO SOBERANA
                const updates: any = { 
                    socialData: { ...found.socialData, ...data.socialData },
                    age: age
                };
                
                // Mapeia campos do senso para o core do usuário
                if (data.name) updates.name = data.name;
                if (data.email) updates.email = data.email;
                if (data.phone) updates.phone = data.phone;
                if (data.unit) updates.unit = data.unit;

                const res = await userService.update(found.id, updates);
                console.log(`[SRE] EVENT: RESIDENT_LINKED | CPF: ${cleanCPF}`);
                return { resident: res.data, action: 'LINKED' };
            } else {
                // FLUXO 2: AUTO-REGISTRO INTELIGENTE
                const newUser: Partial<User> = {
                    name: data.name || "NOVO MORADOR (VIA SENSO)",
                    cpf_cnpj: cleanCPF,
                    email: data.email,
                    unit: data.unit,
                    age: age,
                    role: UserRole.RESIDENT,
                    status: 'PENDING' as UserStatus,
                    active: true,
                    socialData: data.socialData
                };

                const res = await userService.create(newUser);
                console.log(`[SRE] EVENT: RESIDENT_CREATED | CPF: ${cleanCPF}`);
                return { resident: res.data, action: 'CREATED' };
            }
        } catch (error) {
            console.error(`[SRE] EVENT: CPF_CONFLICT_DETECTED | CPF: ${cleanCPF}`, error);
            return { resident: {} as User, action: 'ERROR' };
        }
    }
};
