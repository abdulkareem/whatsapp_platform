import axios from "axios";
import { HttpError } from "../utils/httpError.js";
import { logger } from "../utils/logger.js";

export const forwardIncomingMessage = async ({ targets, from, message, requestId }) => {
  const results = await Promise.allSettled(
    targets.map(async (target) => {
      if (!target.endpoint || !target.apiKey) {
        throw new HttpError(500, `Client target ${target.name || "unknown"} is not configured`);
      }

      const response = await axios.post(
        target.endpoint,
        {
          api_key: target.apiKey,
          from,
          message,
        },
        {
          timeout: Number(process.env.CLIENT_FORWARD_TIMEOUT_MS || 10_000),
        },
      );

      return {
        name: target.name,
        status: response.status,
      };
    }),
  );

  const rejected = results.filter((result) => result.status === "rejected");

  if (rejected.length > 0) {
    logger.error("forwarding.partial_failure", {
      requestId,
      failures: rejected.map((result) => result.reason?.message || "Unknown forwarding error"),
    });

    throw new HttpError(502, "Failed to forward webhook event to one or more client apps", {
      failedTargets: rejected.length,
    });
  }

  return results.map((result) => result.value);
};
