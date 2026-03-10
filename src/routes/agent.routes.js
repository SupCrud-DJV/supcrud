import { Router } from 'express';
import authMiddleware from '../middlewares/auth.js';
import checkWorkspace from '../middlewares/checkWorkspace.js';
import requireWorkspaceRole from '../middlewares/requireWorkspaceRole.js';
import {
  inviteAgent,
  acceptInvite,
} from '../controllers/agent.controller.js';

const router = Router();

// Workspace-admin endpoints
router.post(
  '/invite',
  authMiddleware,
  checkWorkspace,
  requireWorkspaceRole('ADMIN'),
  inviteAgent
);

// Public acceptance (by token)
router.post('/accept', acceptInvite);

export default router;
