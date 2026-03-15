const formatLog = (level, message, meta = {}) => {
  const base = {
    timestamp: new Date().toISOString(),
    level,
    message,
  };

  return JSON.stringify({ ...base, ...meta });
};

export const logger = {
  info: (message, meta) => console.log(formatLog("info", message, meta)),
  warn: (message, meta) => console.warn(formatLog("warn", message, meta)),
  error: (message, meta) => console.error(formatLog("error", message, meta)),
};
