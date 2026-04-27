import express from 'express';
import cors from 'cors';
import { config } from './config';
import path from 'path';
import fs from 'fs';
import http from 'http';
import { Server } from 'socket.io';
import { verifyToken } from './middleware/auth';
import { query } from './db';

// Import routes
import authRoutes from './routes/auth';
import meetingRoutes from './routes/meetings';
import actionItemRoutes from './routes/actionItems';
import dashboardRoutes from './routes/dashboard';
import transcribeRoutes from './routes/transcribe';
import notificationRoutes from './routes/notifications';
import userRoutes from './routes/users';
import teamRoutes from './routes/teams';
import integrationRoutes from './routes/integrations';
import twoFaRoutes from './routes/twofa';

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const uploadsPath = path.resolve(config.upload.dir);
if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
}
app.use('/uploads', express.static(uploadsPath));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    app: config.appName,
    timestamp: new Date().toISOString() 
  });
});

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/meetings', meetingRoutes);
app.use('/api/v1/action-items', actionItemRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/transcribe', transcribeRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/teams', teamRoutes);
app.use('/api/v1/integrations', integrationRoutes);
app.use('/api/v1/2fa', twoFaRoutes);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      next(new Error('No token provided'));
      return;
    }
    const decoded = verifyToken(token);
    socket.data.userId = decoded.userId;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  socket.on('team:join', async (teamId: string) => {
    try {
      const membership = await query(
        'SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2',
        [teamId, socket.data.userId]
      );
      if (membership.rows.length === 0) {
        socket.emit('team:error', 'Not authorized for this team');
        return;
      }
      await socket.join(`team:${teamId}`);
    } catch {
      socket.emit('team:error', 'Failed to join chat room');
    }
  });

  socket.on('team:leave', async (teamId: string) => {
    await socket.leave(`team:${teamId}`);
  });

  socket.on('team:message', async (payload: { teamId: string; message: string }) => {
    try {
      const teamId = payload.teamId;
      const message = payload.message?.trim();
      if (!teamId || !message) {
        return;
      }

      const membership = await query(
        'SELECT 1 FROM team_members WHERE team_id = $1 AND user_id = $2',
        [teamId, socket.data.userId]
      );
      if (membership.rows.length === 0) {
        socket.emit('team:error', 'Not authorized for this team');
        return;
      }

      const insertResult = await query(
        `INSERT INTO team_chat_messages (team_id, sender_id, message)
         VALUES ($1, $2, $3)
         RETURNING id, team_id, sender_id, message, created_at`,
        [teamId, socket.data.userId, message]
      );

      const senderResult = await query(
        'SELECT name, avatar_url FROM users WHERE id = $1',
        [socket.data.userId]
      );

      const createdMessage = insertResult.rows[0];
      const sender = senderResult.rows[0];
      io.to(`team:${teamId}`).emit('team:message', {
        ...createdMessage,
        sender_name: sender?.name || 'Unknown',
        sender_avatar_url: sender?.avatar_url || null,
      });
    } catch {
      socket.emit('team:error', 'Failed to send message');
    }
  });
});

const ensureRealtimeSchema = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS team_chat_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
      sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      message TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
  await query(`
    CREATE INDEX IF NOT EXISTS idx_team_chat_messages_team_created
    ON team_chat_messages(team_id, created_at DESC);
  `);
};

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Start server
const startServer = async () => {
  try {
    await ensureRealtimeSchema();
    // Bind to 0.0.0.0 to accept all interfaces, but display the configured IP
    server.listen(config.port, '0.0.0.0', () => {
      console.log(`
  ╔═══════════════════════════════════════════════════╗
  ║                                                   ║
  ║     🎯 ${config.appName} API Server                       ║
  ║                                                   ║
  ║     Running on: http://${config.host}:${config.port}             ║
  ║     Environment: ${config.nodeEnv}                  ║
  ║                                                   ║
  ╚═══════════════════════════════════════════════════╝
  `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

void startServer();

export default app;
