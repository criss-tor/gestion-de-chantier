# Gestion de Chantiers

Application web de suivi des heures et coûts pour la gestion de chantiers.

## Fonctionnalités

### 👥 Gestion des employés
- Ajout/modification des employés avec rôles (Admin/Employé)
- Authentification par prénom + code PIN
- Gestion des coûts horaires

### 🏗️ Gestion des chantiers
- Création et suivi des chantiers
- Devis et heures prévues
- Suivi des coûts matériaux

### ⏱️ Saisie des heures
- Interface intuitive de saisie des heures
- Catégories d'heures (normal, majoré, bureau, absent, congé)
- Vue calendrier hebdomadaire

### 📊 Dashboard et rapports
- Planning hebdomadaire
- Statistiques mensuelles
- Bilan par chantier
- Historique des connexions (admin)

### 💾 Sauvegarde et restauration
- Export Excel des données
- Import de sauvegardes
- Historique des connexions

## Installation

```bash
# Cloner le repository
git clone <repository-url>
cd gestion-de-chantier-suite

# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev
```

## Configuration Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Copier les clés dans `.env` :
   ```
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
   ```
3. Appliquer les migrations :
   ```bash
   npx supabase db push
   ```

## Utilisation

### Connexion
- **Admin** : Se connecter avec un employé ayant le rôle "admin"
- **Employé** : Se connecter avec un employé ayant le rôle "employe"

### Permissions
- **Admin** : Accès complet (dashboard, employés, chantiers, sauvegarde)
- **Employé** : Accès limité (saisie heures uniquement)

## Technologies

- **Frontend** : React + TypeScript + Vite
- **UI** : Tailwind CSS + shadcn/ui
- **Base de données** : Supabase (PostgreSQL)
- **Authentification** : Session-based avec PIN
- **Export** : Excel (xlsx)

## Structure du projet

```
src/
├── components/     # Composants réutilisables
├── contexts/       # Context React (EmployeeContext)
├── hooks/          # Hooks personnalisés
├── lib/            # Utilitaires (backup, etc.)
├── pages/          # Pages de l'application
└── types/          # Types TypeScript
```
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS