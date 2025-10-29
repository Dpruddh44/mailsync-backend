import axios from 'axios';
import config from '../../config/env';
import logger from '../../utils/logger';

interface InterestedEmailData {
  emailId: number;
  subject: string;
  from: string;
  snippet: string;
  classification: string;
  confidence: number;
}

export class NotificationService {
  /**
   * Send notifications when an "Interested" email is received
   */
  async sendInterestedNotification(data: InterestedEmailData): Promise<void> {
    // Send to Slack
    if (config.slackWebhookUrl) {
      await this.sendSlackNotification(data);
    }

    // Send to Webhook.site
    if (config.webhookSiteUrl) {
      await this.sendWebhook(data);
    }
  }

  /**
   * Send Slack notification
   */
  private async sendSlackNotification(data: InterestedEmailData): Promise<void> {
    try {
      const message = {
        text: `🎯 *New Interested Lead!*`,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '🎯 New Interested Email Received',
              emoji: true,
            },
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*From:*\n${data.from}`,
              },
              {
                type: 'mrkdwn',
                text: `*Classification:*\n${data.classification} (${(data.confidence * 100).toFixed(0)}% confidence)`,
              },
            ],
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Subject:*\n${data.subject}`,
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Preview:*\n${data.snippet}`,
            },
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `Email ID: ${data.emailId} | Timestamp: ${new Date().toISOString()}`,
              },
            ],
          },
        ],
      };

      await axios.post(config.slackWebhookUrl, message);
      logger.info(`Slack notification sent for email ${data.emailId}`);
    } catch (error) {
      logger.error(`Error sending Slack notification: ${error}`);
    }
  }

  /**
   * Send webhook to external service
   */
  private async sendWebhook(data: InterestedEmailData): Promise<void> {
    try {
      const payload = {
        event: 'email.interested',
        timestamp: new Date().toISOString(),
        data: {
          emailId: data.emailId,
          subject: data.subject,
          from: data.from,
          snippet: data.snippet,
          classification: data.classification,
          confidence: data.confidence,
        },
      };

      await axios.post(config.webhookSiteUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      logger.info(`Webhook sent for email ${data.emailId}`);
    } catch (error) {
      logger.error(`Error sending webhook: ${error}`);
    }
  }
}