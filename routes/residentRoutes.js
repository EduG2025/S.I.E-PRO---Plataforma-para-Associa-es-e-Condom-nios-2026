import express from 'express';
import * as resController from '../controllers/residentController.js';
import { authenticateToken, checkPermission } from '../middlewares/auth.js';

const router = express.Router();

// 1. Dashboard (Avisos, Reservas, Finanças, Pesquisas Ativas)
router.get('/dashboard', authenticateToken, checkPermission('view_dashboard'), resController.getDashboard);

// 2. Perfil e Identidade (LGPD)
router.get('/me', authenticateToken, resController.getOwnProfile);
router.put('/me', authenticateToken, resController.updateOwnProfile);

// 3. Unidade Habitação (Dependentes e Veículos)
router.get('/unit', authenticateToken, resController.getUnitData);

// 4. Financeiro Pessoal
router.get('/financials', authenticateToken, resController.getMyFinancials);

// 5. Ouvidoria e Incidentes
router.post('/report-incident', authenticateToken, resController.reportIncident);

// 6. Histórico de Acesso
router.get('/access-logs', authenticateToken, resController.getMyAccessLogs);

export default router;