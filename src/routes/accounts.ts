import { Router, Request, Response } from 'express';
import { AccountModel } from '../models/Account';
import { EmailFetcher } from '../services/imap/EmailFetcher';
import { CreateAccountRequest } from '../types/apitypes';
import logger from '../utils/logger';

const router = Router();
const activeFetchers = new Map<number, EmailFetcher>();

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const data: CreateAccountRequest = req.body;

    if (!data.name || !data.host || !data.username || !data.password) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields: name, host, username, password'
      });
      return;
    }

    const account = await AccountModel.create({
      name: data.name,
      host: data.host,
      port: data.port || 993,
      username: data.username,
      password: data.password,
      useTls: data.useTls !== false
    });

    res.status(201).json({
      success: true,
      data: {
        id: account.id,
        name: account.name,
        host: account.host,
        username: account.username,
        status: account.status
      }
    });
  } catch (error) {
    logger.error('Failed to create account:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create account'
    });
  }
});

router.get('/', async (_req: Request, res: Response): Promise<void> => {
  try {
    const accounts = await AccountModel.findAll();

    res.json({
      success: true,
      data: accounts.map(acc => ({
        id: acc.id,
        name: acc.name,
        host: acc.host,
        username: acc.username,
        status: acc.status,
        lastSyncAt: acc.lastSyncAt
      }))
    });
  } catch (error) {
    logger.error('Failed to fetch accounts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch accounts'
    });
  }
});

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const account = await AccountModel.findById(id);

    if (!account) {
      res.status(404).json({
        success: false,
        error: 'Account not found'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        id: account.id,
        name: account.name,
        host: account.host,
        username: account.username,
        status: account.status,
        lastSyncAt: account.lastSyncAt
      }
    });
  } catch (error) {
    logger.error('Failed to fetch account:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch account'
    });
  }
});

router.post('/:id/sync', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);
    const account = await AccountModel.findById(id);

    if (!account) {
      res.status(404).json({
        success: false,
        error: 'Account not found'
      });
      return;
    }

    if (activeFetchers.has(id)) {
      res.status(400).json({
        success: false,
        error: 'Sync already in progress for this account'
      });
      return;
    }

    const fetcher = new EmailFetcher(account);
    activeFetchers.set(id, fetcher);

    fetcher.start().catch(err => {
      logger.error(`Fetcher error for account ${id}:`, err);
      activeFetchers.delete(id);
    });

    res.json({
      success: true,
      message: 'Sync started',
      data: { accountId: id }
    });
  } catch (error) {
    logger.error('Failed to start sync:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start sync'
    });
  }
});

router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);

    if (activeFetchers.has(id)) {
      const fetcher = activeFetchers.get(id);
      await fetcher?.stop();
      activeFetchers.delete(id);
    }

    await AccountModel.delete(id);

    res.json({
      success: true,
      message: 'Account deleted'
    });
  } catch (error) {
    logger.error('Failed to delete account:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete account'
    });
  }
});

export default router;