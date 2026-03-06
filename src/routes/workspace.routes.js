import { Router }          from 'express';
import { getMyWorkspaces } from '../controllers/workspace.controller.js';
import authMiddleware      from '../middlewares/auth.js';

const router = Router();

router.get('/mine', authMiddleware, getMyWorkspaces);

export default router;