import * as XLSX from 'xlsx';
import { FamilyData } from '@/types/family';

export class ExcelService {
  static importFamiliesFromExcel(file: File): Promise<FamilyData[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // تحويل البيانات إلى JSON
          const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (rawData.length < 2) {
            throw new Error('الملف فارغ أو لا يحتوي على بيانات صحيحة');
          }
          
          // تجاهل الصف الأول (العناوين) والبدء من الصف الثاني
          const dataRows = rawData.slice(1) as any[];
          
          const importedFamilies: FamilyData[] = dataRows
            .filter(row => row.length > 0 && row[0]) // التأكد من وجود بيانات في الصف
            .map((row, index) => {
              try {
                // تحليل بيانات أفراد العائلة
                const membersText = row[11] || '';
                const members: any[] = [];
                
                if (membersText && typeof membersText === 'string') {
                  const memberLines = membersText.split('\n').filter(line => line.trim());
                  memberLines.forEach(line => {
                    const nameMatch = line.match(/\d+\.\s*(.+?)\s*\((.+?)\)/);
                    const birthMatch = line.match(/تاريخ الميلاد:\s*(.+)/);
                    const healthMatch = line.match(/الحالة الصحية:\s*(.+)/);
                    
                    if (nameMatch) {
                      const member = {
                        id: `member-${Date.now()}-${Math.random()}`,
                        fullName: nameMatch[1].trim(),
                        relationship: nameMatch[2].trim(),
                        birthDate: birthMatch ? birthMatch[1].trim() : '',
                        healthStatus: healthMatch ? healthMatch[1].trim() : ''
                      };
                      members.push(member);
                    }
                  });
                }
                
                // تحليل أنواع الإعاقات
                const disabilityTypesText = row[15] || '';
                const disabilityTypes = {
                  بصرية: disabilityTypesText.includes('بصرية'),
                  سمعية: disabilityTypesText.includes('سمعية'),
                  حركية: disabilityTypesText.includes('حركية'),
                  ذهنية: disabilityTypesText.includes('ذهنية'),
                  نفسية: disabilityTypesText.includes('نفسية'),
                  التوحد: disabilityTypesText.includes('التوحد'),
                  متعددة: disabilityTypesText.includes('متعددة'),
                  أخرى: disabilityTypesText.includes('أخرى')
                };
                
                const family: FamilyData = {
                  id: `family-${Date.now()}-${index}`,
                  husbandName: row[0] || '',
                  husbandId: row[1] || '',
                  husbandBirthDate: row[2] || '',
                  wifeName: row[3] || '',
                  wifeId: row[4] || '',
                  wifeBirthDate: row[5] || '',
                  isPregnant: row[6] === 'نعم',
                  isBreastfeeding: row[7] === 'نعم',
                  phoneNumber: row[8] || '',
                  alternativePhoneNumber: row[9] === 'غير محدد' ? '' : row[9] || '',
                  familySize: parseInt(row[10]) || members.length,
                  members: members,
                  hasDiseases: row[12] === 'نعم',
                  diseaseDetails: row[13] || '',
                  hasDisabilities: row[14] === 'نعم',
                  disabilityTypes: disabilityTypes,
                  hasWarInjuries: row[16] === 'نعم',
                  hasChildrenUnder2: row[17] === 'نعم',
                  hasChildren2to5: row[18] === 'نعم',
                  createdAt: new Date(),
                  updatedAt: new Date()
                };
                
                return family;
              } catch (error) {
                console.error(`خطأ في معالجة الصف ${index + 2}:`, error);
                throw new Error(`خطأ في الصف ${index + 2}: بيانات غير صحيحة`);
              }
            });
          
          console.log('تم استيراد العائلات:', importedFamilies);
          resolve(importedFamilies);
          
        } catch (error) {
          console.error('Error importing Excel:', error);
          reject(new Error('فشل في قراءة ملف Excel. تأكد من صحة تنسيق الملف.'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('فشل في قراءة الملف'));
      };
      
      reader.readAsBinaryString(file);
    });
  }

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
        'تاريخ ميلاد الزوج': new Date(family.husbandBirthDate).toLocaleDateString('ar-SA'),
        'اسم الزوجة': family.wifeName,
        'رقم هوية الزوجة': family.wifeId,
        'تاريخ ميلاد الزوجة': new Date(family.wifeBirthDate).toLocaleDateString('ar-SA'),
        'حامل': family.isPregnant ? 'نعم' : 'لا',
        'مرضع': family.isBreastfeeding ? 'نعم' : 'لا',
        'رقم الجوال الأساسي': family.phoneNumber,
        'رقم الجوال البديل': family.alternativePhoneNumber || 'غير محدد',
        'عدد أفراد العائلة': family.familySize,
        'أفراد العائلة': family.members.map((member, index) => 
          `${index + 1}. ${member.fullName} (${member.relationship})
   تاريخ الميلاد: ${new Date(member.birthDate).toLocaleDateString('ar-SA')}${member.healthStatus ? `
   الحالة الصحية: ${member.healthStatus}` : ''}
`
        ).join('\n'),
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
          'تاريخ ميلاد الزوج',
          'اسم الزوجة',
          'رقم هوية الزوجة',
          'تاريخ ميلاد الزوجة',
          'حامل',
          'مرضع',
          'رقم الجوال الأساسي',
          'رقم الجوال البديل',
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
        { wch: 18 }, // اسم الزوج
        { wch: 15 }, // رقم هوية الزوج
        { wch: 15 }, // تاريخ ميلاد الزوج
        { wch: 18 }, // اسم الزوجة
        { wch: 15 }, // رقم هوية الزوجة
        { wch: 15 }, // تاريخ ميلاد الزوجة
        { wch: 8 },  // حامل
        { wch: 8 },  // مرضع
        { wch: 15 }, // رقم الجوال الأساسي
        { wch: 15 }, // رقم الجوال البديل
        { wch: 12 }, // عدد أفراد العائلة
        { wch: 35 }, // أفراد العائلة
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