import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/currency";
import { Users, Phone, MapPin, Search, ShoppingCart } from "lucide-react";

const AdminCustomers = () => {
  const [search, setSearch] = useState("");

  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const customerMap = new Map<string, { name: string; phone: string; address: string; orders: any[]; totalSpent: number; lastOrder: string }>();
  orders.forEach((o: any) => {
    const key = `${o.customer_name}-${o.phone}`;
    if (!customerMap.has(key)) customerMap.set(key, { name: o.customer_name, phone: o.phone, address: o.address, orders: [], totalSpent: 0, lastOrder: o.created_at });
    const c = customerMap.get(key)!;
    c.orders.push(o);
    c.totalSpent += Number(o.total);
  });

  const customers = Array.from(customerMap.values())
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search));

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-muted-foreground text-sm"><Users size={16} /><span>{customers.length} জন কাস্টমার</span></div>
        <div className="relative max-w-sm w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="কাস্টমার খুঁজুন..." className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm focus:outline-none text-foreground placeholder:text-muted-foreground" />
        </div>
      </div>

      <div className="grid gap-4">
        {customers.map((c, i) => (
          <div key={i} className="bg-card p-5 rounded-xl shadow-sm border border-border">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="font-medium text-sm text-foreground">{c.name}</h3>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-1.5">
                  <span className="flex items-center gap-1"><Phone size={12} />{c.phone}</span>
                  <span className="flex items-center gap-1"><MapPin size={12} />{c.address}</span>
                  <span className="flex items-center gap-1"><ShoppingCart size={12} />{c.orders.length} অর্ডার</span>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg text-foreground">{formatPrice(c.totalSpent)}</p>
                <p className="text-[10px] text-muted-foreground">শেষ অর্ডার: {new Date(c.lastOrder).toLocaleDateString("bn-BD")}</p>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wider font-medium">অর্ডার হিস্ট্রি</p>
              <div className="space-y-1">
                {c.orders.slice(0, 5).map((o: any) => (
                  <div key={o.id} className="flex justify-between text-xs py-1 px-2 rounded bg-secondary">
                    <span className="text-muted-foreground">#{o.id.slice(0, 8)} · {new Date(o.created_at).toLocaleDateString("bn-BD")}</span>
                    <div className="flex items-center gap-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] capitalize ${o.status === "delivered" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"}`}>{o.status || "pending"}</span>
                      <span className="font-medium text-foreground">{formatPrice(o.total)}</span>
                    </div>
                  </div>
                ))}
                {c.orders.length > 5 && <p className="text-[10px] text-muted-foreground pl-2">+{c.orders.length - 5} আরও অর্ডার</p>}
              </div>
            </div>
          </div>
        ))}
        {customers.length === 0 && <div className="bg-card p-8 rounded-xl shadow-sm text-center text-muted-foreground text-sm border border-border">কোনো কাস্টমার পাওয়া যায়নি</div>}
      </div>
    </div>
  );
};

export default AdminCustomers;
