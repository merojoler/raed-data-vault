import Dexie, { Table } from 'dexie';
import { FamilyData } from '@/types/family';

export class FamilyDatabase extends Dexie {
  families!: Table<FamilyData>;

  constructor() {
    super('FamilyDatabase');
    this.version(1).stores({
      families: 'id, headOfHouseholdName, entryDate, createdAt'
    });
  }
}

export const db = new FamilyDatabase();

// خدمة العمل دون اتصال
export class OfflineService {
  static async syncToOffline(families: FamilyData[]): Promise<void> {
    try {
      await db.families.clear();
      await db.families.bulkAdd(families);
    } catch (error) {
      console.error('فشل في المزامنة دون اتصال:', error);
    }
  }

  static async getOfflineFamilies(): Promise<FamilyData[]> {
    try {
      return await db.families.toArray();
    } catch (error) {
      console.error('فشل في تحميل البيانات دون اتصال:', error);
      return [];
    }
  }

  static async isOnline(): Promise<boolean> {
    return navigator.onLine && 
           (await fetch('/ping').then(() => true).catch(() => false));
  }
}