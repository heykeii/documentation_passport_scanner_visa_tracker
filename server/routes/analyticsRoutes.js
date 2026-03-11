import express from 'express'
import {verifyAuth} from '../middleware/authMiddleware.js';
import uploadExcel from '../middleware/uploadExcel.js';
import {
    importAnalyticsExcel,
    getAnalytics,
    clearMonthData,
    exportAnalyticsExcel,
} from '../controllers/analyticsController.js';

const router = express.Router();

router.use(verifyAuth);

router.post('/import', uploadExcel.single('file'), importAnalyticsExcel);
router.get('/data', getAnalytics);
router.get('/export', exportAnalyticsExcel);
router.delete('/clear', clearMonthData);

export default router;