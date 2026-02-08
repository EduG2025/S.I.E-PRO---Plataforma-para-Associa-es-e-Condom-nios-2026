import express from 'express';
import * as demoController from '../controllers/demographicsController.js';
import { authenticateToken, checkPermission } from '../middlewares/auth.js';

const router = express.Router();

// Métricas agregadas para o Dashboard
router.get('/stats', authenticateToken, checkPermission('view_dashboard'), demoController.getStats);

export default router;
