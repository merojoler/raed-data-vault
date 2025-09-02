import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { FamilyData, FamilyMember } from '@/types/family';
import { FamilyStorageService } from '@/services/storage';
import { Plus, Trash2, Users, Heart, Phone, User, Baby, Crown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const relationshipOptions = [
  { value: 'Head', label: 'رب الأسرة', color: 'text-yellow-600' },
  { value: 'Spouse', label: 'زوج/زوجة', color: 'text-pink-600' },
  { value: 'Son', label: 'ابن', color: 'text-blue-600' },
  { value: 'Daughter', label: 'ابنة', color: 'text-purple-600' }
] as const;

const maritalStatusOptions = [
  'متزوج', 'أعزب', 'أرمل', 'مطلق', 'مهجور'
] as const;

const familyMemberSchema = z.object({
  fullName: z.string().min(1, 'الاسم مطلوب'),
  identityNumber: z.string().regex(/^\d{9}$/, 'رقم الهوية يجب أن يكون 9 أرقام'),
  birthDate: z.string().min(1, 'تاريخ الميلاد مطلوب'),
  gender: z.enum(['M', 'F']),
  relationship: z.enum(['Head', 'Spouse', 'Son', 'Daughter']),
  maritalStatus: z.enum(maritalStatusOptions),
  
  // الأمراض المزمنة
  hasChronicIllness: z.boolean(),
  chronicIllnesses: z.object({
    diabetes: z.boolean(),
    hypertension: z.boolean(),
    heartDisease: z.boolean(),
    asthma: z.boolean(),
    cancer: z.boolean(),
    kidneyDisease: z.boolean(),
    hiv: z.boolean(),
    arthritis: z.boolean()
  }),
  
  // الإعاقات
  hasDisabilities: z.boolean(),
  disabilities: z.object({
    physical: z.boolean(),
    visual: z.boolean(),
    hearing: z.boolean(),
    intellectual: z.boolean(),
    mentalPsychological: z.boolean()
  }),
  
  isUXOVictim: z.boolean(),
  hasStableIncome: z.boolean()
});

const familySchema = z.object({
  headOfHouseholdName: z.string().min(1, 'اسم رب الأسرة مطلوب'),
  headOfHouseholdId: z.string().regex(/^\d{9}$/, 'رقم الهوية يجب أن يكون 9 أرقام'),
  contactNumber: z.string().regex(/^\d{10}$/, 'رقم الاتصال يجب أن يكون 10 أرقام'),
  
  members: z.array(familyMemberSchema).min(1, 'يجب إضافة فرد واحد على الأقل'),
  
  isPregnant: z.boolean(),
  isBreastfeeding: z.boolean(),
  
  hasUnaccompaniedChild: z.boolean(),
  unaccompaniedChildName: z.string().optional(),
  unaccompaniedChildDetails: z.string().optional()
});

type FamilyFormData = z.infer<typeof familySchema>;

interface FamilyFormProps {
  existingFamily?: FamilyData;
  onSave: () => void;
  onCancel: () => void;
}

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

export const FamilyForm: React.FC<FamilyFormProps> = ({ 
  existingFamily, 
  onSave, 
  onCancel 
}) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<FamilyFormData>({
    resolver: zodResolver(familySchema),
    defaultValues: {
      headOfHouseholdName: existingFamily?.headOfHouseholdName || '',
      headOfHouseholdId: existingFamily?.headOfHouseholdId || '',
      contactNumber: existingFamily?.contactNumber || '',
      members: existingFamily?.members?.map(member => ({
        fullName: member.fullName,
        identityNumber: member.identityNumber,
        birthDate: member.birthDate.split('T')[0],
        gender: member.gender,
        relationship: member.relationship,
        maritalStatus: member.maritalStatus,
        hasChronicIllness: member.hasChronicIllness,
        chronicIllnesses: member.chronicIllnesses,
        hasDisabilities: member.hasDisabilities,
        disabilities: member.disabilities,
        isUXOVictim: member.isUXOVictim,
        hasStableIncome: member.hasStableIncome
      })) || [{
        fullName: '',
        identityNumber: '',
        birthDate: '',
        gender: 'M' as const,
        relationship: 'Head' as const,
        maritalStatus: 'متزوج' as const,
        hasChronicIllness: false,
        chronicIllnesses: {
          diabetes: false,
          hypertension: false,
          heartDisease: false,
          asthma: false,
          cancer: false,
          kidneyDisease: false,
          hiv: false,
          arthritis: false
        },
        hasDisabilities: false,
        disabilities: {
          physical: false,
          visual: false,
          hearing: false,
          intellectual: false,
          mentalPsychological: false
        },
        isUXOVictim: false,
        hasStableIncome: false
      }],
      isPregnant: existingFamily?.isPregnant || false,
      isBreastfeeding: existingFamily?.isBreastfeeding || false,
      hasUnaccompaniedChild: existingFamily?.hasUnaccompaniedChild || false,
      unaccompaniedChildName: existingFamily?.unaccompaniedChildDetails?.name || '',
      unaccompaniedChildDetails: existingFamily?.unaccompaniedChildDetails?.details || ''
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'members'
  });

  const watchHasUnaccompaniedChild = form.watch('hasUnaccompaniedChild');

  const onSubmit = async (data: FamilyFormData) => {
    setIsLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const familyData: FamilyData = {
        id: existingFamily?.id || crypto.randomUUID(),
        entryDate: existingFamily?.entryDate || today,
        headOfHouseholdName: data.headOfHouseholdName,
        headOfHouseholdId: data.headOfHouseholdId,
        contactNumber: data.contactNumber,
        members: data.members.map(member => ({
          id: crypto.randomUUID(),
          fullName: member.fullName,
          identityNumber: member.identityNumber,
          birthDate: new Date(member.birthDate).toISOString(),
          age: calculateAge(member.birthDate),
          gender: member.gender,
          relationship: member.relationship,
          maritalStatus: member.maritalStatus,
          hasChronicIllness: member.hasChronicIllness,
          chronicIllnesses: {
            diabetes: member.chronicIllnesses.diabetes || false,
            hypertension: member.chronicIllnesses.hypertension || false,
            heartDisease: member.chronicIllnesses.heartDisease || false,
            asthma: member.chronicIllnesses.asthma || false,
            cancer: member.chronicIllnesses.cancer || false,
            kidneyDisease: member.chronicIllnesses.kidneyDisease || false,
            hiv: member.chronicIllnesses.hiv || false,
            arthritis: member.chronicIllnesses.arthritis || false
          },
          hasDisabilities: member.hasDisabilities,
          disabilities: {
            physical: member.disabilities.physical || false,
            visual: member.disabilities.visual || false,
            hearing: member.disabilities.hearing || false,
            intellectual: member.disabilities.intellectual || false,
            mentalPsychological: member.disabilities.mentalPsychological || false
          },
          isUXOVictim: member.isUXOVictim,
          hasStableIncome: member.hasStableIncome
        })),
        isPregnant: data.isPregnant,
        isBreastfeeding: data.isBreastfeeding,
        hasUnaccompaniedChild: data.hasUnaccompaniedChild,
        unaccompaniedChildDetails: data.hasUnaccompaniedChild ? {
          name: data.unaccompaniedChildName || '',
          details: data.unaccompaniedChildDetails || ''
        } : undefined,
        createdAt: existingFamily?.createdAt || new Date(),
        updatedAt: new Date()
      };

      FamilyStorageService.saveFamily(familyData);
      
      toast({
        title: 'تم الحفظ بنجاح',
        description: existingFamily ? 'تم تحديث البيانات' : 'تم إضافة العائلة الجديدة',
      });
      
      onSave();
    } catch (error) {
      toast({
        title: 'خطأ في الحفظ',
        description: 'حدث خطأ أثناء حفظ البيانات',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addFamilyMember = () => {
    append({
      fullName: '',
      identityNumber: '',
      birthDate: '',
      gender: 'M',
      relationship: 'Son',
      maritalStatus: 'أعزب',
      hasChronicIllness: false,
      chronicIllnesses: {
        diabetes: false,
        hypertension: false,
        heartDisease: false,
        asthma: false,
        cancer: false,
        kidneyDisease: false,
        hiv: false,
        arthritis: false
      },
      hasDisabilities: false,
      disabilities: {
        physical: false,
        visual: false,
        hearing: false,
        intellectual: false,
        mentalPsychological: false
      },
      isUXOVictim: false,
      hasStableIncome: false
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {existingFamily ? 'تعديل بيانات العائلة' : 'إضافة عائلة جديدة'}
        </h2>
        <p className="text-muted-foreground">
          يرجى ملء جميع الحقول المطلوبة بعناية
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          
          {/* معلومات أساسية */}
          <Card className="shadow-card border-primary/20">
            <CardHeader className="bg-gradient-primary text-white">
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                معلومات رب الأسرة
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="headOfHouseholdName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">اسم رب الأسرة *</FormLabel>
                      <FormControl>
                        <Input placeholder="الاسم الكامل" className="text-right" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="headOfHouseholdId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">رقم هوية رب الأسرة *</FormLabel>
                      <FormControl>
                        <Input placeholder="9 أرقام" className="text-right" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="contactNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">رقم التواصل *</FormLabel>
                      <FormControl>
                        <Input placeholder="0591234567" className="text-right" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* أفراد العائلة */}
          <Card className="shadow-card border-primary/20">
            <CardHeader className="bg-gradient-primary text-white">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  أفراد العائلة
                </div>
                <Button 
                  type="button" 
                  onClick={addFamilyMember}
                  variant="secondary"
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                >
                  <Plus className="h-4 w-4 ml-1" />
                  إضافة فرد
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {fields.map((field, index) => (
                <div key={field.id} className="border border-border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-medium flex items-center gap-2">
                      <User className="h-4 w-4" />
                      فرد العائلة {index + 1}
                      {form.watch(`members.${index}.relationship`) === 'Head' && (
                        <Crown className="h-4 w-4 text-yellow-500" />
                      )}
                    </h4>
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => remove(index)}
                        variant="destructive"
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name={`members.${index}.fullName`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الاسم الكامل *</FormLabel>
                          <FormControl>
                            <Input placeholder="الاسم الكامل" className="text-right" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`members.${index}.identityNumber`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>رقم الهوية *</FormLabel>
                          <FormControl>
                            <Input placeholder="9 أرقام" className="text-right" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`members.${index}.birthDate`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>تاريخ الميلاد *</FormLabel>
                          <FormControl>
                            <Input type="date" className="text-right" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`members.${index}.gender`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الجنس *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="text-right">
                                <SelectValue placeholder="اختر الجنس" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="M">ذكر (M)</SelectItem>
                              <SelectItem value="F">أنثى (F)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`members.${index}.relationship`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>صلة القرابة *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="text-right">
                                <SelectValue placeholder="اختر صلة القرابة" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {relationshipOptions.map(option => (
                                <SelectItem key={option.value} value={option.value}>
                                  <span className={option.color}>{option.label}</span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`members.${index}.maritalStatus`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الحالة الاجتماعية *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="text-right">
                                <SelectValue placeholder="اختر الحالة الاجتماعية" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {maritalStatusOptions.map(status => (
                                <SelectItem key={status} value={status}>{status}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* الأمراض المزمنة */}
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name={`members.${index}.hasChronicIllness`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="cursor-pointer">
                            يعاني من أمراض مزمنة
                          </FormLabel>
                        </FormItem>
                      )}
                    />

                    {form.watch(`members.${index}.hasChronicIllness`) && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-4 bg-muted/50 rounded-lg">
                        {Object.entries({
                          diabetes: 'سكري',
                          hypertension: 'ضغط',
                          heartDisease: 'أمراض قلب',
                          asthma: 'أزمة',
                          cancer: 'سرطان',
                          kidneyDisease: 'أمراض كلى',
                          hiv: 'إيدز',
                          arthritis: 'التهاب مفاصل'
                        }).map(([key, label]) => (
                          <div key={key} className="flex items-center space-x-2">
                            <Checkbox
                              checked={form.watch(`members.${index}.chronicIllnesses.${key}`) || false}
                              onCheckedChange={(checked) => 
                                form.setValue(`members.${index}.chronicIllnesses.${key}`, checked)
                              }
                            />
                            <label className="text-sm cursor-pointer">{label}</label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* الإعاقات */}
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name={`members.${index}.hasDisabilities`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="cursor-pointer">
                            يعاني من إعاقات
                          </FormLabel>
                        </FormItem>
                      )}
                    />

                    {form.watch(`members.${index}.hasDisabilities`) && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 p-4 bg-muted/50 rounded-lg">
                        {Object.entries({
                          physical: 'إعاقة حركية',
                          visual: 'إعاقة بصرية',
                          hearing: 'إعاقة سمعية',
                          intellectual: 'إعاقة ذهنية',
                          mentalPsychological: 'إعاقة عقلية - نفسية'
                        }).map(([key, label]) => (
                          <div key={key} className="flex items-center space-x-2">
                            <Checkbox
                              checked={form.watch(`members.${index}.disabilities.${key}`) || false}
                              onCheckedChange={(checked) => 
                                form.setValue(`members.${index}.disabilities.${key}`, checked)
                              }
                            />
                            <label className="text-sm cursor-pointer">{label}</label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* معلومات إضافية */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`members.${index}.isUXOVictim`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-3 border rounded-lg">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="cursor-pointer">
                            ضحية ذخائر غير منفجرة (UXO)
                          </FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`members.${index}.hasStableIncome`}
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-3 border rounded-lg">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="cursor-pointer">
                            لديه دخل مستقر وكافٍ
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* معلومات خاصة */}
          <Card className="shadow-card border-primary/20">
            <CardHeader className="bg-gradient-primary text-white">
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                معلومات خاصة
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="isPregnant"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-4 border border-border rounded-lg">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-base cursor-pointer">
                        يوجد امرأة حامل في العائلة
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isBreastfeeding"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-4 border border-border rounded-lg">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-base cursor-pointer">
                        يوجد امرأة مرضع في العائلة
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="hasUnaccompaniedChild"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-4 border border-border rounded-lg">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="text-base cursor-pointer">
                      يوجد طفل غير مصحوب أو منفصل عن ذويه
                    </FormLabel>
                  </FormItem>
                )}
              />

              {watchHasUnaccompaniedChild && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <FormField
                    control={form.control}
                    name="unaccompaniedChildName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>اسم الطفل</FormLabel>
                        <FormControl>
                          <Input placeholder="اسم الطفل غير المصحوب" className="text-right" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="unaccompaniedChildDetails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>تفاصيل الطفل</FormLabel>
                        <FormControl>
                          <Textarea placeholder="تفاصيل إضافية عن الطفل" className="text-right" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* أزرار الحفظ والإلغاء */}
          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-gradient-primary hover:shadow-glow"
            >
              {isLoading ? 'جاري الحفظ...' : (existingFamily ? 'تحديث البيانات' : 'حفظ البيانات')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};