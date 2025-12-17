# Diagnostic du problème de données vides après refresh

## Problème décrit

Après login, les données s'affichent correctement. Après un refresh (F5), le planning devient vide pour la même semaine, alors que les données existent en base.

## Étapes de diagnostic

### 1. Vérifier les logs du navigateur

Ouvrez la console du navigateur (F12 → Console) et rechargez la page. Vous devriez voir une séquence de logs comme celle-ci :

```
[initAuth] Starting session check...
[initAuth] Session retrieved: { hasSession: true, userId: "...", email: "...", emailConfirmed: true }
[initAuth] User role: employee
[initAuth] Auth loading complete
[useEffect fetchWeekData] Triggered with: { hasSession: true, mondayStr: "2025-12-15", userId: "...", email: "..." }
[fetchWeekData] Fetching data for: { user_id: "...", week_start_date: "2025-12-15", session_exists: true, email: "..." }
[fetchWeekData] Response: { data: true, error: null, errorCode: null }
[fetchWeekData] Found data, grid has 7 days
```

### 2. Scénarios possibles et solutions

#### Scénario A : Session non disponible après refresh
**Symptômes dans les logs :**
```
[initAuth] Starting session check...
[initAuth] Session retrieved: { hasSession: false, userId: undefined, email: undefined, emailConfirmed: undefined }
[useEffect fetchWeekData] Skipping fetch - no session
```

**Cause :** Le localStorage est corrompu ou la session a expiré

**Solution :**
1. Vérifier le localStorage (F12 → Application → Local Storage)
2. Chercher la clé qui commence par `time-sheet-auth-`
3. Si elle n'existe pas ou est corrompue, se reconnecter

---

#### Scénario B : Session OK mais aucune donnée retournée
**Symptômes dans les logs :**
```
[fetchWeekData] Fetching data for: { user_id: "61d9117f-2e5c-4d83-879d-7f2867dec399", week_start_date: "2025-12-15", session_exists: true, email: "mathias@amb-elec.fr" }
[fetchWeekData] Response: { data: false, error: null, errorCode: "PGRST116" }
[fetchWeekData] No data found for this week, creating empty grid
```

**Cause :** Les données existent en base mais le filtre ne matche pas

**Solution :** Vérifier le format de date en base avec le script SQL `DEBUG_DATES.sql`

**Actions :**
1. Aller sur Supabase → SQL Editor
2. Exécuter le script `DEBUG_DATES.sql`
3. Vérifier que `week_start_date_text` affiche bien `2025-12-15`
4. Si le format est différent (ex: `2025-12-15 00:00:00+00`), il faut ajuster le filtre

---

#### Scénario C : Erreur RLS (Row Level Security)
**Symptômes dans les logs :**
```
[fetchWeekData] Fetching data for: { user_id: "...", week_start_date: "2025-12-15", ... }
[fetchWeekData] Response: { data: false, error: "new row violates row-level security policy", errorCode: null }
```

**Cause :** Les policies RLS bloquent l'accès après refresh (auth.uid() retourne null)

**Solution :**
1. Vérifier que les policies RLS sont bien configurées (voir SUPABASE_CONFIG.md)
2. Vérifier que la session est bien chargée AVANT d'appeler fetchWeekData

---

#### Scénario D : Format de date incorrect
**Symptômes dans les logs :**
```
[fetchWeekData] Fetching data for: { ..., week_start_date: "2025-12-15", ... }
[fetchWeekData] Response: { data: false, error: null, errorCode: "PGRST116" }
```

**En base, la date est stockée différemment** (ex: `2025-12-16` au lieu de `2025-12-15`)

**Cause :** Problème de timezone lors du calcul du lundi

**Solution :** Ajouter un log pour afficher le calcul du lundi :
```javascript
console.log('Current date:', currentDate);
console.log('Monday:', monday);
console.log('Monday string:', mondayStr);
```

---

### 3. Vérifier les données en base

Exécutez ce script SQL dans Supabase SQL Editor :

```sql
-- Voir toutes les semaines pour l'utilisateur mathias@amb-elec.fr
SELECT
    p.email,
    t.week_start_date,
    t.week_start_date::text as date_exacte,
    to_char(t.week_start_date, 'YYYY-MM-DD') as date_formatee,
    jsonb_array_length(t.grid_data) as nb_jours,
    t.updated_at
FROM timesheets t
JOIN profiles p ON p.id = t.user_id
WHERE p.email = 'mathias@amb-elec.fr'
ORDER BY t.week_start_date DESC;
```

Comparez `date_formatee` avec la valeur de `mondayStr` dans les logs du navigateur.

---

### 4. Test de la requête Supabase directement

Dans la console du navigateur, testez la requête manuellement :

```javascript
// Copier l'user_id et le week_start_date depuis les logs
const userId = "61d9117f-2e5c-4d83-879d-7f2867dec399";
const weekStartDate = "2025-12-15";

const { data, error } = await supabase
  .from('timesheets')
  .select('grid_data')
  .eq('user_id', userId)
  .eq('week_start_date', weekStartDate)
  .single();

console.log('Manual test result:', { data, error });
```

Si cette requête retourne des données, alors le problème est dans le timing de l'appel (session pas encore chargée).

---

### 5. Vérifier le réseau

1. Ouvrir F12 → Network
2. Filtrer par "timesheets"
3. Rafraîchir la page
4. Cliquer sur la requête REST `/rest/v1/timesheets`
5. Vérifier :
   - **Headers** : Le token Authorization est-il présent ?
   - **Query params** : Les filtres `user_id` et `week_start_date` sont-ils corrects ?
   - **Response** : Quel est le code HTTP ? (200, 401, 403, 404 ?)

---

## Solutions possibles selon le diagnostic

### Solution 1 : Forcer la session à charger avant fetchWeekData

Si la session n'est pas encore prête, on peut ajouter une vérification :

```typescript
useEffect(() => {
  if (session && !authLoading) {
    fetchWeekData();
  }
}, [session, authLoading, fetchWeekData]);
```

### Solution 2 : Ajuster le format de date

Si le format de date ne matche pas, utiliser `to_char` dans la requête :

```typescript
const { data, error } = await supabase
  .from('timesheets')
  .select('grid_data')
  .eq('user_id', session.user.id)
  .filter('week_start_date', 'eq', mondayStr) // Ou utiliser un format SQL
  .single();
```

### Solution 3 : Vérifier l'auth avant chaque requête

Ajouter une vérification explicite de l'auth token :

```typescript
const fetchWeekData = useCallback(async () => {
  if (!session) return;

  // Vérifier que le token est encore valide
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error('[fetchWeekData] Auth check failed:', authError);
    setLoadError('Session expirée, veuillez vous reconnecter');
    return;
  }

  // Continuer avec la requête...
}, [session, mondayStr]);
```

---

## Prochaines étapes

1. Rechargez la page avec la console ouverte
2. Copiez tous les logs qui commencent par `[initAuth]` ou `[fetchWeekData]`
3. Identifiez le scénario correspondant ci-dessus
4. Appliquez la solution proposée

---

## Informations complémentaires

- **User ID de mathias@amb-elec.fr :** `61d9117f-2e5c-4d83-879d-7f2867dec399`
- **Semaine concernée :** 15-21 décembre 2025
- **Format de date attendu :** `2025-12-15` (YYYY-MM-DD)
- **Type de colonne en base :** `DATE` (pas TIMESTAMP)

Si le problème persiste après ces vérifications, il peut s'agir d'un problème de cache du navigateur ou de Supabase.
