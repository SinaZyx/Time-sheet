-- ============================================
-- OPTIMISATION DES POLITIQUES RLS
-- ============================================
-- Ce script corrige le problème de performance des politiques RLS
-- en remplaçant auth.uid() par (select auth.uid())
--
-- POURQUOI ?
-- - auth.uid() est réévalué pour CHAQUE ligne (lent)
-- - (select auth.uid()) est évalué UNE SEULE FOIS (rapide)
--
-- EXÉCUTEZ CE SCRIPT DANS SUPABASE SQL EDITOR
-- ============================================

-- 1. SUPPRIMER LES ANCIENNES POLITIQUES SUR TIMESHEETS
DROP POLICY IF EXISTS "Users can view own timesheets or admins view all" ON public.timesheets;
DROP POLICY IF EXISTS "Users can insert own timesheets" ON public.timesheets;
DROP POLICY IF EXISTS "Users can update own timesheets" ON public.timesheets;
DROP POLICY IF EXISTS "Users can delete own timesheets" ON public.timesheets;

-- 2. RECRÉER LES POLITIQUES OPTIMISÉES SUR TIMESHEETS

-- SELECT: Les utilisateurs voient leurs données OU les admins voient tout
CREATE POLICY "Users can view own timesheets or admins view all"
    ON public.timesheets FOR SELECT
    USING (
        (select auth.uid()) = user_id
        OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
        )
    );

-- INSERT: Les utilisateurs peuvent créer leurs propres timesheets
CREATE POLICY "Users can insert own timesheets"
    ON public.timesheets FOR INSERT
    WITH CHECK ((select auth.uid()) = user_id);

-- UPDATE: Les utilisateurs peuvent modifier leurs propres timesheets
CREATE POLICY "Users can update own timesheets"
    ON public.timesheets FOR UPDATE
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

-- DELETE: Les utilisateurs peuvent supprimer leurs propres timesheets
CREATE POLICY "Users can delete own timesheets"
    ON public.timesheets FOR DELETE
    USING ((select auth.uid()) = user_id);

-- 3. SUPPRIMER LES ANCIENNES POLITIQUES SUR PROFILES
DROP POLICY IF EXISTS "Everyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Only admins can update profiles" ON public.profiles;

-- 4. RECRÉER LES POLITIQUES OPTIMISÉES SUR PROFILES

-- SELECT: Tout le monde peut voir les profiles
CREATE POLICY "Everyone can view profiles"
    ON public.profiles FOR SELECT
    USING (true);

-- UPDATE: Seuls les admins peuvent modifier les rôles
CREATE POLICY "Only admins can update profiles"
    ON public.profiles FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
        )
    );

-- ============================================
-- VÉRIFICATION
-- ============================================

-- Lister toutes les politiques sur timesheets
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'timesheets'
ORDER BY policyname;

-- Lister toutes les politiques sur profiles
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'profiles'
ORDER BY policyname;

-- ============================================
-- RÉSULTAT ATTENDU
-- ============================================
-- ✅ 4 politiques sur timesheets (SELECT, INSERT, UPDATE, DELETE)
-- ✅ 2 politiques sur profiles (SELECT, UPDATE)
-- ✅ Toutes les politiques utilisent (select auth.uid())
-- ✅ L'avertissement de performance devrait disparaître

-- ============================================
-- EXPLICATIONS TECHNIQUES
-- ============================================
--
-- AVANT (LENT) :
-- WHERE auth.uid() = user_id
-- → auth.uid() est évalué pour CHAQUE ligne de la table
-- → Si 1000 lignes → 1000 appels à auth.uid()
--
-- APRÈS (RAPIDE) :
-- WHERE (select auth.uid()) = user_id
-- → auth.uid() est évalué UNE SEULE FOIS
-- → Si 1000 lignes → 1 appel à auth.uid()
-- → PostgreSQL met en cache le résultat
--
-- GAIN DE PERFORMANCE : 100x à 1000x plus rapide sur de grandes tables
-- ============================================
