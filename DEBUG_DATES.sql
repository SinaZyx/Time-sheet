-- Script de diagnostic pour comprendre le problème de dates après refresh

-- 1. Vérifier les données existantes pour l'utilisateur mathias@amb-elec.fr
SELECT
    p.email,
    p.full_name,
    t.week_start_date,
    t.week_start_date::text as week_start_date_text,
    to_char(t.week_start_date, 'YYYY-MM-DD') as week_start_date_formatted,
    t.updated_at,
    jsonb_array_length(t.grid_data) as grid_days_count,
    t.user_id
FROM timesheets t
JOIN profiles p ON p.id = t.user_id
WHERE p.email = 'mathias@amb-elec.fr'
ORDER BY t.week_start_date DESC
LIMIT 10;

-- 2. Vérifier spécifiquement la semaine du 15 décembre 2025
SELECT
    p.email,
    t.week_start_date,
    t.week_start_date::text as week_start_date_text,
    t.grid_data,
    t.updated_at
FROM timesheets t
JOIN profiles p ON p.id = t.user_id
WHERE p.email = 'mathias@amb-elec.fr'
  AND t.week_start_date = '2025-12-15'::date;

-- 3. Vérifier le format exact du type de colonne
SELECT
    column_name,
    data_type,
    udt_name,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'timesheets'
  AND column_name = 'week_start_date';

-- 4. Test de requête similaire à ce que fait le front
-- (simuler la requête avec user_id et week_start_date)
SELECT
    t.id,
    t.user_id,
    t.week_start_date,
    t.grid_data,
    t.updated_at
FROM timesheets t
WHERE t.user_id = '61d9117f-2e5c-4d83-879d-7f2867dec399'
  AND t.week_start_date = '2025-12-15';

-- 5. Vérifier les policies RLS sur la table timesheets
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
WHERE tablename = 'timesheets';
