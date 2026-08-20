import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jgpklwlzxvlisiktgkzu.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpncGtsd2x6eHZsaXNpa3Rna3p1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwNDAxODQsImV4cCI6MjA3MTYxNjE4NH0.jXhT5n4lH8O1V1_e_K1F7-v8t8hV8_t8y8y8y8y8y8y';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
