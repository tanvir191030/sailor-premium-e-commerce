import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/currency";
import { FileDown, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import jsPDF from "jspdf";

const statusColors: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700",
  processing: "bg-blue-50 text-blue-700",
  shipped: "bg-purple-50 text-purple-700",
  delivered: "bg-emerald-50 text-emerald-700",
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
      toast({ title: "Order status updated" });
    },
  });

  const updateTracking = useMutation({
    mutationFn: async ({ id, courier_tracking_id }: { id: string; courier_tracking_id: string }) => {
      const { error } = await supabase.from("orders").update({ courier_tracking_id }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast({ title: "Tracking ID updated" });
    },
  });

  const generateInvoice = (order: any) => {
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text("SAILOR", 20, 25);
    doc.setFontSize(10);
    doc.text("Invoice", 20, 35);
    doc.text(`Order: ${order.id.slice(0, 8)}`, 20, 45);
    doc.text(`Date: ${new Date(order.created_at).toLocaleDateString()}`, 20, 52);
    doc.text(`Customer: ${order.customer_name}`, 20, 62);
    doc.text(`Phone: ${order.phone}`, 20, 69);
    doc.text(`Address: ${order.address}`, 20, 76);

    doc.setFontSize(11);
    doc.text("Items:", 20, 90);
    let y = 100;
    const items = Array.isArray(order.cart_items) ? order.cart_items : [];
    items.forEach((item: any, i: number) => {
      doc.setFontSize(9);
      doc.text(`${i + 1}. ${item.name || "Item"} x${item.quantity || 1} - BDT ${item.price || 0}`, 25, y);
      y += 8;
    });

    doc.setFontSize(12);
    doc.text(`Total: BDT ${order.total}`, 20, y + 10);
    doc.save(`invoice-${order.id.slice(0, 8)}.pdf`);
  };

  const filtered = orders.filter((o: any) => {
    const matchesSearch =
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      o.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search orders..." className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none" />
        </div>
        <div className="flex gap-2">
          {["all", "pending", "processing", "shipped", "delivered"].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 rounded-full text-xs capitalize font-medium transition-colors ${statusFilter === s ? "bg-[hsl(160,84%,20%)] text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Orders */}
      <div className="space-y-3">
        {filtered.map((o: any) => (
          <div key={o.id} className="bg-white p-4 rounded-xl shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
              <div>
                <p className="font-medium text-sm">#{o.id.slice(0, 8)} · {o.customer_name}</p>
                <p className="text-xs text-gray-500">{o.phone} · {new Date(o.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColors[o.status || "pending"]}`}>
                  {o.status || "pending"}
                </span>
                <span className="font-semibold text-sm">{formatPrice(o.total)}</span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-3">📍 {o.address}</p>

            <div className="flex flex-col md:flex-row gap-2 items-stretch md:items-center">
              <select
                value={o.status || "pending"}
                onChange={(e) => updateStatus.mutate({ id: o.id, status: e.target.value })}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none"
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
              </select>
              <input
                placeholder="Courier tracking ID"
                defaultValue={o.courier_tracking_id || ""}
                onBlur={(e) => {
                  if (e.target.value !== (o.courier_tracking_id || "")) {
                    updateTracking.mutate({ id: o.id, courier_tracking_id: e.target.value });
                  }
                }}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none flex-1"
              />
              <button onClick={() => generateInvoice(o)} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium transition-colors">
                <FileDown size={13} /> Invoice
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="bg-white p-8 rounded-xl shadow-md text-center text-gray-400 text-sm">No orders found</div>
        )}
      </div>
    </div>
  );
};

export default AdminOrders;
