export interface DLQMessage {
  id: string;
  instanceId?: string;
  originalRoutingKey: string;
  retryCount: number;
  maxRetries: number;
  lastErrorTimestamp: string;
  error: string;
  originalMessage?: any;
  createdAt?: string;
  updatedAt?: string;
}

export interface DLQStats {
  totalMessages: number;
  messagesByInstance: { [key: string]: number };
  messagesByError: { [key: string]: number };
  timeline?: { [key: string]: number };
}

export interface DLQApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  stats?: DLQStats;
  messages?: DLQMessage[];
  messagesCleared?: number;
}

export interface RetryResponse {
  success: boolean;
  message?: string;
  stats?: {
    retried: number;
    failed: number;
  };
} 