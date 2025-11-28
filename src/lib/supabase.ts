import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://trzjwipxrftkdhvyzmbi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyemp3aXB4cmZ0a2Rodnl6bWJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMzYwMjgsImV4cCI6MjA3OTkxMjAyOH0.tzG9P_ealuJRgLB0zYyH-38c8RDQsWgy_4mSrKcjUd0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
