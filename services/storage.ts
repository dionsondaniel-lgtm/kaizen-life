import { AppState, User, QuickCard, LinkItem, Transaction, Reminder, AdminSettings, Habit } from '../types';

const STORAGE_KEY = 'kaizen_app_db_v1';

const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  gcashQr: null,
  rcbcQr: null,
  donationMessage: "Support the developer (Optional)",
};

const DEFAULT_CARDS: QuickCard[] = [
  { id: '1', title: 'Google', url: 'https://google.com', color: 'bg-blue-500' },
  { id: '2', title: 'YouTube', url: 'https://youtube.com', color: 'bg-red-600' },
  { id: '3', title: 'ChatGPT', url: 'https://chat.openai.com', color: 'bg-emerald-600' },
];

const DEFAULT_HABITS: Habit[] = [
  { id: '1', title: 'Drink Water', color: 'bg-blue-500', history: [], createdAt: Date.now() },
  { id: '2', title: 'Read 10 Mins', color: 'bg-purple-500', history: [], createdAt: Date.now() }
];

const DEFAULT_STATE: AppState = {
  currentUser: null,
  cards: DEFAULT_CARDS,
  links: [],
  transactions: [],
  reminders: [],
  habits: DEFAULT_HABITS,
  adminSettings: DEFAULT_ADMIN_SETTINGS,
};

export const loadState = (): AppState => {
  try {
    const serialized = localStorage.getItem(STORAGE_KEY);
    if (!serialized) {
      return DEFAULT_STATE;
    }
    const loaded = JSON.parse(serialized);
    return {
      ...DEFAULT_STATE,
      ...loaded,
      // Ensure habits exist if loading from older state version
      habits: loaded.habits || DEFAULT_HABITS,
      currentUser: loaded.currentUser ? {
        ...DEFAULT_STATE.currentUser,
        ...loaded.currentUser,
        preferences: {
          ...DEFAULT_STATE.currentUser?.preferences,
          ...loaded.currentUser.preferences
        }
      } : null
    };
  } catch (e) {
    console.error("Failed to load state", e);
    return DEFAULT_STATE;
  }
};

export const saveState = (state: AppState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save state", e);
  }
};

export const formatPascalCase = (str: string) => {
  return str.replace(/(\w)(\w*)/g,
    (g0, g1, g2) => g1.toUpperCase() + g2.toLowerCase());
};

export const getCurrencySymbol = (currency: string) => {
  switch (currency) {
    case 'PHP': return '₱';
    case 'USD': return '$';
    case 'EUR': return '€';
    case 'JPY': return '¥';
    case 'GBP': return '£';
    case 'AUD': return 'A$';
    case 'CAD': return 'C$';
    case 'SGD': return 'S$';
    default: return currency;
  }
};

// Simulation of "Auth"
export const loginUser = (email: string, appState: AppState): User | null => {
  // In a real app, this would verify password. 
  // Here we just check if a user exists in our "local db" concept.
  // Since we only store 'currentUser' in this simple schema, 
  // we assume if the email matches the current user, they login.
  // If no user exists, we return null (need register).
  if (appState.currentUser && appState.currentUser.email === email) {
    // Ensure new properties exist for older users in storage
    if (!appState.currentUser.preferences.background) {
      appState.currentUser.preferences.background = 'default';
    }
    return appState.currentUser;
  }
  // Admin Backdoor
  if (email === 'admin@kaizen.com') {
    return {
      id: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@kaizen.com',
      isAdmin: true,
      preferences: { 
        theme: 'dark', 
        colorTheme: 'blue', 
        currency: 'PHP', 
        language: 'en',
        background: 'default' 
      }
    };
  }
  return null;
};