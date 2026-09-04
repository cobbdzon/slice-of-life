const LEVELS: Record<string, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const DEFAULT_LEVEL = 1; // info
const currentLevel = LEVELS[process.env.LOG_LEVEL ?? "info"] ?? DEFAULT_LEVEL;

function timestamp(): string {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

function emit(level: string, msg: string) {
  console.log(`[${timestamp()}] [${level.toUpperCase()}] ${msg}`);
}

const enabled = (level: number | undefined) => currentLevel <= (level ?? DEFAULT_LEVEL);

export const logger = {
  debug(msg: string) {
    if (enabled(LEVELS.debug)) emit("debug", msg);
  },
  info(msg: string) {
    if (enabled(LEVELS.info)) emit("info", msg);
  },
  warn(msg: string) {
    if (enabled(LEVELS.warn)) emit("warn", msg);
  },
  error(msg: string) {
    if (enabled(LEVELS.error)) emit("error", msg);
  },
};
