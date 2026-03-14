export interface AppRecord {
  id: number;
  name: string;
  keyword: string;
  endpoint: string;
  apiKey: string;
  rateLimitRpm: number;
  isActive: boolean;
}

export interface MessageLog {
  id: number;
  mobile: string;
  message: string;
  direction: string;
  app: string;
  status: string;
  createdAt: string;
}

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
