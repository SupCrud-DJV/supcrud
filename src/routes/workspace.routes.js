import { Router }       from 'express';
import authMiddleware   from '../middlewares/auth.js';
import checkWorkspace   from '../middlewares/checkWorkspace.js';
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
router.get ('/:id',               authMiddleware, checkWorkspace, getWorkspace);
router.put ('/:id',               authMiddleware, checkWorkspace, updateWorkspace);
router.get ('/:id/members',       authMiddleware, checkWorkspace, getMembers);
router.get ('/:id/addons',        authMiddleware, checkWorkspace, getAddons);
router.post('/:id/addons/toggle', authMiddleware, checkWorkspace, toggleAddon);
router.get ('/:id/ai-config',     authMiddleware, checkWorkspace, getAIConfig);
router.put ('/:id/ai-config',     authMiddleware, checkWorkspace, updateAIConfig);

export default router;