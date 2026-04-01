# 🧹 Nettoyage de l'application

## Fichiers à supprimer (non utilisés)

### Composants
- `src/components/ChantierCard.tsx`
- `src/components/StatsCard.tsx` 
- `src/components/AddTimeEntryDialog.tsx`

### Données initiales
- `src/data/employees.ts`
- `src/data/chantiers.ts`

### Composants UI non utilisés (33 fichiers)
```bash
rm src/components/ui/accordion.tsx
rm src/components/ui/aspect-ratio.tsx
rm src/components/ui/avatar.tsx
rm src/components/ui/breadcrumb.tsx
rm src/components/ui/calendar.tsx
rm src/components/ui/carousel.tsx
rm src/components/ui/chart.tsx
rm src/components/ui/checkbox.tsx
rm src/components/ui/command.tsx
rm src/components/ui/context-menu.tsx
rm src/components/ui/drawer.tsx
rm src/components/ui/dropdown-menu.tsx
rm src/components/ui/form.tsx
rm src/components/ui/hover-card.tsx
rm src/components/ui/input-otp.tsx
rm src/components/ui/menubar.tsx
rm src/components/ui/navigation-menu.tsx
rm src/components/ui/pagination.tsx
rm src/components/ui/popover.tsx
rm src/components/ui/progress.tsx
rm src/components/ui/radio-group.tsx
rm src/components/ui/resizable.tsx
rm src/components/ui/scroll-area.tsx
rm src/components/ui/separator.tsx
rm src/components/ui/sheet.tsx
rm src/components/ui/skeleton.tsx
rm src/components/ui/slider.tsx
rm src/components/ui/sonner.tsx
rm src/components/ui/switch.tsx
rm src/components/ui/tabs.tsx
rm src/components/ui/toggle.tsx
rm src/components/ui/toggle-group.tsx
```

## Imports à nettoyer

### Dans `src/pages/Chantiers.tsx`
Supprimer : `import { exportChantierReport } from '@/lib/backup';`

### Dans `src/pages/Employees.tsx`
Supprimer : `import { AddTimeEntryDialog } from '@/components/AddTimeEntryDialog';`

## ⚠️ Attention
- Faire une sauvegarde avant suppression
- Tester l'application après chaque nettoyage
- Certains composants UI pourraient être utilisés indirectement

## 📊 Impact attendu
- **-33 fichiers UI** (environ 2000 lignes)
- **-4 composants personnalisés** (environ 500 lignes)  
- **-2 fichiers de données** (environ 100 lignes)
- **Total** : ~2600 lignes en moins, bundle plus léger
