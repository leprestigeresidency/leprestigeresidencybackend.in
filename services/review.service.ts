import { adminFirestore } from '../firebase/admin';
import { COLLECTIONS } from '../firebase/collections';
import { Review } from '../firebase/types';
import { reviewSchema, ReviewInput } from '../schemas/review.schema';
import { NotFoundError } from '../firebase/errors';

export class ReviewService {
  /**
   * Submit a new guest review (Unapproved by default for safety)
   */
  static async submitReview(input: ReviewInput): Promise<Review> {
    const validated = reviewSchema.parse(input);
    const now = new Date().toISOString();

    const ref = adminFirestore.collection(COLLECTIONS.REVIEWS).doc();
    const review: Review = {
      id: ref.id,
      ...validated,
      approved: false, // Must be approved by staff/admin to display publicly
      createdAt: now
    };

    await ref.set(review);
    return review;
  }

  /**
   * Get approved public reviews
   */
  static async getPublicReviews(roomId?: string): Promise<Review[]> {
    let query: FirebaseFirestore.Query = adminFirestore
      .collection(COLLECTIONS.REVIEWS)
      .where('approved', '==', true);

    if (roomId) {
      query = query.where('roomId', '==', roomId);
    }

    const snap = await query.get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Review));
  }

  /**
   * Approve or decline review (Staff / Admin)
   */
  static async setReviewApproval(reviewId: string, approved: boolean): Promise<Review> {
    const ref = adminFirestore.collection(COLLECTIONS.REVIEWS).doc(reviewId);
    const doc = await ref.get();
    if (!doc.exists) throw new NotFoundError('Review');

    await ref.update({ approved });
    return { id: doc.id, ...doc.data(), approved } as Review;
  }
}
