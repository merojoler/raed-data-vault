import { FamilyData } from '@/types/family';

const STORAGE_KEY = 'data-raed-families';

export class FamilyStorageService {
  static getAllFamilies(): FamilyData[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading families:', error);
      return [];
    }
  }

  static saveFamily(family: FamilyData): void {
    try {
      const families = this.getAllFamilies();
      const existingIndex = families.findIndex(f => f.id === family.id);
      
      if (existingIndex !== -1) {
        families[existingIndex] = { ...family, updatedAt: new Date() };
      } else {
        families.push(family);
      }
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(families));
    } catch (error) {
      console.error('Error saving family:', error);
      throw new Error('فشل في حفظ البيانات');
    }
  }

  static deleteFamily(familyId: string): void {
    try {
      const families = this.getAllFamilies();
      const updatedFamilies = families.filter(f => f.id !== familyId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedFamilies));
    } catch (error) {
      console.error('Error deleting family:', error);
      throw new Error('فشل في حذف البيانات');
    }
  }

  static getFamilyById(id: string): FamilyData | null {
    const families = this.getAllFamilies();
    return families.find(f => f.id === id) || null;
  }

  static exportToJSON(): string {
    const families = this.getAllFamilies();
    return JSON.stringify(families, null, 2);
  }

  static importFromJSON(jsonData: string): void {
    try {
      const families = JSON.parse(jsonData) as FamilyData[];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(families));
    } catch (error) {
      console.error('Error importing data:', error);
      throw new Error('فشل في استيراد البيانات');
    }
  }
}