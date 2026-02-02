import express from 'express';
import * as commController from '../controllers/communicationController.js';
import { createHandlers } from '../controllers/genericController.js';
import { authenticateToken, checkPermission } from '../middlewares/auth.js';

const router = express.Router();

/**
 * MURAL DE AVISOS (NOTICES)
 * Utiliza o Motor Genérico para CRUD rápido.
 */
const noticeHandlers = createHandlers('notices');

// Visualização (Membros/Geral)
router.get('/notices', 
    authenticateToken, 
    checkPermission('view_dashboard'), 
    noticeHandlers.getAll
);

// Gestão de Avisos (Admin/Comunicação)
router.post('/notices', 
    authenticateToken, 
    checkPermission('manage_communication'), 
    noticeHandlers.create
);

router.put('/notices/:id', 
    authenticateToken, 
    checkPermission('manage_communication'), 
    noticeHandlers.update
);

router.delete('/notices/:id', 
    authenticateToken, 
    checkPermission('manage_communication'), 
    noticeHandlers.delete
);

/**
 * MESSAGE TEMPLATES
 * Gestão de modelos para automação de mensagens (Boas-vindas, Censo, etc)
 */
router.get('/templates', 
    authenticateToken, 
    checkPermission('manage_communication'), 
    commController.getTemplates
);

router.post('/templates', 
    authenticateToken, 
    checkPermission('manage_communication'), 
    commController.saveTemplate
);

router.delete('/templates/:id', 
    authenticateToken, 
    checkPermission('manage_communication'), 
    commController.deleteTemplate
);

/**
 * WHATSAPP ENGINE (BROADCAST & WEBHOOK)
 */

// Disparo em massa (Protegido por permissão de gestão)
router.post('/whatsapp-broadcast', 
    authenticateToken, 
    checkPermission('manage_communication'), 
    commController.whatsappBroadcast
);

// Disparo de Pesquisas (Novo endpoint do Passo 2)
router.post('/survey-broadcast', 
    authenticateToken, 
    checkPermission('manage_communication'), 
    commController.surveyBroadcast
);

/**
 * WHATSAPP WEBHOOK (INBOUND)
 * Rota pública para integração com Gateway (JennyAI / Evolution API).
 * A segurança deve ser tratada via TOKEN no header dentro do controller.
 */
router.post('/whatsapp-webhook', 
    commController.receiveWebhook
);

/**
 * SRE SCHEDULER (MENSAGENS AGENDADAS)
 * Motor de CRON para disparos programados
 */
router.get('/schedules', 
    authenticateToken, 
    checkPermission('manage_communication'), 
    commController.getSchedules
);

router.post('/schedules', 
    authenticateToken, 
    checkPermission('manage_communication'), 
    commController.createSchedule
);

router.delete('/schedules/:id', 
    authenticateToken, 
    checkPermission('manage_communication'), 
    commController.deleteSchedule
);

export default router;