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
    from: message?.from,
    text: message?.text?.body,
  };
};

export const receiveWebhook = async (req, res, next) => {
  try {
    const { from, text } = extractIncomingMessage(req.body);

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
