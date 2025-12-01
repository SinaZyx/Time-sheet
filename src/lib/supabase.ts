import { createClient } from '@supabase/supabase-js';

// Utiliser les variables d'environnement ou fallback sur les valeurs par défaut
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://trzjwipxrftkdhvyzmbi.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyemp3aXB4cmZ0a2Rodnl6bWJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMzYwMjgsImV4cCI6MjA3OTkxMjAyOH0.tzG9P_ealuJRgLB0zYyH-38c8RDQsWgy_4mSrKcjUd0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
