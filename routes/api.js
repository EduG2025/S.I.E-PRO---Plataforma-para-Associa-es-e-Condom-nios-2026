import express from 'express';
import pool from '../config/database.js';
import { authenticateToken, checkPermission } from '../middlewares/auth.js';

// Domain Routers
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import aiRoutes from './aiRoutes.js';
import governanceRoutes from './governanceRoutes.js';
import communityRoutes from './communityRoutes.js';
import financeRoutes from './financeRoutes.js';
import surveyRoutes from './surveyRoutes.js';
import operationalRoutes from './operationalRoutes.js';
import conciergeRoutes from './conciergeRoutes.js';
import residentRoutes from './residentRoutes.js';
import communicationRoutes from './communicationRoutes.js';
import settingsRoutes from './settingsRoutes.js';
import storageRoutes from './storageRoutes.js';
import planRoutes from './planRoutes.js';

const router = express.Router();

/**
 * S.I.E PRO KERNEL ROUTER - V37.0
 */

router.use('/auth', authRoutes);
router.use('/settings', settingsRoutes);
router.use('/', operationalRoutes); 
router.use('/surveys', surveyRoutes);
router.use('/users', userRoutes);
router.use('/governance', governanceRoutes);
router.use('/financials', financeRoutes);
router.use('/plans', planRoutes);
router.use('/resident', residentRoutes);
router.use('/community', communityRoutes);
router.use('/communication', communicationRoutes);
router.use('/visitors', conciergeRoutes);
router.use('/deliveries', conciergeRoutes);
router.use('/storage', storageRoutes);
router.use('/ai', aiRoutes);

// --- ROTAS PÚBLICAS ---
router.get('/public/system-info', async (req, res) => {
    try {
        const [[s]] = await pool.query('SELECT name, shortName, logoUrl, primaryColor, whatsapp_config, cep, street, city, state, module_metadata FROM settings WHERE id=1');
        if (!s) return res.status(404).json({ error: 'KERNEL_NOT_INITIALIZED' });
        const jsonFields = ['whatsapp_config', 'module_metadata'];
        jsonFields.forEach(f => {
            if (s[f] && typeof s[f] === 'string') {
                try { s[f] = JSON.parse(s[f]); } catch(e) { s[f] = {}; }
            }
        });
        res.json(s);
    } catch (e) { res.status(500).json({ error: 'FALHA_AO_LER_KERNEL' }); }
});

router.get('/audit', authenticateToken, checkPermission('manage_settings'), async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT id, user_id, action, table_name, record_id, details, created_at FROM audit_logs ORDER BY id DESC LIMIT 100");
        res.json({ data: rows });
    } catch (e) { res.status(500).json({ error: "Erro ao buscar trilha de auditoria." }); }
});

router.post('/audit/log-export', authenticateToken, async (req, res) => {
    const { module, count, criteria } = req.body;
    try {
        await pool.query('INSERT INTO audit_logs (user_id, action, table_name, details) VALUES (?, "TACTICAL_EXPORT", ?, ?)',
            [req.user.id, module || 'DEMOGRAPHICS', `Exportados ${count} registros. Critérios: ${JSON.stringify(criteria)}`]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: "FALHA_AO_LOGAR_EXPORT" }); }
});

export default router;