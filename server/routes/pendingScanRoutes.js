import express from 'express';
import {
    getAllPending,
    create,
    remove
} from '../controllers/pendingScanController.js'
import { verifyAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

//All pending scan routes are protected
router.use(verifyAuth);

router.get("/", getAllPending);
router.post("/", create)
router.delete("/:scanId", remove);

export default router;