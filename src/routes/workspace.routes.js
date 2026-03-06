import { Router }       from 'express';
import authMiddleware   from '../middlewares/auth.js';
import {
  getMyWorkspaces, createWorkspace,
  getWorkspace,    updateWorkspace,
  getMembers,      getAddons,
  toggleAddon,     getAIConfig,
  updateAIConfig
} from '../controllers/workspace.controller.js';

const router = Router();

router.get ('/mine',              authMiddleware, getMyWorkspaces);
router.post('/',                  authMiddleware, createWorkspace);
router.get ('/:id',               authMiddleware, getWorkspace);
router.put ('/:id',               authMiddleware, updateWorkspace);
router.get ('/:id/members',       authMiddleware, getMembers);
router.get ('/:id/addons',        authMiddleware, getAddons);
router.post('/:id/addons/toggle', authMiddleware, toggleAddon);
router.get ('/:id/ai-config',     authMiddleware, getAIConfig);
router.put ('/:id/ai-config',     authMiddleware, updateAIConfig);

export default router;