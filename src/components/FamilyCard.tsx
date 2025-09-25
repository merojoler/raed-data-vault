import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FamilyData } from '@/types/family';
import { Users, Phone, Edit, Trash2, Crown, Heart, Baby, AlertCircle } from 'lucide-react';

interface FamilyCardProps {
  family: FamilyData;
  onEdit: () => void;
  onDelete: () => void;
}

export const FamilyCard: React.FC<FamilyCardProps> = ({ family, onEdit, onDelete }) => {
  const headOfHousehold = family.members.find(member => member.relationship === 'Head');
  const spouse = family.members.find(member => member.relationship === 'Spouse');
  const children = family.members.filter(member => member.relationship === 'Son' || member.relationship === 'Daughter');

  return (
    <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-600" />
            {family.headOfHouseholdName}
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="h-8 w-8 p-0 hover:bg-primary/10"
            >
              <Edit className="h-4 w-4 text-primary" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-8 w-8 p-0 hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* معلومات التواصل */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Phone className="h-4 w-4" />
          <span dir="ltr">{family.contactNumber}</span>
        </div>

        {/* عدد أفراد العائلة */}
        <div className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4 text-primary" />
          <span>عدد الأفراد: <strong>{family.members.length}</strong></span>
        </div>

        {/* معلومات الأفراد */}
        <div className="space-y-2">
          {headOfHousehold && (
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1">
                <Crown className="h-3 w-3 text-yellow-600" />
                رب الأسرة
              </span>
              <span className="font-medium">{headOfHousehold.fullName}</span>
            </div>
          )}
          
          {spouse && (
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1">
                <Heart className="h-3 w-3 text-pink-600" />
                الزوج/ة
              </span>
              <span className="font-medium">{spouse.fullName}</span>
            </div>
          )}

          {children.length > 0 && (
            <div className="text-sm">
              <span className="flex items-center gap-1 mb-1">
                <Baby className="h-3 w-3 text-blue-600" />
                الأطفال ({children.length})
              </span>
              <div className="mr-4 space-y-1">
                {children.slice(0, 3).map((child, index) => (
                  <div key={index} className="text-xs text-muted-foreground">
                    • {child.fullName} ({child.age} سنة)
                  </div>
                ))}
                {children.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    وآخرون...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* حالات خاصة */}
        <div className="flex flex-wrap gap-2">
          {spouse?.isPregnant && (
            <Badge variant="secondary" className="text-xs bg-pink-100 text-pink-700">
              حامل
            </Badge>
          )}
          {spouse?.isBreastfeeding && (
            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
              مرضع
            </Badge>
          )}
          {family.hasChildUnder2 && (
            <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
              طفل أقل من سنتين
            </Badge>
          )}
          {family.hasChild2To5 && (
            <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-700">
              طفل من 2-5 سنوات
            </Badge>
          )}
          {family.hasUnaccompaniedChild && (
            <Badge variant="destructive" className="text-xs">
              <AlertCircle className="h-3 w-3 mr-1" />
              طفل غير مصحوب
            </Badge>
          )}
        </div>

        {/* تاريخ الإدخال */}
        <div className="text-xs text-muted-foreground pt-2 border-t">
          تاريخ الإدخال: {new Date(family.entryDate).toLocaleDateString('ar-SA')}
        </div>
      </CardContent>
    </Card>
  );
};