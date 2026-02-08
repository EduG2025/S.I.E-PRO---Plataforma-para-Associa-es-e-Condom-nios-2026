
import express from 'express';
import * as commController from '../controllers/communicationController.js';
import { createHandlers } from '../controllers/genericController.js';
import { authenticateToken, checkPermission } from '../middlewares/auth.js';

const router = express.Router();

// Handlers genéricos para redundância
const noticeHandlers = createHandlers('notices');

router.get('/notices', authenticateToken, checkPermission('view_dashboard'), noticeHandlers.getAll);
router.post('/notices', authenticateToken, checkPermission('manage_communication'), noticeHandlers.create);
router.put('/notices/:id', authenticateToken, checkPermission('manage_communication'), noticeHandlers.update);
router.delete('/notices/:id', authenticateToken, checkPermission('manage_communication'), noticeHandlers.delete);

// Template Engine
router.get('/templates', authenticateToken, checkPermission('manage_communication'), commController.getTemplates);
router.post('/templates', authenticateToken, checkPermission('manage_communication'), commController.saveTemplate);
router.delete('/templates/:id', authenticateToken, checkPermission('manage_communication'), commController.deleteTemplate);

// WhatsApp Engine
router.post('/whatsapp-broadcast', authenticateToken, checkPermission('manage_communication'), commController.whatsappBroadcast);
router.post('/survey-broadcast', authenticateToken, checkPermission('manage_communication'), commController.surveyBroadcast);
router.post('/whatsapp-webhook', commController.receiveWebhook);

// Scheduler
router.get('/schedules', authenticateToken, checkPermission('manage_communication'), commController.getSchedules);
router.post('/schedules', authenticateToken, checkPermission('manage_communication'), commController.createSchedule);
router.delete('/schedules/:id', authenticateToken, checkPermission('manage_communication'), commController.deleteSchedule);

// CRM Automation
router.get('/rules', authenticateToken, checkPermission('manage_communication'), commController.getRules);
router.post('/rules', authenticateToken, checkPermission('manage_communication'), commController.createRule);
router.delete('/rules/:id', authenticateToken, checkPermission('manage_communication'), commController.deleteRule);

router.get('/campaigns', authenticateToken, checkPermission('manage_communication'), commController.getCampaigns);
router.post('/campaigns/execute', authenticateToken, checkPermission('manage_communication'), commController.executeCampaign);

export default router;
