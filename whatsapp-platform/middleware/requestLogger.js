import { logger } from "../utils/logger.js";

export const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const durationMs = Date.now() - start;
    logger.info("request.completed", {
      method: req.method,
      path: req.originalUrl,
      statusCode: res.statusCode,
      durationMs,
      requestId: req.id,
    });
  });

  next();
};
