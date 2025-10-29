import esClient from '../../config/elasticsearch';
import { Email, SearchFilters } from '../../types/emailtypes';
import logger from '../../utils/logger';

export class ElasticsearchService {
  private indexName = 'emails';

  async indexEmail(email: Email): Promise<void> {
    try {
      await esClient.index({
        index: this.indexName,
        id: email.id.toString(),
        document: {
          accountId: email.accountId,
          uid: email.uid,
          folder: email.folder,
          messageId: email.messageId,
          threadId: email.threadId,
          from: email.from,
          to: email.to,
          cc: email.cc,
          subject: email.subject,
          bodyText: email.bodyText,
          snippet: email.snippet,
          date: email.date,
          labels: email.labels.map(l => l.label),
          attachments: email.attachments,
          indexedAt: new Date()
        }
      });

      logger.debug(`Indexed email ${email.id} in Elasticsearch`);
    } catch (error) {
      logger.error(`Failed to index email ${email.id}:`, error);
      throw error;
    }
  }

  async search(query: string, filters?: SearchFilters, page = 1, size = 20) {
    try {
      const must: any[] = [];

      if (query) {
        must.push({
          multi_match: {
            query,
            fields: ['subject^3', 'bodyText^2', 'from', 'to'],
            type: 'best_fields',
            operator: 'or'
          }
        });
      }

      if (filters?.accountId) {
        must.push({ term: { accountId: filters.accountId } });
      }

      if (filters?.folder) {
        must.push({ term: { folder: filters.folder } });
      }

      if (filters?.label) {
        must.push({ term: { labels: filters.label } });
      }

      if (filters?.from) {
        must.push({ match: { from: filters.from } });
      }

      if (filters?.to) {
        must.push({ match: { to: filters.to } });
      }

      if (filters?.dateFrom || filters?.dateTo) {
        const range: any = {};
        if (filters.dateFrom) range.gte = filters.dateFrom;
        if (filters.dateTo) range.lte = filters.dateTo;
        must.push({ range: { date: range } });
      }

      const response = await esClient.search({
        index: this.indexName,
        from: (page - 1) * size,
        size,
        body: {
          query: must.length > 0 ? { bool: { must } } : { match_all: {} },
          sort: [{ date: { order: 'desc' } }],
          highlight: {
            fields: {
              subject: {},
              bodyText: {}
            }
          }
        }
      });

      return {
        total: (response.hits.total as any).value || 0,
        page,
        size,
        results: response.hits.hits.map(hit => ({
          id: hit._id,
          score: hit._score,
          ...(hit._source || {}),
          highlight: hit.highlight
        }))
      };
    } catch (error) {
      logger.error('Elasticsearch search error:', error);
      throw error;
    }
  }

  async deleteEmail(emailId: number): Promise<void> {
    try {
      await esClient.delete({
        index: this.indexName,
        id: emailId.toString()
      });
      logger.debug(`Deleted email ${emailId} from Elasticsearch`);
    } catch (error) {
      logger.error(`Failed to delete email ${emailId}:`, error);
    }
  }
}