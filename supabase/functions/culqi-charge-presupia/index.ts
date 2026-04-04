import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CULQI_SECRET_KEY = Deno.env.get("CULQI_SECRET_KEY_PRESUPIA") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  try {
    const { token, device_id, amount } = await req.json();

    if (!token || !device_id) {
      return new Response(JSON.stringify({ success: false, error: "Datos incompletos" }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        status: 400,
      });
    }

    // Cobrar con Culqi
    const culqiRes = await fetch("https://api.culqi.com/v2/charges", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${CULQI_SECRET_KEY}`,
      },
      body: JSON.stringify({
        amount: amount || 2990,
        currency_code: "PEN",
        description: "PresupIA Pro - 1 mes",
        source_id: token,
      }),
    });

    const culqiData = await culqiRes.json();

    if (culqiData.object === "error" || culqiData.outcome?.type === "decline") {
      return new Response(JSON.stringify({ success: false, error: culqiData.user_message || "Pago rechazado" }), {
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        status: 400,
      });
    }

    // Actualizar usuario en Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const fechaFin = new Date();
    fechaFin.setMonth(fechaFin.getMonth() + 1);

    await supabase.from("pres_usuarios").upsert({
      device_id,
      es_pro: true,
      fecha_inicio_pro: new Date().toISOString(),
      fecha_fin_pro: fechaFin.toISOString(),
    }, { onConflict: "device_id" });

    return new Response(JSON.stringify({ success: true, charge_id: culqiData.id }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      status: 200,
    });

  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      status: 500,
    });
  }
});
