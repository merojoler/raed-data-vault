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
          
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (jsonData.length < 2) {
            throw new Error('الملف فارغ أو لا يحتوي على بيانات صحيحة');
          }

          // استخراج العناوين من الصف الأول
          const headers = jsonData[0] as string[];
          const dataRows = jsonData.slice(1) as any[][];

          // تجميع البيانات حسب العائلات - استراتيجية محسنة للتجميع الصحيح
          const rawFamilyData = new Map<string, any[]>();
          let currentFamilyKey = '';
          let currentHeadName = '';
          
          // مرحلة أولى: تحديد العائلات والمعرف الصحيح لكل عائلة
          dataRows.forEach((row, rowIndex) => {
            try {
              if (!row || row.length === 0 || !row[3]) return; // تخطي الصفوف الفارغة

              const fullName = (row[3] || '').trim(); // Full Name
              const relation = (row[11] || '').trim(); // Relation to HH Head
              const hhHeadCell = (row[2] || '').trim(); // HH Head
              const enumeratorName = (row[1] || '').trim(); // Enumerator Name
              const nationalId = (row[4] || '').trim(); // National ID
              
              // إنشاء مفتاح موحد للعائلة بناءً على عدة عوامل
              let familyIdentifier = '';
              
              // الطريقة الأولى: استخدام عمود رب الأسرة إذا كان مملوء
              if (hhHeadCell) {
                familyIdentifier = hhHeadCell;
              }
              // الطريقة الثانية: استخدام اسم العداد كمعرف للعائلة
              else if (enumeratorName) {
                familyIdentifier = enumeratorName;
              }
              // الطريقة الثالثة: إذا كان هذا الشخص رب الأسرة
              else if (relation.toLowerCase().includes('head') || relation.toLowerCase().includes('رب') || relation === '') {
                familyIdentifier = fullName;
                currentHeadName = fullName;
              }
              // الطريقة الرابعة: استخدام رب الأسرة الحالي
              else if (currentHeadName) {
                familyIdentifier = currentHeadName;
              }
              // الطريقة الأخيرة: استخدام الاسم الكامل
              else {
                familyIdentifier = fullName;
                currentHeadName = fullName;
              }

              // تحديث رب الأسرة الحالي إذا وُجد رب أسرة جديد
              if (relation.toLowerCase().includes('head') || relation.toLowerCase().includes('رب')) {
                currentHeadName = fullName;
                familyIdentifier = fullName;
              }
              
              // إنشاء مفتاح ثابت للعائلة
              const familyKey = familyIdentifier.replace(/\s+/g, '_').toLowerCase().replace(/[^\w\u0600-\u06FF]/g, '');
              
              if (!rawFamilyData.has(familyKey)) {
                rawFamilyData.set(familyKey, []);
              }
              
              // حفظ البيانات مع المعرف الصحيح للعائلة
              rawFamilyData.get(familyKey)!.push({
                row,
                fullName,
                relation,
                hhHead: hhHeadCell || familyIdentifier,
                enumerator: enumeratorName || familyIdentifier,
                nationalId,
                familyHeadName: familyIdentifier,
                originalRowIndex: rowIndex
              });
              
            } catch (error) {
              console.error(`خطأ في معالجة الصف ${rowIndex + 2}:`, error);
            }
          });

          // مرحلة ثانية: إنشاء العائلات من البيانات المجمعة
          const familiesMap = new Map<string, any>();
          
          rawFamilyData.forEach((familyMembers, familyKey) => {
            try {
              // ترتيب الأعضاء: رب الأسرة أولاً
              const sortedMembers = familyMembers.sort((a, b) => {
                const aIsHead = a.relation.toLowerCase().includes('head') || a.relation.toLowerCase().includes('رب') || a.relation === '' || !a.hhHead;
                const bIsHead = b.relation.toLowerCase().includes('head') || b.relation.toLowerCase().includes('رب') || b.relation === '' || !b.hhHead;
                
                if (aIsHead && !bIsHead) return -1;
                if (!aIsHead && bIsHead) return 1;
                return 0;
              });
              
              // إنشاء العائلة الجديدة
              const firstMember = sortedMembers[0];
              const today = new Date().toISOString().split('T')[0];
              
              const family = {
                id: `family-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                entryDate: firstMember.row[0] || today,
                headOfHouseholdName: firstMember.familyHeadName,
                headOfHouseholdId: '',
                contactNumber: '',
                members: [],
                isPregnant: false,
                isBreastfeeding: false,
                hasUnaccompaniedChild: false,
                unaccompaniedChildDetails: undefined,
                createdAt: new Date(),
                updatedAt: new Date()
              };

              // إضافة جميع الأعضاء
              sortedMembers.forEach((memberData) => {
                const { row, fullName, relation, nationalId } = memberData;
                
                // تحديد العلاقة بدقة
                let relationship: 'Head' | 'Spouse' | 'Son' | 'Daughter';
                const relationStr = relation.toLowerCase().trim();
                
                if (relationStr.includes('head') || relationStr.includes('رب') || relation === '' || !memberData.hhHead) {
                  relationship = 'Head';
                } else if (relationStr.includes('زوج') || relationStr.includes('wife') || relationStr.includes('spouse') || relationStr.includes('زوجة')) {
                  relationship = 'Spouse';
                } else if (relationStr.includes('ابن') || relationStr.includes('son') || relationStr.includes('boy')) {
                  relationship = 'Son';
                } else if (relationStr.includes('ابنة') || relationStr.includes('daughter') || relationStr.includes('بنت') || relationStr.includes('girl')) {
                  relationship = 'Daughter';
                } else {
                  // تخمين العلاقة بناءً على العمر والجنس
                  const age = row[32] ? parseInt(row[32]) : 25;
                  const gender = row[6] === 'F' || row[6] === 'أ' ? 'F' : 'M';
                  
                  if (age >= 18) {
                    relationship = gender === 'M' ? 'Head' : 'Spouse';
                  } else {
                    relationship = gender === 'M' ? 'Son' : 'Daughter';
                  }
                }

                // إنشاء تاريخ الميلاد
                const birthDateStr = row[5] || '';
                let birthDate = new Date();
                if (birthDateStr) {
                  const parsedDate = new Date(birthDateStr);
                  if (!isNaN(parsedDate.getTime())) {
                    birthDate = parsedDate;
                  }
                }

                const age = row[32] ? parseInt(row[32]) : calculateAge(birthDate.toISOString().split('T')[0]);

                const member: FamilyMember = {
                  id: `member-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  fullName: fullName,
                  identityNumber: nationalId,
                  birthDate: birthDate.toISOString().split('T')[0],
                  age: age,
                  gender: row[6] === 'F' || row[6] === 'أ' ? 'F' : 'M',
                  phoneNumber: relationship === 'Head' ? (row[7] || row[9] || '') : '',
                  alternativePhoneNumber: relationship !== 'Head' ? (row[8] || '') : '',
                  maritalStatus: row[10] || 'Single',
                  relationship: relationship,
                  hasChronicIllness: 
                    (row[14] || '').includes('Yes') || (row[14] || '').includes('نعم') ||
                    (row[15] || '').includes('Yes') || (row[15] || '').includes('نعم') ||
                    (row[16] || '').includes('Yes') || (row[16] || '').includes('نعم') ||
                    (row[18] || '').includes('Yes') || (row[18] || '').includes('نعم') ||
                    (row[19] || '').includes('Yes') || (row[19] || '').includes('نعم') ||
                    (row[20] || '').includes('Yes') || (row[20] || '').includes('نعم') ||
                    (row[21] || '').includes('Yes') || (row[21] || '').includes('نعم') ||
                    (row[22] || '').includes('Yes') || (row[22] || '').includes('نعم'),
                  chronicIllnesses: {
                    diabetes: (row[14] || '').includes('Yes') || (row[14] || '').includes('نعم'),
                    hypertension: (row[15] || '').includes('Yes') || (row[15] || '').includes('نعم'),
                    heartDisease: (row[16] || '').includes('Yes') || (row[16] || '').includes('نعم'),
                    asthma: (row[18] || '').includes('Yes') || (row[18] || '').includes('نعم'),
                    cancer: (row[19] || '').includes('Yes') || (row[19] || '').includes('نعم'),
                    kidneyDisease: (row[20] || '').includes('Yes') || (row[20] || '').includes('نعم'),
                    hiv: (row[21] || '').includes('Yes') || (row[21] || '').includes('نعم'),
                    arthritis: (row[22] || '').includes('Yes') || (row[22] || '').includes('نعم')
                  },
                  hasDisabilities: 
                    (row[23] || '').includes('Yes') || (row[23] || '').includes('نعم') ||
                    (row[24] || '').includes('Yes') || (row[24] || '').includes('نعم') ||
                    (row[26] || '').includes('Yes') || (row[26] || '').includes('نعم') ||
                    (row[27] || '').includes('Yes') || (row[27] || '').includes('نعم') ||
                    (row[28] || '').includes('Yes') || (row[28] || '').includes('نعم'),
                  disabilities: {
                    physical: (row[23] || '').includes('Yes') || (row[23] || '').includes('نعم'),
                    visual: (row[24] || '').includes('Yes') || (row[24] || '').includes('نعم'),
                    hearing: (row[26] || '').includes('Yes') || (row[26] || '').includes('نعم'),
                    intellectual: (row[27] || '').includes('Yes') || (row[27] || '').includes('نعم'),
                    mentalPsychological: (row[28] || '').includes('Yes') || (row[28] || '').includes('نعم')
                  },
                  isUXOVictim: (row[29] || '').includes('Yes') || (row[29] || '').includes('نعم'),
                  hasStableIncome: (row[30] || '').includes('Yes') || (row[30] || '').includes('نعم')
                };

                family.members.push(member);

                // تحديث معلومات العائلة حسب رب الأسرة
                if (relationship === 'Head') {
                  family.headOfHouseholdName = member.fullName;
                  family.headOfHouseholdId = member.identityNumber;
                  family.contactNumber = member.phoneNumber || row[9] || '';
                }

                // تحديث حالة الحمل والرضاعة
                const pregnancyInfo = row[13] || '';
                if (pregnancyInfo.includes('حامل') || pregnancyInfo.includes('pregnant')) {
                  family.isPregnant = true;
                }
                if (pregnancyInfo.includes('مرضع') || pregnancyInfo.includes('breastfeeding')) {
                  family.isBreastfeeding = true;
                }

                // تحديث حالة الطفل غير المصحوب
                if ((row[12] || '').includes('Yes') || (row[12] || '').includes('نعم')) {
                  family.hasUnaccompaniedChild = true;
                }
              });

              // ترتيب الأعضاء داخل العائلة
              family.members.sort((a: FamilyMember, b: FamilyMember) => {
                const order = { 'Head': 0, 'Spouse': 1, 'Son': 2, 'Daughter': 3 };
                return order[a.relationship] - order[b.relationship];
              });

              familiesMap.set(familyKey, family);
              
            } catch (error) {
              console.error(`خطأ في معالجة العائلة ${familyKey}:`, error);
            }
          });

          const importedFamilies = Array.from(familiesMap.values());

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
            'Spouse': 'زوجة',
            'Son': 'ابن',
            'Daughter': 'ابنة'
          };
          
          exportData.push({
            'Entry Date\nتاريخ الإدخال': family.entryDate,
            'Enumerator Name\nاسم العداد': family.headOfHouseholdName, // نفس اسم رب الأسرة لجميع الأعضاء
            'HH Head\nرب الأسرة': family.headOfHouseholdName, // نفس اسم رب الأسرة لجميع الأعضاء
            'Full Name\nالاسم الكامل': member.fullName,
            'National ID\nرقم الهوية': member.identityNumber,
            'Date of Birth\nتاريخ الولادة': new Date(member.birthDate).toLocaleDateString('en-CA'),
            'Gender (F/M)\nالجنس (أ/ذ)': member.gender,
            'Phone Number\nرقم الهاتف': member.phoneNumber || '',
            'Alternative Phone\nرقم الهاتف البديل': member.alternativePhoneNumber || '',
            'Contact Number\nرقم التواصل': family.contactNumber,
            'Marital Status\nالحالة الاجتماعية': member.maritalStatus,
            'Relation to HH Head\nصلة القرابة برب الأسرة': relationshipNames[member.relationship] || member.relationship,
            'Unaccompanied child\nطفل غير مصحوب': family.hasUnaccompaniedChild ? 'Yes\nنعم' : '',
            'Pregnancy/breastfeeding\nحمل/رضاعة': (family.isPregnant ? 'حامل' : '') + (family.isBreastfeeding ? (family.isPregnant ? ' مرضع' : 'مرضع') : ''),
            'Diabetes\nسكري': member.chronicIllnesses.diabetes ? 'Yes\nنعم' : '',
            'Hypertension\nضغط الدم': member.chronicIllnesses.hypertension ? 'Yes\nنعم' : '',
            'Heart Disease\nأمراض القلب': member.chronicIllnesses.heartDisease ? 'Yes\nنعم' : '',
            'Chronic Illness\nأمراض مزمنة': member.hasChronicIllness ? 'Yes\nنعم' : '',
            'Asthma\nأزمة': member.chronicIllnesses.asthma ? 'Yes\nنعم' : '',
            'Cancer\nسرطان': member.chronicIllnesses.cancer ? 'Yes\nنعم' : '',
            'Chronic Kidney Disease\nأمراض الكلى المزمنة': member.chronicIllnesses.kidneyDisease ? 'Yes\nنعم' : '',
            'HIV/AIDS\nالإيدز': member.chronicIllnesses.hiv ? 'Yes\nنعم' : '',
            'Arthritis\nالتهاب المفاصل': member.chronicIllnesses.arthritis ? 'Yes\nنعم' : '',
            'Physical Disability\nإعاقة حركية': member.disabilities.physical ? 'Yes\nنعم' : '',
            'Vision Loss\nفقدان البصر': member.disabilities.visual ? 'Yes\nنعم' : '',
            'Disabilities\nإعاقات': member.hasDisabilities ? 'Yes\nنعم' : '',
            'Hearing Loss\nفقدان السمع': member.disabilities.hearing ? 'Yes\nنعم' : '',
            'Intellectual Disability\nإعاقة ذهنية': member.disabilities.intellectual ? 'Yes\nنعم' : '',
            'Mental/Psychological\nعقلية/نفسية': member.disabilities.mentalPsychological ? 'Yes\nنعم' : '',
            'UXO Victim\nضحية ذخائر غير منفجرة': member.isUXOVictim ? 'Yes\nنعم' : '',
            'Employment/Income\nعمل/دخل': member.hasStableIncome ? 'Yes\nنعم' : '',
            'Calculated Field\nحقل محسوب': '',
            'Age\nالعمر': member.age.toString()
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
        { wch: 15 }, // Phone Number
        { wch: 15 }, // Alternative Phone
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