import { ChantierStats } from '@/types/employee';
import { formatHoursDecimalWithH } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { HardHat, Clock, Hammer, Package } from 'lucide-react';

interface ChantierCardProps {
  stats: ChantierStats[];
}

export function ChantierCard({ stats }: ChantierCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-CH', {
      style: 'currency',
      currency: 'CHF',
    }).format(amount);
  };

  const totalCoutGlobal = stats.reduce((sum, s) => sum + s.coutTotal, 0);
  const maxCout = Math.max(...stats.map((s) => s.coutTotal), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <HardHat className="h-5 w-5 text-primary" />
          Coûts par chantier
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            Aucun chantier enregistré
          </p>
        ) : (
          stats
            .filter((s) => s.heures > 0 || s.coutMateriel > 0)
            .sort((a, b) => b.coutTotal - a.coutTotal)
            .map((chantier) => {
              const percentage = totalCoutGlobal > 0 
                ? (chantier.coutTotal / totalCoutGlobal) * 100 
                : 0;
              const barWidth = (chantier.coutTotal / maxCout) * 100;

              return (
                <div key={chantier.chantierId} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium truncate max-w-[60%]">
                      {chantier.chantierNom}
                    </span>
                    <span className="font-semibold text-primary">
                      {formatCurrency(chantier.coutTotal)}
                    </span>
                  </div>
                  
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatHoursDecimalWithH(chantier.heures)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Hammer className="h-3 w-3" />
                      {formatCurrency(chantier.coutMain)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      {formatCurrency(chantier.coutMateriel)}
                    </span>
                    <span className="ml-auto">{percentage.toFixed(0)}%</span>
                  </div>
                </div>
              );
            })
        )}

        {stats.every((s) => s.heures === 0 && s.coutMateriel === 0) && stats.length > 0 && (
          <p className="text-center text-muted-foreground py-4">
            Aucune donnée disponible
          </p>
        )}
      </CardContent>
    </Card>
  );
}