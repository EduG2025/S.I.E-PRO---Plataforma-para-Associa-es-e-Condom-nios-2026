import express from 'express';
import * as communityController from '../controllers/communityController.js';
import { createHandlers } from '../controllers/genericController.js';
import { authenticateToken, checkPermission } from '../middlewares/auth.js';

const router = express.Router();
const marketHandlers = createHandlers('marketplace_items');
const suggestionHandlers = createHandlers('suggestions');

// Marketplace - Protegido por use_marketplace
router.get('/marketplace', authenticateToken, checkPermission('use_marketplace'), communityController.getMarketplace);
router.post('/marketplace', authenticateToken, checkPermission('use_marketplace'), communityController.createMarketplaceItem);
router.put('/marketplace/:id', authenticateToken, checkPermission('use_marketplace'), marketHandlers.update);
router.delete('/marketplace/:id', authenticateToken, checkPermission('use_marketplace'), marketHandlers.delete);

// Reservations - Protegido por use_reservations
router.get('/reservations', authenticateToken, checkPermission('use_reservations'), communityController.getReservations);
router.post('/reservations', authenticateToken, checkPermission('use_reservations'), communityController.createReservation);
router.delete('/reservations/:id', authenticateToken, checkPermission('use_reservations'), communityController.deleteReservation);

// Suggestions (Ouvidoria) - Protegido por send_suggestions
router.get('/suggestions', authenticateToken, checkPermission('send_suggestions'), communityController.getSuggestions);
router.post('/suggestions', authenticateToken, checkPermission('send_suggestions'), communityController.createSuggestion);
router.put('/suggestions/:id', authenticateToken, checkPermission('manage_communication'), suggestionHandlers.update); // Apenas gestão para editar
router.delete('/suggestions/:id', authenticateToken, checkPermission('manage_communication'), suggestionHandlers.delete); // Apenas gestão para deletar

export default router;