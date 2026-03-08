import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/currency";
import { FileDown, Search, Trash2, Send, ShieldCheck, CheckCircle2, XCircle, ShieldX, RotateCcw, Archive, Undo2, Printer } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { generateInvoiceHTML } from "@/lib/invoiceTemplate";
import { openBulkInvoicesInNewTab } from "@/lib/bulkInvoicePdf";

const statusColors: Record<string, string> = {
  pending:    "bg-amber-500/10 text-amber-500",
  paid:       "bg-sky-500/10 text-sky-600",
  processing: "bg-blue-500/10 text-blue-500",
  shipped:    "bg-purple-500/10 text-purple-500",
  delivered:  "bg-emerald-500/10 text-emerald-500",
  cancelled:  "bg-rose-500/10 text-rose-500",
  refunded:   "bg-red-500/10 text-red-500",
  returned:   "bg-muted text-muted-foreground",
};

const REJECTION_REASONS = [
  "Invalid TxnID",
  "Amount Mismatch",
  "Duplicate Transaction",
  "Fraudulent Payment",
  "Wrong Sender Number",
  "Other",
];

const AdminOrders = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [rejectTarget, setRejectTarget] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("Invalid TxnID");
  const [rejectCustomReason, setRejectCustomReason] = useState("");
  const [sendingOrderId, setSendingOrderId] = useState<string | null>(null);
  const [courierTarget, setCourierTarget] = useState<any>(null);
  const [permanentDeleteTarget, setPermanentDeleteTarget] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"orders" | "trash">("orders");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { settings: siteSettings } = useSiteSettings();

  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const activeOrders = orders.filter((o: any) => !(o as any).is_deleted);
  const trashedOrders = orders.filter((o: any) => (o as any).is_deleted);

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-orders"] }); toast({ title: "অর্ডার স্ট্যাটাস আপডেট হয়েছে" }); },
  });

  const updateTracking = useMutation({
    mutationFn: async ({ id, courier_tracking_id }: { id: string; courier_tracking_id: string }) => {
      const { error } = await supabase.from("orders").update({ courier_tracking_id }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-orders"] }); toast({ title: "ট্র্যাকিং ID আপডেট হয়েছে" }); },
  });

  const verifyPayment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("orders").update({ is_payment_verified: true, status: "paid", payment_rejection_reason: null } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast({ title: "✅ পেমেন্ট ভেরিফাই হয়েছে", description: "অর্ডার এখন প্রসেস করা যাবে।" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const rejectPayment = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const { error } = await supabase.from("orders").update({
        is_payment_verified: false,
        status: "cancelled",
        payment_rejection_reason: reason,
      } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast({ title: "❌ পেমেন্ট বাতিল হয়েছে", description: "অর্ডার ক্যান্সেল করা হয়েছে।" });
      setRejectTarget(null);
      setRejectReason("Invalid TxnID");
      setRejectCustomReason("");
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  // Soft delete — move to trash
  const softDeleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("orders").update({ is_deleted: true } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast({ title: "🗑️ অর্ডার ট্র্যাশে সরানো হয়েছে" });
      setDeleteTarget(null);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  // Restore from trash
  const restoreMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("orders").update({ is_deleted: false } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast({ title: "✅ অর্ডার সফলভাবে পুনরুদ্ধার হয়েছে!", description: "অর্ডার মূল তালিকায় ফিরে এসেছে।" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  // Permanent delete
  const permanentDeleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("orders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast({ title: "অর্ডার স্থায়ীভাবে মুছে ফেলা হয়েছে" });
      setPermanentDeleteTarget(null);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  // Back to Pending — for cancelled/rejected orders
  const backToPending = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("orders").update({
        status: "pending",
        is_payment_verified: false,
        payment_rejection_reason: null,
      } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast({ title: "✅ অর্ডারটি আবার পেন্ডিং লিস্টে পাঠানো হয়েছে!" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const sendToCourier = useMutation({
    mutationFn: async (order: any) => {
      setSendingOrderId(order.id);
      const res = await supabase.functions.invoke("steadfast-courier", {
        body: {
          action: "create_order",
          order_id: order.id,
          recipient_name: order.customer_name,
          recipient_phone: order.phone,
          recipient_address: order.address,
          district: order.district || "",
          cod_amount: order.total,
          note: order.tracking_id || "",
        },
      });
      if (res.error) throw new Error(res.error.message);
      if (res.data?.error) throw new Error(res.data.error);
      return res.data;
    },
    onSuccess: (data) => {
      setSendingOrderId(null);
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast({ title: "কুরিয়ারে পাঠানো হয়েছে", description: `Consignment ID: ${data.consignment?.consignment_id}` });
    },
    onError: (e: any) => {
      setSendingOrderId(null);
      const msg = e.message || "";
      const isPending = msg.includes("অ্যাক্টিভ") || msg.includes("not active") || msg.includes("Pending");
      toast({
        title: isPending ? "⚠️ Steadfast অ্যাকাউন্ট Pending" : "কুরিয়ারে পাঠাতে সমস্যা",
        description: isPending ? "আপনার Steadfast অ্যাকাউন্ট এখনো অ্যাক্টিভ হয়নি। প্রোভাইডারের সাথে যোগাযোগ করুন।" : msg,
        variant: "destructive",
      });
    },
  });

  const handleGenerateInvoice = (order: any) => {
    const items = Array.isArray(order.cart_items) ? order.cart_items : [];
    const deliveryCharge = order.delivery_charge ?? 0;
    const discountAmount = order.discount_amount ?? 0;
    const subtotal = order.total + discountAmount - deliveryCharge;

    const isCOD = order.payment_method === "Cash on Delivery";
    const hasAdvance = !isCOD && order.transaction_id;
    let paidAmount = 0;
    if (hasAdvance) {
      const dc = order.delivery_charge ?? 0;
      paidAmount = (dc > 0 && dc < order.total) ? dc : order.total;
    }

    const html = generateInvoiceHTML({
      storeName: siteSettings.store_name || "Modest Mart",
      websiteUrl: siteSettings.website_url || "",
      orderId: order.id,
      date: new Date(order.created_at).toLocaleDateString("en-GB"),
      status: (order.status || "pending").toUpperCase(),
      paymentMethod: order.payment_method || "Cash on Delivery",
      transactionId: order.transaction_id || "",
      customerName: order.customer_name,
      phone: order.phone,
      address: order.address,
      items,
      subtotal,
      deliveryCharge,
      total: order.total,
      courierTrackingId: order.courier_tracking_id || "",
      couponCode: order.coupon_code || "",
      discountAmount,
      paidAmount,
      isPaymentVerified: (order as any).is_payment_verified ?? false,
    });

    const win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); }
  };

  // Helpers
  const hasAdvancePayment = (o: any) =>
    o.payment_method && o.payment_method !== "Cash on Delivery" && o.transaction_id;

  const isPaymentRejected = (o: any) => !!(o as any).payment_rejection_reason;

  const needsVerification = (o: any) =>
    hasAdvancePayment(o) && !(o as any).is_payment_verified && !isPaymentRejected(o);

  const baseOrders = viewMode === "orders" ? activeOrders : trashedOrders;

  const filtered = baseOrders.filter((o: any) => {
    const matchesSearch = o.customer_name.toLowerCase().includes(search.toLowerCase()) || o.phone.includes(search) || o.id.toLowerCase().includes(search.toLowerCase());
    return (statusFilter === "all" || o.status === statusFilter) && matchesSearch;
  });
  const totalFiltered = filtered.reduce((s, o) => s + Number(o.total), 0);

  const handleRejectConfirm = () => {
    if (!rejectTarget) return;
    const reason = rejectReason === "Other" ? rejectCustomReason.trim() || "Other" : rejectReason;
    rejectPayment.mutate({ id: rejectTarget.id, reason });
  };

  return (
    <div className="space-y-5">
      {/* Tab switcher: Orders / Trash */}
      <div className="flex gap-2">
        <button
          onClick={() => setViewMode("orders")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === "orders" ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:bg-secondary"}`}
        >
          📦 অর্ডার সমূহ ({activeOrders.length})
        </button>
        <button
          onClick={() => setViewMode("trash")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === "trash" ? "bg-destructive text-destructive-foreground" : "bg-card border border-border text-muted-foreground hover:bg-secondary"}`}
        >
          <Archive size={14} /> ট্র্যাশ ({trashedOrders.length})
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <span className="px-3 py-1.5 bg-card rounded-lg border border-border text-muted-foreground text-sm">
          {filtered.length} টি অর্ডার · মোট {formatPrice(totalFiltered)}
        </span>
        {viewMode === "orders" && (
          <button
            onClick={() => {
              const verifiedToday = filtered.filter((o: any) => {
                const todayStr = new Date().toISOString().split("T")[0];
                return o.created_at?.startsWith(todayStr) && (o as any).is_payment_verified === true;
              });
              if (verifiedToday.length === 0) {
                toast({ title: "আজকে কোনো ভেরিফাইড অর্ডার নেই", variant: "destructive" });
                return;
              }
              openBulkInvoicesInNewTab(verifiedToday as any, siteSettings.store_name || "Modest Mart", siteSettings.website_url || "");
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors"
          >
            <Printer size={14} /> আজকের ভেরিফাইড ইনভয়েস
          </button>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="অর্ডার, নাম বা ফোন খুঁজুন..." className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm focus:outline-none text-foreground placeholder:text-muted-foreground" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {["all", "pending", "paid", "processing", "shipped", "delivered", "cancelled", "refunded", "returned"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-full text-xs capitalize font-medium transition-colors ${statusFilter === s ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:bg-secondary"}`}>
              {s === "all" ? "সব" : s === "pending" ? "Pending" : s === "paid" ? "Paid" : s === "processing" ? "Processing" : s === "shipped" ? "Shipped" : s === "delivered" ? "Delivered" : s === "cancelled" ? "Cancelled" : s === "refunded" ? "Refunded" : "Returned"}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((o: any) => {
          const awaitingVerification = needsVerification(o);
          const isVerified = hasAdvancePayment(o) && (o as any).is_payment_verified;
          const rejected = isPaymentRejected(o);

          return (
            <div key={o.id} className={`bg-card p-4 rounded-xl shadow-sm border ${awaitingVerification ? "border-amber-500/50" : rejected ? "border-destructive/50" : "border-border"}`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                <div>
                  <p className="font-medium text-sm text-foreground">#{o.id.slice(0, 8)} · {o.customer_name}</p>
                  <p className="text-xs text-muted-foreground">📞 {o.phone} · 📅 {new Date(o.created_at).toLocaleDateString("bn-BD")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColors[o.status || "pending"]}`}>{o.status || "pending"}</span>
                  <span className="font-bold text-sm text-foreground">{formatPrice(o.total)}</span>
                </div>
              </div>

              <div className="text-xs text-muted-foreground mb-2">
                {Array.isArray(o.cart_items) && o.cart_items.slice(0, 3).map((item: any, i: number) => (
                  <span key={i}>{item.name} x{item.quantity || 1}{i < Math.min(o.cart_items.length, 3) - 1 ? ", " : ""}</span>
                ))}
                {Array.isArray(o.cart_items) && o.cart_items.length > 3 && <span> +{o.cart_items.length - 3} আরও</span>}
              </div>
              <p className="text-xs text-muted-foreground mb-3">📍 {o.address}</p>

              {o.payment_method && (
                <p className="text-xs text-muted-foreground mb-1">
                  💳 {o.payment_method} {o.transaction_id ? `· TxnID: ${o.transaction_id}` : ""}
                </p>
              )}

              {/* Payment status badges */}
              {isVerified && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded text-[11px] font-medium mb-3">
                  <CheckCircle2 size={12} /> পেমেন্ট ভেরিফাইড {o.delivery_charge > 0 && `(ডেলিভারি চার্জ: ${formatPrice(o.delivery_charge)})`}
                </span>
              )}
              {rejected && (
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-destructive/10 text-destructive rounded text-[11px] font-medium">
                    <XCircle size={12} /> পেমেন্ট বাতিল — {(o as any).payment_rejection_reason}
                  </span>
                </div>
              )}
              {/* Back to Pending button for cancelled or rejected orders */}
              {viewMode === "orders" && (o.status === "cancelled" || rejected) && (
                <div className="mb-3">
                  <button
                    onClick={() => backToPending.mutate(o.id)}
                    disabled={backToPending.isPending}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    <Undo2 size={13} /> {backToPending.isPending ? "প্রসেস হচ্ছে..." : "পেন্ডিং এ ফিরিয়ে নিন"}
                  </button>
                </div>
              )}
              {awaitingVerification && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded text-[11px] font-medium mb-3">
                  ⏳ পেমেন্ট ভেরিফিকেশন বাকি {o.delivery_charge > 0 && `(ডেলিভারি চার্জ: ${formatPrice(o.delivery_charge)})`}
                </span>
              )}
              {o.payment_method === "Cash on Delivery" && (
                <span className="inline-block px-2 py-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded text-[11px] font-medium mb-3">
                  ⏳ ক্যাশ অন ডেলিভারি — অগ্রিম পেমেন্ট নেই
                </span>
              )}

              {/* Verify/Reject buttons for unverified advance payments — only in orders view */}
              {viewMode === "orders" && awaitingVerification && (
                <div className="mb-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                  <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">
                    ⚠️ এই অর্ডারে অগ্রিম পেমেন্ট আছে। প্রসেস করার আগে পেমেন্ট ভেরিফাই করুন।
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => verifyPayment.mutate(o.id)}
                      disabled={verifyPayment.isPending}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      <ShieldCheck size={14} /> {verifyPayment.isPending ? "ভেরিফাই হচ্ছে..." : "পেমেন্ট ভেরিফাই করুন"}
                    </button>
                    <button
                      onClick={() => { setRejectTarget(o); setRejectReason("Invalid TxnID"); setRejectCustomReason(""); }}
                      className="flex items-center gap-1.5 px-4 py-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-lg text-xs font-medium transition-colors"
                    >
                      <ShieldX size={14} /> পেমেন্ট বাতিল করুন
                    </button>
                  </div>
                </div>
              )}

              {/* Actions row */}
              <div className="flex flex-col md:flex-row gap-2 items-stretch md:items-center">
                {viewMode === "orders" ? (
                  <>
                    <select
                      value={o.status || "pending"}
                      onChange={(e) => updateStatus.mutate({ id: o.id, status: e.target.value })}
                      disabled={awaitingVerification || rejected}
                      className={`px-3 py-1.5 border border-border rounded-lg text-xs bg-card text-foreground focus:outline-none ${(awaitingVerification || rejected) ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <option value="pending">⏳ Pending</option>
                      <option value="paid">💳 Paid</option>
                      <option value="processing">🔄 Processing</option>
                      <option value="shipped">🚚 Shipped</option>
                      <option value="delivered">✅ Delivered</option>
                      <option value="cancelled">❌ Cancelled</option>
                      <option value="refunded">↩️ Refunded</option>
                      <option value="returned">📦 Returned</option>
                    </select>
                    <input
                      placeholder="কুরিয়ার ট্র্যাকিং ID"
                      defaultValue={o.courier_tracking_id || ""}
                      onBlur={(e) => { if (e.target.value !== (o.courier_tracking_id || "")) updateTracking.mutate({ id: o.id, courier_tracking_id: e.target.value }); }}
                      disabled={awaitingVerification || rejected}
                      className={`px-3 py-1.5 border border-border rounded-lg text-xs focus:outline-none flex-1 bg-transparent text-foreground placeholder:text-muted-foreground ${(awaitingVerification || rejected) ? "opacity-50 cursor-not-allowed" : ""}`}
                    />
                    <button onClick={() => handleGenerateInvoice(o)} className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary hover:bg-muted rounded-lg text-xs font-medium transition-colors text-foreground">
                      <FileDown size={13} /> ইনভয়েস
                    </button>
                    {!o.courier_tracking_id && !awaitingVerification && !rejected && (
                      <button
                        onClick={() => setCourierTarget(o)}
                        disabled={sendingOrderId === o.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                      >
                        <Send size={13} /> {sendingOrderId === o.id ? "পাঠানো হচ্ছে..." : "কুরিয়ারে পাঠান"}
                      </button>
                    )}
                    {o.courier_tracking_id && (
                      <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg text-xs font-medium">
                        ✅ CID: {o.courier_tracking_id}
                      </span>
                    )}
                    <button onClick={() => setDeleteTarget(o)} className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-destructive/10 text-destructive rounded-lg text-xs font-medium transition-colors">
                      <Trash2 size={13} /> ডিলিট
                    </button>
                  </>
                ) : (
                  /* Trash view actions */
                  <>
                    <button onClick={() => handleGenerateInvoice(o)} className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary hover:bg-muted rounded-lg text-xs font-medium transition-colors text-foreground">
                      <FileDown size={13} /> ইনভয়েস
                    </button>
                    <button
                      onClick={() => restoreMutation.mutate(o.id)}
                      disabled={restoreMutation.isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      <RotateCcw size={13} /> {restoreMutation.isPending ? "পুনরুদ্ধার হচ্ছে..." : "পুনরুদ্ধার করুন"}
                    </button>
                    <button
                      onClick={() => setPermanentDeleteTarget(o)}
                      className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-destructive/10 text-destructive rounded-lg text-xs font-medium transition-colors"
                    >
                      <Trash2 size={13} /> স্থায়ীভাবে মুছুন
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="bg-card p-8 rounded-xl shadow-sm text-center text-muted-foreground text-sm border border-border">
            {viewMode === "trash" ? "ট্র্যাশ খালি — কোনো ডিলিট করা অর্ডার নেই" : "কোনো অর্ডার পাওয়া যায়নি"}
          </div>
        )}
      </div>

      {/* Reject Payment Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-sm p-6 border border-border">
            <div className="text-center mb-4">
              <ShieldX size={32} className="mx-auto mb-3 text-destructive" />
              <h3 className="font-serif text-lg mb-1 text-foreground">পেমেন্ট বাতিল করুন</h3>
              <p className="text-sm text-muted-foreground">#{rejectTarget.id.slice(0, 8)} · {rejectTarget.customer_name}</p>
              {rejectTarget.transaction_id && (
                <p className="text-xs text-muted-foreground mt-1">TxnID: {rejectTarget.transaction_id}</p>
              )}
            </div>

            <div className="space-y-3 mb-6">
              <label className="text-sm font-medium text-foreground">বাতিলের কারণ নির্বাচন করুন:</label>
              <div className="space-y-2">
                {REJECTION_REASONS.map((reason) => (
                  <label key={reason} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="reject-reason"
                      value={reason}
                      checked={rejectReason === reason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      className="accent-destructive"
                    />
                    <span className="text-sm text-foreground">{reason}</span>
                  </label>
                ))}
              </div>
              {rejectReason === "Other" && (
                <input
                  value={rejectCustomReason}
                  onChange={(e) => setRejectCustomReason(e.target.value)}
                  placeholder="কারণ লিখুন..."
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
                />
              )}
            </div>

            <div className="flex gap-3 justify-center">
              <button onClick={() => setRejectTarget(null)} className="px-5 py-2 border border-border rounded-full text-sm font-medium text-foreground hover:bg-secondary transition-colors">
                বাতিল
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={rejectPayment.isPending || (rejectReason === "Other" && !rejectCustomReason.trim())}
                className="px-5 py-2 bg-destructive text-destructive-foreground rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {rejectPayment.isPending ? "প্রসেস হচ্ছে..." : "পেমেন্ট বাতিল করুন"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Courier Confirmation Modal */}
      {courierTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-sm p-6 border border-border text-center">
            <Send size={32} className="mx-auto mb-3 text-emerald-500" />
            <h3 className="font-serif text-lg mb-2 text-foreground">কুরিয়ারে পাঠান</h3>
            <p className="text-sm text-muted-foreground mb-1">#{courierTarget.id.slice(0, 8)} · {courierTarget.customer_name}</p>
            <p className="text-xs text-muted-foreground mb-1">📞 {courierTarget.phone}</p>
            <p className="text-xs text-muted-foreground mb-4">💰 {formatPrice(courierTarget.total)}</p>
            <p className="text-sm text-foreground mb-6">আপনি কি নিশ্চিত যে আপনি এই অর্ডারটি কুরিয়ারে পাঠাতে চান?</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setCourierTarget(null)} className="px-5 py-2 border border-border rounded-full text-sm font-medium text-foreground hover:bg-secondary transition-colors">বাতিল</button>
              <button
                onClick={() => { sendToCourier.mutate(courierTarget); setCourierTarget(null); }}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-sm font-medium transition-colors"
              >
                হ্যাঁ, পাঠান
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Soft Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-sm p-6 border border-border text-center">
            <Trash2 size={32} className="mx-auto mb-3 text-destructive" />
            <h3 className="font-serif text-lg mb-2 text-foreground">অর্ডার ট্র্যাশে সরান</h3>
            <p className="text-sm text-muted-foreground mb-1">#{deleteTarget.id.slice(0, 8)} · {deleteTarget.customer_name}</p>
            <p className="text-xs text-muted-foreground mb-6">অর্ডারটি ট্র্যাশে সরানো হবে। পরে পুনরুদ্ধার করা যাবে।</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteTarget(null)} className="px-5 py-2 border border-border rounded-full text-sm font-medium text-foreground hover:bg-secondary transition-colors">বাতিল</button>
              <button onClick={() => softDeleteMutation.mutate(deleteTarget.id)} disabled={softDeleteMutation.isPending} className="px-5 py-2 bg-destructive text-destructive-foreground rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                {softDeleteMutation.isPending ? "সরানো হচ্ছে..." : "ট্র্যাশে সরান"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Delete Confirmation Modal */}
      {permanentDeleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-sm p-6 border border-border text-center">
            <Trash2 size={32} className="mx-auto mb-3 text-destructive" />
            <h3 className="font-serif text-lg mb-2 text-foreground">স্থায়ীভাবে মুছে ফেলুন</h3>
            <p className="text-sm text-muted-foreground mb-1">#{permanentDeleteTarget.id.slice(0, 8)} · {permanentDeleteTarget.customer_name}</p>
            <p className="text-xs text-destructive mb-6">⚠️ এই অর্ডার স্থায়ীভাবে মুছে যাবে এবং আর পুনরুদ্ধার করা যাবে না!</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setPermanentDeleteTarget(null)} className="px-5 py-2 border border-border rounded-full text-sm font-medium text-foreground hover:bg-secondary transition-colors">বাতিল</button>
              <button onClick={() => permanentDeleteMutation.mutate(permanentDeleteTarget.id)} disabled={permanentDeleteMutation.isPending} className="px-5 py-2 bg-destructive text-destructive-foreground rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                {permanentDeleteMutation.isPending ? "মুছে ফেলা হচ্ছে..." : "স্থায়ীভাবে মুছুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
