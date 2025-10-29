import { query } from '../config/database';
import { encrypt, decrypt } from '../utils/crypto';
import { Account } from '../types/emailtypes';

export class AccountModel {
  static async create(data: {
    name: string;
    host: string;
    port: number;
    username: string;
    password: string;
    useTls: boolean;
  }): Promise<Account> {
    const encryptedPassword = encrypt(data.password);
    
    const result = await query(
      `INSERT INTO accounts (name, host, port, username, encrypted_password, use_tls, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [data.name, data.host, data.port, data.username, encryptedPassword, data.useTls, 'inactive']
    );
    
    return this.mapRow(result.rows[0]);
  }

  static async findById(id: number): Promise<Account | null> {
    const result = await query('SELECT * FROM accounts WHERE id = $1', [id]);
    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  static async findAll(): Promise<Account[]> {
    const result = await query('SELECT * FROM accounts ORDER BY created_at DESC');
    return result.rows.map(this.mapRow);
  }

  static async updateStatus(id: number, status: string, lastSyncAt?: Date): Promise<void> {
    await query(
      'UPDATE accounts SET status = $1, last_sync_at = $2, updated_at = NOW() WHERE id = $3',
      [status, lastSyncAt || new Date(), id]
    );
  }

  static async delete(id: number): Promise<void> {
    await query('DELETE FROM accounts WHERE id = $1', [id]);
  }

  static getDecryptedPassword(account: Account): string {
    return decrypt(account.encryptedPassword);
  }

  private static mapRow(row: any): Account {
    return {
      id: row.id,
      name: row.name,
      host: row.host,
      port: row.port,
      username: row.username,
      encryptedPassword: row.encrypted_password,
      useTls: row.use_tls,
      status: row.status,
      lastSyncAt: row.last_sync_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}