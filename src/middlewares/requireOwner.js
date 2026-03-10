import User from '../models/sql/User.js';

export default async function requireOwner(req, res, next) {
  // Owner access is granted only to users with an @crudzaso.com email and a local password (no Google-only accounts).
  const email = String(req.user?.email || '').toLowerCase();
  if (!email.endsWith('@crudzaso.com')) {
    return res.status(403).json({ message: 'Owner access restricted' });
  }

  const user = await User.findByEmail(email);
  if (!user || !user.password) {
    return res.status(403).json({ message: 'Owner access restricted' });
  }

  next();
}
