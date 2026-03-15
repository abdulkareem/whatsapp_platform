import { logger } from "../utils/logger.js";

export const requestLogger = (req, res, next) => {
  const start = Date.now();

  console.log(`${req.method} ${req.url}`);

  if (req.originalUrl.startsWith("/webhook")) {
    console.log("===== WEBHOOK HTTP REQUEST =====");
    console.log(`Method: ${req.method}`);
    console.log(`URL: ${req.originalUrl}`);
    console.log("===============================");
  }

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
