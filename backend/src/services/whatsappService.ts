import axios from 'axios';
import { env } from '../config/env';
import { logger } from '../config/logger';

export const whatsappService = {
  async sendMessage(mobile: string, message: string) {
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: mobile,
      type: 'text',
      text: { body: message }
    };

    const response = await axios.post(
      `https://graph.facebook.com/v19.0/${env.WHATSAPP_PHONE_ID}/messages`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${env.WHATSAPP_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    logger.info('Outgoing WhatsApp message sent', { mobile, messageId: response.data?.messages?.[0]?.id });
    return response.data;
  }
};
