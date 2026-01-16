export type Language = 'en' | 'ar' | 'fr';

export interface Story {
  id: string;
  // We use Partial because a story might only exist in Arabic
  title: Partial<Record<Language, string>>;
  description: Partial<Record<Language, string>>;
  availableLanguages: Language[]; // Explicitly track which languages are active
  coverImage: string;
  pdfUrl: string;
  content?: string;
  ageGroup: '3-5' | '6-8' | '9-12';
  // "language" field below is for the legacy category display, 
  // but logic should rely on availableLanguages
  categoryLabel: 'Arabic' | 'English' | 'French' | 'Bilingual' | 'Trilingual';
  tags: string[];
  pages?: string[]; // Array of image URLs for Image Mode
  categories?: string[]; // Array of Category IDs
  views: number;
  downloads: number;
}

export interface Category {
  id: string;
  name: Partial<Record<Language, string>>;
  description: Partial<Record<Language, string>>;
}

export interface Subscriber {
  id: string;
  name: string;
  email: string;
  ageGroupPreference: string;
  languagePreference: Language;
  subscribedAt: string;
}

export interface DesignElement {
  id: string;
  type: 'sticker' | 'text' | 'image';
  content: string;
  x: number;
  y: number;
  scale: number;
  zIndex?: number;
}

export interface AnalyticsData {
  name: string;
  views: number;
  downloads: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  points?: number;
  level?: number;
  avatar?: string;
}