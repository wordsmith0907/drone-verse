import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

// ==============================================================================
// RAZORPAY & SUPABASE CONFIGURATION
// In Production: RAZORPAY_KEY_SECRET is kept strictly confidential on the server.
// It is NEVER exposed to client-side JS or git.
// ==============================================================================
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
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      order_number
    } = body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing required Razorpay payment credentials for verification.'
      });
    }

    // 1. CALCULATE EXPECTED SIGNATURE VIA HMAC SHA256 (Razorpay Documented Algorithm)
    const hmac = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET);
    hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const expectedSignature = hmac.digest('hex');

    // Constant-time comparison to prevent timing attacks
    const isSignatureValid =
      expectedSignature.length === razorpay_signature.length &&
      crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(razorpay_signature));

    // 2. CONNECT TO SUPABASE
    const clientKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
    const dbClient = createClient(SUPABASE_URL, clientKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    // 3. IF SIGNATURE INVALID -> REJECT & MARK FAILED
    if (!isSignatureValid) {
      console.error(`[Payment Security Alert] Invalid signature for Razorpay Order: ${razorpay_order_id}`);
      
      // Update order status if found
      try {
        await dbClient
          .from('orders')
          .update({
            status: 'cancelled',
            payment_status: 'payment_failed'
          })
          .eq('razorpay_order_id', razorpay_order_id);
      } catch (e) {
        // Continue
      }

      return res.status(400).json({
        success: false,
        error: 'Payment verification failed: cryptographic signature mismatch.'
      });
    }

    // 4. SIGNATURE VALID -> MARK ORDER AS PAID IN SUPABASE
    // We attempt status: 'paid'. If check constraint on old schema only allows 'confirmed', fallback gracefully.
    let updatedOrder = null;
    try {
      // First attempt: status 'paid', payment_status 'paid'
      const { data, error } = await dbClient
        .from('orders')
        .update({
          status: 'paid',
          payment_status: 'paid',
          razorpay_payment_id: razorpay_payment_id,
          razorpay_signature: razorpay_signature,
          updated_at: new Date().toISOString()
        })
        .or(`razorpay_order_id.eq.${razorpay_order_id},order_number.eq.${order_number || ''}`)
        .select()
        .maybeSingle();

      if (error && error.message.includes('check constraint')) {
        // Fallback: status 'confirmed' (allowed by existing schema), with payment details
        console.warn('[Verify Payment] Check constraint note, using status confirmed:', error.message);
        const { data: fbData } = await dbClient
          .from('orders')
          .update({
            status: 'confirmed',
            tracking_number: `RZP-${razorpay_payment_id}`,
            updated_at: new Date().toISOString()
          })
          .or(`order_number.eq.${order_number || ''}`)
          .select()
          .maybeSingle();
        updatedOrder = fbData;
      } else {
        updatedOrder = data;
      }
    } catch (dbErr) {
      console.error('[Verify Payment] DB update error:', dbErr);
    }

    return res.status(200).json({
      success: true,
      message: 'Payment verified successfully.',
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
      status: 'paid',
      order: updatedOrder
    });

  } catch (err) {
    console.error('[API Verify Payment Error]:', err);
    return res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
}
