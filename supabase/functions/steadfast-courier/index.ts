import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const STEADFAST_BASES = [
  "https://portal.steadfast.com.bd/api/v1",
  "https://portal.packzy.com/api/v1",
];

const toJson = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const STEADFAST_API_KEY = Deno.env.get("STEADFAST_API_KEY");
  const STEADFAST_SECRET_KEY = Deno.env.get("STEADFAST_SECRET_KEY");

  if (!STEADFAST_API_KEY || !STEADFAST_SECRET_KEY) {
    console.error("Missing Steadfast credentials");
    return toJson({ error: "Steadfast API credentials not configured" }, 500);
  }

  const steadfastHeaders = {
    "Api-Key": STEADFAST_API_KEY,
    "Secret-Key": STEADFAST_SECRET_KEY,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  try {
    const { action, ...params } = await req.json();

    if (action === "create_order") {
      const { order_id, recipient_name, recipient_phone, recipient_address, district, cod_amount, note } = params;

      const cleanPhone = String(recipient_phone || "").replace(/[^0-9]/g, "");
      if (!/^\d{11}$/.test(cleanPhone)) {
        console.error("Invalid phone number:", recipient_phone, "->", cleanPhone);
        return toJson({ error: "Invalid customer phone number. Must be exactly 11 digits." }, 400);
      }

      const name = String(recipient_name || "").trim().slice(0, 100);
      if (!name) return toJson({ error: "Recipient name is required." }, 400);

      const rawAddress = String(recipient_address || "").trim();
      const districtText = String(district || "").trim();
      const mappedAddress = districtText && !rawAddress.toLowerCase().includes(districtText.toLowerCase())
        ? `${rawAddress}, ${districtText}`
        : rawAddress;
      const address = mappedAddress.slice(0, 250);
      if (!address) return toJson({ error: "Recipient address is required." }, 400);

      const amount = Number(cod_amount);
      if (!Number.isFinite(amount) || amount < 0) {
        console.error("Invalid COD amount:", cod_amount);
        return toJson({ error: "Invalid COD amount." }, 400);
      }

      const invoiceBase = String(note || order_id || "").trim();
      const invoice = invoiceBase.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40) || `INV${Date.now().toString().slice(-10)}`;

      const body = {
        invoice,
        recipient_name: name,
        recipient_phone: cleanPhone,
        recipient_address: address,
        cod_amount: Math.round(amount),
        note: String(note || "").slice(0, 120),
      };

      console.log("Sending to Steadfast:", JSON.stringify(body));

      let lastError: { status: number; raw: string; message?: string; errors?: unknown; base: string } | null = null;

      for (const base of STEADFAST_BASES) {
        const url = `${base}/create_order`;
        const res = await fetch(url, {
          method: "POST",
          headers: steadfastHeaders,
          body: JSON.stringify(body),
        });

        const raw = await res.text();
        console.log(`Steadfast raw response [${base}]:`, res.status, raw);

        let parsed: any = null;
        try {
          parsed = raw ? JSON.parse(raw) : null;
        } catch {
          parsed = null;
        }

        if (res.ok && parsed?.status === 200 && parsed?.consignment?.consignment_id) {
          const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
          );

          await supabase
            .from("orders")
            .update({
              courier_tracking_id: String(parsed.consignment.consignment_id),
              status: "processing",
            })
            .eq("id", order_id);

          return toJson({ success: true, consignment: parsed.consignment });
        }

        lastError = {
          status: res.status,
          raw,
          message: parsed?.message,
          errors: parsed?.errors,
          base,
        };

        if (res.status !== 500) break;
      }

      console.error("Steadfast API error:", lastError);

      // Friendly message for inactive account (401)
      if (lastError?.status === 401) {
        const raw = (lastError?.raw || "").toLowerCase();
        const isPending = raw.includes("not active") || raw.includes("pending");
        return toJson(
          { error: isPending ? "Steadfast অ্যাকাউন্ট এখনো অ্যাক্টিভ হয়নি। প্রোভাইডারের সাথে যোগাযোগ করুন।" : "Steadfast API credentials অবৈধ।" },
          401,
        );
      }

      return toJson(
        {
          error: lastError?.message || "Steadfast API error",
          status_code: lastError?.status,
          provider_response: (lastError?.raw || "").slice(0, 500),
          provider_errors: lastError?.errors || null,
          endpoint: lastError?.base || null,
        },
        400,
      );
    }

    if (action === "check_status") {
      const { consignment_id } = params;
      if (!consignment_id) return toJson({ error: "consignment_id is required" }, 400);

      const res = await fetch(`${STEADFAST_BASES[0]}/status_by_cid/${consignment_id}`, {
        headers: steadfastHeaders,
      });

      const raw = await res.text();
      let data: any = null;
      try {
        data = raw ? JSON.parse(raw) : null;
      } catch {
        console.error("Steadfast status non-JSON:", raw);
      }

      if (res.ok && data) return toJson({ success: true, delivery_status: data.delivery_status });

      console.error("Steadfast status check error:", res.status, raw);
      return toJson({ error: "Could not fetch status", status_code: res.status, provider_response: raw.slice(0, 500) }, 400);
    }

    return toJson({ error: "Unknown action" }, 400);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Edge function error:", msg);
    return toJson({ error: msg }, 500);
  }
});
