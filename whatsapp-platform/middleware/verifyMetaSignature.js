import crypto from "node:crypto";
import { HttpError } from "../utils/httpError.js";

const SIGNATURE_PREFIX = "sha256=";

export const verifyMetaSignature = (req, _res, next) => {
  const appSecret = process.env.META_APP_SECRET;
  const signatureHeader = req.header("X-Hub-Signature-256");

  if (!appSecret) {
    return next(new HttpError(500, "META_APP_SECRET is not configured"));
  }

  if (!signatureHeader || !signatureHeader.startsWith(SIGNATURE_PREFIX)) {
    return next(new HttpError(401, "Missing or invalid X-Hub-Signature-256 header"));
  }

  const rawBody = req.rawBody;

  if (!rawBody) {
    return next(new HttpError(400, "Missing raw request body for signature validation"));
  }

  const expectedDigest = crypto
    .createHmac("sha256", appSecret)
    .update(rawBody)
    .digest("hex");

  const receivedDigest = signatureHeader.slice(SIGNATURE_PREFIX.length);
  const expectedBuffer = Buffer.from(expectedDigest, "hex");
  const receivedBuffer = Buffer.from(receivedDigest, "hex");

  if (
    expectedBuffer.length !== receivedBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
  ) {
    return next(new HttpError(401, "Webhook signature verification failed"));
  }

  return next();
};
