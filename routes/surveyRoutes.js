import express from 'express';
import { 
    getAllSurveys, 
    getAllResponses, 
    getResponses, 
    getResponsesByCpf, 
    suggestQuestions, 
    checkResident, 
    getPublicSurvey, 
    submitResponse,
    generateAISummary
} from '../controllers/surveyController.js';
import { createHandlers } from '../controllers/genericController.js';
import { authenticateToken, checkPermission } from '../middlewares/auth.js';

const router = express.Router();
const generic = createHandlers('surveys');

// =========================================================================
// 1. ADMIN FLOW (Protegido por Permissões)
// =========================================================================

// Listagem de Protocolos de Pesquisa
router.get('/', authenticateToken, checkPermission('manage_surveys'), getAllSurveys);

// CRUD de Protocolos (Generic Engine)
router.post('/', authenticateToken, checkPermission('manage_surveys'), generic.create);
router.put('/:id', authenticateToken, checkPermission('manage_surveys'), generic.update);
router.delete('/:id', authenticateToken, checkPermission('manage_surveys'), generic.delete);

// Auditoria de Respostas e Inteligência Territorial
router.get('/responses/all', authenticateToken, checkPermission('manage_surveys'), getAllResponses);
router.get('/:id/responses', authenticateToken, checkPermission('manage_surveys'), getResponses);
router.get('/responses/cpf/:cpf', authenticateToken, checkPermission('manage_surveys'), getResponsesByCpf);

// Arquiteto Neural e Diagnóstico de IA
router.post('/suggest', authenticateToken, checkPermission('manage_surveys'), suggestQuestions);
router.post('/public/ai-summary', authenticateToken, generateAISummary);

// =========================================================================
// 2. PUBLIC FLOW (Bypass de Autenticação para Censo por Link)
// =========================================================================

// Handshake de Identidade Civil (Bypass Protocol)
router.get('/public/check-resident/:cpf', checkResident);

// Recuperação de Estrutura de Formulário
router.get('/public/:id', getPublicSurvey);

// Submissão de Snapshot Social
router.post('/public/:surveyId/submit', submitResponse);

export default router;
