import  {pool}  from '../config/database';
import  logger  from '../utils/logger';

export interface EmailData {
  accountId: number;
  uid: number;
  folder: string;
  messageId: string;
  threadId?: string;
  fromAddress: string;
  toAddress?: string;
  ccAddress?: string;
  subject: string;
  bodyText?: string;
  bodyHtml?: string;
  snippet?: string;
  date: Date;
  attachments?: any[];
  rawHeaders?: any;
  labels?: string[];
}

export class Email {
  /**
   * Create a new email
   */
  static async create(data: EmailData): Promise<any> {
    const query = `
      INSERT INTO emails (
        account_id, uid, folder, message_id, thread_id,
        from_address, to_address, cc_address, subject,
        body_text, body_html, snippet, date, attachments, raw_headers, labels
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      ON CONFLICT (account_id, folder, uid) DO UPDATE SET
        message_id = EXCLUDED.message_id,
        subject = EXCLUDED.subject,
        body_text = EXCLUDED.body_text,
        body_html = EXCLUDED.body_html,
        snippet = EXCLUDED.snippet,
        date = EXCLUDED.date
      RETURNING *
    `;

    const values = [
      data.accountId,
      data.uid,
      data.folder,
      data.messageId,
      data.threadId || data.messageId,
      data.fromAddress,
      data.toAddress || '',
      data.ccAddress || '',
      data.subject,
      data.bodyText || '',
      data.bodyHtml || '',
      data.snippet || '',
      data.date,
      JSON.stringify(data.attachments || []),
      JSON.stringify(data.rawHeaders || {}),
      JSON.stringify(data.labels || []),
    ];

    try {
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      logger.error(`Error creating email: ${error}`);
      throw error;
    }
  }

  /**
   * Get last synced UID for an account and folder
   */
  static async getLastSyncedUid(accountId: number, folder: string): Promise<number> {
    const query = `
      SELECT last_uid FROM sync_state
      WHERE account_id = $1 AND folder = $2
    `;

    try {
      const result = await pool.query(query, [accountId, folder]);
      if (result.rows.length > 0) {
        return result.rows[0].last_uid;
      }
      return 0;
    } catch (error) {
      logger.error(`Error getting last synced UID: ${error}`);
      return 0;
    }
  }

  /**
   * Update sync state
   */
  static async updateSyncState(accountId: number, folder: string, uid: number): Promise<void> {
    const query = `
      INSERT INTO sync_state (account_id, folder, last_uid, last_sync_at)
      VALUES ($1, $2, $3, NOW())
      ON CONFLICT (account_id, folder) DO UPDATE SET
        last_uid = GREATEST(sync_state.last_uid, EXCLUDED.last_uid),
        last_sync_at = NOW()
    `;

    try {
      await pool.query(query, [accountId, folder, uid]);
    } catch (error) {
      logger.error(`Error updating sync state: ${error}`);
      throw error;
    }
  }

  /**
   * Find all emails
   */
  static async findAll(filters: any = {}): Promise<any[]> {
    let query = 'SELECT * FROM emails WHERE 1=1';
    const values: any[] = [];
    let paramCount = 1;

    if (filters.accountId) {
      query += ` AND account_id = $${paramCount}`;
      values.push(filters.accountId);
      paramCount++;
    }

    if (filters.folder) {
      query += ` AND folder = $${paramCount}`;
      values.push(filters.folder);
      paramCount++;
    }

    if (filters.label) {
      query += ` AND labels::jsonb @> $${paramCount}::jsonb`;
      values.push(JSON.stringify([filters.label]));
      paramCount++;
    }

    query += ' ORDER BY date DESC';

    if (filters.limit) {
      query += ` LIMIT $${paramCount}`;
      values.push(filters.limit);
      paramCount++;
    }

    if (filters.offset) {
      query += ` OFFSET $${paramCount}`;
      values.push(filters.offset);
    }

    try {
      const result = await pool.query(query, values);
      return result.rows;
    } catch (error) {
      logger.error(`Error finding emails: ${error}`);
      throw error;
    }
  }

  /**
   * Find email by ID
   */
  static async findById(id: number): Promise<any> {
    const query = 'SELECT * FROM emails WHERE id = $1';
    try {
      const result = await pool.query(query, [id]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error(`Error finding email by ID: ${error}`);
      throw error;
    }
  }

  /**
   * Add label to email
   */
  static async addLabel(id: number, label: string): Promise<void> {
    const query = `
      UPDATE emails
      SET labels = CASE
        WHEN labels::jsonb ? $2 THEN labels
        ELSE (labels::jsonb || $3::jsonb)::text::jsonb
      END
      WHERE id = $1
    `;

    try {
      await pool.query(query, [id, label, JSON.stringify([label])]);
    } catch (error) {
      logger.error(`Error adding label: ${error}`);
      throw error;
    }
  }

  /**
   * Remove label from email
   */
  static async removeLabel(id: number, label: string): Promise<void> {
    const query = `
      UPDATE emails
      SET labels = (
        SELECT jsonb_agg(elem)
        FROM jsonb_array_elements(labels::jsonb) elem
        WHERE elem::text != $2::jsonb::text
      )
      WHERE id = $1
    `;

    try {
      await pool.query(query, [id, JSON.stringify(label)]);
    } catch (error) {
      logger.error(`Error removing label: ${error}`);
      throw error;
    }
  }

  /**
   * Count total emails
   */
  static async count(filters: any = {}): Promise<number> {
    let query = 'SELECT COUNT(*) FROM emails WHERE 1=1';
    const values: any[] = [];
    let paramCount = 1;

    if (filters.accountId) {
      query += ` AND account_id = $${paramCount}`;
      values.push(filters.accountId);
      paramCount++;
    }

    if (filters.folder) {
      query += ` AND folder = $${paramCount}`;
      values.push(filters.folder);
      paramCount++;
    }

    try {
      const result = await pool.query(query, values);
      return parseInt(result.rows[0].count);
    } catch (error) {
      logger.error(`Error counting emails: ${error}`);
      return 0;
    }
  }
}