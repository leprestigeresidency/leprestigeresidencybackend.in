import { adminFirestore } from '../firebase/admin';
import { COLLECTIONS } from '../firebase/collections';
import { Room } from '../firebase/types';
import { roomSchema, updateRoomSchema, RoomInput, UpdateRoomInput } from '../schemas/room.schema';
import { NotFoundError, ValidationError } from '../firebase/errors';
import { slugify } from '../firebase/helpers';

export class RoomService {
  /**
   * Create a new room (Admin / Staff)
   */
  static async createRoom(input: RoomInput): Promise<Room> {
    const validated = roomSchema.parse(input);
    const slug = validated.slug || slugify(validated.name);
    const now = new Date().toISOString();

    const roomRef = adminFirestore.collection(COLLECTIONS.ROOMS).doc();
    const roomData: Room = {
      id: roomRef.id,
      ...validated,
      slug,
      createdAt: now,
      updatedAt: now
    };

    await roomRef.set(roomData);
    return roomData;
  }

  /**
   * Get room by ID
   */
  static async getRoomById(roomId: string): Promise<Room> {
    const doc = await adminFirestore.collection(COLLECTIONS.ROOMS).doc(roomId).get();
    if (!doc.exists) {
      throw new NotFoundError(`Room with ID ${roomId}`);
    }
    return { id: doc.id, ...doc.data() } as Room;
  }

  /**
   * Get room by slug
   */
  static async getRoomBySlug(slug: string): Promise<Room> {
    const snap = await adminFirestore
      .collection(COLLECTIONS.ROOMS)
      .where('slug', '==', slug)
      .limit(1)
      .get();

    if (snap.empty) {
      throw new NotFoundError(`Room with slug '${slug}'`);
    }
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() } as Room;
  }

  /**
   * List all rooms with filtering options
   */
  static async getRooms(filters?: {
    branchId?: string;
    roomType?: string;
    minPrice?: number;
    maxPrice?: number;
    availableOnly?: boolean;
    featuredOnly?: boolean;
  }): Promise<Room[]> {
    let query: FirebaseFirestore.Query = adminFirestore.collection(COLLECTIONS.ROOMS);

    if (filters?.branchId) {
      query = query.where('branchId', '==', filters.branchId);
    }
    if (filters?.roomType) {
      query = query.where('roomType', '==', filters.roomType);
    }
    if (filters?.availableOnly) {
      query = query.where('available', '==', true);
    }
    if (filters?.featuredOnly) {
      query = query.where('featured', '==', true);
    }

    const snap = await query.get();
    let rooms = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Room));

    if (filters?.minPrice !== undefined) {
      rooms = rooms.filter((r) => r.price >= filters.minPrice!);
    }
    if (filters?.maxPrice !== undefined) {
      rooms = rooms.filter((r) => r.price <= filters.maxPrice!);
    }

    return rooms;
  }

  /**
   * Update room details (Admin / Staff)
   */
  static async updateRoom(roomId: string, input: UpdateRoomInput): Promise<Room> {
    const validated = updateRoomSchema.parse(input);
    const room = await this.getRoomById(roomId);

    const now = new Date().toISOString();
    const updatedData = {
      ...validated,
      updatedAt: now
    };

    await adminFirestore.collection(COLLECTIONS.ROOMS).doc(roomId).update(updatedData);
    return { ...room, ...updatedData };
  }

  /**
   * Delete room (Admin)
   */
  static async deleteRoom(roomId: string): Promise<void> {
    await this.getRoomById(roomId);
    await adminFirestore.collection(COLLECTIONS.ROOMS).doc(roomId).delete();
  }
}
