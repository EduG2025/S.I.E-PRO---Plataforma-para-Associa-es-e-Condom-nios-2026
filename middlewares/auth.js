import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'sie_kernel_production_master_2025';

/**
 * SRE JWT Auth Guard
 */
export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'TOKEN_REQUIRED' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'INVALID_TOKEN' });
        req.user = user;
        next();
    });
};

/**
 * SRE Master Admin Guard
 */
export const requireAdmin = (req, res, next) => {
    if (req.user && (req.user.role === 'ADMIN' || req.user.virtual)) {
        return next();
    }
    res.status(403).json({ error: 'ADMIN_REQUIRED' });
};

/**
 * SRE Granular Permission Guard (RBAC Engine V2.0)
 * Valida se o cargo do usuário possui a permissão requerida ou o wildcard '*' no banco de dados.
 */
export const checkPermission = (permissionId) => {
    return async (req, res, next) => {
        if (!req.user) return res.status(401).json({ error: 'UNAUTHORIZED' });

        // Root Bypass para administradores virtuais ou cargo master ADMIN
        if (req.user.virtual || req.user.role === 'ADMIN') return next();

        try {
            // Busca permissão específica ou permissão total (*) para o cargo
            const [rows] = await pool.query(
                'SELECT 1 FROM role_permissions WHERE role = ? AND (permission_id = ? OR permission_id = "*")',
                [req.user.role, permissionId]
            );

            if (rows.length > 0) return next();

            // Auditoria SRE: Log de tentativa de acesso não autorizado
            console.warn(`[SRE AUTH BREACH ATTEMPT] User ${req.user.id} (Role: ${req.user.role}) denied access to ${permissionId} on ${req.originalUrl}`);

            res.status(403).json({
                error: 'PERMISSION_DENIED',
                required: permissionId,
                current_role: req.user.role,
                protocol: 'SRE_SHIELD_ACTIVE'
            });
        } catch (e) {
            console.error("[SRE AUTH CRITICAL] Database failure during permission sync:", e.message);
            res.status(500).json({ error: 'AUTH_LEDGER_FAILURE' });
        }
    };
};