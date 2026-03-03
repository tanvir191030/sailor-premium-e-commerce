import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/currency";
import { FileDown, Search, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { generateInvoiceHTML } from "@/lib/invoiceTemplate";

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

const AdminOrders = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
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

  const deleteOrderMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("orders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast({ title: "অর্ডার ডিলিট হয়েছে" });
      setDeleteTarget(null);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleGenerateInvoice = (order: any) => {
    const items = Array.isArray(order.cart_items) ? order.cart_items : [];
    const deliveryCharge = order.delivery_charge ?? 0;
    const subtotal = order.total - deliveryCharge;

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
    });

    const win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); }
  };

  const filtered = orders.filter((o: any) => {
    const matchesSearch = o.customer_name.toLowerCase().includes(search.toLowerCase()) || o.phone.includes(search) || o.id.toLowerCase().includes(search.toLowerCase());
    return (statusFilter === "all" || o.status === statusFilter) && matchesSearch;
  });
  const totalFiltered = filtered.reduce((s, o) => s + Number(o.total), 0);

  return (
    <div className="space-y-5">
      <span className="px-3 py-1.5 bg-card rounded-lg border border-border text-muted-foreground text-sm inline-block">
        {filtered.length} টি অর্ডার · মোট {formatPrice(totalFiltered)}
      </span>

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
        {filtered.map((o: any) => (
          <div key={o.id} className="bg-card p-4 rounded-xl shadow-sm border border-border">
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
            {o.payment_method && <p className="text-xs text-muted-foreground mb-3">💳 {o.payment_method} {o.transaction_id ? `· TxnID: ${o.transaction_id}` : ""}</p>}
            <div className="flex flex-col md:flex-row gap-2 items-stretch md:items-center">
              <select
                value={o.status || "pending"}
                onChange={(e) => updateStatus.mutate({ id: o.id, status: e.target.value })}
                className="px-3 py-1.5 border border-border rounded-lg text-xs bg-card text-foreground focus:outline-none cursor-pointer"
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
              <input placeholder="কুরিয়ার ট্র্যাকিং ID" defaultValue={o.courier_tracking_id || ""} onBlur={(e) => { if (e.target.value !== (o.courier_tracking_id || "")) updateTracking.mutate({ id: o.id, courier_tracking_id: e.target.value }); }} className="px-3 py-1.5 border border-border rounded-lg text-xs focus:outline-none flex-1 bg-transparent text-foreground placeholder:text-muted-foreground" />
              <button onClick={() => handleGenerateInvoice(o)} className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary hover:bg-muted rounded-lg text-xs font-medium transition-colors text-foreground">
                <FileDown size={13} /> ইনভয়েস
              </button>
              <button onClick={() => setDeleteTarget(o)} className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-destructive/10 text-destructive rounded-lg text-xs font-medium transition-colors">
                <Trash2 size={13} /> ডিলিট
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="bg-card p-8 rounded-xl shadow-sm text-center text-muted-foreground text-sm border border-border">কোনো অর্ডার পাওয়া যায়নি</div>}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-sm p-6 border border-border text-center">
            <Trash2 size={32} className="mx-auto mb-3 text-destructive" />
            <h3 className="font-serif text-lg mb-2 text-foreground">অর্ডার ডিলিট করুন</h3>
            <p className="text-sm text-muted-foreground mb-1">#{deleteTarget.id.slice(0, 8)} · {deleteTarget.customer_name}</p>
            <p className="text-xs text-muted-foreground mb-6">এই অর্ডার স্থায়ীভাবে মুছে ফেলা হবে।</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteTarget(null)} className="px-5 py-2 border border-border rounded-full text-sm font-medium text-foreground hover:bg-secondary transition-colors">বাতিল</button>
              <button onClick={() => deleteOrderMutation.mutate(deleteTarget.id)} disabled={deleteOrderMutation.isPending} className="px-5 py-2 bg-destructive text-destructive-foreground rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                {deleteOrderMutation.isPending ? "ডিলিট হচ্ছে..." : "ডিলিট করুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
