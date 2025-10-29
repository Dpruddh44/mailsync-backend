import dotenv from 'dotenv';

dotenv.config();

interface Config {
  nodeEnv: string;
  port: number;
  databaseUrl: string;
  geminiApiKey: string;
  encryptionKey: string;
  slackWebhookUrl: string;
  webhookSiteUrl: string;
}

const config: Config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  databaseUrl: process.env.DATABASE_URL || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  encryptionKey: process.env.ENCRYPTION_KEY || '',
  slackWebhookUrl: process.env.SLACK_WEBHOOK_URL || '',
  webhookSiteUrl: process.env.WEBHOOK_SITE_URL || '',
};

// Validate required config
if (!config.databaseUrl) {
  throw new Error('DATABASE_URL is required');
}

if (!config.geminiApiKey) {
  console.warn('Warning: GEMINI_API_KEY is not set. AI features will not work.');
}

if (!config.encryptionKey || config.encryptionKey.length < 32) {
  throw new Error('ENCRYPTION_KEY must be at least 32 characters');
}

export default config;