import { logger } from "../utils/logger.js";

export const errorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode || 500;

  logger.error("request.failed", {
    requestId: req.id,
    method: req.method,
    path: req.originalUrl,
    statusCode,
    error: err.message,
    details: err.details,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });

  res.status(statusCode).json({
    error: err.message || "Internal Server Error",
    requestId: req.id,
  });
};
