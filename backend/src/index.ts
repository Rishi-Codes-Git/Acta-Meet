import express from 'express';
import cors from 'cors';
import { config } from './config';

// Import routes
import authRoutes from './routes/auth';
import meetingRoutes from './routes/meetings';
import actionItemRoutes from './routes/actionItems';
import dashboardRoutes from './routes/dashboard';
import transcribeRoutes from './routes/transcribe';
import notificationRoutes from './routes/notifications';
import userRoutes from './routes/users';
import teamRoutes from './routes/teams';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

// Start server
app.listen(config.port, () => {
  console.log(`
  ╔═══════════════════════════════════════════════════╗
  ║                                                   ║
  ║     🎯 ${config.appName} API Server                       ║
  ║                                                   ║
  ║     Running on: http://localhost:${config.port}          ║
  ║     Environment: ${config.nodeEnv}                  ║
  ║                                                   ║
  ╚═══════════════════════════════════════════════════╝
  `);
});

export default app;
