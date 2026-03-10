import { Router } from 'express';
import authMiddleware from '../middlewares/auth.js';
import requireOwner from '../middlewares/requireOwner.js';
import {
  listWorkspaces,
  updateWorkspaceStatus,
  getWorkspaceMetrics,
  listAddons,
  createAddon,
  updateAddon,
  deleteAddon
} from '../controllers/owner.controller.js';

const router = Router();

router.use(authMiddleware, requireOwner);

router.get('/workspaces', listWorkspaces);
router.put('/workspaces/:id/status', updateWorkspaceStatus);
router.get('/workspaces/:id/metrics', getWorkspaceMetrics);

router.get('/addons', listAddons);
router.post('/addons', createAddon);
router.put('/addons/:id', updateAddon);
router.delete('/addons/:id', deleteAddon);

export default router;
