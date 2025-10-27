// src/types/env.d.ts
declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    APP_KEY: string;
    JWT_SECRET: string;
    JWT_EXPIRATION?: string; // ex: "1h", "7d"
    DB_HOST?: string;
    DB_PORT?: string;
    DB_DATABASE?: string;
    DB_USERNAME?: string;
    DB_PASSWORD?: string;
  }
}
