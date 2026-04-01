import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'success' | 'warning';
}

const variantStyles = {
  default: 'bg-card border-border',
  primary: 'bg-primary/5 border-primary/20',
  success: 'bg-accent/5 border-accent/20',
  warning: 'bg-warning/5 border-warning/20',
};

const iconVariantStyles = {
  default: 'bg-secondary text-secondary-foreground',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-accent/10 text-accent',
  warning: 'bg-warning/10 text-warning',
};

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
}: StatsCardProps) {
  return (
    <Card className={`${variantStyles[variant]} border transition-all hover:shadow-md`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <p
                className={`text-xs font-medium ${
                  trend.isPositive ? 'text-accent' : 'text-destructive'
                }`}
              >
                {trend.isPositive ? '+' : ''}{trend.value}% ce mois
              </p>
            )}
          </div>
          <div className={`rounded-xl p-3 ${iconVariantStyles[variant]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
