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
import broadcastRoutes from './routes/broadcastRoutes';
import { swaggerSpec } from './config/swagger';
import { authMiddleware } from './middleware/authMiddleware';
import { apiRateLimiter } from './middleware/rateLimitMiddleware';
import { messageController } from './controllers/messageController';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(loggerMiddleware);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'whatsapp-platform-backend' });
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/webhook', webhookRoutes);
app.use('/api/messages', messageRoutes);
app.post('/api/otp/send', authMiddleware, apiRateLimiter, messageController.sendOtp);
app.use('/api/apps', appRoutes);
app.use('/api/broadcast', broadcastRoutes);

app.use((error: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', { error: error.message, stack: error.stack });
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(env.PORT, () => {
  logger.info(`Server running on port ${env.PORT}`);
});
