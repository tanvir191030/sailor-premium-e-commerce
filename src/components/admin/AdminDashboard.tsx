import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/currency";
import { Package, ShoppingCart, Clock, TrendingUp, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const AdminDashboard = () => {
  const { data: products = [] } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*");
      if (error) throw error;
      return data;
    },
  });

  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const deliveredOrders = orders.filter((o) => o.status === "delivered").length;
  const lowStockProducts = products.filter((p: any) => (p.stock ?? 0) < 5);

  // Simple chart data - orders by day (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split("T")[0];
  });

  const chartData = last7Days.map((day) => ({
    date: new Date(day).toLocaleDateString("en", { weekday: "short" }),
    orders: orders.filter((o) => o.created_at?.startsWith(day)).length,
    revenue: orders.filter((o) => o.created_at?.startsWith(day)).reduce((s, o) => s + Number(o.total), 0),
  }));

  const stats = [
    { label: "Total Revenue", value: formatPrice(totalRevenue), icon: TrendingUp, iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
    { label: "Total Orders", value: orders.length, icon: ShoppingCart, iconBg: "bg-blue-50", iconColor: "text-blue-600" },
    { label: "Pending Orders", value: pendingOrders, icon: Clock, iconBg: "bg-amber-50", iconColor: "text-amber-600" },
    { label: "Delivered", value: deliveredOrders, icon: Package, iconBg: "bg-emerald-50", iconColor: "text-emerald-600" },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white p-5 rounded-xl shadow-md">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2.5 rounded-lg ${s.iconBg}`}>
                <s.icon size={18} className={s.iconColor} />
              </div>
            </div>
            <p className="text-2xl font-semibold">{s.value}</p>
            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white p-5 rounded-xl shadow-md">
        <h3 className="font-serif text-lg mb-4">Orders & Revenue (Last 7 Days)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="orders" fill="hsl(160,84%,20%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <div className="bg-white p-5 rounded-xl shadow-md border-l-4 border-amber-400">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} className="text-amber-500" />
            <h3 className="font-medium text-sm">Low Stock Alert</h3>
          </div>
          <div className="space-y-2">
            {lowStockProducts.map((p: any) => (
              <div key={p.id} className="flex justify-between text-sm">
                <span>{p.name}</span>
                <span className="text-amber-600 font-medium">{p.stock} left</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
