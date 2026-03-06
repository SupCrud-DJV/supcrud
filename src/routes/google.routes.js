import { Router }                                    from 'express';
import { redirectToGoogle, handleGoogleCallback }   from '../controllers/google.controller.js';

const router = Router();

router.get('/google',          redirectToGoogle);
router.get('/google/callback', handleGoogleCallback);

router.get('/google/result', (req, res) => {
  const result = req.session.oauthResult;

  if (!result) {
    return res.status(404).json({ message: 'No OAuth result found' });
  }

  // Clear session after reading
  req.session.oauthResult = null;
  res.json(result);
});

export default router;