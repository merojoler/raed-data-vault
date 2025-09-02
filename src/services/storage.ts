import { FamilyData } from '@/types/family';

const STORAGE_KEY = 'family-database';

export class FamilyStorageService {
  static getAllFamilies(): FamilyData[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      
      const families = JSON.parse(stored);
      return families.map((family: any) => ({
        ...family,
        createdAt: new Date(family.createdAt),
        updatedAt: new Date(family.updatedAt)
      }));
    } catch (error) {
      console.error('Error loading families:', error);
      return [];
    }
  }

  static saveFamily(family: FamilyData): void {
    try {
      const families = this.getAllFamilies();
      const existingIndex = families.findIndex(f => f.id === family.id);
      
      if (existingIndex >= 0) {
        families[existingIndex] = family;
      } else {
        families.push(family);
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(families));
    } catch (error) {
      console.error('Error saving family:', error);
      throw new Error('فشل في حفظ البيانات');
    }
  }

  static deleteFamily(id: string): void {
    const families = this.getAllFamilies();
    const updatedFamilies = families.filter(family => family.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedFamilies));
  }

  static deleteAllFamilies(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}