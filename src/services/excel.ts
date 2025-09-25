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

          const headers = jsonData[0] as string[];
          const dataRows = jsonData.slice(1) as any[][];

          // تجميع البيانات حسب هوية رب الأسرة (العمود الثالث)
          const familiesMap = new Map<string, any[]>();
          
          dataRows.forEach((row, rowIndex) => {
            try {
              if (!row || row.length === 0 || !row[3]) return;

              // العمود الثالث يحتوي على هوية رب الأسرة
              const headId = (row[2] || '').toString().trim();
              if (!headId) return;

              if (!familiesMap.has(headId)) {
                familiesMap.set(headId, []);
              }
              
              familiesMap.get(headId)!.push({
                row,
                originalRowIndex: rowIndex
              });
            } catch (error) {
              console.error(`خطأ في معالجة الصف ${rowIndex + 2}:`, error);
            }
          });

          // إنشاء العائلات من البيانات المجمعة
          const importedFamilies: FamilyData[] = [];
          
          familiesMap.forEach((familyMembers, headId) => {
            try {
              // ترتيب الأعضاء: رب الأسرة أولاً
              const sortedMembers = familyMembers.sort((a, b) => {
                const aRelation = (a.row[9] || '').toString().toLowerCase();
                const bRelation = (b.row[9] || '').toString().toLowerCase();
                
                const aIsHead = aRelation.includes('رب') || aRelation.includes('head');
                const bIsHead = bRelation.includes('رب') || bRelation.includes('head');
                
                if (aIsHead && !bIsHead) return -1;
                if (!aIsHead && bIsHead) return 1;
                return 0;
              });
              
              const today = new Date().toISOString().split('T')[0];
              const firstMember = sortedMembers[0];
              
              const family: FamilyData = {
                id: `family-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                entryDate: firstMember.row[0] || today,
                headOfHouseholdName: '',
                headOfHouseholdId: headId,
                contactNumber: '',
                members: [],
                hasChildUnder2: false,
                hasChild2To5: false,
                hasUnaccompaniedChild: false,
                unaccompaniedChildDetails: undefined,
                createdAt: new Date(),
                updatedAt: new Date()
              };

              // إضافة جميع الأعضاء
              sortedMembers.forEach((memberData) => {
                const { row } = memberData;
                
                const fullName = (row[3] || '').toString().trim();
                const identityNumber = (row[4] || '').toString().trim();
                const relationStr = (row[9] || '').toString().toLowerCase().trim();
                
                // تحديد العلاقة
                let relationship: 'Head' | 'Spouse' | 'Son' | 'Daughter';
                if (relationStr.includes('رب') || relationStr.includes('head')) {
                  relationship = 'Head';
                } else if (relationStr.includes('زوج') || relationStr.includes('spouse') || relationStr.includes('wife')) {
                  relationship = 'Spouse';
                } else if (relationStr.includes('ابن') || relationStr.includes('son')) {
                  relationship = 'Son';
                } else if (relationStr.includes('ابنة') || relationStr.includes('daughter') || relationStr.includes('بنت')) {
                  relationship = 'Daughter';
                } else {
                  // تخمين بناءً على العمر والجنس
                  const age = parseInt(row[27]) || 25;
                  const gender = row[6] === 'F' ? 'F' : 'M';
                  
                  if (age >= 18) {
                    relationship = gender === 'M' ? 'Head' : 'Spouse';
                  } else {
                    relationship = gender === 'M' ? 'Son' : 'Daughter';
                  }
                }

                // تاريخ الميلاد
                const birthDateStr = row[5] || '';
                let birthDate = new Date();
                if (birthDateStr) {
                  const parsedDate = new Date(birthDateStr);
                  if (!isNaN(parsedDate.getTime())) {
                    birthDate = parsedDate;
                  }
                }

                const age = parseInt(row[27]) || calculateAge(birthDate.toISOString().split('T')[0]);

                const member: FamilyMember = {
                  id: `member-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  fullName: fullName,
                  identityNumber: identityNumber,
                  birthDate: birthDate.toISOString().split('T')[0],
                  age: age,
                  gender: (row[6] === 'F' || row[6] === 'أ') ? 'F' : 'M',
                  phoneNumber: relationship === 'Head' ? (row[7] || '') : '',
                  maritalStatus: (() => {
                    const raw = (row[8] || '').toString().trim().toLowerCase();
                    if (/متزوج|married/.test(raw)) return 'متزوج';
                    if (/أعزب|single/.test(raw)) return 'أعزب';
                    if (/أرمل|widow/.test(raw)) return 'أرمل';
                    if (/مطلق|divorc/.test(raw)) return 'مطلق';
                    if (/مهجور|separated/.test(raw)) return 'مهجور';
                    return 'أعزب';
                  })(),
                  relationship: relationship,
                  hasChronicIllness: [13,14,15,16,17,18,19,20].some(i => 
                    (row[i] || '').toString().toLowerCase().includes('yes') || 
                    (row[i] || '').toString().includes('نعم')
                  ),
                  chronicIllnesses: {
                    diabetes: (row[13] || '').toString().toLowerCase().includes('yes') || (row[13] || '').includes('نعم'),
                    hypertension: (row[14] || '').toString().toLowerCase().includes('yes') || (row[14] || '').includes('نعم'),
                    heartDisease: (row[15] || '').toString().toLowerCase().includes('yes') || (row[15] || '').includes('نعم'),
                    asthma: (row[16] || '').toString().toLowerCase().includes('yes') || (row[16] || '').includes('نعم'),
                    cancer: (row[17] || '').toString().toLowerCase().includes('yes') || (row[17] || '').includes('نعم'),
                    kidneyDisease: (row[18] || '').toString().toLowerCase().includes('yes') || (row[18] || '').includes('نعم'),
                    hiv: (row[19] || '').toString().toLowerCase().includes('yes') || (row[19] || '').includes('نعم'),
                    arthritis: (row[20] || '').toString().toLowerCase().includes('yes') || (row[20] || '').includes('نعم')
                  },
                  hasDisabilities: [21,22,23,24,25].some(i => 
                    (row[i] || '').toString().toLowerCase().includes('yes') || 
                    (row[i] || '').toString().includes('نعم')
                  ),
                  disabilities: {
                    physical: (row[21] || '').toString().toLowerCase().includes('yes') || (row[21] || '').includes('نعم'),
                    visual: (row[22] || '').toString().toLowerCase().includes('yes') || (row[22] || '').includes('نعم'),
                    hearing: (row[23] || '').toString().toLowerCase().includes('yes') || (row[23] || '').includes('نعم'),
                    intellectual: (row[24] || '').toString().toLowerCase().includes('yes') || (row[24] || '').includes('نعم'),
                    mentalPsychological: (row[25] || '').toString().toLowerCase().includes('yes') || (row[25] || '').includes('نعم')
                  },
                  isUXOVictim: (row[26] || '').toString().toLowerCase().includes('yes') || (row[26] || '').includes('نعم'),
                  hasStableIncome: (row[27] || '').toString().toLowerCase().includes('yes') || (row[27] || '').includes('نعم'),
                  // للزوجة فقط
                  isPregnant: relationship === 'Spouse' ? 
                    ((row[11] || '').includes('حامل') || (row[11] || '').includes('pregnant')) : undefined,
                  isBreastfeeding: relationship === 'Spouse' ? 
                    ((row[12] || '').includes('مرضع') || (row[12] || '').includes('breastfeeding')) : undefined
                };

                family.members.push(member);

                // تحديث معلومات العائلة
                if (relationship === 'Head') {
                  family.headOfHouseholdName = member.fullName;
                  family.contactNumber = member.phoneNumber || '';
                }

                // تحديث حالة الطفل غير المصحوب
                if ((row[10] || '').toString().toLowerCase().includes('yes') || (row[10] || '').includes('نعم')) {
                  family.hasUnaccompaniedChild = true;
                }

                // تحديث الأطفال الصغار
                if (age < 2) family.hasChildUnder2 = true;
                if (age >= 2 && age <= 5) family.hasChild2To5 = true;
              });

              // ترتيب الأعضاء
              family.members.sort((a, b) => {
                const order = { 'Head': 0, 'Spouse': 1, 'Son': 2, 'Daughter': 3 };
                return order[a.relationship] - order[b.relationship];
              });

              importedFamilies.push(family);
              
            } catch (error) {
              console.error(`خطأ في معالجة العائلة ${headId}:`, error);
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
          const relationshipNames: Record<string, string> = {
            'Head': 'رب الأسرة',
            'Spouse': 'زوجة',
            'Son': 'ابن',
            'Daughter': 'ابنة'
          };
          
          exportData.push({
            'Entry Date\nتاريخ الإدخال': family.entryDate,
            'Data Entry Person\nاسم مدخل البيانات': 'Raed ALbakri',
            'HH Head ID\nهوية رب الأسرة': family.headOfHouseholdId,
            'Full Name\nالاسم الكامل': member.fullName,
            'National ID\nرقم الهوية': member.identityNumber,
            'Date of Birth\nتاريخ الولادة': new Date(member.birthDate).toLocaleDateString('en-CA'),
            'Gender (M/F)\nالجنس (ذ/أ)': member.gender,
            'Contact Number\nرقم التواصل': family.contactNumber,
            'Marital Status\nالحالة الاجتماعية': member.maritalStatus,
            'Relation to HH Head\nصلة القرابة برب الأسرة': relationshipNames[member.relationship] || member.relationship,
            'Unaccompanied child\nطفل غير مصحوب': family.hasUnaccompaniedChild ? (memberIndex === 0 ? 'Yes\nنعم' : '') : '',
            'Pregnant woman\nامرأة حامل': member.relationship === 'Spouse' && member.isPregnant ? 'Yes\nنعم' : '',
            'Breastfeeding woman\nامرأة مرضع': member.relationship === 'Spouse' && member.isBreastfeeding ? 'Yes\nنعم' : '',
            'Diabetes\nسكري': member.chronicIllnesses.diabetes ? 'Yes\nنعم' : '',
            'Hypertension\nضغط الدم': member.chronicIllnesses.hypertension ? 'Yes\nنعم' : '',
            'Heart Disease\nأمراض القلب': member.chronicIllnesses.heartDisease ? 'Yes\nنعم' : '',
            'Asthma\nأزمة': member.chronicIllnesses.asthma ? 'Yes\nنعم' : '',
            'Cancer\nسرطان': member.chronicIllnesses.cancer ? 'Yes\nنعم' : '',
            'Chronic Kidney Disease\nأمراض الكلى المزمنة': member.chronicIllnesses.kidneyDisease ? 'Yes\nنعم' : '',
            'HIV/AIDS\nالإيدز': member.chronicIllnesses.hiv ? 'Yes\nنعم' : '',
            'Arthritis\nالتهاب المفاصل': member.chronicIllnesses.arthritis ? 'Yes\nنعم' : '',
            'Physical Disability\nإعاقة حركية': member.disabilities.physical ? 'Yes\nنعم' : '',
            'Vision Loss\nفقدان البصر': member.disabilities.visual ? 'Yes\nنعم' : '',
            'Hearing Loss\nفقدان السمع': member.disabilities.hearing ? 'Yes\nنعم' : '',
            'Intellectual Disability\nإعاقة ذهنية': member.disabilities.intellectual ? 'Yes\nنعم' : '',
            'Mental/Psychological\nعقلية/نفسية': member.disabilities.mentalPsychological ? 'Yes\nنعم' : '',
            'UXO Victim\nضحية ذخائر غير منفجرة': member.isUXOVictim ? 'Yes\nنعم' : '',
            'Employment/Income\nعمل/دخل': member.hasStableIncome ? 'Yes\nنعم' : '',
            'Age\nالعمر': member.age.toString(),
            'Child under 2\nطفل أقل من سنتين': member.age < 2 ? 'Yes\nنعم' : '',
            'Child 2-5 years\nطفل من 2-5 سنوات': (member.age >= 2 && member.age <= 5) ? 'Yes\nنعم' : ''
          });
        });
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // تنسيق خاص لرب الأسرة - خلفية صفراء
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1:Z1');
      const headRows: number[] = [];
      
      exportData.forEach((row, index) => {
        if (row['Relation to HH Head\nصلة القرابة برب الأسرة'] === 'رب الأسرة') {
          headRows.push(index + 2); // +2 because Excel is 1-indexed and has header row
        }
      });

      // إضافة التنسيق للخلفية الصفراء
      if (!ws['!rows']) ws['!rows'] = [];
      headRows.forEach(rowNum => {
        if (!ws['!rows'][rowNum - 1]) ws['!rows'][rowNum - 1] = {};
        // Note: XLSX doesn't support direct styling like this, but we keep for reference
      });
      
      // تحسين عرض الأعمدة
      const colWidths = [
        { wch: 12 }, // Entry Date
        { wch: 15 }, // Data Entry Person
        { wch: 15 }, // HH Head ID
        { wch: 25 }, // Full Name
        { wch: 12 }, // National ID
        { wch: 12 }, // Date of Birth
        { wch: 8 },  // Gender
        { wch: 15 }, // Contact Number
        { wch: 12 }, // Marital Status
        { wch: 15 }, // Relation to HH Head
        { wch: 15 }, // Unaccompanied child
        { wch: 15 }, // Pregnant woman
        { wch: 15 }, // Breastfeeding woman
        { wch: 8 },  // Diabetes
        { wch: 10 }, // Hypertension
        { wch: 10 }, // Heart Disease
        { wch: 8 },  // Asthma
        { wch: 8 },  // Cancer
        { wch: 15 }, // Chronic Kidney Disease
        { wch: 8 },  // HIV/AIDS
        { wch: 8 },  // Arthritis
        { wch: 8 },  // Physical Disability
        { wch: 10 }, // Vision Loss
        { wch: 10 }, // Hearing Loss
        { wch: 10 }, // Intellectual Disability
        { wch: 15 }, // Mental/Psychological
        { wch: 15 }, // UXO Victim
        { wch: 15 }, // Employment/Income
        { wch: 5 },  // Age
        { wch: 15 }, // Child under 2
        { wch: 15 }  // Child 2-5 years
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