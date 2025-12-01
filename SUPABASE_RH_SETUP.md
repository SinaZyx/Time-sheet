# Configuration Supabase pour la page RH

Ce document explique comment configurer la base de données pour la fonctionnalité RH (gestion des employés).

## 1. Créer la table profiles

Cette table stocke les informations supplémentaires des utilisateurs, notamment leur rôle (employé ou admin RH).

```sql
-- Table profiles pour stocker les roles des utilisateurs
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('employee', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performance
CREATE INDEX idx_profiles_role ON profiles(role);

-- Fonction pour creer automatiquement un profile lors de l'inscription
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, role)
    VALUES (NEW.id, 'employee');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour appeler la fonction apres creation d'un utilisateur
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();
```

## 2. Activer Row Level Security (RLS)

```sql
-- Activer RLS sur la table profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Politique: Tout le monde peut voir tous les profiles (necessaire pour la page RH)
CREATE POLICY "Everyone can view profiles"
    ON profiles FOR SELECT
    USING (true);

-- Politique: Seuls les admins peuvent modifier les roles
CREATE POLICY "Only admins can update profiles"
    ON profiles FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
```

## 3. Mettre à jour les politiques RLS de timesheets

Modifier les politiques existantes pour permettre aux admins de voir toutes les données :

```sql
-- Supprimer l'ancienne politique de lecture
DROP POLICY IF EXISTS "Users can view own timesheets" ON timesheets;

-- Nouvelle politique: Les utilisateurs voient leurs donnees OU les admins voient tout
CREATE POLICY "Users can view own timesheets or admins view all"
    ON timesheets FOR SELECT
    USING (
        auth.uid() = user_id
        OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );
```

## 4. Créer votre premier compte admin

Après avoir exécuté les scripts ci-dessus, vous devez promouvoir un utilisateur existant en admin :

```sql
-- Remplacez 'votre-email@example.com' par votre email RH
UPDATE profiles
SET role = 'admin'
WHERE id = (
    SELECT id FROM auth.users
    WHERE email = 'votre-email@example.com'
);
```

## 5. Vérification

Pour vérifier que tout fonctionne :

```sql
-- Voir tous les profiles avec leur role
SELECT
    u.email,
    p.role,
    p.created_at
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
ORDER BY p.created_at DESC;

-- Compter les admins et employes
SELECT
    role,
    COUNT(*) as count
FROM profiles
GROUP BY role;
```

## Résumé des étapes

1. ✅ Exécuter le SQL de création de la table `profiles`
2. ✅ Exécuter le SQL pour activer RLS sur `profiles`
3. ✅ Mettre à jour les politiques RLS de `timesheets`
4. ✅ Promouvoir votre compte en admin
5. ✅ Vérifier que tout fonctionne

## Structure finale

### Table `profiles`
| Colonne | Type | Description |
|---------|------|-------------|
| id | UUID | Référence vers auth.users(id) |
| role | TEXT | 'employee' ou 'admin' |
| created_at | TIMESTAMP | Date de création |
| updated_at | TIMESTAMP | Date de mise à jour |

### Rôles
- **employee** : Peut voir uniquement ses propres feuilles de temps
- **admin** : Peut voir toutes les feuilles de temps de tous les employés (page RH)

## Dépannage

### Le trigger ne se déclenche pas
Vérifiez que le trigger existe :
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

### Un utilisateur n'a pas de profile
Créez-le manuellement :
```sql
INSERT INTO profiles (id, role)
VALUES ('uuid-de-l-utilisateur', 'employee');
```

### Tester les permissions
Connectez-vous avec un compte employé et un compte admin pour vérifier les accès.

---

**Documentation mise à jour le** : 2025-12-01
