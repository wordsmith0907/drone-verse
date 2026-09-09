import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xfyeupjlstfsxlccpltq.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_OYrzBndEI8AiRdykSOpNmA_3P0vMgwJ';

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. Verify Authorization Bearer Header
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid Bearer token' });
  }

  const token = authHeader.split(' ')[1];

  // Verify JWT user using public client
  const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: { user }, error: userError } = await authClient.auth.getUser(token);

  if (userError || !user) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token or expired session' });
  }

  // Create DB client. Use SERVICE_ROLE_KEY if provided in Vercel env, otherwise fallback to admin bearer token
  const clientKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
  const dbClient = createClient(SUPABASE_URL, clientKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: SUPABASE_SERVICE_ROLE_KEY ? {} : {
      headers: { Authorization: `Bearer ${token}` }
    }
  });

  // 2. Verify Admin Role
  const { data: profile, error: profileError } = await dbClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const isAdmin = (profile && profile.role === 'admin') || user.user_metadata?.role === 'admin';
  if (!isAdmin) {
    return res.status(403).json({ error: 'Forbidden: Admin access privileges required' });
  }

  // 3. GET: Fetch all orders across all customers and aggregate key metrics
  if (req.method === 'GET') {
    try {
      const { data: orders, error: ordersError } = await dbClient
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Enrich with customer profile data if available
      const { data: profiles } = await dbClient
        .from('profiles')
        .select('id, full_name, phone');

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      const enrichedOrders = (orders || []).map(o => {
        const custProfile = profileMap.get(o.user_id);
        const addr = o.shipping_address || {};
        const fallbackName = addr.firstName ? `${addr.firstName} ${addr.lastName || ''}`.trim() : 'Customer';
        return {
          ...o,
          customer_name: custProfile?.full_name || fallbackName,
          customer_phone: custProfile?.phone || addr.phone || '',
          customer_email: addr.email || ''
        };
      });

      // Compute metrics
      const totalOrders = enrichedOrders.length;
      const totalRevenue = enrichedOrders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
      const pendingOrders = enrichedOrders.filter(o => o.status === 'confirmed' || o.status === 'processing').length;
      const shippedOrders = enrichedOrders.filter(o => o.status === 'shipped').length;
      const deliveredOrders = enrichedOrders.filter(o => o.status === 'delivered').length;

      return res.status(200).json({
        metrics: {
          totalOrders,
          totalRevenue,
          pendingOrders,
          shippedOrders,
          deliveredOrders
        },
        orders: enrichedOrders
      });
    } catch (err) {
      console.error('[API Admin Orders GET] error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // 4. POST / PATCH: Update order status & tracking info
  if (req.method === 'POST' || req.method === 'PATCH') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const { order_id, order_number, status, tracking_number, courier } = body;

      if (!order_id && !order_number) {
        return res.status(400).json({ error: 'Missing order_id or order_number in request' });
      }

      const updateData = {};
      if (status) updateData.status = status;
      if (tracking_number !== undefined) updateData.tracking_number = tracking_number;
      if (courier !== undefined) updateData.courier = courier;

      let query = dbClient.from('orders').update(updateData);
      if (order_id) {
        query = query.eq('id', order_id);
      } else {
        query = query.eq('order_number', order_number);
      }

      const { data: updatedOrder, error: updateError } = await query.select().single();
      if (updateError) throw updateError;

      return res.status(200).json({ success: true, order: updatedOrder });
    } catch (err) {
      console.error('[API Admin Orders POST/PATCH] error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
