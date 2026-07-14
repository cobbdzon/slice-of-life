declare module "bun" {
  interface Env {
    JWT_SECRET: string;
    NODE_ENV: "development" | "production";
  }
  1;
}

declare global {
  namespace NodeJS {
    interface ProcessEnv extends Bun.Env { }
  }
}
