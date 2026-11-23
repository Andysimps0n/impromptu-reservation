import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SECRET_KEY // anon key 또는 service_role key
const supabase = createClient(supabaseUrl, supabaseKey);


export default supabase