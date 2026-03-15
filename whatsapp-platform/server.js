import express from "express";
import dotenv from "dotenv";
import webhookRoutes from "./routes/webhookRoutes.js";
import sendMessageRoute from "./routes/sendMessage.js";
import { requestId } from "./middleware/requestId.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { apiLimiter } from "./middleware/rateLimiter.js";
import { errorHandler } from "./middleware/errorHandler.js";

dotenv.config();

const app = express();

app.use(requestId);
app.use(requestLogger);
app.use(apiLimiter);

app.use(
  express.json({
    verify: (req, _res, buffer) => {
      req.rawBody = buffer;
    },
  }),
);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/webhook", webhookRoutes);
app.use("/send-message", sendMessageRoute);

app.use(errorHandler);

const port = Number(process.env.PORT || 8080);

app.listen(port, () => {
  console.log(`WhatsApp Gateway listening on port ${port}`);
});
