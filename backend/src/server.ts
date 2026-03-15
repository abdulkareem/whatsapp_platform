import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { logger } from './config/logger';
import { loggerMiddleware } from './middleware/loggerMiddleware';
import webhookRoutes from './routes/webhookRoutes';
import messageRoutes from './routes/messageRoutes';
import appRoutes from './routes/appRoutes';
import adminRoutes from './routes/adminRoutes';
import broadcastRoutes from './routes/broadcastRoutes';
import { swaggerSpec } from './config/swagger';
import { authMiddleware } from './middleware/authMiddleware';
import { apiRateLimiter } from './middleware/rateLimitMiddleware';
import { messageController } from './controllers/messageController';
import { startMessageWorker } from './queue/messageWorker';

const app = express();

app.use(helmet());
const defaultAllowedOrigins = ['https://whatsapp-platform.pages.dev'];
const configuredOrigins = env.CORS_ORIGINS
  ?.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean) ?? [];
const allowedOrigins = Array.from(new Set([...defaultAllowedOrigins, ...configuredOrigins]));

const corsOptions: cors.CorsOptions = {
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-ADMIN-TOKEN', 'X-APP-KEY', 'APP_API_KEY', 'X-API-KEY'],
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(loggerMiddleware);
app.use((req, _res, next) => {
  logger.info('Incoming request', {
    method: req.method,
    path: req.originalUrl,
    origin: req.headers.origin,
    contentType: req.headers['content-type']
  });
  next();
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'whatsapp-platform-backend' });
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/webhook', webhookRoutes);
app.use('/api/messages', messageRoutes);
app.post('/api/otp/send', authMiddleware, apiRateLimiter, messageController.sendOtp);
app.use('/api/admin', adminRoutes);
app.use('/api/apps', appRoutes);
app.use('/api/broadcast', broadcastRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((error: Error & { status?: number; type?: string }, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', { error: error.message, stack: error.stack });

  if (error.message.startsWith('CORS blocked for origin:')) {
    return res.status(403).json({ error: error.message });
  }

  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }

  if (error.status && error.status >= 400 && error.status < 500) {
    return res.status(error.status).json({ error: error.message });
  }

  return res.status(500).json({ error: 'Internal Server Error' });
});

startMessageWorker();

app.listen(env.PORT, () => {
  logger.info(`Server running on port ${env.PORT}`);
});
