# PresupIA Edge Function Deployment Guide

## Status

✅ **Code Ready for Deployment**
- Edge Function: `supabase/functions/validar-analisis/index.ts`
- Migration: `supabase/migrations/20260416_create_pres_usuarios.sql`
- Configuration: `supabase/config.toml`

All files are in place. Now deploy to your Supabase project.

---

## Deployment Method 1: Supabase CLI (Recommended)

### Prerequisites
- Supabase CLI installed (`supabase --version`)
- Supabase access token

### Step 1: Authenticate

```bash
supabase login
```

This will open a browser to generate an access token. Copy it and paste into the terminal.

### Step 2: Link Project

```bash
cd /c/Users/alexi/Downloads/presupia
supabase link --project-ref tnrqdyagfecceeebocvn
```

### Step 3: Run Migration

```bash
supabase migration up
```

This creates the `pres_usuarios` table in your database.

### Step 4: Deploy Edge Function

```bash
supabase functions deploy validar-analisis
```

Expected output:
```
✓ Function validar-analisis deployed successfully
  https://tnrqdyagfecceeebocvn.supabase.co/functions/v1/validar-analisis
```

### Step 5: Verify Deployment

```bash
supabase functions list
```

Should see:
```
validar-analisis  validar-analisis
```

---

## Deployment Method 2: Manual (Supabase Dashboard)

If CLI doesn't work, deploy manually:

### Step 1: Create the Table

1. Go to **Supabase Dashboard** → Your Project
2. Go to **SQL Editor**
3. Create a new query
4. Paste the SQL from `supabase/migrations/20260416_create_pres_usuarios.sql`
5. Click **Run**

### Step 2: Create Edge Function

1. Go to **Edge Functions** in Supabase Dashboard
2. Click **Create a new function**
3. Name: `validar-analisis`
4. Runtime: **TypeScript**
5. Copy the entire code from `supabase/functions/validar-analisis/index.ts`
6. Paste it into the editor
7. Click **Deploy**

---

## Testing the Deployment

### Test 1: Check Function Exists

```bash
curl -i https://tnrqdyagfecceeebocvn.supabase.co/functions/v1/validar-analisis \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{}'
```

Expected response: 400 (missing device_id, but function is working)

### Test 2: First Analysis (Free User)

```bash
curl -X POST https://tnrqdyagfecceeebocvn.supabase.co/functions/v1/validar-analisis \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"user_id": null, "device_id": "test-device-001"}'
```

Expected response:
```json
{
  "permitido": true,
  "analisisRestantes": 2
}
```

### Test 3: Use All 3 Free Analyses

Run the curl command 2 more times. On the 4th request:

Expected response:
```json
{
  "permitido": false,
  "razon": "Ha alcanzado el límite de 3 análisis gratuitos..."
}
```

### Test 4: Pro User

Create a pro user in the database:

```sql
INSERT INTO pres_usuarios (device_id, es_pro)
VALUES ('test-pro-device', true);
```

Then test:
```bash
curl -X POST https://tnrqdyagfecceeebocvn.supabase.co/functions/v1/validar-analisis \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"user_id": null, "device_id": "test-pro-device"}'
```

Expected response:
```json
{
  "permitido": true,
  "analisisRestantes": null
}
```

---

## Verify Complete Setup

### Check Edge Function Deployed

```bash
supabase functions list
```

Should show:
```
validar-analisis  (deployed)
```

### Check Table Exists

Go to **Supabase Dashboard** → **SQL Editor** → Run:

```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'pres_usuarios';
```

Should return:
```
pres_usuarios
```

### Check RLS Policies

Go to **Authentication** → **Policies** → Look for `pres_usuarios` table policies.

---

## Environment Variables Needed

Make sure these are set in your client `.env`:

```
EXPO_PUBLIC_SUPABASE_URL=https://tnrqdyagfecceeebocvn.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

The app will automatically call:
```
https://tnrqdyagfecceeebocvn.supabase.co/functions/v1/validar-analisis
```

---

## Troubleshooting

### Function returns 500 error

**Check logs:**
```bash
supabase functions logs validar-analisis
```

Look for database connection errors.

### "permission denied" error

**Check RLS policies:**
1. Go to Supabase Dashboard → Authentication → Policies
2. Make sure `pres_usuarios` table allows queries

### Function not found (404)

**Verify deployment:**
```bash
supabase functions list
```

If not showing, redeploy:
```bash
supabase functions deploy validar-analisis
```

### "database does not exist"

**Create the table:**
```sql
-- Paste the entire migration SQL
-- From: supabase/migrations/20260416_create_pres_usuarios.sql
```

---

## Post-Deployment Checklist

After deployment, verify everything works:

- [ ] Edge Function deployed successfully
- [ ] `pres_usuarios` table created
- [ ] RLS policies enabled
- [ ] Test 1: Function responds (even with error)
- [ ] Test 2: First analysis returns `permitido: true`
- [ ] Test 3: 4th analysis returns `permitido: false`
- [ ] Test 4: Pro user has unlimited analyses
- [ ] App rebuilds and tests end-to-end

---

## Next Steps

Once deployed:

1. **Test the app:**
   - Create a new account
   - Do 3 free analyses
   - 4th analysis should fail
   - Upgrade to Pro
   - Unlimited analyses should work

2. **Monitor:**
   - Check function logs for errors
   - Monitor database for unusual patterns

3. **Scale:**
   - Monitor Edge Function usage
   - Check database query performance
   - Add caching if needed

---

## Support

If deployment fails:

1. Check **Supabase Status** page: https://status.supabase.com
2. Review **Edge Function Logs** in Supabase Dashboard
3. Verify database connection in Supabase Dashboard
4. Check CORS headers are correct (should be `*` for mobile)

---

**Project:** PresupIA v1.0.0  
**Edge Function:** validar-analisis  
**Database:** pres_usuarios  
**Deployment Date:** April 16, 2026
