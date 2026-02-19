import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/currency";
import { FileDown, Search, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";

const statusColors: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  processing: "bg-blue-50 text-blue-700",
  shipped: "bg-purple-50 text-purple-700",
  delivered: "bg-emerald-50 text-emerald-700",
  refunded: "bg-red-50 text-red-700",
  returned: "bg-gray-100 text-gray-700",
};

const AdminOrders = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast({ title: "অর্ডার স্ট্যাটাস আপডেট হয়েছে" });
    },
  });

  const updateTracking = useMutation({
    mutationFn: async ({ id, courier_tracking_id }: { id: string; courier_tracking_id: string }) => {
      const { error } = await supabase.from("orders").update({ courier_tracking_id }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast({ title: "ট্র্যাকিং ID আপডেট হয়েছে" });
    },
  });

  const generateInvoice = (order: any) => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text("SAILOR", 20, 25);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text("Invoice / Memo", 20, 33);
    doc.line(20, 36, 190, 36);

    doc.setTextColor(0);
    doc.setFontSize(10);
    doc.text(`Order ID: #${order.id.slice(0, 8)}`, 20, 45);
    doc.text(`Date: ${new Date(order.created_at).toLocaleDateString("en-GB")}`, 20, 52);
    doc.text(`Status: ${(order.status || "pending").toUpperCase()}`, 130, 45);
    if (order.payment_method) doc.text(`Payment: ${order.payment_method}`, 130, 52);

    doc.setFontSize(11);
    doc.text("Customer Details:", 20, 65);
    doc.setFontSize(9);
    doc.text(`Name: ${order.customer_name}`, 25, 73);
    doc.text(`Phone: ${order.phone}`, 25, 80);
    doc.text(`Address: ${order.address}`, 25, 87);

    // Items table header
    let y = 100;
    doc.setFontSize(9);
    doc.setFillColor(245, 245, 245);
    doc.rect(20, y - 5, 170, 10, "F");
    doc.text("Item", 25, y + 2);
    doc.text("Qty", 120, y + 2);
    doc.text("Price", 145, y + 2);
    doc.text("Total", 170, y + 2);
    y += 12;

    const items = Array.isArray(order.cart_items) ? order.cart_items : [];
    items.forEach((item: any) => {
      doc.text(String(item.name || "Item").substring(0, 40), 25, y);
      doc.text(String(item.quantity || 1), 123, y);
      doc.text(`BDT ${item.price || 0}`, 145, y);
      doc.text(`BDT ${(item.price || 0) * (item.quantity || 1)}`, 170, y);
      y += 8;
    });

    doc.line(20, y, 190, y);
    y += 8;
    doc.setFontSize(12);
    doc.text(`Total: BDT ${order.total}`, 140, y);

    if (order.courier_tracking_id) {
      y += 12;
      doc.setFontSize(9);
      doc.text(`Courier Tracking: ${order.courier_tracking_id}`, 20, y);
    }

    doc.save(`invoice-${order.id.slice(0, 8)}.pdf`);
  };

  const filtered = orders.filter((o: any) => {
    const matchesSearch =
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      o.phone.includes(search) ||
      o.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalFiltered = filtered.reduce((s, o) => s + Number(o.total), 0);

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="flex flex-wrap gap-3 text-sm">
        <span className="px-3 py-1.5 bg-white rounded-lg border border-[hsl(0,0%,90%)] text-[hsl(0,0%,40%)]">
          {filtered.length} টি অর্ডার · মোট {formatPrice(totalFiltered)}
        </span>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[hsl(0,0%,60%)]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="অর্ডার, নাম বা ফোন খুঁজুন..." className="w-full pl-9 pr-4 py-2.5 bg-white border border-[hsl(0,0%,88%)] rounded-lg text-sm focus:outline-none focus:border-[hsl(0,0%,70%)]" />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {["all", "pending", "processing", "shipped", "delivered", "refunded", "returned"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-full text-xs capitalize font-medium transition-colors ${statusFilter === s ? "bg-[hsl(160,84%,20%)] text-white" : "bg-white border border-[hsl(0,0%,88%)] text-[hsl(0,0%,50%)] hover:bg-[hsl(0,0%,96%)]"}`}>
              {s === "all" ? "সব" : s}
            </button>
          ))}
        </div>
      </div>

      {/* Orders */}
      <div className="space-y-3">
        {filtered.map((o: any) => (
          <div key={o.id} className="bg-white p-4 rounded-xl shadow-sm border border-[hsl(0,0%,92%)]">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
              <div>
                <p className="font-medium text-sm">#{o.id.slice(0, 8)} · {o.customer_name}</p>
                <p className="text-xs text-[hsl(0,0%,50%)]">📞 {o.phone} · 📅 {new Date(o.created_at).toLocaleDateString("bn-BD")}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColors[o.status || "pending"]}`}>
                  {o.status || "pending"}
                </span>
                <span className="font-bold text-sm">{formatPrice(o.total)}</span>
              </div>
            </div>

            {/* Items preview */}
            <div className="text-xs text-[hsl(0,0%,50%)] mb-2">
              {Array.isArray(o.cart_items) && o.cart_items.slice(0, 3).map((item: any, i: number) => (
                <span key={i}>{item.name} x{item.quantity || 1}{i < Math.min(o.cart_items.length, 3) - 1 ? ", " : ""}</span>
              ))}
              {Array.isArray(o.cart_items) && o.cart_items.length > 3 && <span> +{o.cart_items.length - 3} আরও</span>}
            </div>

            <p className="text-xs text-[hsl(0,0%,50%)] mb-3">📍 {o.address}</p>
            {o.payment_method && <p className="text-xs text-[hsl(0,0%,50%)] mb-3">💳 {o.payment_method} {o.transaction_id ? `· TxnID: ${o.transaction_id}` : ""}</p>}

            <div className="flex flex-col md:flex-row gap-2 items-stretch md:items-center">
              <select
                value={o.status || "pending"}
                onChange={(e) => updateStatus.mutate({ id: o.id, status: e.target.value })}
                className="px-3 py-1.5 border border-[hsl(0,0%,88%)] rounded-lg text-xs bg-white focus:outline-none"
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="refunded">Refunded</option>
                <option value="returned">Returned</option>
              </select>
              <input
                placeholder="কুরিয়ার ট্র্যাকিং ID"
                defaultValue={o.courier_tracking_id || ""}
                onBlur={(e) => {
                  if (e.target.value !== (o.courier_tracking_id || "")) {
                    updateTracking.mutate({ id: o.id, courier_tracking_id: e.target.value });
                  }
                }}
                className="px-3 py-1.5 border border-[hsl(0,0%,88%)] rounded-lg text-xs focus:outline-none flex-1"
              />
              <button onClick={() => generateInvoice(o)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[hsl(0,0%,96%)] hover:bg-[hsl(0,0%,92%)] rounded-lg text-xs font-medium transition-colors">
                <FileDown size={13} /> ইনভয়েস
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="bg-white p-8 rounded-xl shadow-sm text-center text-[hsl(0,0%,50%)] text-sm border border-[hsl(0,0%,92%)]">কোনো অর্ডার পাওয়া যায়নি</div>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;
