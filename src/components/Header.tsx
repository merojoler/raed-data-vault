import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, FileSpreadsheet, HelpCircle, Database, Upload, Users } from 'lucide-react';

interface HeaderProps {
  onAddNew: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onHelp: () => void;
  familyCount: number;
}

export const Header: React.FC<HeaderProps> = ({ onAddNew, onExport, onImport, onHelp, familyCount }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImport(file);
      // إعادة تعيين قيمة input لتمكين اختيار نفس الملف مرة أخرى
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  return (
    <header className="bg-gradient-hero shadow-elegant">
      <div className="container mx-auto px-4 py-6">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Database className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white font-arabic">
              Data Raed
            </h1>
          </div>
          <p className="text-white/90 text-lg font-medium">
            قاعدة بيانات العائلات
          </p>
          <p className="text-white/70 text-sm mt-1">
            إدارة وتنظيم البيانات العائلية بكفاءة عالية
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 justify-center items-center">
          <Button 
            onClick={onAddNew}
            className="bg-white/20 hover:bg-white/30 text-white border border-white/30 backdrop-blur-sm transition-all duration-300 hover:shadow-glow"
            size="lg"
          >
            <Plus className="ml-2 h-5 w-5" />
            إضافة عائلة جديدة
          </Button>
          
          <Button 
            onClick={onExport}
            variant="outline"
            className="bg-white/10 hover:bg-white/20 text-white border-white/40 hover:border-white/60 backdrop-blur-sm transition-all duration-300"
            size="lg"
            disabled={familyCount === 0}
          >
            <FileSpreadsheet className="ml-2 h-5 w-5" />
            تصدير إلى Excel
          </Button>

          <Button 
            onClick={handleImportClick}
            variant="outline"
            className="bg-white/10 hover:bg-white/20 text-white border-white/40 hover:border-white/60 backdrop-blur-sm transition-all duration-300"
            size="lg"
          >
            <Upload className="ml-2 h-5 w-5" />
            استيراد من Excel
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
          
          <Button 
            onClick={onHelp}
            variant="ghost"
            className="text-white/80 hover:text-white hover:bg-white/10 backdrop-blur-sm transition-all duration-300"
            size="lg"
          >
            <HelpCircle className="ml-2 h-5 w-5" />
            المساعدة
          </Button>
        </div>

        {/* Statistics */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
            <Users className="h-4 w-4 text-white" />
            <span className="text-white/90 text-sm font-medium">
              إجمالي العائلات المسجلة: <span className="text-white font-bold">{familyCount}</span>
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};