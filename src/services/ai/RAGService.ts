import qdrantClient from '../../config/qdrant';
import { GeminiService } from './gservice';
import { Email } from '../../types/emailtypes';
import logger from '../../utils/logger';

export class RAGService {
  private geminiService: GeminiService;
  private collectionName = 'email_context';

  constructor() {
    this.geminiService = new GeminiService();
  }

  async storeEmailContext(email: Email): Promise<void> {
    try {
      const contextText = `
Subject: ${email.subject}
From: ${email.from}
Date: ${email.date}
Body: ${email.bodyText?.substring(0, 2000)}
`;

      const embedding = await this.geminiService.generateEmbedding(contextText);

      await qdrantClient.upsert(this.collectionName, {
        points: [
          {
            id: email.id,
            vector: embedding,
            payload: {
              emailId: email.id,
              accountId: email.accountId,
              from: email.from,
              subject: email.subject,
              snippet: email.snippet,
              date: email.date.toISOString()
            }
          }
        ]
      });

      logger.debug(`Stored email ${email.id} in vector database`);
    } catch (error) {
      logger.error(`Failed to store email ${email.id} in Qdrant:`, error);
    }
  }

  async findSimilarEmails(email: Email, limit = 5): Promise<Email[]> {
    try {
      const queryText = `${email.subject} ${email.bodyText?.substring(0, 500)}`;
      const queryEmbedding = await this.geminiService.generateEmbedding(queryText);

      const searchResult = await qdrantClient.search(this.collectionName, {
        vector: queryEmbedding,
        limit,
        filter: {
          must: [
            {
              key: 'accountId',
              match: { value: email.accountId }
            }
          ],
          must_not: [
            {
              key: 'emailId',
              match: { value: email.id }
            }
          ]
        }
      });

      return searchResult.map(result => result.payload as any);
    } catch (error) {
      logger.error('Failed to find similar emails:', error);
      return [];
    }
  }

  async generateContextualReply(email: Email): Promise<string> {
    try {
      const similarEmails = await this.findSimilarEmails(email, 3);

      const context = similarEmails.map(e => 
        `Subject: ${e.subject}\nFrom: ${e.from}\nSnippet: ${e.snippet}`
      );

      const reply = await this.geminiService.generateReply(email, context);

      return reply;
    } catch (error) {
      logger.error('Failed to generate contextual reply:', error);
      throw error;
    }
  }
}