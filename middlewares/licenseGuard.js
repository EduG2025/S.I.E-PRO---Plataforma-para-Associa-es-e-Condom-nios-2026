
import pool from '../config/database.js';

/**
 * SRE LICENSE GUARD V1.0
 * Bloqueia o acesso ao sistema se o status da licença for SUSPENDED.
 */
export const licenseGuard = async (req, res, next) => {
    const whitelist = [
        '/auth/login', 
        '/auth/me', 
        '/public/system-info',
        '/settings/toggle-license',
        '/time'
    ];

    if (whitelist.some(path => req.path.includes(path))) {
        return next();
    }

    try {
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
        res.status(500).json({ error: 'LICENSE_VERIFICATION_FAILED' });
    }
};
