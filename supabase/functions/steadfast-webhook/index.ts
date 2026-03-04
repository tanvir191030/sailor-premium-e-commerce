import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const toJson = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

/**
 * Steadfast Webhook Receiver
 * 
 * Steadfast sends POST requests with delivery status updates.
 * Expected payload fields: consignment_id, status, invoice, tracking_code
 * 
 * Steadfast statuses:
 *   pending, delivered_approval_pending, partial_delivered_approval_pending,
 *   cancelled_approval_pending, unknown_approval_pending, delivered, partial_delivered,
 *   cancelled, unknown, hold, in_review, expired
 */

const STATUS_MAP: Record<string, string> = {
  "in_review": "processing",
  "pending": "shipped",
  "hold": "shipped",
  "delivered_approval_pending": "delivered",
  "delivered": "delivered",
  "partial_delivered": "delivered",
  "partial_delivered_approval_pending": "delivered",
  "cancelled_approval_pending": "returned",
  "cancelled": "returned",
  "unknown_approval_pending": "returned",
  "unknown": "returned",
  "expired": "returned",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only accept POST
  if (req.method !== "POST") {
    return toJson({ error: "Method not allowed" }, 405);
  }

  // Verify Bearer token
  const WEBHOOK_TOKEN = Deno.env.get("STEADFAST_WEBHOOK_TOKEN");
  if (!WEBHOOK_TOKEN) {
    console.error("STEADFAST_WEBHOOK_TOKEN not configured");
    return toJson({ error: "Webhook not configured" }, 500);
  }

  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (!token || token !== WEBHOOK_TOKEN) {
    console.error("Webhook auth failed. Received token:", token ? "***" + token.slice(-4) : "(empty)");
    return toJson({ error: "Unauthorized" }, 401);
  }

  try {
    const body = await req.json();
    console.log("Steadfast webhook received:", JSON.stringify(body));

    const consignmentId = String(body.consignment_id || body.consignment?.consignment_id || "").trim();
    const steadfastStatus = String(body.status || body.delivery_status || "").trim().toLowerCase();

    if (!consignmentId) {
      console.error("Missing consignment_id in webhook payload");
      return toJson({ error: "Missing consignment_id" }, 400);
    }

    const mappedStatus = STATUS_MAP[steadfastStatus];
    if (!mappedStatus) {
      console.log(`Unknown Steadfast status: "${steadfastStatus}" for consignment ${consignmentId}. Ignoring.`);
      return toJson({ success: true, message: "Status not mapped, ignored" });
    }

    // Update order in database
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data, error } = await supabase
      .from("orders")
      .update({ status: mappedStatus })
      .eq("courier_tracking_id", consignmentId)
      .select("id, status");

    if (error) {
      console.error("DB update error:", error.message);
      return toJson({ error: "Database update failed" }, 500);
    }

    if (!data || data.length === 0) {
      console.warn(`No order found with courier_tracking_id: ${consignmentId}`);
      return toJson({ success: false, message: "Order not found" }, 404);
    }

    console.log(`Order ${data[0].id} updated to "${mappedStatus}" (from Steadfast: "${steadfastStatus}")`);
    return toJson({ success: true, order_id: data[0].id, new_status: mappedStatus });

  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook error:", msg);
    return toJson({ error: msg }, 500);
  }
});
