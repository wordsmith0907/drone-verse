import { createClient } from '@supabase/supabase-js';

const url = 'https://xfyeupjlstfsxlccpltq.supabase.co';
const anonKey = 'sb_publishable_OYrzBndEI8AiRdykSOpNmA_3P0vMgwJ';

const supabase = createClient(url, anonKey);

async function testConnection() {
  try {
    console.log('Testing connection to:', url);
    const { data, error } = await supabase.auth.getSession();
    console.log('Auth getSession response error:', error ? error.message : 'none');
    console.log('Session data:', data);

    // Test querying profiles table
    const { data: profiles, error: profileErr } = await supabase.from('profiles').select('*').limit(1);
    console.log('Profiles query response:');
    console.log('  Data:', profiles);
    console.log('  Error:', profileErr ? `${profileErr.code} - ${profileErr.message}` : 'none');
  } catch (err) {
    console.error('Test error:', err);
  }
}

testConnection();
