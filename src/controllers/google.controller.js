import { google } from 'googleapis';
import jwt        from 'jsonwebtoken';
import User       from '../models/sql/User.js';
import Workspace  from '../models/sql/Workspace.js';
import dotenv     from 'dotenv';
dotenv.config();

function getOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_CALLBACK_URL
  );
}

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Step 1 — redirect user to Google
export const redirectToGoogle = (req, res) => {
  const oauth2Client = getOAuthClient();

  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['openid', 'email', 'profile'],
  });

  res.redirect(url);
};

// Step 2 — Google redirects back here with a code
export const handleGoogleCallback = async (req, res) => {
  const { code } = req.query;

  if (!code) return res.redirect(`/app#/login?error=google_failed`);

  try {
    const oauth2Client = getOAuthClient();
    const { tokens }   = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2     = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data }   = await oauth2.userinfo.get();
    const { id: google_id, email, name, picture: avatar } = data;

    let user = await User.findByEmail(email);
    if (!user) {
      user = await User.create({ name, email, password: null, avatar, google_id });
    }

    const workspaces = await Workspace.findByUserId(user.id);
    const token      = generateToken(user);

    // Store in session temporarily
    req.session.oauthResult = {
      token,
      user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar, role: user.role },
      workspaces
    };

    // Redirect cleanly — no data in URL
    res.redirect('/app#/auth/callback');

  } catch (err) {
    console.error('Google OAuth error:', err);
    res.redirect('/app#/login?error=google_failed');
  }
};