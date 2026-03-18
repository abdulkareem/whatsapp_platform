export interface AppRecord {
  id: number;
  name: string;
  keyword: string;
  endpoint: string;
  apiKey: string;
  rateLimitRpm: number;
  isActive: boolean;
  sessionEnabled: boolean;
  sessionTimeoutMinutes: number;
  keywordRequired: boolean;
  defaultApp: boolean;
  fallbackMessage?: string | null;
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

export interface WhatsAppLocation {
  latitude?: number | string;
  longitude?: number | string;
  name?: string;
  address?: string;
}

export interface WhatsAppInboundPayload {
  object?: string;
  entry?: Array<{
    changes?: Array<{
      value?: {
        contacts?: Array<{
          wa_id?: string;
        }>;
        statuses?: Array<{
          id?: string;
          status?: string;
        }>;
        messages?: Array<{
          id?: string;
          type?: string;
          from?: string;
          text?: { body?: string };
          button?: { text?: string; payload?: string };
          interactive?: {
            button_reply?: { title?: string };
            list_reply?: { title?: string };
            nfm_reply?: {
              body?: string;
              response_json?: string;
            };
          };
          image?: { caption?: string };
          video?: { caption?: string };
          document?: { caption?: string };
          location?: WhatsAppLocation;
          timestamp?: string;
        }>;
      };
    }>;
  }>;
  messages?: Array<{
    id?: string;
    type?: string;
    from?: string;
    text?: { body?: string };
    button?: { text?: string; payload?: string };
    interactive?: {
      button_reply?: { title?: string };
      list_reply?: { title?: string };
      nfm_reply?: {
        body?: string;
        response_json?: string;
      };
    };
    image?: { caption?: string };
    video?: { caption?: string };
    document?: { caption?: string };
    location?: WhatsAppLocation;
  }>;
}
