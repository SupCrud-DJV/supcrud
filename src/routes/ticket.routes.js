import { Router } from "express";
import authMiddleware from "../middlewares/auth.js";
import checkWorkspace from "../middlewares/checkWorkspace.js";
import {
  createPublicTicket,
  listTickets,
  getTicket,
  addMessage,
  updateStatus,
  assignAgent,
} from "../controllers/ticket.controller.js";

const router = Router();

// Public
router.post("/", createPublicTicket);
router.post("/public", createPublicTicket);

// Workspace-protected ticket APIs
router.use(authMiddleware);
router.use(checkWorkspace);

router.get("/", listTickets);
router.get("/:id", getTicket);
router.post("/:id/messages", addMessage);
router.patch("/:id/status", updateStatus);
router.patch("/:id/assign", assignAgent);

export default router;
