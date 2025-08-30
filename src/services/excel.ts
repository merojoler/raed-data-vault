import * as XLSX from 'xlsx';
import { FamilyData } from '@/types/family';

export class ExcelService {
  static exportFamiliesToExcel(families: FamilyData[]): void {
    try {
      console.log('عدد العائلات للتصدير:', families.length);
      console.log('البيانات:', families);
      
      if (families.length === 0) {
        throw new Error('لا توجد بيانات للتصدير');
      }
      
      // إنشاء البيانات للتصدير
      const exportData = families.map(family => ({
        'اسم الزوج': family.husbandName,
        'رقم هوية الزوج': family.husbandId,
        'اسم الزوجة': family.wifeName,
        'رقم هوية الزوجة': family.wifeId,
        'حامل': family.isPregnant ? 'نعم' : 'لا',
        'مرضع': family.isBreastfeeding ? 'نعم' : 'لا',
        'رقم الجوال': family.phoneNumber,
        'عدد أفراد العائلة': family.familySize,
        'أفراد العائلة': family.members.map(m => `${m.fullName} (${m.relationship})`).join(', '),
        'يوجد أمراض': family.hasDiseases ? 'نعم' : 'لا',
        'تفاصيل الأمراض': family.diseaseDetails || '',
        'يوجد إعاقات': family.hasDisabilities ? 'نعم' : 'لا',
        'أنواع الإعاقات': Object.entries(family.disabilityTypes)
          .filter(([_, value]) => value)
          .map(([key]) => key)
          .join(', '),
        'إصابات حرب': family.hasWarInjuries ? 'نعم' : 'لا',
        'أطفال أقل من سنتين': family.hasChildrenUnder2 ? 'نعم' : 'لا',
        'أطفال 2-5 سنوات': family.hasChildren2to5 ? 'نعم' : 'لا',
        'تاريخ الإضافة': new Date(family.createdAt).toLocaleDateString('ar-SA'),
        'تاريخ التحديث': new Date(family.updatedAt).toLocaleDateString('ar-SA')
      }));

      console.log('البيانات المُعدّة للتصدير:', exportData);

      // إنشاء ملف Excel
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData, {
        header: [
          'اسم الزوج',
          'رقم هوية الزوج', 
          'اسم الزوجة',
          'رقم هوية الزوجة',
          'حامل',
          'مرضع',
          'رقم الجوال',
          'عدد أفراد العائلة',
          'أفراد العائلة',
          'يوجد أمراض',
          'تفاصيل الأمراض',
          'يوجد إعاقات',
          'أنواع الإعاقات',
          'إصابات حرب',
          'أطفال أقل من سنتين',
          'أطفال 2-5 سنوات',
          'تاريخ الإضافة',
          'تاريخ التحديث'
        ]
      });
      
      // تحسين عرض الأعمدة
      const colWidths = [
        { wch: 20 }, // اسم الزوج
        { wch: 15 }, // رقم هوية الزوج
        { wch: 20 }, // اسم الزوجة
        { wch: 15 }, // رقم هوية الزوجة
        { wch: 8 },  // حامل
        { wch: 8 },  // مرضع
        { wch: 15 }, // رقم الجوال
        { wch: 12 }, // عدد أفراد العائلة
        { wch: 30 }, // أفراد العائلة
        { wch: 10 }, // يوجد أمراض
        { wch: 25 }, // تفاصيل الأمراض
        { wch: 10 }, // يوجد إعاقات
        { wch: 25 }, // أنواع الإعاقات
        { wch: 10 }, // إصابات حرب
        { wch: 15 }, // أطفال أقل من سنتين
        { wch: 15 }, // أطفال 2-5 سنوات
        { wch: 15 }, // تاريخ الإضافة
        { wch: 15 }  // تاريخ التحديث
      ];
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, 'البيانات العائلية');
      
      // تصدير الملف
      const fileName = `البيانات_العائلية_${new Date().toISOString().split('T')[0]}.xlsx`;
      console.log('اسم الملف:', fileName);
      
      XLSX.writeFile(wb, fileName);
      console.log('تم تصدير الملف بنجاح');
      
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      throw new Error('فشل في تصدير البيانات إلى Excel');
    }
  }
}