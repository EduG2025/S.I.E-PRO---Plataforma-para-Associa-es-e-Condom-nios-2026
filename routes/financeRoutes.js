import express from 'express';
import * as finController from '../controllers/financeController.js';
import { createHandlers } from '../controllers/genericController.js';
import { authenticateToken, checkPermission } from '../middlewares/auth.js';

const router = express.Router();

/**
 * MOTOR GENÉRICO (CRUD ADMIN)
 * Gerencia a tabela 'financials' para operações diretas.
 */
const generic = createHandlers('financials');

// --- 1. VISUALIZAÇÃO E BI (ADMIN/TESOURARIA) ---

// Listagem global de lançamentos
router.get('/', 
    authenticateToken, 
    checkPermission('view_finances'), 
    generic.getAll
);

// Estatísticas de Fluxo de Caixa e Inadimplência
router.get('/stats', 
    authenticateToken, 
    checkPermission('view_finances'), 
    finController.getStats
);

// --- 2. ÁREA DO MORADOR (AUTOCONSULTA) ---

// Rota para o morador logado ver apenas as suas próprias contas/boletos
// Nota: Não precisa de checkPermission de admin, apenas de estar logado.
router.get('/my-invoices', 
    authenticateToken, 
    finController.getMyInvoices
);

// --- 3. GESTÃO FINANCEIRA (CUD - ESCRITA) ---

// Criar novo lançamento (Taxas, Multas, Acordos)
router.post('/', 
    authenticateToken, 
    checkPermission('manage_finances'), 
    generic.create
);

// Atualizar lançamento ou baixar pagamento
router.put('/:id', 
    authenticateToken, 
    checkPermission('manage_finances'), 
    generic.update
);

// Estornar/Deletar (Altamente restrito)
router.delete('/:id', 
    authenticateToken, 
    checkPermission('manage_finances'), 
    generic.delete
);

// --- 4. COMPLIANCE E RELATÓRIOS ---

// Geração de relatórios PDF/Excel para prestação de contas
router.get('/reports', 
    authenticateToken, 
    checkPermission('manage_settings'), 
    finController.getReports
);

// Log de exportação (Trilha de Auditoria para dados sensíveis)
router.post('/reports/log', 
    authenticateToken, 
    checkPermission('manage_settings'), 
    finController.logReportExport
);

export default router;