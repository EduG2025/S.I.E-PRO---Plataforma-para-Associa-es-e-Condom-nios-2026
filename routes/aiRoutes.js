import express from 'express';
import * as aiController from '../controllers/aiController.js';
import { authenticateToken, requireAdmin } from '../middlewares/auth.js';
import pool from '../config/database.js';

const router = express.Router();

router.post('/chat', authenticateToken, aiController.chat);
router.post('/generate-document', authenticateToken, aiController.generateDocument);
router.post('/ocr', authenticateToken, aiController.ocr);
router.post('/dossier/:id', authenticateToken, requireAdmin, aiController.generateDossier);
router.post('/tts', authenticateToken, aiController.textToSpeech);

// Wiki & Auto-Doc
router.post('/bulk-wiki-ingestion', authenticateToken, requireAdmin, aiController.bulkWikiIngestion);
router.post('/generate-system-manuals', authenticateToken, requireAdmin, aiController.generateSystemManuals);

router.get('/prompts', authenticateToken, async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM ai_prompts ORDER BY is_favorite DESC, title ASC');
        res.json({ data: rows });
    } catch (error) {
        res.json({ data: [] });
    }
});

router.post('/prompts', authenticateToken, async (req, res) => {
    const { title, content, category, is_favorite } = req.body;
    try {
        const [result] = await pool.query(
            'INSERT INTO ai_prompts (title, content, category, is_favorite) VALUES (?, ?, ?, ?)',
            [title, content, category || 'GERAL', is_favorite ? 1 : 0]
        );
        res.status(201).json({ data: { id: result.insertId }, message: 'Prompt salvo!' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao salvar prompt.' });
    }
});

router.delete('/prompts/:id', authenticateToken, async (req, res) => {
    try {
        await pool.query('DELETE FROM ai_prompts WHERE id = ?', [req.params.id]);
        res.json({ message: 'Prompt excluído.' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao excluir prompt.' });
    }
});

export default router;