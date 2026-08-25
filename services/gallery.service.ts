import { adminFirestore } from '../firebase/admin';
import { COLLECTIONS } from '../firebase/collections';
import { GalleryItem } from '../firebase/types';
import { NotFoundError } from '../firebase/errors';

export class GalleryService {
  static async addGalleryItem(data: Omit<GalleryItem, 'id' | 'createdAt'>): Promise<GalleryItem> {
    const ref = adminFirestore.collection(COLLECTIONS.GALLERY).doc();
    const item: GalleryItem = {
      id: ref.id,
      ...data,
      createdAt: new Date().toISOString()
    };
    await ref.set(item);
    return item;
  }

  static async getGalleryItems(category?: string, branchId?: string): Promise<GalleryItem[]> {
    let query: FirebaseFirestore.Query = adminFirestore.collection(COLLECTIONS.GALLERY);
    if (category) query = query.where('category', '==', category);
    if (branchId) query = query.where('branchId', '==', branchId);

    const snap = await query.get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as GalleryItem));
  }

  static async deleteGalleryItem(id: string): Promise<void> {
    const ref = adminFirestore.collection(COLLECTIONS.GALLERY).doc(id);
    const snap = await ref.get();
    if (!snap.exists) throw new NotFoundError('Gallery Item');
    await ref.delete();
  }
}
