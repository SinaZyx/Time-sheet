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

// Charger depuis les variables d'environnement (aucun fallback pour éviter de cibler le mauvais projet)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase non configuré : définis VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY');
}

// Clé de stockage distincte pour éviter les collisions dev/prod dans le localStorage
const isDev = import.meta.env.DEV;
const storageKey = isDev ? 'time-sheet-auth-dev' : 'time-sheet-auth-prod';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
        storageKey,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
    },
});
