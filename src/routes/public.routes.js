import { Router } from "express";
import {
  getPublicTicket,
  getPublicTicketFull,
  requestOtp,
  verifyOtp,
} from "../controllers/ticket.controller.js";

const router = Router();

router.get("/ticket/:referenceCode", getPublicTicket);
router.get("/ticket/:referenceCode/full", getPublicTicketFull);
router.post("/request-otp", requestOtp);
router.post("/verify-otp", verifyOtp);

export default router;
