import { ImapFlow } from 'imapflow';
import { Account } from '../../types/emailtypes';
import { AccountModel } from '../../models/Account';
import logger from '../../utils/logger';

export class ImapConnection {
  private client: ImapFlow | null = null;
  private account: Account;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(account: Account) {
    this.account = account;
  }

  async connect(): Promise<void> {
    try {
      const password = AccountModel.getDecryptedPassword(this.account);

      this.client = new ImapFlow({
        host: this.account.host,
        port: this.account.port,
        secure: this.account.useTls,
        auth: {
          user: this.account.username,
          pass: password
        },
        logger: false
      });

      await this.client.connect();
      logger.info(`IMAP connected: ${this.account.username}`);

      await AccountModel.updateStatus(this.account.id, 'active', new Date());
      this.reconnectAttempts = 0;

      this.client.on('close', () => {
        logger.warn(`IMAP connection closed: ${this.account.username}`);
        this.handleReconnect();
      });

      this.client.on('error', (err) => {
        logger.error(`IMAP error for ${this.account.username}:`, err);
      });

    } catch (error) {
      logger.error(`Failed to connect IMAP for ${this.account.username}:`, error);
      await AccountModel.updateStatus(this.account.id, 'error');
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.logout();
      this.client = null;
      logger.info(`IMAP disconnected: ${this.account.username}`);
    }
  }

  async selectMailbox(folder: string): Promise<void> {
    if (!this.client) throw new Error('IMAP client not connected');
    await this.client.mailboxOpen(folder);
  }

  async startIdle(folder: string, onNewMail: () => void): Promise<void> {
    if (!this.client) throw new Error('IMAP client not connected');

    await this.selectMailbox(folder);

    this.client.on('exists', async () => {
      logger.info(`New email detected in ${folder} for ${this.account.username}`);
      onNewMail();
    });

    await this.client.idle();
  }

  async fetchMessages(folder: string, range: string) {
    if (!this.client) throw new Error('IMAP client not connected');
    
    await this.selectMailbox(folder);
    
    const messages = [];
    for await (const msg of this.client.fetch(range, {
      envelope: true,
      bodyStructure: true,
      source: true,
      uid: true
    })) {
      messages.push(msg);
    }
    
    return messages;
  }

  getClient(): ImapFlow | null {
    return this.client;
  }

  private async handleReconnect(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error(`Max reconnect attempts reached for ${this.account.username}`);
      await AccountModel.updateStatus(this.account.id, 'error');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    logger.info(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        logger.error(`Reconnection failed for ${this.account.username}:`, error);
      }
    }, delay);
  }
}