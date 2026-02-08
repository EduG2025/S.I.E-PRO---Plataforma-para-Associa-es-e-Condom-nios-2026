
import express from 'express';
import * as collectiveController from '../controllers/collectiveController.js';
import { authenticateToken, checkPermission } from '../middlewares/auth.js';

const router = express.Router();

router.get('/decisions', authenticateToken, collectiveController.getDecisions);
router.post('/decisions', authenticateToken, checkPermission('manage_assemblies'), collectiveController.createDecision);
router.post('/decisions/:id/vote', authenticateToken, collectiveController.castVote);
router.get('/decisions/:id/results', authenticateToken, collectiveController.getDecisionResults);
router.delete('/decisions/:id', authenticateToken, checkPermission('manage_assemblies'), collectiveController.deleteDecision);

export default router;
