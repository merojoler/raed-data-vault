import * as XLSX from 'xlsx';
import { FamilyData, FamilyMember } from '@/types/family';

const calculateAge = (birthDate: string): number => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
};

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
          
          const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (rawData.length < 2) {
            throw new Error('الملف فارغ أو لا يحتوي على بيانات صحيحة');
          }
          
          const dataRows = rawData.slice(1) as any[];
          
          const importedFamilies: FamilyData[] = dataRows
            .filter(row => row.length > 0 && row[0])
            .map((row, index) => {
              try {
                const today = new Date().toISOString().split('T')[0];
                
                const family: FamilyData = {
                  id: `family-${Date.now()}-${index}`,
                  entryDate: today,
                  headOfHouseholdName: row[2] || '',
                  headOfHouseholdId: row[3] || '',
                  contactNumber: row[4] || '',
                  members: [], // سيتم ملؤها لاحقاً
                  isPregnant: row[5] === 'نعم' || row[5] === 'Yes',
                  isBreastfeeding: row[6] === 'نعم' || row[6] === 'Yes',
                  hasUnaccompaniedChild: row[7] === 'نعم' || row[7] === 'Yes',
                  unaccompaniedChildDetails: row[7] === 'نعم' || row[7] === 'Yes' ? {
                    name: row[8] || '',
                    details: row[9] || ''
                  } : undefined,
                  createdAt: new Date(),
                  updatedAt: new Date()
                };
                
                return family;
              } catch (error) {
                console.error(`خطأ في معالجة الصف ${index + 2}:`, error);
                throw new Error(`خطأ في الصف ${index + 2}: بيانات غير صحيحة`);
              }
            });
          
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
      if (families.length === 0) {
        throw new Error('لا توجد بيانات للتصدير');
      }
      
      const exportData: any[] = [];
      
      families.forEach(family => {
        // ترتيب الأعضاء: رب الأسرة أولاً، ثم الزوج/ة، ثم الأطفال
        const sortedMembers = [...family.members].sort((a, b) => {
          const order = { 'Head': 0, 'Spouse': 1, 'Son': 2, 'Daughter': 3 };
          return order[a.relationship] - order[b.relationship];
        });
        
        sortedMembers.forEach((member, memberIndex) => {
          const chronicIllnessList = Object.entries(member.chronicIllnesses)
            .filter(([_, value]) => value)
            .map(([key, _]) => {
              const illnessNames: Record<string, string> = {
                diabetes: 'سكري',
                hypertension: 'ضغط',
                heartDisease: 'أمراض قلب',
                asthma: 'أزمة',
                cancer: 'سرطان',
                kidneyDisease: 'أمراض كلى',
                hiv: 'إيدز',
                arthritis: 'التهاب مفاصل'
              };
              return illnessNames[key] || key;
            });
          
          const disabilitiesList = Object.entries(member.disabilities)
            .filter(([_, value]) => value)
            .map(([key, _]) => {
              const disabilityNames: Record<string, string> = {
                physical: 'حركية',
                visual: 'بصرية',
                hearing: 'سمعية',
                intellectual: 'ذهنية',
                mentalPsychological: 'عقلية - نفسية'
              };
              return disabilityNames[key] || key;
            });
          
          const relationshipNames: Record<string, string> = {
            'Head': 'رب الأسرة',
            'Spouse': 'زوج/زوجة',
            'Son': 'ابن',
            'Daughter': 'ابنة'
          };
          
          exportData.push({
            'Entry Date': family.entryDate,
            'Enumerator Nam': family.headOfHouseholdName,
            'HH Head': memberIndex === 0 ? family.headOfHouseholdName : '',
            'Full Name': member.fullName,
            'National ID': member.identityNumber,
            'Date of Birth': new Date(member.birthDate).toLocaleDateString('en-CA'),
            'Gender (F/M)': member.gender,
            'Contact Num': memberIndex === 0 ? family.contactNumber : '',
            'Marital Stat': member.maritalStatus,
            'Relation to HH Head': relationshipNames[member.relationship] || member.relationship,
            'Unaccompanied child (yes/no)': family.hasUnaccompaniedChild ? 'Yes' : '',
            'Pregnancy/breastfeeding (yes/no)': memberIndex === 0 ? (family.isPregnant ? 'حامل' : '') + (family.isBreastfeeding ? ' مرضع' : '') : '',
            'Diabet': member.chronicIllnesses.diabetes ? 'Yes' : '',
            'Hypertens': member.chronicIllnesses.hypertension ? 'Yes' : '',
            'Heart disea': member.chronicIllnesses.heartDisease ? 'Yes' : '',
            'Chronic illness (yes/no)': member.hasChronicIllness ? 'Yes' : '',
            'Asthm': member.chronicIllnesses.asthma ? 'Yes' : '',
            'Cancer': member.chronicIllnesses.cancer ? 'Yes' : '',
            'Chronic kidney disea': member.chronicIllnesses.kidneyDisease ? 'Yes' : '',
            'HIV/AID': member.chronicIllnesses.hiv ? 'Yes' : '',
            'Arthrit': member.chronicIllnesses.arthritis ? 'Yes' : '',
            'Physic': member.disabilities.physical ? 'Yes' : '',
            'Vision Lo': member.disabilities.visual ? 'Yes' : '',
            'Disabilities (yes/no)': member.hasDisabilities ? 'Yes' : '',
            'Hearing Lo': member.disabilities.hearing ? 'Yes' : '',
            'Intellect': member.disabilities.intellectual ? 'Yes' : '',
            'Mental/psychosoc': member.disabilities.mentalPsychological ? 'Yes' : '',
            'UXO Victim (yes/no)': member.isUXOVictim ? 'Yes' : '',
            'Employment/Income': member.hasStableIncome ? 'Yes' : '',
            'Calculated Field': '',
            'Age': member.age.toString()
          });
        });
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // تحسين عرض الأعمدة
      const colWidths = [
        { wch: 12 }, // Entry Date
        { wch: 20 }, // Enumerator Nam
        { wch: 20 }, // HH Head
        { wch: 25 }, // Full Name
        { wch: 12 }, // National ID
        { wch: 12 }, // Date of Birth
        { wch: 8 },  // Gender
        { wch: 12 }, // Contact Num
        { wch: 12 }, // Marital Stat
        { wch: 15 }, // Relation to HH Head
        { wch: 15 }, // Unaccompanied child
        { wch: 20 }, // Pregnancy/breastfeeding
        { wch: 8 },  // Diabet
        { wch: 10 }, // Hypertens
        { wch: 10 }, // Heart disea
        { wch: 15 }, // Chronic illness
        { wch: 8 },  // Asthm
        { wch: 8 },  // Cancer
        { wch: 15 }, // Chronic kidney disea
        { wch: 8 },  // HIV/AID
        { wch: 8 },  // Arthrit
        { wch: 8 },  // Physic
        { wch: 10 }, // Vision Lo
        { wch: 15 }, // Disabilities
        { wch: 10 }, // Hearing Lo
        { wch: 10 }, // Intellect
        { wch: 15 }, // Mental/psychosoc
        { wch: 15 }, // UXO Victim
        { wch: 15 }, // Employment/Income
        { wch: 10 }, // Calculated Field
        { wch: 5 }   // Age
      ];
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, 'IDPs detailed list');
      
      const fileName = `IDPs_detailed_list_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      throw new Error('فشل في تصدير البيانات إلى Excel');
    }
  }
}