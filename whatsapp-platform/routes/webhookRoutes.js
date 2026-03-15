import express from "express";
import { receiveWebhook, verifyWebhook } from "../controllers/webhookController.js";
import { verifyMetaSignature } from "../middleware/verifyMetaSignature.js";

const router = express.Router();

router.get("/", verifyWebhook);
router.post("/", verifyMetaSignature, receiveWebhook);

export default router;
