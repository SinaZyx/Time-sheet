-- ============================================
-- SCRIPT DE VERIFICATION SUPABASE
-- Copiez-collez ce script dans Supabase SQL Editor
-- ============================================

-- 1. Verifier que la table profiles existe
SELECT 'Table profiles existe' as verification,
    CASE
        WHEN EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = 'profiles'
        ) THEN '✓ OK'
        ELSE '✗ ERREUR: Table profiles manquante'
    END as statut;

-- 2. Verifier que la table timesheets existe
SELECT 'Table timesheets existe' as verification,
    CASE
        WHEN EXISTS (
            SELECT FROM information_schema.tables
            WHERE table_schema = 'public'
            AND table_name = 'timesheets'
        ) THEN '✓ OK'
        ELSE '✗ ERREUR: Table timesheets manquante'
    END as statut;

-- 3. Verifier le trigger de creation automatique de profile
SELECT 'Trigger on_auth_user_created' as verification,
    CASE
        WHEN EXISTS (
            SELECT FROM pg_trigger
            WHERE tgname = 'on_auth_user_created'
        ) THEN '✓ OK'
        ELSE '✗ ERREUR: Trigger manquant'
    END as statut;

-- 4. Verifier que RLS est active sur profiles
SELECT 'RLS actif sur profiles' as verification,
    CASE
        WHEN relrowsecurity = true THEN '✓ OK'
        ELSE '✗ ERREUR: RLS non activé'
    END as statut
FROM pg_class
WHERE relname = 'profiles';

-- 5. Verifier que RLS est active sur timesheets
SELECT 'RLS actif sur timesheets' as verification,
    CASE
        WHEN relrowsecurity = true THEN '✓ OK'
        ELSE '✗ ERREUR: RLS non activé'
    END as statut
FROM pg_class
WHERE relname = 'timesheets';

-- 6. Lister toutes les politiques sur profiles
SELECT 'Politiques sur profiles' as info,
    polname as nom_politique,
    polcmd as commande
FROM pg_policy
WHERE polrelid = 'public.profiles'::regclass;

-- 7. Lister toutes les politiques sur timesheets
SELECT 'Politiques sur timesheets' as info,
    polname as nom_politique,
    polcmd as commande
FROM pg_policy
WHERE polrelid = 'public.timesheets'::regclass;

-- 8. Verifier tous les utilisateurs et leurs profiles
SELECT
    'Utilisateurs et profiles' as info,
    u.email,
    u.created_at as date_inscription,
    u.email_confirmed_at as email_verifie,
    COALESCE(p.role, 'PAS DE PROFILE') as role,
    CASE
        WHEN p.id IS NULL THEN '✗ PROFILE MANQUANT'
        ELSE '✓ OK'
    END as statut
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC;

-- 9. Compter les admins et employes
SELECT
    'Statistiques roles' as info,
    role,
    COUNT(*) as nombre
FROM public.profiles
GROUP BY role
UNION ALL
SELECT
    'Statistiques roles' as info,
    'SANS PROFILE' as role,
    COUNT(*) as nombre
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = u.id
);

-- 10. Verifier les contraintes de la table profiles
SELECT
    'Contraintes profiles' as info,
    conname as nom_contrainte,
    contype as type_contrainte
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass;

-- ============================================
-- DIAGNOSTIC DES PROBLEMES COURANTS
-- ============================================

-- Trouver les utilisateurs SANS profile
SELECT
    '⚠️ UTILISATEURS SANS PROFILE' as alerte,
    u.email,
    u.id
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = u.id
);

-- Verifier les timesheets orphelins (sans utilisateur)
SELECT
    '⚠️ TIMESHEETS ORPHELINS' as alerte,
    t.id,
    t.user_id,
    t.week_start_date
FROM public.timesheets t
WHERE NOT EXISTS (
    SELECT 1 FROM auth.users u WHERE u.id = t.user_id
);

-- ============================================
-- SCRIPT DE REPARATION
-- ============================================

-- Creer les profiles manquants pour les utilisateurs existants
INSERT INTO public.profiles (id, role)
SELECT u.id, 'employee'
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;

-- Verifier apres reparation
SELECT
    '✓ VERIFICATION APRES REPARATION' as resultat,
    COUNT(*) as utilisateurs_avec_profile
FROM auth.users u
INNER JOIN public.profiles p ON u.id = p.id;

-- ============================================
-- COMMENT SUPPRIMER UN UTILISATEUR CORRECTEMENT
-- ============================================

-- METHODE 1: Supprimer via l'interface Supabase Dashboard
-- Allez dans Authentication > Users > Cliquez sur les 3 points > Delete user

-- METHODE 2: Supprimer via SQL (avec les bonnes permissions)
-- ATTENTION: Ceci supprime l'utilisateur ET son profile grace a ON DELETE CASCADE
-- Remplacez 'email@example.com' par l'email de l'utilisateur a supprimer

/*
-- Trouver l'ID de l'utilisateur
SELECT id, email FROM auth.users WHERE email = 'email@example.com';

-- Supprimer le profile d'abord
DELETE FROM public.profiles WHERE id = 'uuid-de-l-utilisateur';

-- Puis supprimer l'utilisateur (NECESSITE DES PERMISSIONS ADMIN)
-- Cette commande ne peut etre executee que via l'API admin ou le dashboard
*/
