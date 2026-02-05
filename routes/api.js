
import express from 'express';
import pool from '../config/database.js';
import { authenticateToken, checkPermission } from '../middlewares/auth.js';
import { licenseGuard } from '../middlewares/licenseGuard.js';

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
 * S.I.E PRO KERNEL ROUTER - V45.0 (PLATAFORMA COMPLETA)
 */

router.use(licenseGuard);

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

// --- NTP TIME SYNC (SRE CLOCK) ---
router.get('/time', (req, res) => {
    res.json({ 
        serverTime: Date.now(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });
});

router.get('/public/system-info', async (req, res) => {
    try {
        // SRE SYNC: Seleção explícita de colunas baseada no schema 'siecacaria'.`settings`
        const [[s]] = await pool.query(`
            SELECT 
                id, name, shortName, cnpj, email, phone, website, 
                primaryColor, logoUrl, registrationMode, 
                cep, street, number, complement, neighborhood, city, state, coordinates,
                president_name, president_cpf, management_start, management_end, president_signature,
                whatsapp_config, module_metadata, license_status 
            FROM settings WHERE id=1
        `);
        
        if (!s) return res.status(404).json({ error: 'KERNEL_NOT_INITIALIZED' });

        const jsonFields = ['whatsapp_config', 'module_metadata', 'coordinates'];
        jsonFields.forEach(f => {
            if (s[f] && typeof s[f] === 'string') {
                try { s[f] = JSON.parse(s[f]); } catch (e) { s[f] = {}; }
            }
        });

        res.json(s);
    } catch (e) { 
        console.error("Kernel Read Error:", e);
        res.status(500).json({ error: 'FALHA_AO_LER_KERNEL' }); 
    }
});

export default router;
