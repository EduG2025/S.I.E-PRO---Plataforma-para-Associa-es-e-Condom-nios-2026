
import express from 'express';
import * as govController from '../controllers/governanceController.js';
import { authenticateToken, checkPermission } from '../middlewares/auth.js';
import { createHandlers } from '../controllers/genericController.js';
import pool from '../config/database.js';

const router = express.Router();

const promptHandlers = createHandlers('ai_prompts');
const visualHandlers = createHandlers('visual_templates');

router.get('/assemblies', authenticateToken, govController.getAssemblies); 
router.post('/assemblies', authenticateToken, checkPermission('manage_assemblies'), govController.createAssembly);
router.put('/assemblies/:id', authenticateToken, checkPermission('manage_assemblies'), govController.updateAssembly);
router.delete('/assemblies/:id', authenticateToken, checkPermission('manage_assemblies'), govController.deleteAssembly);

router.get('/documents', authenticateToken, checkPermission('view_documents'), govController.getDocuments);
router.get('/documents/:id/history', authenticateToken, checkPermission('view_documents'), govController.getDocumentHistory);
router.post('/documents', authenticateToken, checkPermission('manage_documents'), govController.saveDocument);
router.put('/documents/:id', authenticateToken, checkPermission('manage_documents'), govController.saveDocument);
router.delete('/documents/:id', authenticateToken, checkPermission('manage_documents'), govController.deleteDocument);

router.get('/visual-templates', authenticateToken, checkPermission('view_documents'), async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM visual_templates ORDER BY is_default DESC, name ASC");
        res.json({ data: rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/visual-templates', authenticateToken, checkPermission('manage_documents'), visualHandlers.create);
router.put('/visual-templates/:id', authenticateToken, checkPermission('manage_documents'), visualHandlers.update);
router.delete('/visual-templates/:id', authenticateToken, checkPermission('manage_documents'), visualHandlers.delete);

router.get('/prompts', authenticateToken, promptHandlers.getAll);
router.post('/prompts', authenticateToken, checkPermission('manage_settings'), promptHandlers.create);
router.put('/prompts/:id', authenticateToken, checkPermission('manage_settings'), promptHandlers.update);
router.delete('/prompts/:id', authenticateToken, checkPermission('manage_settings'), promptHandlers.delete);

// --- ID CARD TEMPLATES ROUTES ---
router.get('/id-templates', authenticateToken, checkPermission('manage_settings'), govController.getIdTemplates);
router.post('/id-templates', authenticateToken, checkPermission('manage_settings'), govController.saveIdTemplate);
router.delete('/id-templates/:id', authenticateToken, checkPermission('manage_settings'), govController.deleteIdTemplate);
router.post('/id-templates/:id/activate', authenticateToken, checkPermission('manage_settings'), govController.activateIdTemplate);

export default router;
