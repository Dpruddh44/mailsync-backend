import { GoogleGenerativeAI } from '@google/generative-ai';
import config from '../../config/env';

const genAI = new GoogleGenerativeAI(config.geminiApiKey);

export const generateReply = async (context: string, emailContent: string): Promise<string> => {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  const prompt = `
You are an AI assistant helping to draft email replies.

Context/Background:
${context}

Email received:
${emailContent}

Generate a professional, concise reply based on the context provided.
`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
};