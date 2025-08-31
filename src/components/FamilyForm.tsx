import React, { useState, useEffect } from 'react';
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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FamilyData, FamilyMember, DisabilityType } from '@/types/family';
import { FamilyStorageService } from '@/services/storage';
import { CalendarIcon, Plus, Trash2, Users, Heart, Phone, User, Baby } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const relationshipOptions = [
  'أب', 'أم', 'ابن', 'ابنة', 'أخ', 'أخت', 'جد', 'جدة', 'آخر'
] as const;

const disabilityOptions = [
  'بصرية', 'سمعية', 'حركية', 'ذهنية', 'نفسية', 'التوحد', 'متعددة', 'أخرى'
] as const;

const familySchema = z.object({
  husbandName: z.string().min(1, 'اسم الزوج مطلوب'),
  husbandId: z.string().regex(/^\d{9}$/, 'رقم الهوية يجب أن يكون 9 أرقام'),
  husbandBirthDate: z.string().min(1, 'تاريخ ميلاد الزوج مطلوب'),
  wifeName: z.string().min(1, 'اسم الزوجة مطلوب'),
  wifeId: z.string().regex(/^\d{9}$/, 'رقم الهوية يجب أن يكون 9 أرقام'),
  wifeBirthDate: z.string().min(1, 'تاريخ ميلاد الزوجة مطلوب'),
  isPregnant: z.boolean(),
  isBreastfeeding: z.boolean(),
  phoneNumber: z.string().regex(/^\d{10}$/, 'رقم الجوال يجب أن يكون 10 أرقام'),
  alternativePhoneNumber: z.string().regex(/^\d{10}$/, 'رقم الجوال البديل يجب أن يكون 10 أرقام').optional().or(z.literal('')),
  familySize: z.coerce.number().min(1, 'عدد أفراد العائلة مطلوب'),
  members: z.array(z.object({
    fullName: z.string().min(1, 'اسم الفرد مطلوب'),
    birthDate: z.string().min(1, 'تاريخ الميلاد مطلوب'),
    relationship: z.enum(relationshipOptions),
    healthStatus: z.string().optional()
  })),
  hasDiseases: z.boolean(),
  diseaseDetails: z.string().optional(),
  hasDisabilities: z.boolean(),
  disabilityTypes: z.object({
    بصرية: z.boolean(),
    سمعية: z.boolean(),
    حركية: z.boolean(),
    ذهنية: z.boolean(),
    نفسية: z.boolean(),
    التوحد: z.boolean(),
    متعددة: z.boolean(),
    أخرى: z.boolean()
  }),
  hasWarInjuries: z.boolean(),
  hasChildrenUnder2: z.boolean(),
  hasChildren2to5: z.boolean()
});

type FamilyFormData = z.infer<typeof familySchema>;

