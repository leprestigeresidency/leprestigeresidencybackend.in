import { onRequest } from 'firebase-functions/v2/https';
import { PaymentService } from '../../../services/payment.service';
import { formatErrorForClient } from '../../../firebase/errors';
import { logger } from '../../../utils/logger';

export const razorpayWebhookFunction = onRequest({ cors: true }, async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const signature = req.headers['x-razorpay-signature'] as string;
  if (!signature) {
    res.status(400).send('Missing Razorpay signature header.');
    return;
  }

  try {
    const rawBody = req.rawBody || JSON.stringify(req.body);
    const result = await PaymentService.handleRazorpayWebhook(rawBody, signature, req.body);
    res.status(200).json({ status: 'ok', ...result });
  } catch (error: any) {
    logger.error('Error handling Razorpay Webhook:', error);
    const formatted = formatErrorForClient(error);
    res.status(400).json({ error: formatted.message });
  }
});
