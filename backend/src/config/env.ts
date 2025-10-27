// src/config/env.ts
import 'dotenv/config';

const required = (key: string, val: string | undefined) => {
  if (!val || val.trim() === '') {
    throw new Error(`Missing required env var: ${key}`);
  }
  return val;
};

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? 'development',
  APP_KEY: required('APP_KEY', process.env.APP_KEY),
  JWT_SECRET: required('JWT_SECRET', process.env.JWT_SECRET),
  JWT_EXPIRATION: process.env.JWT_EXPIRATION ?? '1h'
};
