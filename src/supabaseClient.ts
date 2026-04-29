import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jbapenfzejagwvkbnbdf.supabase.co/rest/v1/'; 
const supabaseKey = 'sb_publishable_lJxItVLxxcBK5_7uVae5mw_aiBendbe';

export const supabase = createClient(supabaseUrl, supabaseKey);