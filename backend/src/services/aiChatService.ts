import axios from 'axios';
import { prisma } from '../database/prisma';

export const aiChatService = {
  async generateReply(conversationId: number, prompt: string) {
    const conversation = await prisma.conversation.findUnique({ where: { id: conversationId } });
    const context = Array.isArray(conversation?.contextMemory) ? conversation.contextMemory : [];

    if (!process.env.OPENAI_API_KEY) {
      return 'AI service is not configured for this tenant.';
    }

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a WhatsApp automation assistant.' },
          ...context,
          { role: 'user', content: prompt }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const reply = response.data?.choices?.[0]?.message?.content ?? 'Sorry, I could not generate a response.';

    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        contextMemory: [...context, { role: 'user', content: prompt }, { role: 'assistant', content: reply }].slice(-20)
      }
    });

    return reply;
  }
};
