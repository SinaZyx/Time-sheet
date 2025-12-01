# Page RH - Gestion des Employés

Cette fonctionnalité permet aux administrateurs RH de visualiser et exporter les feuilles de temps de tous les employés.

## 🚀 Installation

### 1. Installer les dépendances manquantes

```bash
npm install jszip
```

> **Note** : JSZip est nécessaire pour la fonctionnalité d'export ZIP de PDFs individuels.

### 2. Configuration de la base de données Supabase

Suivez les instructions détaillées dans le fichier `SUPABASE_RH_SETUP.md`.

**Résumé des étapes :**

1. Créer la table `profiles`
2. Activer Row Level Security (RLS)
3. Mettre à jour les politiques RLS de `timesheets`
4. Promouvoir votre premier compte en admin

```sql
-- Dans Supabase SQL Editor, exécutez le script complet de SUPABASE_RH_SETUP.md
-- Puis promouvez votre compte :
UPDATE profiles
SET role = 'admin'
WHERE id = (
    SELECT id FROM auth.users
    WHERE email = 'votre-email@example.com'
);
```

## 📋 Fonctionnalités

### Pour les employés (role = 'employee')

- ✅ Accès à leur propre feuille de temps
- ✅ Export PDF et Excel de leur semaine
- ❌ Pas d'accès à la page RH

### Pour les administrateurs RH (role = 'admin')

- ✅ Accès à leur propre feuille de temps
- ✅ Bouton "RH" dans le header pour accéder au tableau de bord
- ✅ Vue de tous les employés avec leurs statistiques
- ✅ Sélection multiple d'employés
- ✅ Filtres par période (semaine, mois, personnalisée, dernière feuille)
- ✅ Export PDF consolidé (toutes les fiches dans un seul PDF)
- ✅ Export ZIP (un PDF par employé sélectionné)
- ✅ Export Excel consolidé avec statistiques

## 🎯 Utilisation

### Accéder au tableau de bord RH

1. Connectez-vous avec un compte admin
2. Cliquez sur le bouton **"RH"** (violet) dans le header
3. Vous accédez au tableau de bord RH

### Sélectionner des employés

- Cliquez sur une ligne pour sélectionner/désélectionner un employé
- Cliquez sur "Tout sélectionner" pour sélectionner tous les employés
- Les employés sélectionnés sont indiqués par une icône cochée

### Filtrer par période

**Dernière feuille** (par défaut)
- Exporte la dernière feuille de temps saisie par chaque employé

**Par semaine**
- Sélectionnez une date de début de semaine spécifique
- Exporte les feuilles de la semaine choisie

**Par mois**
- Sélectionnez un mois (ex: 2025-12)
- Exporte toutes les semaines du mois

**Personnalisée**
- Définissez une date de début et une date de fin
- Exporte toutes les feuilles dans cette plage

### Exporter les données

**PDF Consolidé**
- Génère un seul PDF avec une page par employé sélectionné
- Idéal pour l'impression ou l'archivage

**ZIP de PDFs**
- Génère un PDF individuel pour chaque employé
- Tous les PDFs sont regroupés dans un fichier ZIP
- Nommage : `NomPrenom_YYYY-MM-DD.pdf`

**Excel Consolidé**
- Génère un fichier Excel avec 3 feuilles :
  - **Details** : Toutes les lignes jour par jour pour chaque employé
  - **Resume** : Total par employé
  - **Statistiques** : Moyennes et totaux généraux

## 🔒 Sécurité

### Politiques RLS (Row Level Security)

Les données sont protégées au niveau de la base de données :

- **Employés** : Peuvent voir uniquement leurs propres timesheets
- **Admins** : Peuvent voir tous les timesheets de tous les employés
- **Modification** : Chacun peut modifier uniquement ses propres données

### Vérification des rôles

Le rôle est vérifié :
- Côté client (React) : Affichage conditionnel du bouton RH
- Côté serveur (Supabase RLS) : Protection des requêtes SQL

## 📊 Informations affichées

Dans le tableau de bord RH, pour chaque employé :

