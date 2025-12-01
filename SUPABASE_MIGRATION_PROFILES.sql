-- ============================================
-- MIGRATION : Ajouter email et full_name à profiles
-- ============================================
-- Ce script corrige le problème "0 employés" en stockant
-- les infos utilisateur directement dans profiles

-- 1. Ajouter les colonnes email et full_name
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS full_name TEXT;

-- 2. Remplir les colonnes pour les utilisateurs existants
UPDATE public.profiles p
SET
    email = u.email,
    full_name = COALESCE(u.raw_user_meta_data->>'full_name', u.email)
FROM auth.users u
WHERE p.id = u.id;

-- 3. Modifier le trigger pour remplir ces champs automatiquement
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, role, email, full_name)
    VALUES (
        NEW.id,
        'employee',
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Vérification
SELECT
    'Vérification' as statut,
    id,
    email,
    full_name,
    role
FROM public.profiles
ORDER BY created_at DESC;

-- ============================================
-- RESULTAT ATTENDU
-- ============================================
-- Tous les profils doivent maintenant avoir :
-- - email renseigné
-- - full_name renseigné (ou email si pas de nom)
-- - role = 'employee' ou 'admin'
