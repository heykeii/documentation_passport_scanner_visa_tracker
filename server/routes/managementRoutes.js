import express from 'express';
import { verifyAuth } from '../middleware/authMiddleware.js';
import uploadExcel from '../middleware/uploadExcel.js';
import { importExcel, exportExcel, downloadTemplate } from '../controllers/managementController.js';

const router = express.Router();

router.use(verifyAuth);

router.post('/import', uploadExcel.single('file'), importExcel);
router.get('/export', exportExcel);
router.get('/template', downloadTemplate);

export default router;