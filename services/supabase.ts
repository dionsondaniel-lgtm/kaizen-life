import { createClient, SupabaseClient } from '@supabase/supabase-js';

// These environment variables must be set in your .env file
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

// Conditionally create the client. If keys are missing, supabase will be null.
export const supabase: SupabaseClient | null = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

/**
 * Checks if a user file already exists in the bucket without downloading it.
 * Used to prevent duplicate account creation.
 * @param filenameKey The formatted filename (e.g., "dionsondaniel_gmail_com")
 */
export const checkUserExists = async (filenameKey: string): Promise<boolean> => {
  if (!supabase) return false;

  try {
    // We search for the specific file prefix in the bucket
    const { data, error } = await supabase.storage
      .from('kaizenusers')
      .list('', {
        limit: 1,
        search: filenameKey, 
      });

    if (error) {
      console.error('Supabase check error:', error);
      return false;
    }

    // Ensure we found an exact match for the json file
    const targetFile = `${filenameKey}.json`;
    return data ? data.some((file) => file.name === targetFile) : false;
  } catch (err) {
    console.warn('Error checking user existence:', err);
    return false;
  }
};

/**
 * Uploads the user backup file.
 * Modified to accept the specific filename identifier directly to match the checkUserExists logic.
 */
export const uploadUserBackup = async (file: File, identifier: string) => {
  if (!supabase) return { data: null, error: new Error("Supabase not configured") };

  // Ensure the filename ends with .json
  const fileName = identifier.endsWith('.json') ? identifier : `${identifier}.json`;
  
  const { data, error } = await supabase.storage
    .from('kaizenusers')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true // We allow upsert here, but the AuthPage logic prevents reaching this if it exists
    });

  return { data, error };
};

export const uploadFeedback = async (feedbackData: any, userId: string) => {
  if (!supabase) return { data: null, error: new Error("Supabase not configured") };

  const timestamp = new Date().getTime();
  const fileName = `feedback_${userId}_${timestamp}.json`;
  const blob = new Blob([JSON.stringify(feedbackData, null, 2)], { type: 'application/json' });

  const { data, error } = await supabase.storage
    .from('kaizenfeedback')
    .upload(fileName, blob, {
      cacheControl: '3600',
      upsert: false
    });

  return { data, error };
};

// --- Admin Helper Functions ---

export const fetchBucketFiles = async (bucketName: 'kaizenusers' | 'kaizenfeedback') => {
  if (!supabase) return { data: [], error: new Error("Supabase not configured") };
  
  const { data, error } = await supabase.storage
    .from(bucketName)
    .list('', { limit: 100, sortBy: { column: 'created_at', order: 'desc' } });
    
  return { data, error };
};

export const getFileContent = async (bucketName: 'kaizenusers' | 'kaizenfeedback', path: string) => {
  if (!supabase) return { data: null, error: new Error("Supabase not configured") };

  const { data, error } = await supabase.storage
    .from(bucketName)
    .download(path);

  if (error || !data) return { data: null, error };

  try {
    const text = await data.text();
    const json = JSON.parse(text);
    return { data: json, error: null };
  } catch (e) {
    return { data: null, error: e };
  }
};