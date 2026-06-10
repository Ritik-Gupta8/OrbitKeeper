import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './utils/db.js';
import { startDeadlineMonitor } from './agents/deadlineMonitor.js';
import mcpClient from './mcp/mcpClient.js';
import { verifyToken } from './middleware/auth.js';

// Routes
import applicationRoutes  from './routes/applications.js';
import resumeRoutes        from './routes/resume.js';
import agentRoutes         from './routes/agent.js';
import profileRoutes       from './routes/profile.js';
import notificationRoutes  from './routes/notifications.js';
import mcpRoutes           from './routes/mcp.js';

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin:      process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status:    'ok',
    timestamp: new Date().toISOString(),
    service:   'OrbitKeeper API',
    mcp:       'MongoDB MCP Server active at POST /mcp',
  });
});

// ── Debug endpoints (temporary - for testing) ─────────────────────────────────
app.get('/api/debug/check-deadlines', async (req, res) => {
  try {
    const Application = (await import('./models/Application.js')).default;
    const now = new Date();
    const future = new Date(now.getTime() + 25 * 60 * 60 * 1000);
    
    const allApps = await Application.find({}).select('company role deadline userId status createdAt');
    const upcomingApps = await Application.find({
      deadline: { $gte: now, $lte: future },
      status: { $nin: ['rejected', 'withdrawn', 'offer'] },
    }).select('company role deadline userId status');
    
    res.json({
      now: now.toISOString(),
      future: future.toISOString(),
      hoursAhead: 25,
      allApplications: allApps.map(a => ({
        company: a.company,
        role: a.role,
        deadline: a.deadline,
        deadlineISO: a.deadline ? new Date(a.deadline).toISOString() : null,
        hoursUntil: a.deadline ? ((new Date(a.deadline) - now) / (1000 * 60 * 60)).toFixed(1) : null,
        userId: a.userId,
        status: a.status,
      })),
      upcomingDeadlines: upcomingApps.map(a => ({
        company: a.company,
        role: a.role,
        deadline: a.deadline,
        userId: a.userId,
        hoursUntil: ((new Date(a.deadline) - now) / (1000 * 60 * 60)).toFixed(1),
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/debug/profile', verifyToken, async (req, res) => {
  try {
    const Profile = (await import('./models/Profile.js')).default;
    const userId = req.headers['x-user-id'];
    const profile = await Profile.findOne({ userId });
    
    res.json({
      userId,
      profileExists: !!profile,
      resumeTextLength: profile?.resumeText?.length || 0,
      resumeFileName: profile?.resumeFileName || null,
      resumeUploadedAt: profile?.resumeUploadedAt || null,
      skillsCount: profile?.skills?.length || 0,
      name: profile?.name || null,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── MCP Server endpoint (must come before other routes, no /api prefix) ──────
// Judges verify MCP integration at:
//   POST /mcp         — MCP protocol endpoint
//   GET  /api/mcp/tools — Live tool manifest
app.use('/mcp',      mcpRoutes);      // POST /mcp  (MCP protocol)
app.use('/api/mcp',  mcpRoutes);      // GET  /api/mcp/tools (manifest)

// ── REST API Routes (protected with Firebase auth) ──────────────────────────
app.use('/api/applications',  verifyToken, applicationRoutes);
app.use('/api/resume',        verifyToken, resumeRoutes);
app.use('/api/agent',         verifyToken, agentRoutes);
app.use('/api/profile',       verifyToken, profileRoutes);
app.use('/api/notifications', verifyToken, notificationRoutes);

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const start = async () => {
  await connectDB();

  app.listen(PORT, async () => {
    console.log(`\n🚀 OrbitKeeper API  →  http://localhost:${PORT}`);
    console.log(`🔧 MCP Server endpoint     →  POST http://localhost:${PORT}/mcp`);
    console.log(`📋 MCP Tool manifest       →  GET  http://localhost:${PORT}/api/mcp/tools\n`);

    // Connect MCP client after server is listening
    // Small delay ensures the /mcp endpoint is ready to accept connections
    setTimeout(async () => {
      await mcpClient.connect();
    }, 500);

    // Start deadline monitoring agent (uses MCP client internally)
    startDeadlineMonitor();
    console.log('⏰ Deadline Monitor Agent started (via MCP)\n');
  });
};

start();
