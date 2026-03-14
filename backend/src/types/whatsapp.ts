export interface WhatsAppInboundPayload {
  entry?: Array<{
    changes?: Array<{
      value?: {
        messages?: Array<{
          id?: string;
          from?: string;
          text?: { body?: string };
          timestamp?: string;
        }>;
      };
    }>;
  }>;
  messages?: Array<{
    from?: string;
    text?: { body?: string };
  }>;
}
