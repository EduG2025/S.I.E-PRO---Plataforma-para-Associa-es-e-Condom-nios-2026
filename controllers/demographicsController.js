
import pool from '../config/database.js';

/**
 * S.I.E PRO - DEMOGRAPHICS ENGINE
 * Agregação de métricas populacionais e operacionais para o Dashboard.
 */
export const getStats = async (req, res) => {
    try {
        // Execução paralela para performance (SRE Tuning)
        const [usersTotal] = await pool.query("SELECT COUNT(*) as count FROM users WHERE active = 1");
        const [usersPending] = await pool.query("SELECT COUNT(*) as count FROM users WHERE status = 'PENDING'");
        const [incidentsOpen] = await pool.query("SELECT COUNT(*) as count FROM incidents WHERE status = 'OPEN' OR status = 'IN_PROGRESS'");
        const [decisionsOpen] = await pool.query("SELECT COUNT(*) as count FROM decisions WHERE status = 'OPEN' AND due_date > NOW()");
        
        res.json({
            totalPopulation: usersTotal[0].count,
            pending: usersPending[0].count,
            openIncidents: incidentsOpen[0].count,
            activeDecisions: decisionsOpen[0].count
        });
    } catch (e) {
        console.error("[SRE DEMOGRAPHICS FAIL]", e);
        res.status(500).json({ error: "METRICS_UNAVAILABLE" });
    }
};
