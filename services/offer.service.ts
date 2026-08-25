import { adminFirestore } from '../firebase/admin';
import { COLLECTIONS } from '../firebase/collections';
import { Offer, Coupon } from '../firebase/types';
import { offerSchema, couponSchema, OfferInput, CouponInput } from '../schemas/offer.schema';
import { ValidationError, NotFoundError } from '../firebase/errors';
import { getTodayDateString } from '../utils/date';

export class OfferService {
  /**
   * Create offer (Admin)
   */
  static async createOffer(input: OfferInput): Promise<Offer> {
    const validated = offerSchema.parse(input);
    const now = new Date().toISOString();

    const ref = adminFirestore.collection(COLLECTIONS.OFFERS).doc();
    const offer: Offer = {
      id: ref.id,
      ...validated,
      createdAt: now,
      updatedAt: now
    };

    await ref.set(offer);
    return offer;
  }

  /**
   * Create Coupon (Admin)
   */
  static async createCoupon(input: CouponInput): Promise<Coupon> {
    const validated = couponSchema.parse(input);
    const now = new Date().toISOString();

    const codeUpper = validated.code.toUpperCase();
    const existing = await adminFirestore
      .collection(COLLECTIONS.COUPONS)
      .where('code', '==', codeUpper)
      .get();

    if (!existing.empty) {
      throw new ValidationError(`Coupon code '${codeUpper}' already exists.`);
    }

    const ref = adminFirestore.collection(COLLECTIONS.COUPONS).doc();
    const coupon: Coupon = {
      id: ref.id,
      ...validated,
      code: codeUpper,
      usedCount: 0,
      createdAt: now,
      updatedAt: now
    };

    await ref.set(coupon);
    return coupon;
  }

  /**
   * Validate Coupon code and calculate discount amount server-side
   */
  static async validateAndCalculateCouponDiscount(
    code: string,
    subtotal: number
  ): Promise<number> {
    const codeUpper = code.trim().toUpperCase();
    const snap = await adminFirestore
      .collection(COLLECTIONS.COUPONS)
      .where('code', '==', codeUpper)
      .limit(1)
      .get();

    if (snap.empty) {
      throw new ValidationError(`Invalid coupon code '${codeUpper}'.`);
    }

    const coupon = snap.docs[0].data() as Coupon;
    const today = getTodayDateString();

    if (!coupon.active) {
      throw new ValidationError(`Coupon '${codeUpper}' is inactive.`);
    }

    if (today < coupon.startDate || today > coupon.endDate) {
      throw new ValidationError(`Coupon '${codeUpper}' has expired or is not yet valid.`);
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      throw new ValidationError(`Coupon '${codeUpper}' usage limit has been reached.`);
    }

    if (subtotal < coupon.minimumAmount) {
      throw new ValidationError(
        `Subtotal of ₹${subtotal} does not meet minimum coupon requirement of ₹${coupon.minimumAmount}.`
      );
    }

    let discount = 0;
    if (coupon.discountType === 'percentage') {
      discount = (subtotal * coupon.discountValue) / 100;
      if (coupon.maximumDiscount && discount > coupon.maximumDiscount) {
        discount = coupon.maximumDiscount;
      }
    } else {
      discount = coupon.discountValue;
    }

    return Math.min(discount, subtotal);
  }

  /**
   * Get active public offers
   */
  static async getActiveOffers(): Promise<Offer[]> {
    const snap = await adminFirestore
      .collection(COLLECTIONS.OFFERS)
      .where('active', '==', true)
      .get();

    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Offer));
  }
}
