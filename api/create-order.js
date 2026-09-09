import { createClient } from '@supabase/supabase-js';
import { calculateOrderTotals } from './_catalog.js';

// ==============================================================================
// RAZORPAY & SUPABASE CONFIGURATION
// In Production: These are read exclusively from Vercel Environment Variables.
// To switch to LIVE keys after KYC approval, update RAZORPAY_KEY_ID and
// RAZORPAY_KEY_SECRET in your Vercel Project Dashboard (Settings > Environment Variables).
// ==============================================================================
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_TZrmFs3YqwlEwB';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'ZEAKecLCO2ftViWyWljv6DZH';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xfyeupjlstfsxlccpltq.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_OYrzBndEI8AiRdykSOpNmA_3P0vMgwJ';

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { items = [], shippingAddress = {} } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty. Please add items before checking out.' });
    }

    // 1. RECALCULATE ORDER TOTALS SERVER-SIDE (Never trust client-supplied prices or totals)
    const totals = calculateOrderTotals(items);
    if (totals.grandTotal <= 0 || totals.amountInPaise <= 0) {
      return res.status(400).json({ error: 'Invalid order amount calculated.' });
    }

    // 2. Identify Authenticated User (if token provided)
    let authenticatedUserId = null;
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        const { data: { user } } = await authClient.auth.getUser(token);
        if (user) authenticatedUserId = user.id;
      } catch (e) {
        console.warn('[Create Order] Auth token decode warning:', e.message);
      }
    }

    // Generate unique DroneVerse order number
    const orderNumber = 'DV-ORD-' + Date.now().toString(36).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900);

    // 3. CALL RAZORPAY ORDERS API SERVER-SIDE
    const basicAuth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
    
    const razorpayPayload = {
      amount: totals.amountInPaise, // Amount in paise
      currency: 'INR',
      receipt: orderNumber,
      notes: {
        order_number: orderNumber,
        customer_name: `${shippingAddress.firstName || ''} ${shippingAddress.lastName || ''}`.trim() || 'Customer',
        customer_email: shippingAddress.email || '',
        customer_phone: shippingAddress.phone || '',
        items_count: String(totals.items.length)
      }
    };

    const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(razorpayPayload)
    });

    const rzpOrder = await rzpResponse.json();

    if (!rzpResponse.ok || !rzpOrder.id) {
      console.error('[Razorpay Create Order Failed]', rzpOrder);
      return res.status(502).json({
        error: 'Failed to initiate secure payment with Razorpay.',
        details: rzpOrder.error ? rzpOrder.error.description : 'Payment gateway error'
      });
    }

    // 4. RECORD INITIAL ORDER IN SUPABASE DATABASE
    const clientKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
    const dbClient = createClient(SUPABASE_URL, clientKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    // Enriched shipping address with Razorpay metadata
    const enrichedAddress = {
      ...shippingAddress,
      razorpay_order_id: rzpOrder.id
    };

    const orderRow = {
      order_number: orderNumber,
      items: totals.items,
      total_amount: totals.grandTotal,
      gst_amount: totals.gstAmount,
      shipping_fee: totals.shippingFee,
      status: 'pending',
      shipping_address: enrichedAddress,
      courier: 'Bluedart Express'
    };

    // If authenticated user, attach user_id; if guest, attach or leave null
    if (authenticatedUserId) {
      orderRow.user_id = authenticatedUserId;
    }

    // Try inserting with razorpay columns
    let supabaseRecord = null;
    try {
      const { data, error } = await dbClient
        .from('orders')
        .insert([{
          ...orderRow,
          razorpay_order_id: rzpOrder.id,
          payment_status: 'pending'
        }])
        .select()
        .maybeSingle();

      if (error) {
        // Fallback without new columns if user hasn't run the migration yet
        console.warn('[Create Order] Retrying insert with base schema:', error.message);
        const { data: fbData } = await dbClient
          .from('orders')
          .insert([orderRow])
          .select()
          .maybeSingle();
        supabaseRecord = fbData;
      } else {
        supabaseRecord = data;
      }
    } catch (dbErr) {
      console.warn('[Create Order] Supabase pre-insert note:', dbErr.message);
    }

    // 5. RETURN SECURE ORDER DETAILS TO FRONTEND
    return res.status(200).json({
      success: true,
      order_id: rzpOrder.id,
      amount: rzpOrder.amount, // In paise
      currency: rzpOrder.currency,
      key_id: RAZORPAY_KEY_ID,
      order_number: orderNumber,
      subtotal: totals.subtotal,
      gst_amount: totals.gstAmount,
      shipping_fee: totals.shippingFee,
      grand_total: totals.grandTotal,
      db_id: supabaseRecord ? supabaseRecord.id : null
    });

  } catch (err) {
    console.error('[API Create Order Error]:', err);
    return res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
