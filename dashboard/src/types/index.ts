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
