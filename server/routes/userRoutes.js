import express from 'express';
import { updateName, updatePassword, updateEmail } from '../controllers/userController.js';
import { verifyAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.put('/name',     verifyAuth, updateName);
router.put('/password', verifyAuth, updatePassword);
router.put('/email',    verifyAuth, updateEmail);

export default router;
