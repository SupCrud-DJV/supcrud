import { Router }                          from 'express';
import { getMe, getMyRole, changePassword} from '../controllers/user.controller.js';
import authMiddleware                      from '../middlewares/auth.js';

const router = Router();

router.get('/me',          authMiddleware, getMe);
router.get('/me/role',     authMiddleware, getMyRole);
router.put('/me/password', authMiddleware, changePassword);

export default router;