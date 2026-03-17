import express from 'express';
import { verifyAuth } from '../middleware/authMiddleware.js';
import mobileUpload from '../middleware/mobileUpload.js';
import rateLimitMobileScan from '../middleware/rateLimitMobileScan.js';
import {
    extractFromMobile,
    listPendingMobile,
    confirmMobileScan,
    deleteMobileScan,
} from '../controllers/mobileScanController.js';

const router = express.Router();

router.use(verifyAuth);

router.get('/pending', listPendingMobile);

router.post(
    '/extract',
    rateLimitMobileScan,
    mobileUpload.single('image'),
    extractFromMobile
);

router.post('/:scanId/confirm', confirmMobileScan);
router.delete('/:scanId', deleteMobileScan);

export default router;

