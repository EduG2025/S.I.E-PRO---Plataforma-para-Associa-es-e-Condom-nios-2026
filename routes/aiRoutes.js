
import express from 'express';
import * as aiController from '../controllers/aiController.js';
import { authenticateToken, requireAdmin } from '../middlewares/auth.js';
import pool from '../config/database.js';

const router = express.Router();

router.post('/chat', authenticateToken, aiController.chat);
router.post('/generate-document', authenticateToken, aiController.generateDocument);
router.post('/ocr', authenticateToken, aiController.ocr);
router.post('/dossier/:id', authenticateToken, requireAdmin, aiController.generateDossier);

// SRE VISION ENDPOINTS
router.post('/vision-lpr', authenticateToken, aiController.visionLPR);
router.post('/analyze-perimeter', authenticateToken, aiController.analyzePerimeter);

router.post('/bulk-wiki-ingestion', authenticateToken, requireAdmin, aiController.bulkWikiIngestion);
router.post('/generate-system-manuals', authenticateToken, requireAdmin, aiController.generateSystemManuals);

router.get('/prompts', authenticateToken, async (req, res) => {
    try {
        const { role } = req.user;
        let query = `SELECT id, title, content, category, role_restriction, is_favorite, updated_at FROM ai_prompts `;
        let params = [];
        if (role !== 'ADMIN') {
            query += ` WHERE role_restriction = 'ALL' OR role_restriction = ? `;
            params.push(role);
        }
        query += ` ORDER BY is_favorite DESC, title ASC `;
        const [rows] = await pool.query(query, params);
        res.json({ data: rows });
    } catch (error) { res.status(500).json({ error: 'FALHA_AO_SINCRONIZAR_BIBLIOTECA' }); }
});

router.post('/prompts', authenticateToken, requireAdmin, async (req, res) => {
    const { title, content, category, is_favorite, role_restriction } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO ai_prompts (title, content, category, is_favorite, role_restriction) VALUES (?, ?, ?, ?, ?)',
            [title, content, category || 'GERAL', is_favorite ? 1 : 0, role_restriction || 'ALL']
        );
        res.status(201).json({ data: { id: result.insertId } });
    } catch (error) { res.status(500).json({ error: 'Erro ao persistir prompt.' }); }
});

router.delete('/prompts/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        await pool.query('DELETE FROM ai_prompts WHERE id = ?', [req.params.id]);
        res.json({ message: 'Prompt expurgado.' });
    } catch (error) { res.status(500).json({ error: 'Erro ao excluir prompt.' }); }
});

export default router;
