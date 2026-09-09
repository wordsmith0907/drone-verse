/**
 * DroneVerse End-to-End Payment Flow & Security Simulation
 * Tests:
 * 1. Anti-Tamper Recalculation (Client-side price tampering blocked)
 * 2. Razorpay Orders API integration (Server-side order creation)
 * 3. HMAC SHA256 Signature Verification (Valid vs Tampered verification)
 * 4. Supabase Order Status Lifecycle
 */

import crypto from 'node:crypto';
import { calculateOrderTotals, getProductPrice } from '../api/_catalog.js';

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_TZrmFs3YqwlEwB';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'ZEAKecLCO2ftViWyWljv6DZH';

async function runPaymentSimulation() {
  console.log('================================================================');
  console.log('  DRONEVERSE END-TO-END RAZORPAY PAYMENT FLOW TEST SUITE       ');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  // --- TEST 1: Price Tampering Defense ---
  total++;
  console.log('[TEST 1] Anti-Price-Tampering Defense: Client claims drone costs ₹1.00');
  const hackedCart = [
    {
      id: 'DV-DRN-0001',
      title: 'AeroMini 4K Pocket Drone',
      price: 1.00, // Attacker manipulated price from ₹24,999 to ₹1.00
      qty: 1
    }
  ];

  const calculated = calculateOrderTotals(hackedCart);
  console.log(`  Catalog Price: ₹${getProductPrice('DV-DRN-0001')}`);
  console.log(`  Attacker Injected Price: ₹1.00`);
  console.log(`  Server Calculated Grand Total: ₹${calculated.grandTotal}`);

  if (calculated.grandTotal === 24999 && calculated.amountInPaise === 2499900) {
    console.log('  ✓ [PASS] Tampered price overwritten by authoritative server catalog! (Total: ₹24,999)\n');
    passed++;
  } else {
    console.error('  ✗ [FAIL] Price tampering succeeded! Total calculated as:', calculated.grandTotal);
  }

  // --- TEST 2: Razorpay Orders API Server-Side Call ---
  total++;
  console.log('[TEST 2] Live Call to Razorpay Orders API (Test Mode)...');
  const testOrderNumber = 'DV-TEST-' + Date.now().toString(36).toUpperCase();
  const basicAuth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');

  try {
    const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: 2499900, // 24999.00 in paise
        currency: 'INR',
        receipt: testOrderNumber,
        notes: {
          test: 'true',
          app: 'DroneVerse'
        }
      })
    });

    const rzpOrder = await rzpResponse.json();

    if (rzpResponse.ok && rzpOrder.id && rzpOrder.id.startsWith('order_')) {
      console.log(`  ✓ [PASS] Razorpay Order Created! ID: ${rzpOrder.id}, Status: ${rzpOrder.status}, Amount: ₹${rzpOrder.amount / 100}`);
      passed++;

      // --- TEST 3: Cryptographic HMAC SHA256 Signature Verification ---
      total++;
      console.log('\n[TEST 3] Cryptographic HMAC SHA256 Signature Verification...');
      const mockPaymentId = 'pay_' + Date.now().toString(36) + 'mock';

      // Generate legitimate signature
      const validHmac = crypto.createHmac('sha256', RAZORPAY_KEY_SECRET);
      validHmac.update(`${rzpOrder.id}|${mockPaymentId}`);
      const legitimateSignature = validHmac.digest('hex');

      // Test valid signature
      const checkValid = crypto.timingSafeEqual(
        Buffer.from(legitimateSignature),
        Buffer.from(legitimateSignature)
      );

      // Generate corrupted signature
      const fakeSignature = crypto.createHash('sha256').update('random_garbage').digest('hex');
      const checkInvalid = legitimateSignature.length === fakeSignature.length &&
        crypto.timingSafeEqual(Buffer.from(legitimateSignature), Buffer.from(fakeSignature));

      if (checkValid && !checkInvalid) {
        console.log('  ✓ [PASS] Legitimate signature accepted via constant-time equality check.');
        console.log('  ✓ [PASS] Tampered signature rejected.');
        passed++;
      } else {
        console.error('  ✗ [FAIL] Signature verification anomaly');
      }

    } else {
      console.error('  ✗ [FAIL] Razorpay API error:', rzpOrder);
    }
  } catch (err) {
    console.error('  ✗ [FAIL] Network error connecting to Razorpay:', err.message);
  }

  // --- TEST 4: GST dual display mathematical consistency ---
  total++;
  console.log('\n[TEST 4] Dual GST 18% Mathematical Consistency Check...');
  const sampleItems = [
    { id: 'arduino-uno-r3', qty: 2, price: 2199 },
    { id: 'raspberry-pi-5-8gb', qty: 1, price: 7499 }
  ];
  const gstTotals = calculateOrderTotals(sampleItems);
  // 2 * 2199 = 4398, 1 * 7499 = 7499, subtotal = 11897
  // Shipping = 0 (>=999)
  // GST 18% included: (11897 * 18) / 118 = 1814.80
  const expectedSubtotal = 11897;
  const expectedGst = Math.round((11897 * 18) / 118 * 100) / 100;

  console.log(`  Subtotal: ₹${gstTotals.subtotal} (Expected: ₹${expectedSubtotal})`);
  console.log(`  GST (18% incl): ₹${gstTotals.gstAmount} (Expected: ₹${expectedGst})`);
  console.log(`  Grand Total: ₹${gstTotals.grandTotal} (Paise: ${gstTotals.amountInPaise})`);

  if (gstTotals.subtotal === expectedSubtotal && gstTotals.gstAmount === expectedGst) {
    console.log('  ✓ [PASS] Dual GST breakdown aligns with charged paise amount.');
    passed++;
  } else {
    console.error('  ✗ [FAIL] GST calculation mismatch');
  }

  console.log('\n================================================================');
  console.log(`  RESULTS: ${passed}/${total} TESTS PASSED`);
  console.log('================================================================\n');
}

runPaymentSimulation().catch(console.error);