| Colonne | Description |
|---------|-------------|
| Employé | Nom et prénom + email |
| Total heures (mois) | Somme des heures du mois en cours |
| Dernière saisie | Date de la dernière modification |

## 🛠️ Architecture

### Nouveaux fichiers

```
src/
├── components/
│   └── RHDashboard.tsx          # Composant principal du tableau de bord RH
├── utils/
│   ├── pdfExports.ts            # Fonctions d'export PDF
│   └── excelExports.ts          # Fonctions d'export Excel
└── lib/
    └── supabase.ts              # Types TypeScript pour la DB

SUPABASE_RH_SETUP.md             # Instructions SQL pour Supabase
README_RH.md                     # Ce fichier
```

### Flux de données

```
1. Utilisateur se connecte
   ↓
2. App.tsx récupère le rôle depuis profiles
   ↓
3. Si admin → Bouton "RH" visible
   ↓
4. Clic sur "RH" → Affiche RHDashboard
   ↓
5. RHDashboard récupère tous les employés
   ↓
6. Récupère les timesheets selon les filtres
   ↓
7. Export PDF/Excel selon le choix
```

## 🐛 Dépannage

### Le bouton "RH" n'apparaît pas

**Cause** : Votre compte n'est pas en mode admin

**Solution** :
```sql
-- Vérifier votre rôle
SELECT u.email, p.role
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'votre-email@example.com';

-- Si role = 'employee', le changer en 'admin'
UPDATE profiles
SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'votre-email@example.com');
```

### Erreur "Cannot read property 'admin' of undefined"

**Cause** : La fonction `supabase.auth.admin.listUsers()` nécessite des permissions spéciales

**Solution** : Cette fonction fonctionne avec la clé anon. Si erreur, vérifiez les politiques RLS.

### Les employés ne s'affichent pas

**Cause** : Pas de profiles créés pour les utilisateurs

**Solution** :
```sql
-- Vérifier que le trigger fonctionne
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Créer manuellement des profiles pour les utilisateurs existants
INSERT INTO profiles (id, role)
SELECT id, 'employee'
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles);
```

### Erreur lors de l'export ZIP

**Cause** : Le package `jszip` n'est pas installé

**Solution** :
```bash
npm install jszip
```

### Les admins ne voient pas tous les timesheets

**Cause** : Les politiques RLS ne sont pas correctement configurées

**Solution** : Réexécutez le SQL de mise à jour des politiques dans `SUPABASE_RH_SETUP.md`

## 📝 Notes de développement

### Ajouter un nouveau filtre

Modifiez `RHDashboard.tsx` :

```typescript
// Ajoutez votre option dans le select
<option value="custom">Ma nouvelle période</option>

// Ajoutez la logique dans fetchTimesheetsForExport()
if (filterPeriod === 'custom') {
    // Votre logique ici
}
```

### Modifier le format PDF

Modifiez `src/utils/pdfExports.ts` :

```typescript
// Fonction generateSingleEmployeePDF() ou generateConsolidatedPDF()
doc.setFontSize(22); // Taille du titre
doc.setFillColor(2, 132, 199); // Couleur du header
```

### Ajouter des statistiques dans Excel

Modifiez `src/utils/excelExports.ts` :

```typescript
// Dans la section statsData
const statsData = [
    // Ajoutez vos nouvelles statistiques ici
    { "Statistique": "Nouvelle stat", "Valeur": calcul },
];
```

## 🚀 Améliorations futures

- [ ] Export par département
- [ ] Graphiques et visualisations
- [ ] Notifications par email
- [ ] Validation des feuilles de temps par RH
- [ ] Historique des modifications
- [ ] Export en format CSV
- [ ] Filtres avancés (par employé, par type de contrat, etc.)

## 📞 Support

Pour toute question ou problème :
1. Consultez `SUPABASE_RH_SETUP.md` pour la configuration
2. Vérifiez les logs dans la console du navigateur
3. Vérifiez les politiques RLS dans Supabase Dashboard

---

**Version** : 1.0.0
**Date** : 2025-12-01
**Dernière mise à jour** : Page RH avec exports multiples
