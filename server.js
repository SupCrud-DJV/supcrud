import express from 'express';
import cors from 'cors';
import path from 'path';
import authRoutes from './src/routes/auth.routes.js'
import googleRoutes from './src/routes/google.routes.js';
import session from 'express-session';
import workspaceRoutes from './src/routes/workspace.routes.js';
import userRoutes from './src/routes/user.routes.js';
import { connectMongo } from './src/config/mongo.js';
import ticketRoutes from './src/routes/ticket.routes.js';


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

await connectMongo();

app.listen(3000, () => console.log('SupCrud running on http://localhost:3000'));