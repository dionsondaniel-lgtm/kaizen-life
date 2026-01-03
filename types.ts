export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  isAdmin: boolean;
  preferences: {
    theme: 'light' | 'dark';
    colorTheme: 'blue' | 'violet' | 'emerald' | 'orange';
    currency: 'PHP' | 'USD' | 'EUR' | 'JPY' | 'GBP' | 'AUD' | 'CAD' | 'SGD';
    language: 'en' | 'fil' | 'ceb';
    background: 'default' | 'ocean' | 'sunset' | 'forest' | 'royal' | 'midnight';
  };
}

export interface QuickCard {
  id: string;
  title: string;
  url: string;
  color: string;
  icon?: string;
}

export interface LinkItem {
  id: string;
  title: string;
  url: string;
  category: string;
  tags: string[];
  isFavorite: boolean;
  createdAt: number;
}

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: string; // ISO string
}

export interface Reminder {
  id: string;
  title: string;
  date: string;
  completed: boolean;
}

export interface Habit {
  id: string;
  title: string;
  color: string;
  history: string[]; // Array of YYYY-MM-DD strings indicating completion
  createdAt: number;
}

export interface AdminSettings {
  gcashQr: string | null; // Base64
  rcbcQr: string | null; // Base64
  donationMessage: string;
}

export interface Feedback {
  userId: string;
  userName: string;
  message: string;
  type: 'suggestion' | 'bug' | 'other';
  date: string;
}

export interface AppState {
  currentUser: User | null;
  cards: QuickCard[];
  links: LinkItem[];
  transactions: Transaction[];
  reminders: Reminder[];
  habits: Habit[];
  adminSettings: AdminSettings;
}