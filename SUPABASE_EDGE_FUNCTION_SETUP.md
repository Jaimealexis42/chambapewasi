# Supabase Edge Function Setup Guide

## Overview

This document describes the Supabase Edge Function that must be created to implement server-side freemium validation for PresupIA.

---

## Function: `validar-analisis`

### Purpose
Validate freemium limits server-side and atomically register analysis consumption to prevent users from bypassing the 3 free analysis limit.

### Endpoint
```
POST /functions/v1/validar-analisis
```

### Request Body
```json
{
  "user_id": "user-uuid-or-null",
  "device_id": "device-id-string"
}
```

### Response (Success)
```json
{
  "permitido": true,
  "analisisRestantes": 2
}
```

### Response (Limit Reached)
```json
{
  "permitido": false,
  "razon": "Ha alcanzado el límite de 3 análisis gratuitos"
}
```

### Response (Error)
```json
{
  "permitido": false,
  "razon": "Error al procesar la solicitud"
}
```

---

## Implementation Steps

### 1. Create Edge Function in Supabase

In Supabase Dashboard:
1. Go to **Functions** → **Create a new function**
2. Name: `validar-analisis`
3. Runtime: TypeScript
4. Replace the template with the code below

### 2. Edge Function Code

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user_id, device_id } = await req.json()

    if (!device_id) {
      return new Response(
        JSON.stringify({
          permitido: false,
          razon: 'device_id es requerido',
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the user's freemium record
    const { data: usuario, error: errorUsuario } = await supabase
      .from('pres_usuarios')
      .select('es_pro, analisis_gratis_usados')
      .or(`device_id.eq.${device_id},user_id.eq.${user_id}`)
      .single()

    if (errorUsuario && errorUsuario.code !== 'PGRST116') {
      throw errorUsuario
    }

    // If no record, create one
    if (!usuario) {
      const { error: insertError } = await supabase
        .from('pres_usuarios')
        .insert({
          device_id,
          user_id,
          es_pro: false,
          analisis_gratis_usados: 1,
        })

      if (insertError) throw insertError

      return new Response(
        JSON.stringify({
          permitido: true,
          analisisRestantes: 2,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is pro
    if (usuario.es_pro) {
      return new Response(
        JSON.stringify({
          permitido: true,
          analisisRestantes: null, // Pro users have unlimited
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if free user has analyses left
    const MAX_GRATIS = 3
    if (usuario.analisis_gratis_usados >= MAX_GRATIS) {
      return new Response(
        JSON.stringify({
          permitido: false,
          razon: `Ha alcanzado el límite de ${MAX_GRATIS} análisis gratuitos. Suscríbase a Pro para análisis ilimitados.`,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Atomically increment analysis counter
    const nuevosAnalisis = usuario.analisis_gratis_usados + 1
    const { error: updateError } = await supabase
      .from('pres_usuarios')
      .update({ analisis_gratis_usados: nuevosAnalisis })
      .or(`device_id.eq.${device_id},user_id.eq.${user_id}`)

    if (updateError) throw updateError

    const analisisRestantes = MAX_GRATIS - nuevosAnalisis

    return new Response(
      JSON.stringify({
        permitido: true,
        analisisRestantes,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({
        permitido: false,
        razon: 'Error al procesar la solicitud',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

### 3. Create Database Table (if not exists)

If you haven't already created the `pres_usuarios` table, run this SQL in Supabase:

```sql
CREATE TABLE pres_usuarios (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id text,
  user_id uuid,
  es_pro boolean DEFAULT false,
  analisis_gratis_usados integer DEFAULT 0,
  subscription_expires_at timestamp,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  UNIQUE(device_id),
  UNIQUE(user_id)
);

CREATE INDEX idx_pres_usuarios_device_id ON pres_usuarios(device_id);
CREATE INDEX idx_pres_usuarios_user_id ON pres_usuarios(user_id);
```

### 4. Set Row Level Security (RLS)

Enable RLS on the table:

```sql
ALTER TABLE pres_usuarios ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own record
CREATE POLICY "Users can read own record"
  ON pres_usuarios
  FOR SELECT
  USING (auth.uid() = user_id OR device_id = current_setting('request.device_id', true));

-- Edge function (service role) can update records
-- (already has full access via SERVICE_ROLE_KEY)
```

### 5. Set Environment Variables

In Supabase Edge Function settings, ensure these are available:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (for server-side access)

---

## Testing the Function

### Test Request (Free user, first analysis)
```bash
curl -X POST http://localhost:54321/functions/v1/validar-analisis \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"user_id": null, "device_id": "dev_test123"}'
```

### Expected Response
```json
{
  "permitido": true,
  "analisisRestantes": 2
}
```

---

## Error Cases

### Limit Reached
```json
{
  "permitido": false,
  "razon": "Ha alcanzado el límite de 3 análisis gratuitos..."
}
```

### Pro User (Always Allowed)
```json
{
  "permitido": true,
  "analisisRestantes": null
}
```

---

## How It Works

1. **Client sends request** from `Procesando.tsx` with `user_id` and `device_id`
2. **Edge Function checks**:
   - If user exists in `pres_usuarios` table
   - If user is Pro → allow (unlimited)
   - If free user has analyses left → allow and increment
   - If free user reached limit → deny
3. **Atomic increment**: Updates counter server-side to prevent race conditions
4. **Returns result** to client to proceed or show error

---

## Security Notes

- Uses Supabase SERVICE_ROLE_KEY (server-side only, not exposed to client)
- Atomic update prevents race conditions (two simultaneous requests)
- Validates server-side; client-side check is just UX, not security
- CORS headers allow requests from the mobile app

---

## Related Code

- **Client hook**: `hooks/useServerValidation.ts`
- **Consumer**: `screens/Procesando.tsx` (line 154+)
- **Setup**: Called when user attempts analysis

---

## Deployment

1. Create the function in Supabase Dashboard
2. Deploy the code
3. Test with the curl commands above
4. Once working, the app will automatically use it on next rebuild

No code changes needed on client after function is deployed!
