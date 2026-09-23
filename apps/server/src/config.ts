import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

export const config = {
  discord: {
    clientId: process.env.DISCORD_CLIENT_ID || '',
    clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
  },
  port: parseInt(process.env.PORT || '3001', 10),
  allowedOrigins: process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(s => s.trim())
    : ['http://localhost:5173', 'http://localhost:5174']
};
