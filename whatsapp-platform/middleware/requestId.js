import crypto from "node:crypto";

export const requestId = (req, _res, next) => {
  req.id = req.headers["x-request-id"] || crypto.randomUUID();
  next();
};
