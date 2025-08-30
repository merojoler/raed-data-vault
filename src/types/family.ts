export interface FamilyMember {
  id: string;
  fullName: string;
  birthDate: string;
  relationship: 'أب' | 'أم' | 'ابن' | 'ابنة' | 'أخ' | 'أخت' | 'جد' | 'جدة' | 'آخر';
}

export interface DisabilityType {
  بصرية: boolean;
  سمعية: boolean;
  حركية: boolean;
  ذهنية: boolean;
  نفسية: boolean;
  التوحد: boolean;
  متعددة: boolean;
  أخرى: boolean;
}

export interface FamilyData {
  id: string;
  
  // بيانات الزوج
  husbandName: string;
  husbandId: string;
  
  // بيانات الزوجة
  wifeName: string;
  wifeId: string;
  isPregnant: boolean;
  isBreastfeeding: boolean;
  
  // معلومات التواصل
  phoneNumber: string;
  familySize: number;
  
  // أفراد العائلة
  members: FamilyMember[];
  
  // معلومات صحية
  hasDiseases: boolean;
  diseaseDetails?: string;
  hasDisabilities: boolean;
  disabilityTypes: DisabilityType;
  hasWarInjuries: boolean;
  
  // معلومات الأطفال
  hasChildrenUnder2: boolean;
  hasChildren2to5: boolean;
  
  // تاريخ الإضافة والتحديث
  createdAt: Date;
  updatedAt: Date;
}