import express from 'express';
import * as planController from '../controllers/planController.js';
import { authenticateToken, checkPermission } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', authenticateToken, planController.getAllPlans);
router.post('/', authenticateToken, checkPermission('manage_finances'), planController.createPlan);
router.put('/:id', authenticateToken, checkPermission('manage_finances'), planController.updatePlan);
router.delete('/:id', authenticateToken, checkPermission('manage_finances'), planController.deletePlan);

router.get('/subscriptions/all', authenticateToken, checkPermission('manage_finances'), planController.getSubscriptions);
router.get('/my-subscription', authenticateToken, planController.getMySubscription);
router.get('/user/:id', authenticateToken, checkPermission('manage_finances'), planController.getUserSubscription);
router.post('/subscribe', authenticateToken, checkPermission('manage_finances'), planController.subscribeUser);

export default router;
