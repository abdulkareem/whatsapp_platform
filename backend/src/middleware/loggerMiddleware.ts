import morgan from 'morgan';
import { logger } from '../config/logger';

export const loggerMiddleware = morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
});
