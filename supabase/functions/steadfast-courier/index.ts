import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const STEADFAST_BASE = "https://portal.steadfast.com.bd/api/v1";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const STEADFAST_API_KEY = Deno.env.get("STEADFAST_API_KEY");
  const STEADFAST_SECRET_KEY = Deno.env.get("STEADFAST_SECRET_KEY");

  if (!STEADFAST_API_KEY || !STEADFAST_SECRET_KEY) {
    console.error("Missing Steadfast credentials");
    return new Response(
      JSON.stringify({ error: "Steadfast API credentials not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const steadfastHeaders = {
    "Api-Key": STEADFAST_API_KEY,
    "Secret-Key": STEADFAST_SECRET_KEY,
    "Content-Type": "application/json",
    "Accept": "application/json",
  };

  try {
    const { action, ...params } = await req.json();

    if (action === "create_order") {
      const { order_id, recipient_name, recipient_phone, recipient_address, cod_amount, note } = params;

      // Validate phone: must be 11 digits
      const cleanPhone = (recipient_phone || "").replace(/[^0-9]/g, "");
      if (cleanPhone.length !== 11) {
        console.error("Invalid phone number:", recipient_phone, "-> cleaned:", cleanPhone);
        return new Response(
          JSON.stringify({ error: `Invalid phone number. Must be exactly 11 digits. Got: ${cleanPhone.length} digits.` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!recipient_name || !recipient_address) {
        console.error("Missing required fields:", { recipient_name, recipient_address });
        return new Response(
          JSON.stringify({ error: "Missing recipient name or address." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!cod_amount || Number(cod_amount) <= 0) {
        console.error("Invalid COD amount:", cod_amount);
        return new Response(
          JSON.stringify({ error: "Invalid COD amount." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const body = {
        invoice: order_id,
        recipient_name,
        recipient_phone: cleanPhone,
        recipient_address,
        cod_amount: Number(cod_amount),
        note: note || "",
      };

      console.log("Sending to Steadfast:", JSON.stringify(body));

      const res = await fetch(`${STEADFAST_BASE}/create_order`, {
        method: "POST",
        headers: steadfastHeaders,
        body: JSON.stringify(body),
      });

      const resText = await res.text();
      console.log("Steadfast raw response:", res.status, resText);

      let data: any;
      try {
        data = JSON.parse(resText);
      } catch {
        console.error("Steadfast returned non-JSON:", resText.substring(0, 500));
        return new Response(JSON.stringify({ error: "Steadfast API returned invalid response. Check API credentials." }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (res.ok && data.status === 200) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const consignment = data.consignment;
        await supabase
          .from("orders")
          .update({
            courier_tracking_id: String(consignment.consignment_id),
            status: "processing",
          })
          .eq("id", order_id);

        return new Response(JSON.stringify({ success: true, consignment }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.error("Steadfast API error:", data.message, data.errors);
      return new Response(JSON.stringify({ error: data.message || "Steadfast API error", errors: data.errors }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "check_status") {
      const { consignment_id } = params;

      const res = await fetch(
        `${STEADFAST_BASE}/status_by_cid/${consignment_id}`,
        { headers: steadfastHeaders }
      );

      const data = await res.json();

      if (res.ok) {
        return new Response(JSON.stringify({ success: true, delivery_status: data.delivery_status }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.error("Steadfast status check error:", JSON.stringify(data));
      return new Response(JSON.stringify({ error: "Could not fetch status" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Edge function error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
