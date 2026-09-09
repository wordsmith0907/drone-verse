import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

// ==============================================================================
// RAZORPAY WEBHOOK HANDLER
// Asynchronously processes payment events (payment.captured, payment.failed, order.paid)
// in case the user drops network connection or closes the browser window mid-payment.
// ==============================================================================
const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || 'droneverse_webhook_secret_test';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xfyeupjlstfsxlccpltq.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'sb_publishable_OYrzBndEI8AiRdykSOpNmA_3P0vMgwJ';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const signature = req.headers['x-razorpay-signature'];
    
    // Read raw body
    let rawBody = '';
    if (typeof req.body === 'string') {
      rawBody = req.body;
    } else if (Buffer.isBuffer(req.body)) {
      rawBody = req.body.toString('utf8');
    } else {
      rawBody = JSON.stringify(req.body);
    }

    // 1. VERIFY WEBHOOK SIGNATURE IF SECRET CONFIGURED
    if (process.env.RAZORPAY_WEBHOOK_SECRET && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
        .update(rawBody)
        .digest('hex');

      const isValid =
        expectedSignature.length === signature.length &&
        crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));

      if (!isValid) {
        console.error('[Razorpay Webhook] Invalid webhook signature');
        return res.status(400).json({ error: 'Invalid webhook signature' });
      }
    } else if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
      console.warn('[Razorpay Webhook Note] RAZORPAY_WEBHOOK_SECRET not set in environment. Set this in Vercel settings for production.');
    }

    const event = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const eventType = event.event;
    console.log(`[Razorpay Webhook Event Received]: ${eventType}`);

    // Connect to Supabase
    const clientKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
    const dbClient = createClient(SUPABASE_URL, clientKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    });

    const payload = event.payload || {};

    // 2. PROCESS SPECIFIC EVENT TYPES
    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const paymentEntity = payload.payment?.entity || {};
      const orderEntity = payload.order?.entity || {};
      const razorpayOrderId = paymentEntity.order_id || orderEntity.id;
      const razorpayPaymentId = paymentEntity.id;

      if (razorpayOrderId) {
        try {
          await dbClient
            .from('orders')
            .update({
              status: 'paid',
              payment_status: 'paid',
              razorpay_payment_id: razorpayPaymentId,
              updated_at: new Date().toISOString()
            })
            .eq('razorpay_order_id', razorpayOrderId);
          console.log(`[Webhook] Marked order ${razorpayOrderId} as PAID`);
        } catch (e) {
          console.warn('[Webhook] Update fallback:', e.message);
        }
      }
    } else if (eventType === 'payment.failed') {
      const paymentEntity = payload.payment?.entity || {};
      const razorpayOrderId = paymentEntity.order_id;
      const failureReason = paymentEntity.error_description || 'Payment declined by bank';

      if (razorpayOrderId) {
        try {
          await dbClient
            .from('orders')
            .update({
              status: 'cancelled',
              payment_status: 'payment_failed',
              updated_at: new Date().toISOString()
            })
            .eq('razorpay_order_id', razorpayOrderId);
          console.log(`[Webhook] Marked order ${razorpayOrderId} as PAYMENT_FAILED (${failureReason})`);
        } catch (e) {
          console.warn('[Webhook] Failed update fallback:', e.message);
        }
      }
    }

    // Always acknowledge Razorpay webhooks with 200 OK
    return res.status(200).json({ status: 'ok', received: eventType });

  } catch (err) {
    console.error('[Razorpay Webhook Error]:', err);
    return res.status(500).json({ error: err.message || 'Webhook processing failed' });
  }
}
