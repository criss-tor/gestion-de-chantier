import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';

interface OfflineIndicatorProps {
  isOnline: boolean;
  isOffline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  lastSync: string | null;
  onSync: () => void;
}

export function OfflineIndicator({
  isOnline,
  isOffline,
  pendingCount,
  isSyncing,
  lastSync,
  onSync
}: OfflineIndicatorProps) {
  const formatLastSync = (date: string | null) => {
    if (!date) return 'Jamais';
    const syncDate = new Date(date);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - syncDate.getTime()) / 60000);
    
    if (diffMinutes < 1) return 'À l\'instant';
    if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
    if (diffMinutes < 1440) return `Il y a ${Math.floor(diffMinutes / 60)}h`;
    return `Il y a ${Math.floor(diffMinutes / 1440)}j`;
  };

  if (isOnline && pendingCount === 0) {
    return (
      <Badge variant="default" className="bg-green-100 text-green-800">
        <Wifi className="h-3 w-3 mr-1" />
        En ligne
      </Badge>
    );
  }

  if (isOffline) {
    return (
      <Badge variant="destructive" className="bg-red-100 text-red-800">
        <WifiOff className="h-3 w-3 mr-1" />
        Hors-ligne
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
        <AlertCircle className="h-3 w-3 mr-1" />
        {pendingCount} en attente
      </Badge>
      
      <Button
        variant="outline"
        size="sm"
        onClick={onSync}
        disabled={isSyncing}
        className="h-6 px-2 text-xs"
      >
        <RefreshCw className={`h-3 w-3 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
        {isSyncing ? 'Sync...' : 'Sync'}
      </Button>
      
      {lastSync && (
        <span className="text-xs text-muted-foreground">
          Dernière sync: {formatLastSync(lastSync)}
        </span>
      )}
    </div>
  );
}
