
import express from 'express';
import { body, param } from 'express-validator';
import * as userController from '../controllers/userController.js';
import { authenticateToken, checkPermission } from '../middlewares/auth.js';
import { createHandlers } from '../controllers/genericController.js';
import { validate } from '../middlewares/validationMiddleware.js';

const router = express.Router();
const generic = createHandlers('users');

// =========================================================================
// 1. ROTAS ESTATÍCAS (Sempre no topo)
// =========================================================================

// Motor de busca neural
router.post('/search-neural', 
    authenticateToken, 
    checkPermission('view_demographics'),
    [
        body('query').optional().isString(),
        body('filters').optional().isObject()
    ],
    validate,
    userController.searchNeural
);

// SRE Tool: Batch Geocoding (Admin Only)
router.post('/batch-geocode', 
    authenticateToken, 
    checkPermission('manage_settings'), 
    userController.batchGeocode
);

// Self-Service Profile
router.get('/profile', authenticateToken, userController.getMyProfile);
router.put('/profile', 
    authenticateToken, 
    [
        body('email').optional().isEmail(),
        body('phone').optional().notEmpty()
    ],
    validate,
    userController.updateMyProfile
);

// =========================================================================
// 2. GESTÃO DE USUÁRIOS (Admin)
// =========================================================================

router.get('/', authenticateToken, checkPermission('manage_users'), userController.getAllUsers);

router.post('/', 
    authenticateToken, 
    checkPermission('manage_users'),
    [
        body('name').notEmpty(),
        body('cpf_cnpj').notEmpty(),
        body('role').optional().isString()
    ],
    validate,
    userController.createUser
);

// =========================================================================
// 3. OPERAÇÕES EM UM USUÁRIO ESPECÍFICO (:id)
// =========================================================================

router.post('/:id/invite', authenticateToken, checkPermission('manage_users'), userController.generateInvite);
router.post('/:id/activate', authenticateToken, checkPermission('manage_users'), userController.activateUser);
router.get('/:id/dependents', authenticateToken, checkPermission('manage_users'), userController.getDependents);

router.get('/:id', 
    authenticateToken, 
    checkPermission('manage_users'), 
    userController.getUserById
);

router.put('/:id', 
    authenticateToken, 
    checkPermission('manage_users'), 
    userController.updateMember
);

router.delete('/:id', authenticateToken, checkPermission('manage_users'), generic.delete);

export default router;
