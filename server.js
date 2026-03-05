import express from 'express';
import cors from 'cors';
import path from 'path';
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public')); // serves widget.js

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

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'src/views/landing.html'));
});

// Serve the SPA shell for all /app/* routes
app.get('/app', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/app/index.html'));
});

app.listen(3000, () => console.log('SupCrud running on http://localhost:3000'));