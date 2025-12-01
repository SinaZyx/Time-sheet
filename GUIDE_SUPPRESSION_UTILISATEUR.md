# Guide : Supprimer un utilisateur

## ❌ Pourquoi "Failed to delete user: Database error deleting user"

Ce message d'erreur apparaît pour plusieurs raisons :

### 1. **Contrainte de clé étrangère**
- La table `profiles` référence `auth.users` avec `ON DELETE CASCADE`
- La table `timesheets` référence `auth.users` via `user_id`
- Si `timesheets` n'a pas `ON DELETE CASCADE`, la suppression échoue

### 2. **Politiques RLS trop restrictives**
- Les politiques RLS peuvent bloquer la suppression
- Même pour un admin

### 3. **Permissions insuffisantes**
- Seul le service role de Supabase peut supprimer des utilisateurs d'`auth.users`
- La clé anon ne peut pas supprimer directement

---

## ✅ Solutions pour supprimer un utilisateur

### Méthode 1 : Via le Dashboard Supabase (RECOMMANDÉ)

1. Allez sur **https://trzjwipxrftkdhvyzmbi.supabase.co**
2. Cliquez sur **Authentication** dans le menu de gauche
3. Cliquez sur **Users**
4. Trouvez l'utilisateur à supprimer
5. Cliquez sur les **3 points** à droite de la ligne
6. Cliquez sur **Delete user**
7. Confirmez la suppression

**Avantage** : Cette méthode gère automatiquement toutes les contraintes et suppressions en cascade.

---

### Méthode 2 : Via SQL (Supprimer les données liées d'abord)

```sql
-- Etape 1: Identifier l'utilisateur
SELECT id, email, created_at
FROM auth.users
WHERE email = 'utilisateur@example.com';

-- Etape 2: Copier l'UUID de l'utilisateur
-- Exemple: '12345678-1234-1234-1234-123456789abc'

-- Etape 3: Supprimer les timesheets de cet utilisateur
DELETE FROM public.timesheets
WHERE user_id = '12345678-1234-1234-1234-123456789abc';

-- Etape 4: Supprimer le profile
DELETE FROM public.profiles
WHERE id = '12345678-1234-1234-1234-123456789abc';

-- Etape 5: Maintenant vous pouvez supprimer via le Dashboard
-- (La suppression via SQL de auth.users necessite la service key)
```

---

### Méthode 3 : Corriger la contrainte de timesheets

Si le problème persiste, ajoutez `ON DELETE CASCADE` à la table timesheets :

```sql
-- Supprimer l'ancienne contrainte
ALTER TABLE public.timesheets
DROP CONSTRAINT IF EXISTS timesheets_user_id_fkey;

-- Recréer avec ON DELETE CASCADE
ALTER TABLE public.timesheets
ADD CONSTRAINT timesheets_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;
```

**Maintenant**, quand vous supprimez un utilisateur :
1. Ses `timesheets` sont supprimés automatiquement
2. Son `profile` est supprimé automatiquement
3. L'utilisateur est supprimé de `auth.users`

---

## 🔍 Vérifier si tout est bien configuré

### Exécutez le script de vérification

1. Ouvrez **Supabase SQL Editor**
2. Créez une **New query**
3. Copiez-collez le contenu de **SUPABASE_VERIFICATION.sql**
4. Cliquez sur **Run** (ou Ctrl+Enter)

### Ce que le script vérifie :

✅ Table `profiles` existe
✅ Table `timesheets` existe
✅ Trigger `on_auth_user_created` existe
✅ RLS actif sur `profiles`
✅ RLS actif sur `timesheets`
✅ Politiques RLS correctes
✅ Tous les utilisateurs ont un profile
✅ Pas de timesheets orphelins
✅ Contraintes de clés étrangères

### Résultats attendus :

```
✓ OK - Table profiles existe
✓ OK - Table timesheets existe
✓ OK - Trigger on_auth_user_created
✓ OK - RLS actif sur profiles
✓ OK - RLS actif sur timesheets
✓ OK - 4 politiques sur profiles
✓ OK - 5 politiques sur timesheets
```

---

## 🛠️ Diagnostic des erreurs communes

### Erreur : "UTILISATEURS SANS PROFILE"

**Cause** : Le trigger ne s'est pas déclenché ou n'existait pas lors de l'inscription

