
import express from 'express';
import { createHandlers } from '../controllers/genericController.js';
import * as incidentController from '../controllers/incidentController.js';
import { authenticateToken, checkPermission } from '../middlewares/auth.js';
import pool from '../config/database.js';

const router = express.Router();

router.get('/incidents', authenticateToken, checkPermission('view_operations'), incidentController.getAllIncidents);
router.post('/incidents', authenticateToken, checkPermission('manage_operations'), incidentController.createIncident);
router.put('/incidents/:id', authenticateToken, checkPermission('manage_operations'), incidentController.updateIncident);
router.delete('/incidents/:id', authenticateToken, checkPermission('manage_operations'), incidentController.deleteIncident);

const otherModules = [
    { path: 'agenda', table: 'agenda', viewPerm: 'view_timeline' },
    { path: 'projects', table: 'projects', viewPerm: 'view_projects' },
    { path: 'assets', table: 'assets', viewPerm: 'view_operations' },
    { path: 'cameras', table: 'cameras', viewPerm: 'view_operations' },
    { path: 'vehicles', table: 'vehicles', viewPerm: 'view_operations' } 
];

otherModules.forEach(m => {
    const handlers = createHandlers(m.table);
    router.get(`/${m.path}`, authenticateToken, checkPermission(m.viewPerm), handlers.getAll);
    router.post(`/${m.path}`, authenticateToken, checkPermission(m.viewPerm), handlers.create);
    router.put(`/${m.path}/:id`, authenticateToken, checkPermission(m.viewPerm), handlers.update);
    router.delete(`/${m.path}/:id`, authenticateToken, checkPermission(m.viewPerm), handlers.delete);
});

router.get('/incidents/heatmap', authenticateToken, checkPermission('view_operations'), async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT coordinates, priority FROM incidents WHERE status != "RESOLVED" AND coordinates IS NOT NULL');
        const heatData = rows.map(r => {
            let coords = r.coordinates;
            try { if (typeof coords === 'string') coords = JSON.parse(coords); } catch (e) { return null; }
            if (!coords || !coords.lat || !coords.lng) return null;
            return [parseFloat(coords.lat), parseFloat(coords.lng), 0.6];
        }).filter(Boolean);
        res.json({ data: heatData });
    } catch (e) { res.status(500).json({ error: "Heatmap Fail" }); }
});

router.get('/sustainability/stats', authenticateToken, checkPermission('view_dashboard'), async (req, res) => {
    res.json({
        energy: [{ date: 'Jan', value: 450 }, { date: 'Fev', value: 420 }],
        water: [{ date: 'Jan', value: 120 }, { date: 'Fev', value: 115 }],
        waste: [{ name: 'Reciclável', value: 48, color: '#10b981' }]
    });
});

export default router;
