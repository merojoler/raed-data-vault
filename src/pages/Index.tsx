import React, { useState, useEffect } from 'react';
import { FamilyData } from '@/types/family';
import { FamilyStorageService } from '@/services/storage';
import { ExcelService } from '@/services/excel';
import { Header } from '@/components/Header';
import { FamilyCard } from '@/components/FamilyCard';
import { FamilyForm } from '@/components/FamilyForm';
import { HelpDialog } from '@/components/HelpDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Search, Users } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const Index = () => {
  const [families, setFamilies] = useState<FamilyData[]>([]);
  const [filteredFamilies, setFilteredFamilies] = useState<FamilyData[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingFamily, setEditingFamily] = useState<FamilyData | undefined>();
  const [showHelp, setShowHelp] = useState(false);
  const [deletingFamily, setDeletingFamily] = useState<FamilyData | undefined>();
  const { toast } = useToast();

  // تحميل البيانات عند تحميل الصفحة
  useEffect(() => {
    loadFamilies();
  }, []);

  // فلترة البيانات عند تغيير محرك البحث
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredFamilies(families);
    } else {
      const filtered = families.filter(family =>
        family.husbandName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        family.wifeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        family.phoneNumber.includes(searchTerm)
      );
      setFilteredFamilies(filtered);
    }
  }, [families, searchTerm]);

  const loadFamilies = () => {
    try {
      const loadedFamilies = FamilyStorageService.getAllFamilies();
      setFamilies(loadedFamilies);
    } catch (error) {
      toast({
        title: 'خطأ في تحميل البيانات',
        description: 'حدث خطأ أثناء تحميل بيانات العائلات',
        variant: 'destructive'
      });
    }
  };

  const handleAddNew = () => {
    setEditingFamily(undefined);
    setShowForm(true);
  };

  const handleEdit = (family: FamilyData) => {
    setEditingFamily(family);
    setShowForm(true);
  };

  const handleFormSave = () => {
    setShowForm(false);
    setEditingFamily(undefined);
    loadFamilies();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingFamily(undefined);
  };

  const handleExport = () => {
    try {
      if (families.length === 0) {
        toast({
          title: 'لا توجد بيانات للتصدير',
          description: 'يرجى إضافة عائلات أولاً قبل التصدير',
          variant: 'destructive'
        });
        return;
      }

      ExcelService.exportFamiliesToExcel(families);
      toast({
        title: 'تم التصدير بنجاح',
        description: `تم تصدير بيانات ${families.length} عائلة إلى ملف Excel`,
      });
    } catch (error) {
      toast({
        title: 'خطأ في التصدير',
        description: 'حدث خطأ أثناء تصدير البيانات',
        variant: 'destructive'
      });
    }
  };

  const handleImport = async (file: File) => {
    try {
      toast({
        title: 'جاري الاستيراد...',
        description: 'يتم الآن معالجة ملف Excel وإضافة البيانات',
      });

      const importedFamilies = await ExcelService.importFamiliesFromExcel(file);
      
      if (importedFamilies.length === 0) {
        toast({
          title: 'لا توجد بيانات للاستيراد',
          description: 'الملف فارغ أو لا يحتوي على بيانات صحيحة',
          variant: 'destructive'
        });
        return;
      }

      // حفظ العائلات المستوردة
      let successCount = 0;
      let errorCount = 0;
      
      importedFamilies.forEach(family => {
        try {
          FamilyStorageService.saveFamily(family);
          successCount++;
        } catch (error) {
          errorCount++;
          console.error('خطأ في حفظ العائلة:', error);
        }
      });

      // تحديث البيانات المعروضة
      loadFamilies();

      if (successCount > 0) {
        toast({
          title: 'تم الاستيراد بنجاح',
          description: `تم استيراد ${successCount} عائلة من ملف Excel${errorCount > 0 ? ` (فشل في استيراد ${errorCount})` : ''}`,
        });
      } else {
        toast({
          title: 'فشل في الاستيراد',
          description: 'لم يتم استيراد أي عائلة بنجاح',
          variant: 'destructive'
        });
      }

    } catch (error) {
      console.error('خطأ في الاستيراد:', error);
      toast({
        title: 'خطأ في الاستيراد',
        description: error instanceof Error ? error.message : 'حدث خطأ أثناء استيراد البيانات',
        variant: 'destructive'
      });
    }
  };

  const handleHelp = () => {
    setShowHelp(true);
  };

  const handleDelete = (family: FamilyData) => {
    setDeletingFamily(family);
  };

  const confirmDelete = () => {
    if (deletingFamily) {
      try {
        FamilyStorageService.deleteFamily(deletingFamily.id);
        loadFamilies();
        toast({
          title: 'تم الحذف بنجاح',
          description: `تم حذف عائلة ${deletingFamily.husbandName}`,
        });
      } catch (error) {
        toast({
          title: 'خطأ في الحذف',
          description: 'حدث خطأ أثناء حذف العائلة',
          variant: 'destructive'
        });
      } finally {
        setDeletingFamily(undefined);
      }
    }
  };

  const cancelDelete = () => {
    setDeletingFamily(undefined);
  };

  if (showForm) {
    return (
      <div className="min-h-screen bg-background">
        <FamilyForm
          existingFamily={editingFamily}
          onSave={handleFormSave}
          onCancel={handleFormCancel}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-arabic" dir="rtl">
      <Header
        onAddNew={handleAddNew}
        onExport={handleExport}
        onImport={handleImport}
        onHelp={handleHelp}
        familyCount={families.length}
      />

      <main className="container mx-auto px-4 py-8">
        {/* شريط البحث */}
        {families.length > 0 && (
          <div className="mb-8 max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="البحث في العائلات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 text-right"
              />
            </div>
          </div>
        )}

        {/* عرض البطاقات أو رسالة فارغة */}
        {families.length === 0 ? (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="h-12 w-12 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3">
                لا توجد بيانات عائلية بعد
              </h2>
              <p className="text-muted-foreground mb-6">
                ابدأ بإضافة أول عائلة إلى قاعدة البيانات
              </p>
              <Button 
                onClick={handleAddNew}
                size="lg"
                className="bg-gradient-primary hover:shadow-glow transition-all duration-300"
              >
                إضافة أول عائلة
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* عدد النتائج */}
            <div className="mb-6 text-center">
              <p className="text-muted-foreground">
                {searchTerm ? (
                  <>عرض {filteredFamilies.length} من أصل {families.length} عائلة</>
                ) : (
                  <>إجمالي {families.length} عائلة مسجلة</>
                )}
              </p>
            </div>

            {/* شبكة البطاقات */}
            {filteredFamilies.length === 0 ? (
              <div className="text-center py-12">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  لا توجد نتائج للبحث
                </h3>
                <p className="text-muted-foreground">
                  جرب مصطلحات بحث أخرى أو امسح محرك البحث
                </p>
                <Button
                  variant="outline"
                  onClick={() => setSearchTerm('')}
                  className="mt-4"
                >
                  مسح البحث
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredFamilies.map((family) => (
                  <FamilyCard
                    key={family.id}
                    family={family}
                    onEdit={() => handleEdit(family)}
                    onDelete={() => handleDelete(family)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {/* مربع حوار المساعدة */}
      <HelpDialog open={showHelp} onOpenChange={setShowHelp} />

      {/* مربع حوار تأكيد الحذف */}
      <AlertDialog open={!!deletingFamily} onOpenChange={() => setDeletingFamily(undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف عائلة "{deletingFamily?.husbandName}"؟ 
              لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete}>إلغاء</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;
