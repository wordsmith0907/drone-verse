import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xfyeupjlstfsxlccpltq.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_OYrzBndEI8AiRdykSOpNmA_3P0vMgwJ';

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. Extract Bearer Token
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ authorized: false, error: 'Missing or malformed Bearer token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // 2. Validate JWT with Supabase Auth
    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    const { data: { user }, error: userError } = await authClient.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({ authorized: false, error: 'Session expired or invalid token' });
    }

    // 3. Server-Side Role Check in public.profiles
    const clientKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
    const dbClient = createClient(SUPABASE_URL, clientKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const { data: profile, error: profileError } = await dbClient
      .from('profiles')
      .select('role, full_name, phone')
      .eq('id', user.id)
      .maybeSingle();

    const isAdmin = (profile && profile.role === 'admin') || user.user_metadata?.role === 'admin';

    if (!isAdmin) {
      return res.status(403).json({
        authorized: false,
        error: 'Forbidden: Current user does not possess administrative privileges.'
      });
    }

    return res.status(200).json({
      authorized: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: profile?.full_name || user.user_metadata?.full_name || 'Admin',
        role: 'admin'
      }
    });

  } catch (err) {
    console.error('[API Admin Verify Error]:', err);
    return res.status(500).json({ authorized: false, error: err.message || 'Server error' });
  }
}
