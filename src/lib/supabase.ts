import { createClient } from '@supabase/supabase-js';

// Types pour la base de données
export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string;
                    role: 'employee' | 'admin';
                    email: string | null;
                    full_name: string | null;
                    created_at: string;
                    updated_at: string;
                };
                Insert: {
                    id: string;
                    role?: 'employee' | 'admin';
                    email?: string | null;
                    full_name?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
                Update: {
                    id?: string;
                    role?: 'employee' | 'admin';
                    email?: string | null;
                    full_name?: string | null;
                    created_at?: string;
                    updated_at?: string;
                };
            };
            timesheets: {
                Row: {
                    id: number;
                    user_id: string;
                    week_start_date: string;
                    grid_data: boolean[][];
                    updated_at: string;
                };
                Insert: {
                    id?: number;
                    user_id: string;
                    week_start_date: string;
                    grid_data: boolean[][];
                    updated_at?: string;
                };
                Update: {
                    id?: number;
                    user_id?: string;
                    week_start_date?: string;
                    grid_data?: boolean[][];
                    updated_at?: string;
                };
            };
        };
    };
}

// Utiliser les variables d'environnement ou fallback sur les valeurs par défaut
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://trzjwipxrftkdhvyzmbi.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyemp3aXB4cmZ0a2Rodnl6bWJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMzYwMjgsImV4cCI6MjA3OTkxMjAyOH0.tzG9P_ealuJRgLB0zYyH-38c8RDQsWgy_4mSrKcjUd0';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
