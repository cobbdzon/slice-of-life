const LEVELS: Record<string, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel = LEVELS[process.env.LOG_LEVEL ?? "info"] ?? LEVELS.info;

function timestamp(): string {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

function emit(level: string, msg: string) {
  console.log(`[${timestamp()}] [${level.toUpperCase()}] ${msg}`);
}

export const logger = {
  debug(msg: string) {
    if (currentLevel <= LEVELS.debug) emit("debug", msg);
  },
  info(msg: string) {
    if (currentLevel <= LEVELS.info) emit("info", msg);
  },
  warn(msg: string) {
    if (currentLevel <= LEVELS.warn) emit("warn", msg);
  },
  error(msg: string) {
    if (currentLevel <= LEVELS.error) emit("error", msg);
  },
};
