export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ConversationSession {
  id: string;
  userId: string;
  title: string;
  messages: ConversationMessage[];
  status: 'active' | 'saved';
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  summary: string;
  mood: string;
  sentimentScore: number; // -1.0 to 1.0
  keyThemes: string[];
  actionItems: string[];
  conversationSnippet?: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PersonalInsight {
  id: string;
  userId: string;
  period: string;
  synthesis: string;
  recurringThemes: string[];
  emotionalTrend: string;
  recommendations: string[];
  entryCountAnalyzed: number;
  generatedAt: string;
}

export interface GeminiChatRequest {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  systemContext?: string;
}

export interface GeminiSummarizeRequest {
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export interface GeminiSummarizeResponse {
  title: string;
  summary: string;
  mood: string;
  sentimentScore: number;
  keyThemes: string[];
  actionItems: string[];
}

export interface GeminiInsightRequest {
  journalSummaries: Array<{
    title: string;
    summary: string;
    mood: string;
    keyThemes: string[];
    createdAt: string;
  }>;
}

export interface GeminiInsightResponse {
  period: string;
  synthesis: string;
  recurringThemes: string[];
  emotionalTrend: string;
  recommendations: string[];
}
