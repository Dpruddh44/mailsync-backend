export enum EmailLabel {
  INTERESTED = 'Interested',
  MEETING_BOOKED = 'Meeting Booked',
  NOT_INTERESTED = 'Not Interested',
  SPAM = 'Spam',
  OUT_OF_OFFICE = 'Out of Office'
}

export interface EmailAttachment {
  filename: string;
  contentType: string;
  size: number;
  content?: Buffer;
}

export interface EmailAddress {
  name?: string;
  address: string;
}

export interface Email {
  id: number;
  accountId: number;
  uid: number;
  folder: string;
  messageId?: string;
  threadId?: string;
  from: string;
  to?: string;
  cc?: string;
  subject?: string;
  bodyText?: string;
  bodyHtml?: string;
  snippet?: string;
  date: Date;
  labels: LabelInfo[];
  attachments: EmailAttachment[];
  rawHeaders?: any;
  indexedAt: Date;
  createdAt: Date;
}

export interface LabelInfo {
  label: EmailLabel;
  confidence?: number;
  model?: string;
  timestamp: Date;
}

export interface Account {
  id: number;
  name: string;
  host: string;
  port: number;
  username: string;
  encryptedPassword: string;
  useTls: boolean;
  status: 'active' | 'inactive' | 'error';
  lastSyncAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncState {
  id: number;
  accountId: number;
  folder: string;
  lastUid: number;
  lastSyncAt: Date;
}

export interface SearchFilters {
  accountId?: number;
  folder?: string;
  label?: EmailLabel;
  from?: string;
  to?: string;
  dateFrom?: Date;
  dateTo?: Date;
}