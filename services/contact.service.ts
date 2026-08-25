import { adminFirestore } from '../firebase/admin';
import { COLLECTIONS } from '../firebase/collections';
import { ContactMessage, NewsletterSubscription } from '../firebase/types';
import { contactSchema, newsletterSchema, ContactInput, NewsletterInput } from '../schemas/contact.schema';
import { ValidationError } from '../firebase/errors';

export class ContactService {
  /**
   * Submit contact inquiry message
   */
  static async submitContactMessage(input: ContactInput): Promise<ContactMessage> {
    const validated = contactSchema.parse(input);
    const now = new Date().toISOString();

    const ref = adminFirestore.collection(COLLECTIONS.CONTACT_MESSAGES).doc();
    const message: ContactMessage = {
      id: ref.id,
      ...validated,
      email: validated.email.toLowerCase(),
      status: 'unread',
      createdAt: now,
      updatedAt: now
    };

    await ref.set(message);
    return message;
  }

  /**
   * Subscribe to newsletter (Prevent duplicate emails)
   */
  static async subscribeNewsletter(input: NewsletterInput): Promise<NewsletterSubscription> {
    const validated = newsletterSchema.parse(input);
    const emailLower = validated.email.toLowerCase();

    const existing = await adminFirestore
      .collection(COLLECTIONS.NEWSLETTER)
      .where('email', '==', emailLower)
      .limit(1)
      .get();

    if (!existing.empty) {
      const doc = existing.docs[0];
      const data = doc.data() as NewsletterSubscription;
      if (data.status === 'subscribed') {
        throw new ValidationError('This email address is already subscribed to our newsletter.');
      } else {
        await doc.ref.update({ status: 'subscribed' });
        return { ...data, status: 'subscribed' };
      }
    }

    const ref = adminFirestore.collection(COLLECTIONS.NEWSLETTER).doc();
    const sub: NewsletterSubscription = {
      id: ref.id,
      email: emailLower,
      status: 'subscribed',
      createdAt: new Date().toISOString()
    };

    await ref.set(sub);
    return sub;
  }
}
