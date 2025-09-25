export interface FamilyMember {
  id: string;
  fullName: string;
  identityNumber: string;
  birthDate: string;
  age: number;
  gender: 'M' | 'F';
  relationship: 'Head' | 'Spouse' | 'Son' | 'Daughter';
  maritalStatus: 'متزوج' | 'أعزب' | 'أرمل' | 'مطلق' | 'مهجور';
  
  // معلومات التواصل
  phoneNumber?: string;
  alternativePhoneNumber?: string;
  
  // الحالة الصحية والإعاقات
  hasChronicIllness: boolean;
  chronicIllnesses: {
    diabetes: boolean;
    hypertension: boolean;
    heartDisease: boolean;
    asthma: boolean;
    cancer: boolean;
    kidneyDisease: boolean;
    hiv: boolean;
    arthritis: boolean;
  };
  
  hasDisabilities: boolean;
  disabilities: {
    physical: boolean;
    visual: boolean;
    hearing: boolean;
    intellectual: boolean;
    mentalPsychological: boolean;
  };
  
  isUXOVictim: boolean;
  hasStableIncome: boolean;
  
  // معلومات إضافية للزوجة فقط
  isPregnant?: boolean;
  isBreastfeeding?: boolean;
}

export interface FamilyData {
  id: string;
  entryDate: string; // تاريخ الإدخال التلقائي
  
  // معلومات رب الأسرة
  headOfHouseholdName: string;
  headOfHouseholdId: string;
  
  // معلومات التواصل (لرب الأسرة فقط)
  contactNumber: string;
  
  // أفراد العائلة (يشمل رب الأسرة)
  members: FamilyMember[];
  
  // معلومات خاصة (تم نقل الحمل والرضاعة لأفراد العائلة)
  
  // أطفال صغار
  hasChildUnder2: boolean;
  hasChild2To5: boolean;
  
  // طفل غير مصحوب
  hasUnaccompaniedChild: boolean;
  unaccompaniedChildDetails?: {
    name: string;
    details: string;
  };
  
  // تاريخ الإضافة والتحديث
  createdAt: Date;
  updatedAt: Date;
}