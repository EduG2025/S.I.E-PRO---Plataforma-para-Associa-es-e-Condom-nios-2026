
import express from 'express';
import { createHandlers } from '../controllers/genericController.js';
import * as incidentController from '../controllers/incidentController.js'; // NOVO CONTROLADOR
import { authenticateToken, checkPermission } from '../middlewares/auth.js';
import pool from '../config/database.js';

const router = express.Router();

/**
 * S.I.E PRO OPERATIONAL KERNEL - V10.1 (Watchdog Enhanced)
 * Refatoração SRE: Incidentes agora possuem controlador dedicado para lógica Geo-Fence.
 */

// --- INCIDENTES (WATCHDOG) ---
router.get('/incidents', authenticateToken, checkPermission('view_operations'), incidentController.getAllIncidents);
router.post('/incidents', authenticateToken, checkPermission('manage_operations'), incidentController.createIncident);
router.put('/incidents/:id', authenticateToken, checkPermission('manage_operations'), incidentController.updateIncident);
router.delete('/incidents/:id', authenticateToken, checkPermission('manage_operations'), incidentController.deleteIncident);

// --- OUTROS MÓDULOS (GENÉRICOS) ---
const otherModules = [
    { path: 'agenda', table: 'agenda', viewPerm: 'view_timeline', managePerm: 'manage_operations' },
    { path: 'projects', table: 'projects', viewPerm: 'view_projects', managePerm: 'manage_projects' },
    { path: 'assets', table: 'assets', viewPerm: 'view_operations', managePerm: 'manage_users' },
    { path: 'cameras', table: 'cameras', viewPerm: 'view_operations', managePerm: 'manage_settings' }
];

otherModules.forEach(m => {
    const handlers = createHandlers(m.table);
    router.get(`/${m.path}`, authenticateToken, checkPermission(m.viewPerm), handlers.getAll);
    router.post(`/${m.path}`, authenticateToken, checkPermission(m.managePerm || m.viewPerm), handlers.create);
    router.put(`/${m.path}/:id`, authenticateToken, checkPermission(m.managePerm || m.viewPerm), handlers.update);
    router.delete(`/${m.path}/:id`, authenticateToken, checkPermission(m.managePerm || m.viewPerm), handlers.delete);
});

/**
 * MOTOR DE AGREGAÇÃO DE HEATMAP
 * Requisito: /api/incidents/heatmap
 */
router.get('/incidents/heatmap', authenticateToken, checkPermission('view_operations'), async (req, res) => {
    try {
        const [rows] = await pool.query(
            'SELECT coordinates, priority FROM incidents WHERE status != "RESOLVED" AND coordinates IS NOT NULL'
        );

        const heatData = rows.map(r => {
            let coords = r.coordinates;
            try {
                if (typeof coords === 'string') coords = JSON.parse(coords);
            } catch (e) { return null; }

            if (!coords || !coords.lat || !coords.lng) return null;

            let intensity = 0.3;
            const p = String(r.priority || '').toUpperCase();
            if (p.includes('NÍVEL 4')) intensity = 1.0;
            else if (p.includes('NÍVEL 3')) intensity = 0.7;
            else if (p.includes('NÍVEL 2')) intensity = 0.5;

            return [parseFloat(coords.lat), parseFloat(coords.lng), intensity];
        }).filter(Boolean);

        res.json({ data: heatData });
    } catch (e) {
        console.error("[SRE HEATMAP FAIL]", e);
        res.status(500).json({ error: "Erro no heatmap." });
    }
});

/**
 * INDICADORES ESG / SUSTENTABILIDADE
 * Requisito: /api/sustainability/stats
 */
router.get('/sustainability/stats', authenticateToken, checkPermission('view_dashboard'), async (req, res) => {
    res.json({
        energy: [
            { date: 'Jan', value: 450 }, { date: 'Fev', value: 420 }, { date: 'Mar', value: 400 }
        ],
        water: [
            { date: 'Jan', value: 120 }, { date: 'Fev', value: 115 }, { date: 'Mar', value: 95 }
        ],
        waste: [
            { name: 'Reciclável', value: 48, color: '#10b981' },
            { name: 'Orgânico', value: 32, color: '#f59e0b' },
            { name: 'Rejeito', value: 20, color: '#ef4444' }
        ]
    });
});

export default router;
