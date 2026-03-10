import 'dotenv/config';
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import authRoutes from './src/routes/auth.routes.js';
import googleRoutes from './src/routes/google.routes.js';
import session from 'express-session';
import workspaceRoutes from './src/routes/workspace.routes.js';
import userRoutes from './src/routes/user.routes.js';
import ticketRoutes from './src/routes/ticket.routes.js';
import publicRoutes from './src/routes/public.routes.js';
import agentRoutes from './src/routes/agent.routes.js';
import ownerRoutes from './src/routes/owner.routes.js';
import connectMongo from './src/config/mongo.js';
import { setupSwagger } from './src/config/swagger.js';
import { sendEmail } from './src/utils/sendEmail.js';

import { fileURLToPath } from 'url';
import { dirname }       from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static('public'));


app.use(session({
  secret:            process.env.SESSION_SECRET || 'supcrud_secret',
  resave:            false,
  saveUninitialized: false,
  cookie:            { secure: false }
}));

app.use('/api/workspaces', workspaceRoutes);

// ── Routes ──
// app.use('/api/auth',      require('./src/routes/auth.routes'));
// app.use('/api/workspaces',require('./src/routes/workspace.routes'));
// app.use('/api/tickets',   require('./src/routes/ticket.routes'));
// app.use('/api/agents',    require('./src/routes/agent.routes'));
// app.use('/api/addons',    require('./src/routes/addon.routes'));
// app.use('/api/public',    require('./src/routes/public.routes'));

// ── Views ──
app.get('/widget-ui', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/views/widget-ui.html'));
});

app.get('/track', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/views/public-ticket.html'));
});

// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, 'public/views/landing.html'));
// });

app.use(express.static(path.join(__dirname, 'public'))); 

app.get('/', (req, res) => {
  res.redirect('/app');
});

app.get('/app', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/app/index.html'));
});


app.use('/api/auth', authRoutes);

app.use('/api/auth', googleRoutes);

app.use('/api/users', userRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/owner', ownerRoutes);

// SMTP smoke-test endpoint (temporary)
app.get('/api/test-email', async (req, res) => {
  const to = String(req.query.to || process.env.SMTP_USER || '').trim();
  if (!to) {
    return res.status(400).json({ message: 'Missing recipient. Use ?to=you@example.com or set SMTP_USER.' });
  }

  try {
    await sendEmail({
      to,
      subject: 'SupCrud SMTP test',
      text: 'SMTP test email from SupCrud by Crudzaso.',
    });
    return res.json({ message: 'Test email processed', to });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed to send test email' });
  }
});

// Swagger API docs
setupSwagger(app);

// Ensure API errors are always JSON (avoids HTML error pages in frontend fetch).
app.use((err, req, res, next) => {
  console.error(err);
  if (req.originalUrl?.startsWith('/api')) {
    return res.status(err.status || 500).json({ message: err.message || 'Server error' });
  }
  return res.status(err.status || 500).send('Server error');
});

const PORT = process.env.PORT || 3000;

async function start() {
  await connectMongo();
  app.listen(PORT, () => console.log(`SupCrud running on http://localhost:${PORT}`));
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
