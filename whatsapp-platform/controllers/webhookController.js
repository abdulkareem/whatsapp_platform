import { HttpError } from "../utils/httpError.js";
import { resolveClientTargets } from "../services/clientRoutingService.js";
import { forwardIncomingMessage } from "../services/clientForwardingService.js";
import { logger } from "../utils/logger.js";

export const verifyWebhook = (req, res, next) => {
  try {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode !== "subscribe" || token !== process.env.WEBHOOK_VERIFY_TOKEN) {
      throw new HttpError(403, "Webhook verification failed");
    }

    return res.status(200).send(challenge);
  } catch (error) {
    return next(error);
  }
};

const extractIncomingMessage = (payload) => {
  const message = payload?.entry?.[0]?.changes?.[0]?.value?.messages?.[0];

  return {
    message,
    from: message?.from,
    text: message?.text?.body,
  };
};

const formatWebhookTimestamp = () => {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(
    now.getHours(),
  )}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
};

const logWebhookDetails = ({ headers, payload, from, text }) => {
  console.log("===== WHATSAPP WEBHOOK RECEIVED =====");
  console.log(`Time: ${formatWebhookTimestamp()}`);
  console.log(`Sender: ${from || "N/A"}`);
  console.log(`Message: ${text || "N/A"}`);
  console.log(`Headers: ${JSON.stringify(headers, null, 2)}`);
  console.log(`Payload: ${JSON.stringify(payload, null, 2)}`);
  console.log("==============");
};

export const receiveWebhook = async (req, res, next) => {
  try {
    const { message, from, text } = extractIncomingMessage(req.body);

    if (message) {
      logWebhookDetails({
        headers: req.headers,
        payload: req.body,
        from,
        text,
      });
    } else {
      console.log("Webhook event received but no user message.");
    }

    if (!from || !text) {
      logger.info("webhook.ignored", {
        requestId: req.id,
        reason: "No text message payload found",
      });

      return res.status(200).json({ status: "ignored" });
    }

    const targets = resolveClientTargets({ from, message: text });
    const forwardingResults = await forwardIncomingMessage({
      targets,
      from,
      message: text,
      requestId: req.id,
    });

    logger.info("webhook.forwarded", {
      requestId: req.id,
      from,
      targetCount: targets.length,
    });

    return res.status(200).json({
      status: "processed",
      forwarded: forwardingResults,
    });
  } catch (error) {
    return next(error);
  }
};
