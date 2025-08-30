import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FamilyData } from '@/types/family';
import { Edit, Phone, Users, Calendar, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface FamilyCardProps {
  family: FamilyData;
  onEdit: () => void;
  onDelete: () => void;
}

export const FamilyCard: React.FC<FamilyCardProps> = ({ family, onEdit, onDelete }) => {
  return (
    <Card className="hover:shadow-card transition-all duration-300 bg-gradient-card border border-border/50 hover:border-primary/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-card-foreground">
            {family.husbandName}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onEdit}
              className="text-primary hover:text-primary-deep hover:bg-primary/10"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onDelete}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Phone className="h-4 w-4 text-primary" />
          <span className="font-medium">{family.phoneNumber}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4 text-primary" />
          <span>عدد الأفراد: <span className="font-medium text-foreground">{family.familySize}</span></span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 text-primary" />
          <span>
            أضيف في: {' '}
            <span className="font-medium text-foreground">
              {format(new Date(family.createdAt), 'dd MMMM yyyy', { locale: ar })}
            </span>
          </span>
        </div>
        
        {family.wifeName && (
          <div className="pt-2 border-t border-border/50">
            <p className="text-sm text-muted-foreground">
              الزوجة: <span className="font-medium text-foreground">{family.wifeName}</span>
            </p>
          </div>
        )}
        
        {(family.isPregnant || family.isBreastfeeding) && (
          <div className="flex gap-2 pt-1">
            {family.isPregnant && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-accent/50 text-accent-foreground">
                حامل
              </span>
            )}
            {family.isBreastfeeding && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary/70 text-secondary-foreground">
                مرضع
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};