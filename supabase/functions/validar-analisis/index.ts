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
      .select('id, es_pro, analisis_gratis_usados')
      .or(`device_id.eq.${device_id},user_id.eq.${user_id}`)
      .single()

    if (errorUsuario && errorUsuario.code !== 'PGRST116') {
      console.error('Error fetching usuario:', errorUsuario)
      throw errorUsuario
    }

    const MAX_GRATIS = 3

    // If no record, create one
    if (!usuario) {
      const { data: newRecord, error: insertError } = await supabase
        .from('pres_usuarios')
        .insert({
          device_id,
          user_id,
          es_pro: false,
          analisis_gratis_usados: 1,
        })
        .select()
        .single()

      if (insertError) {
        console.error('Error creating usuario:', insertError)
        throw insertError
      }

      return new Response(
        JSON.stringify({
          permitido: true,
          analisisRestantes: MAX_GRATIS - 1,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is pro
    if (usuario.es_pro) {
      return new Response(
        JSON.stringify({
          permitido: true,
          analisisRestantes: null,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if free user has analyses left
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
      .eq('id', usuario.id)

    if (updateError) {
      console.error('Error updating usuario:', updateError)
      throw updateError
    }

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
