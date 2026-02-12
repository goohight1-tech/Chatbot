export enum ChatMode {
  Standard = 'Standard Chat (Gemini 3 Pro)',
  SearchGrounded = 'Search Grounded (Gemini 3 Flash)',
  FastResponse = 'Fast Response (Gemini Flash Lite)',
}

export interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  imageUrl?: string;
  sources?: string[];
  timestamp: Date;
}

export interface ToolSource {
  uri: string;
  title?: string;
}