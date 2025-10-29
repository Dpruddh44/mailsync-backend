import { Pool } from 'pg';
import config from './env';

export const pool = new Pool({
  connectionString: config.databaseUrl,
});

export const connectDatabase = async (): Promise<void> => {
  try {
    await pool.connect();
    console.log('✓ Database connected');
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
};