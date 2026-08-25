import Razorpay from 'razorpay';
import crypto from 'crypto';
import { PaymentVerificationFailedError, ValidationError } from '../firebase/errors';

let razorpayInstance: Razorpay | null = null;

export function getRazorpayInstance(): Razorpay {
  if (razorpayInstance) return razorpayInstance;

  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new ValidationError(
      'Razorpay credentials (RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET) are missing.'
    );
  }

  razorpayInstance = new Razorpay({
    key_id,
    key_secret
  });

  return razorpayInstance;
}

/**
 * Verify Razorpay payment signature from client response
 * HMAC SHA256(order_id + "|" + payment_id, secret) == signature
 */
export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    throw new ValidationError('RAZORPAY_KEY_SECRET environment variable is missing.');
  }

  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  const isValid = generatedSignature === signature;
  if (!isValid) {
    throw new PaymentVerificationFailedError('Invalid Razorpay signature.');
  }
  return true;
}

/**
 * Verify Razorpay Webhook signature
 * HMAC SHA256(rawBody, webhookSecret) == x-razorpay-signature header
 */
export function verifyRazorpayWebhookSignature(
  rawBody: string | Buffer,
  signature: string
): boolean {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    throw new ValidationError('RAZORPAY_WEBHOOK_SECRET environment variable is missing.');
  }

  const generatedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  return generatedSignature === signature;
}
