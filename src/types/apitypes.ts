import { EmailLabel, SearchFilters } from './emailtypes';

export interface CreateAccountRequest {
  name: string;
  host: string;
  port: number;
  username: string;
  password: string;
  useTls?: boolean;
}

export interface UpdateLabelRequest {
  label: EmailLabel;
}

export interface SearchRequest {
  query?: string;
  filters?: SearchFilters;
  page?: number;
  size?: number;
}

export interface SearchResponse {
  total: number;
  page: number;
  size: number;
  results: any[];
}

export interface SuggestReplyRequest {
  emailId: number;
}

export interface SuggestReplyResponse {
  suggestedReply: string;
  context: string[];
  model: string;
}

export interface WebhookConfigRequest {
  slackWebhook?: string;
  webhookSiteUrl?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}