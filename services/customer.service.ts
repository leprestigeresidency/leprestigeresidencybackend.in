import { adminFirestore } from '../firebase/admin';
import { COLLECTIONS } from '../firebase/collections';
import { CustomerUser } from '../firebase/types';
import { customerSchema, updateCustomerSchema, CustomerInput, UpdateCustomerInput } from '../schemas/customer.schema';
import { NotFoundError } from '../firebase/errors';

export class CustomerService {
  static async createOrUpdateProfile(input: CustomerInput): Promise<CustomerUser> {
    const validated = customerSchema.parse(input);
    const now = new Date().toISOString();

    const ref = adminFirestore.collection(COLLECTIONS.CUSTOMERS).doc(validated.uid);
    const snap = await ref.get();

    if (snap.exists) {
      const updated: Partial<CustomerUser> = {
        ...validated,
        updatedAt: now
      };
      await ref.update(updated);
      return { id: snap.id, ...snap.data(), ...updated } as CustomerUser;
    } else {
      const customer: CustomerUser = {
        id: validated.uid,
        role: 'customer',
        ...validated,
        createdAt: now,
        updatedAt: now
      };
      await ref.set(customer);
      return customer;
    }
  }

  static async getProfileByUid(uid: string): Promise<CustomerUser> {
    const doc = await adminFirestore.collection(COLLECTIONS.CUSTOMERS).doc(uid).get();
    if (!doc.exists) throw new NotFoundError('Customer Profile');
    return { id: doc.id, ...doc.data() } as CustomerUser;
  }
}
