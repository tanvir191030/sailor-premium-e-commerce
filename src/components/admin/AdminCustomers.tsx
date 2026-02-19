import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/currency";
import { Users, Phone, MapPin } from "lucide-react";

const AdminCustomers = () => {
  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Group by customer name + phone
  const customerMap = new Map<string, { name: string; phone: string; address: string; orders: any[]; totalSpent: number }>();
  orders.forEach((o: any) => {
    const key = `${o.customer_name}-${o.phone}`;
    if (!customerMap.has(key)) {
      customerMap.set(key, { name: o.customer_name, phone: o.phone, address: o.address, orders: [], totalSpent: 0 });
    }
    const c = customerMap.get(key)!;
    c.orders.push(o);
    c.totalSpent += Number(o.total);
  });

  const customers = Array.from(customerMap.values()).sort((a, b) => b.totalSpent - a.totalSpent);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        <Users size={16} />
        <span>{customers.length} customers</span>
      </div>

      <div className="grid gap-4">
        {customers.map((c, i) => (
          <div key={i} className="bg-white p-5 rounded-xl shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="font-medium">{c.name}</h3>
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                  <span className="flex items-center gap-1"><Phone size={12} />{c.phone}</span>
                  <span className="flex items-center gap-1"><MapPin size={12} />{c.address}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatPrice(c.totalSpent)}</p>
                <p className="text-xs text-gray-500">{c.orders.length} order{c.orders.length !== 1 ? "s" : ""}</p>
              </div>
            </div>
            {/* Recent orders */}
            <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
              {c.orders.slice(0, 3).map((o: any) => (
                <div key={o.id} className="flex justify-between text-xs text-gray-500">
                  <span>#{o.id.slice(0, 8)} · {new Date(o.created_at).toLocaleDateString()}</span>
                  <span className="capitalize">{o.status || "pending"} · {formatPrice(o.total)}</span>
                </div>
              ))}
              {c.orders.length > 3 && <p className="text-xs text-gray-400">+{c.orders.length - 3} more orders</p>}
            </div>
          </div>
        ))}
        {customers.length === 0 && (
          <div className="bg-white p-8 rounded-xl shadow-md text-center text-gray-400 text-sm">No customers yet</div>
        )}
      </div>
    </div>
  );
};

export default AdminCustomers;
