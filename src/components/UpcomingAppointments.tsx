import { useMemo } from 'react';
import { format, isAfter, startOfDay, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, Clock, MapPin, Bell } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Chantier } from '@/types/employee';

interface GanttMarker {
  id: string;
  chantierId: string;
  date: string;
  endDate?: string;
  type: 'milestone' | 'appointment' | 'end-date' | 'custom' | 'range';
  label: string;
  color?: string;
}

interface UpcomingAppointmentsProps {
  markers: GanttMarker[];
  chantiers: Chantier[];
  maxItems?: number;
}

export function UpcomingAppointments({ markers, chantiers, maxItems = 5 }: UpcomingAppointmentsProps) {
  const today = startOfDay(new Date());

  const upcoming = useMemo(() => {
    return markers
      .filter((m) => {
        // Filtrer les rendez-vous et plages à venir
        if (m.type !== 'appointment' && m.type !== 'range') return false;
        const markerDate = parseISO(m.date);
        // Inclure si la date de début est aujourd'hui ou après
        // OU si c'est une plage qui n'est pas encore terminée
        if (m.endDate) {
          const endDate = parseISO(m.endDate);
          return isAfter(endDate, today) || format(endDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
        }
        return isAfter(markerDate, today) || format(markerDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
      })
      .sort((a, b) => {
        const dateA = parseISO(a.date);
        const dateB = parseISO(b.date);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, maxItems);
  }, [markers, maxItems, today]);

  const getChantierName = (chantierId: string) => {
    const chantier = chantiers.find((c) => c.id === chantierId);
    return chantier?.nom || 'Chantier inconnu';
  };

  const getDateLabel = (marker: GanttMarker) => {
    const startDate = parseISO(marker.date);
    const startStr = format(startDate, 'EEEE d MMMM', { locale: fr });
    
    if (marker.endDate && marker.endDate !== marker.date) {
      const endDate = parseISO(marker.endDate);
      const endStr = format(endDate, 'EEEE d MMMM', { locale: fr });
      return `${startStr} → ${endStr}`;
    }
    
    const isToday = format(startDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
    if (isToday) {
      return `Aujourd'hui (${format(startDate, 'd MMMM', { locale: fr })})`;
    }
    
    return startStr;
  };

  const getDaysUntil = (marker: GanttMarker) => {
    const startDate = parseISO(marker.date);
    const diffTime = startDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return 'Demain';
    if (diffDays < 0) return 'En cours';
    return `Dans ${diffDays} jours`;
  };

  const getBadgeColor = (marker: GanttMarker) => {
    if (marker.type === 'range') return 'bg-green-500';
    if (marker.type === 'appointment') return 'bg-orange-500';
    return 'bg-blue-500';
  };

  if (upcoming.length === 0) {
    return (
      <Card className="border-2 border-dashed border-orange-200 bg-orange-50/30">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-orange-700">
            <Bell className="h-5 w-5" />
            Prochains rendez-vous
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucun rendez-vous à venir
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-orange-200 shadow-md bg-gradient-to-br from-white to-orange-50/50">
      <CardHeader className="pb-3 border-b border-orange-100">
        <CardTitle className="flex items-center gap-2 text-base font-bold text-orange-800">
          <div className="p-1.5 bg-orange-100 rounded-md">
            <Bell className="h-5 w-5 text-orange-600" />
          </div>
          Prochains rendez-vous
          <Badge className="ml-auto bg-orange-500 text-white font-bold">
            {upcoming.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        {upcoming.map((marker, index) => (
          <div
            key={marker.id}
            className="flex items-start gap-3 p-3 rounded-xl border border-orange-100 bg-white shadow-sm hover:shadow-md hover:border-orange-300 transition-all"
          >
            <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ring-2 ring-white shadow-sm ${getBadgeColor(marker)}`} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-900 truncate">{marker.label}</p>
              <div className="flex items-center gap-1.5 text-xs text-gray-600 mt-1.5">
                <MapPin className="h-3.5 w-3.5 text-orange-500" />
                <span className="truncate font-medium">{getChantierName(marker.chantierId)}</span>
              </div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Clock className="h-3.5 w-3.5 text-gray-400" />
                <span className="text-xs text-gray-600">
                  {getDateLabel(marker)}
                </span>
                <Badge 
                  variant={index === 0 ? "default" : "outline"} 
                  className={`text-xs px-2 py-0.5 h-5 font-semibold ${
                    index === 0 
                      ? 'bg-orange-500 text-white' 
                      : 'border-orange-300 text-orange-700 bg-orange-50'
                  }`}
                >
                  {getDaysUntil(marker)}
                </Badge>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
