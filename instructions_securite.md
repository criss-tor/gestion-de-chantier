# 🔒 Instructions de sécurité pour l'application

## ⚠️ RISQUES ACTUELS

### 1. Partage d'ordinateur
- **NE JAMAIS** partager le même ordinateur/navigateur entre employés
- Chaque employé doit avoir son propre profil utilisateur sur l'ordinateur
- Utiliser des navigateurs différents (Chrome/Firefox/Edge) si partage obligatoire

### 2. Réseau WiFi
- Le WiFi lui-même n'est pas le problème
- Le risque est le partage du navigateur/ordinateur

### 3. Données publiques
- Votre base de données Supabase est actuellement accessible à tous
- N'importe qui avec l'URL peut voir toutes les données

## 🛡️ MESURES DE SÉCURITÉ IMMÉDIATES

### Pour les employés :
1. **PROFILS SÉPARÉS** : Chaque employé doit avoir son propre profil Windows/Mac
2. **NAVIGATEURS DIFFÉRENTS** : Si partage obligatoire, utiliser des navigateurs différents
3. **DÉCONNEXION** : Toujours se déconnecter après utilisation
4. **NAVIGATION PRIVÉE** : Utiliser le mode navigation privée si possible

### Pour l'administrateur :
1. **CHANGER LES MOTS DE PASSE** : Régulièrement changer les codes PIN
2. **SURVEILLER** : Vérifier qui se connecte et quand
3. **SAUVEGARDES** : Faire des sauvegardes régulières

## 🔐 SOLUTIONS TECHNIQUES RECOMMANDÉES

### Option A : Sécurité Supabase (Recommandé)
Exécuter le script `secure_rls_policies.sql` dans Supabase pour :
- Limiter l'accès aux données
- Chaque employé ne voit que ses propres entrées
- Protection contre l'accès externe

### Option B : Authentification Supabase
- Remplacer le système PIN par l'authentification Supabase
- Chaque employé a son compte email/mot de passe
- Sécurité professionnelle

### Option C : Session unique
- Utiliser sessionStorage au lieu de localStorage
- Session unique par onglet/navigateur
- Protection contre le partage accidentel

## 📋 CHECKLIST DE SÉCURITÉ

- [ ] Chaque employé a son propre profil ordinateur
- [ ] Les codes PIN sont complexes (pas 0000, 1234)
- [ ] Les employés se déconnectent après utilisation
- [ ] L'administrateur surveille les connexions
- [ ] Les données sont sauvegardées régulièrement
- [ ] L'accès WiFi est sécurisé (WPA2/3)

## 🚨 EN CAS DE PROBLÈME

Si un employé voit les données d'un autre :
1. **DÉCONNECTER** immédiatement tous les utilisateurs
2. **CHANGER** tous les codes PIN
3. **EFFACER** les caches des navigateurs
4. **CRÉER** des profils utilisateurs séparés

## 📞 SUPPORT

Pour toute question de sécurité :
- Vérifier les logs de connexion
- Surveiller les accès inhabituels
- Contacter le support technique en cas de doute
