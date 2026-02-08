
import pool from '../config/database.js';
import { IAProviderManager } from '../core/ai/IAProviderManager.js';

/**
 * S.I.E COLLECTIVE INTELLIGENCE CONTROLLER - V2.0
 * Protocolo de Votação Soberana e Análise Preditiva
 */

export const getDecisions = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT d.*, 
            (SELECT COUNT(*) FROM votes WHERE decision_id = d.id) as total_votes,
            (SELECT choice FROM votes WHERE decision_id = d.id AND user_id = ?) as my_vote
            FROM decisions d ORDER BY created_at DESC
        `, [req.user.id]);
        res.json({ data: rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const createDecision = async (req, res) => {
    const { title, description, due_date } = req.body;
    try {
        // [SRE] NEURAL PROMPT V2.0 - Análise de Estabilidade
        const prompt = `
        ATUE COMO: Advisor Sênior de Governança Coletiva do S.I.E PRO.
        OBJETIVO: Realizar uma análise tática e imparcial da seguinte proposta de decisão associativa.
        
        PROPOSTA: "${title}"
        DETALHES: "${description}"
        
        REQUISITOS DE SAÍDA (HTML LIMPO):
        1. RESUMO EXECUTIVO (O que é a proposta em 2 frases).
        2. ANÁLISE DE IMPACTO (Técnico e Financeiro).
        3. PRÓS vs CONTRAS (Mínimo 3 de cada).
        4. SCORE DE ESTABILIDADE SOCIAL (De 0 a 100%, estimando a aceitação baseada em normas coletivas).
        
        Mantenha um tom técnico, soberano e preventivo.`;

        const aiRes = await IAProviderManager.execute('decision_analysis', {
            model: IAProviderManager.MODELS.INTELLIGENT,
            contents: prompt,
            config: { systemInstruction: "Consultor de Governança Coletiva S.I.E PRO. Foco em estabilidade social e transparência." }
        });

        const [result] = await pool.query(
            "INSERT INTO decisions (title, description, ai_analysis, due_date) VALUES (?, ?, ?, ?)",
            [title, description, aiRes.text, due_date]
        );

        res.json({ id: result.insertId, success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const castVote = async (req, res) => {
    const { choice } = req.body;
    const decisionId = req.params.id;
    const userId = req.user.id;

    try {
        const [[decision]] = await pool.query("SELECT status, due_date FROM decisions WHERE id = ?", [decisionId]);
        if (!decision || decision.status !== 'OPEN' || new Date(decision.due_date) < new Date()) {
            return res.status(400).json({ error: "VOTACAO_ENCERRADA" });
        }

        await pool.query(
            "INSERT INTO votes (decision_id, user_id, choice) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE choice = VALUES(choice)",
            [decisionId, userId, choice]
        );
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const getDecisionResults = async (req, res) => {
    try {
        const [rows] = await pool.query(
            "SELECT choice, COUNT(*) as count FROM votes WHERE decision_id = ? GROUP BY choice",
            [req.params.id]
        );
        res.json({ data: rows });
    } catch (e) { res.status(500).json({ error: e.message }); }
};

export const deleteDecision = async (req, res) => {
    try {
        await pool.query("DELETE FROM decisions WHERE id = ?", [req.params.id]);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};
