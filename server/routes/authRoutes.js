import express from 'express';
import {
    signup,
    login,
    verifyEmail,
    getCurrentUser,
    logout
} from '../controllers/authController.js'

import { verifyAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/signup', signup);
router.get('/verify-email', verifyEmail);
router.post('/login', login);

//Protected Routes
router.get('/me', verifyAuth, getCurrentUser);
router.post('/logout', verifyAuth, logout);

export default router;