interface FamilyFormProps {
  existingFamily?: FamilyData;
  onSave: () => void;
  onCancel: () => void;
}

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
      husbandName: existingFamily?.husbandName || '',
      husbandId: existingFamily?.husbandId || '',
      husbandBirthDate: existingFamily?.husbandBirthDate ? existingFamily.husbandBirthDate.split('T')[0] : '',
      wifeName: existingFamily?.wifeName || '',
      wifeId: existingFamily?.wifeId || '',
      wifeBirthDate: existingFamily?.wifeBirthDate ? existingFamily.wifeBirthDate.split('T')[0] : '',
      isPregnant: existingFamily?.isPregnant || false,
      isBreastfeeding: existingFamily?.isBreastfeeding || false,
      phoneNumber: existingFamily?.phoneNumber || '',
      alternativePhoneNumber: existingFamily?.alternativePhoneNumber || '',
      familySize: existingFamily?.familySize || 1,
      members: existingFamily?.members?.map(member => ({
        ...member,
        birthDate: member.birthDate.split('T')[0],
        healthStatus: member.healthStatus || ''
      })) || [],
      hasDiseases: existingFamily?.hasDiseases || false,
      diseaseDetails: existingFamily?.diseaseDetails || '',
      hasDisabilities: existingFamily?.hasDisabilities || false,
      disabilityTypes: existingFamily?.disabilityTypes || {
        بصرية: false,
        سمعية: false,
        حركية: false,
        ذهنية: false,
        نفسية: false,
        التوحد: false,
        متعددة: false,
        أخرى: false
      },
      hasWarInjuries: existingFamily?.hasWarInjuries || false,
      hasChildrenUnder2: existingFamily?.hasChildrenUnder2 || false,
      hasChildren2to5: existingFamily?.hasChildren2to5 || false
    }
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'members'
  });

  const watchHasDiseases = form.watch('hasDiseases');
  const watchHasDisabilities = form.watch('hasDisabilities');

  const onSubmit = async (data: FamilyFormData) => {
    setIsLoading(true);
    try {
      const familyData: FamilyData = {
        id: existingFamily?.id || crypto.randomUUID(),
        husbandName: data.husbandName,
        husbandId: data.husbandId,
        husbandBirthDate: new Date(data.husbandBirthDate).toISOString(),
        wifeName: data.wifeName,
        wifeId: data.wifeId,
        wifeBirthDate: new Date(data.wifeBirthDate).toISOString(),
        isPregnant: data.isPregnant,
        isBreastfeeding: data.isBreastfeeding,
        phoneNumber: data.phoneNumber,
        alternativePhoneNumber: data.alternativePhoneNumber || undefined,
        familySize: data.familySize,
        members: data.members.map(member => ({
          id: crypto.randomUUID(),
          fullName: member.fullName,
          relationship: member.relationship,
          birthDate: new Date(member.birthDate).toISOString(),
          healthStatus: member.healthStatus
        })),
        hasDiseases: data.hasDiseases,
        diseaseDetails: data.diseaseDetails,
        hasDisabilities: data.hasDisabilities,
        disabilityTypes: {
          بصرية: data.disabilityTypes.بصرية || false,
          سمعية: data.disabilityTypes.سمعية || false,
          حركية: data.disabilityTypes.حركية || false,
          ذهنية: data.disabilityTypes.ذهنية || false,
          نفسية: data.disabilityTypes.نفسية || false,
          التوحد: data.disabilityTypes.التوحد || false,
          متعددة: data.disabilityTypes.متعددة || false,
          أخرى: data.disabilityTypes.أخرى || false
        },
        hasWarInjuries: data.hasWarInjuries,
        hasChildrenUnder2: data.hasChildrenUnder2,
        hasChildren2to5: data.hasChildren2to5,
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
      birthDate: '',
      relationship: 'ابن',
      healthStatus: ''
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
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
          
          {/* بيانات الزوج */}
          <Card className="shadow-card border-primary/20">
            <CardHeader className="bg-gradient-primary text-white">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                بيانات الزوج
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <FormField
                control={form.control}
                name="husbandName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">الاسم الرباعي للزوج *</FormLabel>
                    <FormControl>
                      <Input placeholder="أدخل الاسم الرباعي كاملاً" className="text-right" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="husbandId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">رقم الهوية *</FormLabel>
                    <FormControl>
                      <Input placeholder="أدخل رقم الهوية (9 أرقام)" className="text-right" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="husbandBirthDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">تاريخ الميلاد *</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        className="text-right" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* بيانات الزوجة */}
          <Card className="shadow-card border-primary/20">
            <CardHeader className="bg-gradient-primary text-white">
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                بيانات الزوجة
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <FormField
                control={form.control}
                name="wifeName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">الاسم الرباعي للزوجة *</FormLabel>
                    <FormControl>
                      <Input placeholder="أدخل الاسم الرباعي كاملاً" className="text-right" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="wifeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">رقم الهوية *</FormLabel>
                    <FormControl>
                      <Input placeholder="أدخل رقم الهوية (9 أرقام)" className="text-right" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="wifeBirthDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">تاريخ الميلاد *</FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        className="text-right" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        هل هي حامل؟
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
                        هل هي مرضع؟
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* معلومات التواصل */}
          <Card className="shadow-card border-primary/20">
            <CardHeader className="bg-gradient-primary text-white">
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                معلومات التواصل
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">رقم الجوال الأساسي *</FormLabel>
                      <FormControl>
                        <Input placeholder="مثال: 0591234567" className="text-right" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="alternativePhoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base font-medium">رقم الجوال البديل</FormLabel>
                      <FormControl>
                        <Input placeholder="مثال: 0591234567 (اختياري)" className="text-right" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="familySize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">عدد أفراد العائلة *</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" placeholder="أدخل العدد" className="text-right" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
            <CardContent className="p-6">
              {fields.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>لم يتم إضافة أي أفراد بعد</p>
                  <Button 
                    type="button" 
                    onClick={addFamilyMember} 
                    className="mt-3"
                    variant="outline"
                  >
                    إضافة أول فرد
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {fields.map((field, index) => (
                    <div key={field.id} className="p-4 border border-border rounded-lg bg-muted/30">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-foreground">الفرد رقم {index + 1}</h4>
                        <Button
                          type="button"
                          onClick={() => remove(index)}
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`members.${index}.fullName`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>الاسم الرباعي</FormLabel>
                              <FormControl>
                                <Input placeholder="أدخل الاسم كاملاً" className="text-right" {...field} />
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
                              <FormLabel>تاريخ الميلاد</FormLabel>
                              <FormControl>
                                <Input 
                                  type="date" 
                                  className="text-right" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`members.${index}.relationship`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>صلة القرابة</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="text-right">
                                    <SelectValue placeholder="اختر صلة القرابة" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {relationshipOptions.map((option) => (
                                    <SelectItem key={option} value={option}>
                                      {option}
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
                          name={`members.${index}.healthStatus`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>الحالة الصحية</FormLabel>
                              <FormControl>
                                <Input placeholder="حالة صحية خاصة (اختياري)" className="text-right" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* معلومات صحية */}
          <Card className="shadow-card border-primary/20">
            <CardHeader className="bg-gradient-primary text-white">
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5" />
                المعلومات الصحية
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* الأمراض */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="hasDiseases"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-4 border border-border rounded-lg">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-base cursor-pointer font-medium">
                        هل يوجد أمراض في العائلة؟
                      </FormLabel>
                    </FormItem>
                  )}
                />

                {watchHasDiseases && (
                  <FormField
                    control={form.control}
                    name="diseaseDetails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>تفاصيل الأمراض</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="اذكر تفاصيل الأمراض الموجودة في العائلة"
                            className="text-right min-h-20"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* الإعاقات */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="hasDisabilities"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-4 border border-border rounded-lg">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-base cursor-pointer font-medium">
                        هل يوجد إعاقات في العائلة؟
                      </FormLabel>
                    </FormItem>
                  )}
                />

                {watchHasDisabilities && (
                  <div>
                    <FormLabel className="text-base font-medium mb-3 block">أنواع الإعاقات</FormLabel>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {disabilityOptions.map((disability) => (
                        <FormField
                          key={disability}
                          control={form.control}
                          name={`disabilityTypes.${disability}`}
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0 p-3 border border-border rounded-lg">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="text-sm cursor-pointer">
                                {disability}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* إصابات الحرب */}
              <FormField
                control={form.control}
                name="hasWarInjuries"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-4 border border-border rounded-lg">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="text-base cursor-pointer font-medium">
                      هل يوجد إصابات حرب في العائلة؟
                    </FormLabel>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* معلومات الأطفال */}
          <Card className="shadow-card border-primary/20">
            <CardHeader className="bg-gradient-primary text-white">
              <CardTitle className="flex items-center gap-2">
                <Baby className="h-5 w-5" />
                معلومات الأطفال
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="hasChildrenUnder2"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-4 border border-border rounded-lg">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-base cursor-pointer">
                        يوجد أطفال أقل من سنتين
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hasChildren2to5"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-4 border border-border rounded-lg">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-base cursor-pointer">
                        يوجد أطفال من عمر 2-5 سنوات
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* أزرار الحفظ والإلغاء */}
          <div className="flex gap-4 justify-center pt-6">
            <Button 
              type="submit" 
              disabled={isLoading}
              className="px-8 py-3 text-lg bg-gradient-primary hover:shadow-glow transition-all duration-300"
            >
              {isLoading ? 'جاري الحفظ...' : 'حفظ البيانات'}
            </Button>
            
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              className="px-8 py-3 text-lg"
            >
              إلغاء
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
};