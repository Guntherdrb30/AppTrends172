
export enum AppTheme {
  LIGHT = 'light',
  DARK = 'dark',
}

export enum Language {
  ES = 'es',
  EN = 'en',
}

export enum AspectRatio {
  SQUARE = '1:1',
  PORTRAIT = '9:16',
  LANDSCAPE = '16:9',
  FOUR_FIVE = '4:5',
}

export enum GenerationState {
  IDLE = 'idle',
  RESEARCHING = 'researching',
  GENERATING_IMAGES = 'generating_images',
  GENERATING_VIDEO = 'generating_video',
  COMPLETE = 'complete',
  ERROR = 'error',
}

export interface MusicTrack {
  id: string;
  name: string;
  url: string; // URL to mp3 file
  genre: string;
}

export interface ProductInput {
  images: File[];
  logo: File | null;
  url: string;
  description: string;
  style: string;
  aspectRatio: AspectRatio;
  musicTrackId: string;
  musicVolume: number; // 0 to 1
  voiceVolume: number; // 0 to 1
}

export interface GeneratedAsset {
  id: string;
  type: 'image' | 'video' | 'audio';
  url: string;
  thumbnail?: string;
  subType?: 'voiceover' | 'music';
}

export interface Project {
  id: string;
  name: string;
  date: Date;
  input: ProductInput;
  assets: GeneratedAsset[];
  socialPost?: string; // New field for social media copy
}

export type LiveMessageCallback = (text: string, isUser: boolean) => void;
export type LiveStatusCallback = (isActive: boolean) => void;

// --- AUTH & PAYMENT TYPES ---

export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  credits: number; // 3 free initially
  createdAt: number;
}

export interface AdminConfig {
  whatsappNumber: string; // Number to receive payments
  pricePerCredit: number; // e.g., 1 USD
}
