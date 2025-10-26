import dotenv from 'dotenv';

dotenv.config();

const required = ['PORT', 'JWT_SECRET'];

required.forEach((key) => {
  if (!process.env[key]) {
    console.warn(`Environment variable ${key} is not set. Using fallback defaults when applicable.`);
  }
});

export const env = {
  PORT: Number(process.env.PORT) || 4000,
  DB_URL: process.env.DB_URL || 'mysql://user:password@localhost:3306/capifit',
  JWT_SECRET: process.env.JWT_SECRET || 'development-secret',
  JWT_EXPIRATION: process.env.JWT_EXPIRATION || '1d',
  REFRESH_TOKEN_EXPIRATION: process.env.REFRESH_TOKEN_EXPIRATION || '7d',
  EMAIL_HOST: process.env.EMAIL_HOST || '',
  EMAIL_PORT: Number(process.env.EMAIL_PORT) || 587,
  EMAIL_USER: process.env.EMAIL_USER || '',
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD || '',
  ONESIGNAL_APP_ID: process.env.ONESIGNAL_APP_ID || '',
  ONESIGNAL_API_KEY: process.env.ONESIGNAL_API_KEY || ''
};
