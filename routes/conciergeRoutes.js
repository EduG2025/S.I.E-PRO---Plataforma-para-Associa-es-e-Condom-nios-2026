
import express from 'express';
import { createHandlers } from '../controllers/genericController.js';
import { authenticateToken, checkPermission } from '../middlewares/auth.js';

const router = express.Router();

const visitorHandlers = createHandlers('visitors');
const deliveryHandlers = createHandlers('deliveries');

/**
 * SRE CONCIERGE PROTOCOL
 * Como este roteador é montado de forma fragmentada em api.js:
 * router.use('/visitors', conciergeRoutes) -> Responde em /api/visitors
 * router.use('/deliveries', conciergeRoutes) -> Responde em /api/deliveries
 */

// Handlers genéricos baseados no método HTTP
router.get('/', authenticateToken, checkPermission('view_operations'), (req, res) => {
    // Determina o handler baseado no mount path original
    if (req.baseUrl.includes('visitors')) return visitorHandlers.getAll(req, res);
    if (req.baseUrl.includes('deliveries')) return deliveryHandlers.getAll(req, res);
    res.status(404).json({ error: 'DOMAIN_NOT_FOUND' });
});

router.post('/', authenticateToken, checkPermission('view_operations'), (req, res) => {
    if (req.baseUrl.includes('visitors')) return visitorHandlers.create(req, res);
    if (req.baseUrl.includes('deliveries')) return deliveryHandlers.create(req, res);
    res.status(404).json({ error: 'DOMAIN_NOT_FOUND' });
});

router.put('/:id', authenticateToken, checkPermission('view_operations'), (req, res) => {
    if (req.baseUrl.includes('visitors')) return visitorHandlers.update(req, res);
    if (req.baseUrl.includes('deliveries')) return deliveryHandlers.update(req, res);
    res.status(404).json({ error: 'DOMAIN_NOT_FOUND' });
});

router.delete('/:id', authenticateToken, checkPermission('view_operations'), (req, res) => {
    if (req.baseUrl.includes('visitors')) return visitorHandlers.delete(req, res);
    if (req.baseUrl.includes('deliveries')) return deliveryHandlers.delete(req, res);
    res.status(404).json({ error: 'DOMAIN_NOT_FOUND' });
});

export default router;
