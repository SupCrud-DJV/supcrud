import { Router }          from 'express';
import { getMyWorkspaces, createWorkspace } from '../controllers/workspace.controller.js';
import authMiddleware      from '../middlewares/auth.js';

const router = Router();

router.get('/mine', authMiddleware, getMyWorkspaces);
router.post('/',     authMiddleware, createWorkspace);

export default router;