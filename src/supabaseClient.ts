import { createClient } from '@supabase/supabase-js';

// Substitua pelos dados que você pegou no painel do Supabase
const supabaseUrl = 'SUA_URL_AQUI';
const supabaseKey = 'SUA_CHAVE_ANON_AQUI';

export const supabase = createClient(supabaseUrl, supabaseKey);