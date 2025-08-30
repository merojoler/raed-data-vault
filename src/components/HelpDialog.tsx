import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpCircle, Users, FileSpreadsheet, Database, Wifi, WifiOff } from 'lucide-react';

interface HelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const HelpDialog: React.FC<HelpDialogProps> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center text-primary flex items-center justify-center gap-2">
            <HelpCircle className="h-6 w-6" />
            دليل استخدام تطبيق Data Raed
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* نظرة عامة */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Database className="h-5 w-5" />
                نظرة عامة على التطبيق
              </CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm max-w-none text-right">
              <p>
                تطبيق <strong>Data Raed</strong> هو نظام شامل لإدارة البيانات العائلية يعمل بالكامل 
                دون الحاجة إلى اتصال بالإنترنت. يتيح لك التطبيق إضافة وتعديل وتصدير بيانات العائلات 
                بطريقة منظمة وآمنة.
              </p>
            </CardContent>
          </Card>

          {/* العمل دون اتصال */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <WifiOff className="h-5 w-5" />
                العمل دون اتصال بالإنترنت
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-right">
              <div className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold mt-1">
                  ✓
                </div>
                <div>
                  <h4 className="font-semibold">تخزين محلي آمن</h4>
                  <p className="text-sm text-muted-foreground">
                    جميع البيانات تُحفظ على جهازك مباشرة ولا تُرسل إلى أي خادم خارجي
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg">
                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold mt-1">
                  ✓
                </div>
                <div>
                  <h4 className="font-semibold">سرعة في الوصول</h4>
                  <p className="text-sm text-muted-foreground">
                    استخدم التطبيق في أي وقت ومكان دون القلق بشأن الاتصال بالإنترنت
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* كيفية الاستخدام */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Users className="h-5 w-5" />
                كيفية إضافة عائلة جديدة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-right">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-semibold text-primary">الخطوة 1: البيانات الأساسية</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground mr-4">
                    <li>• اسم الزوج ورقم هويته (مطلوب)</li>
                    <li>• اسم الزوجة ورقم هويتها (مطلوب)</li>
                    <li>• حالة الحمل والإرضاع</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-primary">الخطوة 2: معلومات التواصل</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground mr-4">
                    <li>• رقم الجوال (مطلوب)</li>
                    <li>• عدد أفراد العائلة</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-primary">الخطوة 3: أفراد العائلة</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground mr-4">
                    <li>• اضغط على "إضافة فرد" لكل شخص</li>
                    <li>• أدخل الاسم وتاريخ الميلاد</li>
                    <li>• حدد صلة القرابة</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold text-primary">الخطوة 4: المعلومات الصحية</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground mr-4">
                    <li>• حدد وجود أمراض أو إعاقات</li>
                    <li>• أضف التفاصيل إذا لزم الأمر</li>
                    <li>• معلومات الأطفال</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* تصدير البيانات */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <FileSpreadsheet className="h-5 w-5" />
                تصدير البيانات
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-right">
              <div className="p-4 bg-accent/30 rounded-lg">
                <h4 className="font-semibold mb-2">تصدير إلى Excel</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  اضغط على زر "تصدير إلى Excel" في الشريط العلوي لحفظ جميع البيانات في ملف Excel.
                </p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• يتم تضمين جميع البيانات المدخلة</p>
                  <p>• الملف منظم في أعمدة واضحة</p>
                  <p>• يمكن فتحه في أي برنامج جداول بيانات</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* نصائح مهمة */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <HelpCircle className="h-5 w-5" />
                نصائح مهمة
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-right">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                  <h4 className="font-semibold text-green-800 dark:text-green-300 mb-1">
                    احفظ نسخ احتياطية
                  </h4>
                  <p className="text-xs text-green-700 dark:text-green-400">
                    صدّر البيانات بانتظام كنسخة احتياطية آمنة
                  </p>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-1">
                    دقة البيانات
                  </h4>
                  <p className="text-xs text-blue-700 dark:text-blue-400">
                    تأكد من صحة البيانات قبل الحفظ النهائي
                  </p>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                  <h4 className="font-semibold text-purple-800 dark:text-purple-300 mb-1">
                    الخصوصية
                  </h4>
                  <p className="text-xs text-purple-700 dark:text-purple-400">
                    البيانات محفوظة محلياً فقط على جهازك
                  </p>
                </div>
                <div className="p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <h4 className="font-semibold text-orange-800 dark:text-orange-300 mb-1">
                    التحديث
                  </h4>
                  <p className="text-xs text-orange-700 dark:text-orange-400">
                    يمكن تعديل البيانات في أي وقت بالضغط على زر التحرير
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};