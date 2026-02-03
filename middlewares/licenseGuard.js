
import pool from '../config/database.js';

/**
 * SRE LICENSE GUARD V1.0
 * Bloqueia o acesso ao sistema se o status da licença for SUSPENDED.
 * Permite apenas:
 * 1. Rotas de status público (para o frontend saber que está bloqueado)
 * 2. Rotas de Login (para que o Admin possa logar e desbloquear)
 * 3. Rota de desbloqueio
 */
export const licenseGuard = async (req, res, next) => {
    // Whitelist de rotas essenciais (Bypass de segurança)
    const whitelist = [
        '/auth/login', 
        '/auth/me', 
        '/public/system-info',
        '/settings/toggle-license', // Rota de desbloqueio
        '/time'
    ];

    // Se for uma rota permitida, passa direto
    if (whitelist.some(path => req.path.includes(path))) {
        return next();
    }

    try {
        // Cache simples em memória poderia ser usado aqui para performance,
        // mas para garantir "kill" imediato, consultamos o banco.
        // O custo é baixo pois é uma query PK single row.
        const [[settings]] = await pool.query('SELECT license_status FROM settings WHERE id = 1');
        
        if (settings && settings.license_status === 'SUSPENDED') {
            return res.status(402).json({ 
                error: 'PAYMENT_REQUIRED', 
                message: 'A licença de uso deste sistema está suspensa temporariamente. Entre em contato com o suporte.' 
            });
        }
        
        next();
    } catch (e) {
        console.error("[SRE LICENSE CHECK FAIL]", e);
        // Em caso de erro de DB, permite passar (Fail Open) ou bloqueia (Fail Closed)?
        // SRE Standard: Fail Closed para segurança financeira.
        res.status(500).json({ error: 'LICENSE_VERIFICATION_FAILED' });
    }
};
