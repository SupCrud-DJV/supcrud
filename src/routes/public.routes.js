import { Router } from "express";
import {
  getPublicTicket,
  requestOtp,
  verifyOtp,
} from "../controllers/ticket.controller.js";

const router = Router();

router.get("/ticket/:referenceCode", getPublicTicket);
router.post("/request-otp", requestOtp);
router.post("/verify-otp", verifyOtp);

export default router;
