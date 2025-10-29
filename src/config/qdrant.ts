import dotenv from 'dotenv';

dotenv.config();

interface QdrantConfig {
  url: string;
  collectionName: string;
}

const config: QdrantConfig = {
  url: process.env.QDRANT_URL || 'http://localhost:6333',
  collectionName: 'email_context',
};

export default config;