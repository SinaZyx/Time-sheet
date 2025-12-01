# ⚡ Configuration Rapide Supabase

## 🎯 À faire MAINTENANT dans Supabase

Allez sur : **https://trzjwipxrftkdhvyzmbi.supabase.co**

---

## 1️⃣ Activer la vérification d'email (2 min)

### Étape 1 : Authentication → Providers → Email

Dans le menu de gauche :
1. Cliquez sur **Authentication**
2. Cliquez sur **Providers**
3. Cliquez sur **Email**
4. Activez ces options :
   - ✅ **Enable email provider**
   - ✅ **Confirm email** (IMPORTANT !)
   - ❌ **Secure email change** (optionnel)
5. Cliquez sur **Save**

---

## 2️⃣ Configurer les URLs (1 min)

### Étape 2 : Authentication → URL Configuration

Dans le menu de gauche :
1. Cliquez sur **Authentication**
2. Cliquez sur **URL Configuration**
3. Configurez :

**Site URL** :
```
https://time-sheet-j6k9.vercel.app
```

**Redirect URLs** (cliquez sur "Add URL") :
```
https://time-sheet-j6k9.vercel.app/**
```

> 💡 Si vous voulez tester en local, ajoutez aussi : `http://localhost:5173/**`

4. Cliquez sur **Save**

---

## 3️⃣ Ajouter les politiques RLS (2 min)

### Étape 3 : SQL Editor

Dans le menu de gauche :
1. Cliquez sur **SQL Editor**
2. Cliquez sur **New query**
3. Copiez-collez ce SQL :

```sql
-- Activer RLS
ALTER TABLE timesheets ENABLE ROW LEVEL SECURITY;

-- Les utilisateurs peuvent voir leurs propres données
CREATE POLICY "Users can view own timesheets"
    ON timesheets FOR SELECT
    USING (auth.uid() = user_id);

-- Les utilisateurs peuvent insérer leurs propres données
CREATE POLICY "Users can insert own timesheets"
    ON timesheets FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent mettre à jour leurs propres données
CREATE POLICY "Users can update own timesheets"
    ON timesheets FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Les utilisateurs peuvent supprimer leurs propres données
CREATE POLICY "Users can delete own timesheets"
    ON timesheets FOR DELETE
    USING (auth.uid() = user_id);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_timesheets_user_id ON timesheets(user_id);
CREATE INDEX IF NOT EXISTS idx_timesheets_week_start_date ON timesheets(week_start_date);
```

4. Cliquez sur **Run** (ou appuyez sur Ctrl+Enter)
5. Vérifiez qu'il n'y a pas d'erreur

---

## 4️⃣ Personnaliser l'email de confirmation (optionnel, 2 min)

### Étape 4 : Authentication → Email Templates

1. Cliquez sur **Authentication**
2. Cliquez sur **Email Templates**
3. Sélectionnez **Confirm signup**
4. Remplacez le contenu par le template HTML que je vous ai donné
5. Cliquez sur **Save template**

---

## ✅ Vérification

Pour vérifier que tout fonctionne :

1. Allez sur **https://time-sheet-j6k9.vercel.app**
2. Créez un nouveau compte
3. Vous devriez voir la page "Vérifiez votre email"
4. Vérifiez votre boîte mail (et spams)
5. Cliquez sur le lien de confirmation
6. Vous devriez être redirigé vers l'application avec le message "Email vérifié avec succès !"

---

## 🚨 Problèmes courants

### L'email n'arrive pas
- ✅ Vérifiez vos spams
- ✅ Vérifiez que "Confirm email" est activé dans Authentication → Providers → Email
- ✅ Attendez 2-3 minutes (les emails peuvent être lents)

### Le lien de confirmation ne marche pas
- ✅ Vérifiez que le Site URL est bien `https://time-sheet-j6k9.vercel.app`
- ✅ Vérifiez que l'URL est dans les Redirect URLs

### "Invalid redirect URL"
- ✅ Ajoutez `https://time-sheet-j6k9.vercel.app/**` dans Redirect URLs

### L'utilisateur peut se connecter sans vérifier son email
- ✅ Retournez dans Authentication → Providers → Email
- ✅ Désactivez "Allow users to sign in without confirming their email"

---

## 📋 Checklist finale

- [ ] "Confirm email" activé dans Authentication → Providers → Email
- [ ] Site URL = `https://time-sheet-j6k9.vercel.app`
- [ ] Redirect URLs contient `https://time-sheet-j6k9.vercel.app/**`
- [ ] Politiques RLS créées et actives
- [ ] Template email personnalisé (optionnel)
- [ ] Test d'inscription réussi

---

**C'est tout ! Votre système de vérification d'email est maintenant opérationnel.** 🎉

Pour plus de détails, consultez `SUPABASE_CONFIG.md`.
