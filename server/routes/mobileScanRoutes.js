import express from 'express';
import { verifyAuth } from '../middleware/authMiddleware.js';
import mobileUpload from '../middleware/mobileUpload.js';
import rateLimitMobileScan from '../middleware/rateLimitMobileScan.js';
import {
    extractFromMobile,
    listPendingMobile,
    confirmMobileScan,
    deleteMobileScan,
} from '../controllers/mobileScanController.js'