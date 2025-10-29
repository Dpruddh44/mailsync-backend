import { Router } from 'express';
import { Email } from '../models/Email';
import { ElasticsearchService } from '../services/elastisearch/ElasticsearchService';
import { ClassificationService } from '../services/ai/ClassificationService';
import  {RAGService}  from '../services/ai/RAGService';
import logger from '../utils/logger';

const router = Router();
const esService = new ElasticsearchService();
const classificationService = new ClassificationService();
const ragService = new RAGService();

/**
 * GET /api/emails - List emails with filters
 */
router.get('/', async (req, res) => {
  try {
    const { accountId, folder, label, limit = 20, offset = 0 } = req.query;

    const filters: any = {};
    if (accountId) filters.accountId = parseInt(accountId as string);
    if (folder) filters.folder = folder;
    if (label) filters.label = label;
    if (limit) filters.limit = parseInt(limit as string);
    if (offset) filters.offset = parseInt(offset as string);

    const emails = await Email.findAll(filters);
    const total = await Email.count(filters);

    res.json({
      success: true,
      data: emails,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  } catch (error: any) {
    logger.error(`Error fetching emails: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ... rest of the file