import { Router }        from 'express';
import authMiddleware    from '../middlewares/auth.js';
import checkWorkspace    from '../middlewares/checkWorkspace.js';
import requireWorkspaceRole from '../middlewares/requireWorkspaceRole.js';
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
router.get ('/',              authMiddleware, checkWorkspace, getTickets);
router.get ('/:id',           authMiddleware, checkWorkspace, getTicket);
router.put ('/:id/status',    authMiddleware, checkWorkspace, requireWorkspaceRole('ADMIN', 'AGENT'), updateStatus);
router.put ('/:id/assign',    authMiddleware, checkWorkspace, requireWorkspaceRole('ADMIN', 'AGENT'), assignTicket);
router.post('/:id/messages',  authMiddleware, checkWorkspace, requireWorkspaceRole('ADMIN', 'AGENT'), addMessage);

export default router;