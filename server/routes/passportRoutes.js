import express from "express"
import {
    getAll,
    getById,
    create,
    update,
    remove
} from '../controllers/passportController.js';

import { verifyAuth } from "../middleware/authMiddleware.js";

const router = express.Router();

//All passport routes are protected
router.use(verifyAuth);

router.get("/", getAll);
router.get("/:passportId", getById);
router.post("/", create);
router.put("/:passportId", update);
router.delete("/:passportId", remove);

export default router;