**Solution** :
```sql
-- Créer les profiles manquants
INSERT INTO public.profiles (id, role)
SELECT u.id, 'employee'
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = u.id
);
```

### Erreur : "TIMESHEETS ORPHELINS"

**Cause** : Des timesheets existent pour des utilisateurs supprimés

**Solution** :
```sql
-- Supprimer les timesheets orphelins
DELETE FROM public.timesheets t
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users u WHERE u.id = t.user_id
);
```

### Erreur : "RLS non activé"

**Cause** : Row Level Security n'est pas activé

**Solution** :
```sql
-- Activer RLS sur profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Activer RLS sur timesheets
ALTER TABLE public.timesheets ENABLE ROW LEVEL SECURITY;
```

---

## 📋 Checklist de configuration complète

Exécutez cette checklist pour vérifier que tout est correct :

- [ ] ✅ Table `profiles` existe
- [ ] ✅ Table `timesheets` existe avec contrainte CASCADE
- [ ] ✅ Trigger `on_auth_user_created` créé et actif
- [ ] ✅ RLS activé sur `profiles`
- [ ] ✅ RLS activé sur `timesheets`
- [ ] ✅ Politique "Everyone can view profiles"
- [ ] ✅ Politique "Only admins can update profiles"
- [ ] ✅ Politique "Users can view own timesheets or admins view all"
- [ ] ✅ Politique "Users can insert own timesheets"
- [ ] ✅ Politique "Users can update own timesheets"
- [ ] ✅ Politique "Users can delete own timesheets"
- [ ] ✅ Tous les utilisateurs ont un profile
- [ ] ✅ Au moins un admin existe
- [ ] ✅ Pas de timesheets orphelins

---

## 🚀 Script complet de réparation

Si des choses manquent, exécutez ce script :

```sql
-- 1. Ajouter ON DELETE CASCADE si manquant
ALTER TABLE public.timesheets
DROP CONSTRAINT IF EXISTS timesheets_user_id_fkey;

ALTER TABLE public.timesheets
ADD CONSTRAINT timesheets_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- 2. Créer les profiles manquants
INSERT INTO public.profiles (id, role)
SELECT u.id, 'employee'
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;

-- 3. Supprimer les timesheets orphelins
DELETE FROM public.timesheets t
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users u WHERE u.id = t.user_id
);

-- 4. Activer RLS si pas actif
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timesheets ENABLE ROW LEVEL SECURITY;

-- 5. Vérification finale
SELECT
    'Résultat final' as statut,
    (SELECT COUNT(*) FROM auth.users) as total_utilisateurs,
    (SELECT COUNT(*) FROM public.profiles) as total_profiles,
    (SELECT COUNT(*) FROM public.profiles WHERE role = 'admin') as total_admins,
    (SELECT COUNT(*) FROM public.timesheets) as total_timesheets;
```

---

## 💡 Commandes utiles

### Voir tous les utilisateurs avec leur rôle
```sql
SELECT
    u.email,
    p.role,
    u.email_confirmed_at,
    u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC;
```

### Promouvoir un utilisateur en admin
```sql
UPDATE public.profiles
SET role = 'admin'
WHERE id = (
    SELECT id FROM auth.users WHERE email = 'votre-email@example.com'
);
```

### Rétrograder un admin en employé
```sql
UPDATE public.profiles
SET role = 'employee'
WHERE id = (
    SELECT id FROM auth.users WHERE email = 'ancien-admin@example.com'
);
```

### Voir les timesheets d'un utilisateur
```sql
SELECT
    u.email,
    t.week_start_date,
    t.updated_at
FROM public.timesheets t
JOIN auth.users u ON t.user_id = u.id
WHERE u.email = 'utilisateur@example.com'
ORDER BY t.week_start_date DESC;
```

---

## ⚠️ Important

**Ne supprimez JAMAIS directement depuis la table `auth.users` via SQL** sans avoir :
1. Supprimé les données liées (timesheets, profiles)
2. Ou configuré `ON DELETE CASCADE` correctement

**Utilisez toujours le Dashboard Supabase** pour supprimer des utilisateurs, c'est la méthode la plus sûre.

---

**Besoin d'aide ?**

1. Exécutez `SUPABASE_VERIFICATION.sql`
2. Vérifiez les résultats
3. Exécutez le script de réparation si nécessaire
4. Essayez de supprimer à nouveau via le Dashboard
