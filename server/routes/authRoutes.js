import express from 'express';
import {
    signup,
    login,
    verifyEmail,
    getCurrentUser,
    logout,
    forgotPassword,
    resetPassword
} from '../controllers/authController.js'

import { verifyAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/signup', signup);
router.get('/verify-email', verifyEmail);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

//Protected Routes
router.get('/me', verifyAuth, getCurrentUser);
router.post('/logout', verifyAuth, logout);


export default router;