import { GoogleGenerativeAI } from '@google/generative-ai';
import  logger  from '../../utils/logger';
import config from '../../config/env';

export class ClassificationService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor() {
    this.genAI = new GoogleGenerativeAI(config.geminiApiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
  }

  /**
   * Classify email into categories
   */
  async classifyEmail(
    subject: string,
    body: string
  ): Promise<{ label: string; confidence: number }> {
    try {
      const prompt = `
You are an email classification AI. Analyze the following email and classify it into ONE of these categories:
- Interested
- Meeting Booked
- Not Interested
- Spam
- Out of Office

Subject: ${subject}
Body: ${body.substring(0, 500)}

Return ONLY a JSON object with this exact format:
{
  "label": "category_name",
  "confidence": 0.85
}

Rules:
- "Interested" = Lead shows interest, asks questions, wants to know more
- "Meeting Booked" = Contains meeting confirmations, calendar invites, scheduled time
- "Not Interested" = Polite rejection, not interested, unsubscribe requests
- "Spam" = Promotional, marketing, unsolicited bulk emails
- "Out of Office" = Auto-reply, vacation message, unavailable notice
`;

      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          label: parsed.label || 'Not Interested',
          confidence: parsed.confidence || 0.5,
        };
      }

      // Fallback
      logger.warn(`Failed to parse classification response: ${text}`);
      return { label: 'Not Interested', confidence: 0.5 };
    } catch (error) {
      logger.error(`Error classifying email: ${error}`);
      return { label: 'Not Interested', confidence: 0.0 };
    }
  }
}