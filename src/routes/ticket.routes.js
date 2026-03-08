import { Router }        from 'express';
import authMiddleware    from '../middlewares/auth.js';
import {
  getTickets, getTicket,
  createPublicTicket,
  updateStatus, assignTicket,
  addMessage
} from '../controllers/ticket.controller.js';

const router = Router();

// Public — no auth (from widget)
router.post('/public', createPublicTicket);

// Protected
router.get ('/',              authMiddleware, getTickets);
router.get ('/:id',           authMiddleware, getTicket);
router.put ('/:id/status',    authMiddleware, updateStatus);
router.put ('/:id/assign',    authMiddleware, assignTicket);
router.post('/:id/messages',  authMiddleware, addMessage);

export default router;