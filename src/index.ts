import express from 'express';
import cors from 'cors';
import config from './config/env';
import { connectDatabase } from './config/database';
import { ElasticsearchService } from './services/elasticsearch/ElasticsearchService';
import { QdrantService } from './services/qdrant/QdrantService';
import logger from './utils/logger';

// Import routes
import accountRoutes from './routes/accounts';
import emailRoutes from './routes/emails';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/accounts', accountRoutes);
app.use('/api/emails', emailRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Initialize services
const initializeServices = async () => {
  try {
    logger.info('Initializing Onebox Email Backend...');

    // Connect to database
    await connectDatabase();
    logger.info('✓ Database initialized');

    // Initialize Elasticsearch
    const esService = new ElasticsearchService();
    await esService.initialize();
    logger.info('✓ Elasticsearch initialized');

    // Initialize Qdrant
    const qdrantService = new QdrantService();
    await qdrantService.initialize();
    logger.info('✓ Qdrant initialized');

    // Start server
    app.listen(config.port, () => {
      logger.info(`✓ Server running on port ${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info('Onebox Email Backend ready!');
    });
  } catch (error) {
    logger.error(`Initialization error: ${error}`);
    process.exit(1);
  }
};

initializeServices();