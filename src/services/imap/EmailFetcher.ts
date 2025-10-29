import { Client } from '@elastic/elasticsearch';
import  logger  from '../../utils/logger';
import config from '../../config/elasticsearch';

const INDEX_NAME = 'emails';

export class ElasticsearchService {
  private client: Client;

  constructor() {
    // Cast config.nodes to any to satisfy the Client constructor type
    this.client = new Client({ node: config.node as any });
  }

  /**
   * Initialize Elasticsearch index
   */
  async initialize(): Promise<void> {
    try {
      const indexExists = await this.client.indices.exists({ index: INDEX_NAME });

      if (!indexExists) {
        await this.client.indices.create({
          index: INDEX_NAME,
          body: {
            mappings: {
              properties: {
                id: { type: 'integer' },
                accountId: { type: 'integer' },
                uid: { type: 'integer' },
                folder: { type: 'keyword' },
                messageId: { type: 'keyword' },
                threadId: { type: 'keyword' },
                fromAddress: { type: 'text' },
                toAddress: { type: 'text' },
                ccAddress: { type: 'text' },
                subject: { type: 'text' },
                bodyText: { type: 'text' },
                bodyHtml: { type: 'text' },
                snippet: { type: 'text' },
                date: { type: 'date' },
                labels: { type: 'keyword' },
                attachments: { type: 'object' },
              },
            },
          },
        });
        logger.info('Elasticsearch index created');
      }
    } catch (error) {
      logger.error(`Elasticsearch initialization error: ${error}`);
      throw error;
    }
  }

  /**
   * Index an email
   */
  async indexEmail(email: any): Promise<void> {
    try {
      await this.client.index({
        index: INDEX_NAME,
        id: email.id.toString(),
        document: email,
      });
      logger.info(`Email ${email.id} indexed in Elasticsearch`);
    } catch (error) {
      logger.error(`Error indexing email: ${error}`);
      throw error;
    }
  }

  /**
   * Update email labels
   */
  async updateEmailLabels(emailId: number, labels: string[]): Promise<void> {
    try {
      await this.client.update({
        index: INDEX_NAME,
        id: emailId.toString(),
        doc: {
          labels: labels,
        },
      });
      logger.info(`Email ${emailId} labels updated in Elasticsearch`);
    } catch (error) {
      logger.error(`Error updating email labels: ${error}`);
      throw error;
    }
  }

  /**
   * Search emails
   */
  async searchEmails(query: string, filters: any = {}, page = 1, size = 20): Promise<any> {
    try {
      const must: any[] = [];

      // Text search
      if (query) {
        must.push({
          multi_match: {
            query: query,
            fields: ['subject^3', 'bodyText^2', 'fromAddress', 'toAddress'],
          },
        });
      }

      // Account filter
      if (filters.accountId) {
        must.push({ term: { accountId: filters.accountId } });
      }

      // Folder filter
      if (filters.folder) {
        must.push({ term: { folder: filters.folder } });
      }

      // Label filter
      if (filters.label) {
        must.push({ term: { labels: filters.label } });
      }

      const response = await this.client.search({
        index: INDEX_NAME,
        from: (page - 1) * size,
        size: size,
        body: {
          query: {
            bool: {
              must: must.length > 0 ? must : [{ match_all: {} }],
            },
          },
          sort: [{ date: { order: 'desc' } }],
        },
      });

      return {
        total: response.hits.total,
        hits: response.hits.hits.map((hit: any) => hit._source),
      };
    } catch (error) {
      logger.error(`Elasticsearch search error: ${error}`);
      throw error;
    }
  }
}