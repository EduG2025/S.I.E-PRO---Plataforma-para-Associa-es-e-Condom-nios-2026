
import express from 'express';
import * as authController from '../controllers/authController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = express.Router();

router.post('/login', authController.login);
router.get('/me', authenticateToken, authController.me);

export default router;
