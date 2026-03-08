import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/currency";
import { Package, ShoppingCart, Clock, TrendingUp, AlertTriangle, Users, DollarSign, TrendingDown, Wallet, FileDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { useTheme } from "@/contexts/ThemeContext";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { openBulkInvoicesInNewTab } from "@/lib/bulkInvoicePdf";
import { useToast } from "@/hooks/use-toast";

type TimeRange = "daily" | "weekly" | "monthly";

const AdminDashboard = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>("weekly");
  const { theme } = useTheme();
  const { settings: siteSettings } = useSiteSettings();
  const { toast } = useToast();

  const { data: products = [] } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("id,name,price,stock,category,created_at");
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 2,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("id,customer_name,total,status,created_at,delivery_charge").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 1,
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ["admin-expenses-dashboard"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("expenses").select("id,amount,category,expense_date");
      if (error) throw error;
      return data as any[];
    },
    staleTime: 1000 * 60 * 2,
  });

  const totalRevenue = orders.filter((o) => o.status === "delivered").reduce((sum, o) => sum + Number(o.total), 0);
  const totalExpenses = expenses.reduce((s: number, e: any) => s + Number(e.amount), 0);
  const netProfit = totalRevenue - totalExpenses;
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const processingOrders = orders.filter((o) => o.status === "processing").length;
  const shippedOrders = orders.filter((o) => o.status === "shipped").length;
  const deliveredOrders = orders.filter((o) => o.status === "delivered").length;
  const todayStr = new Date().toISOString().split("T")[0];
  const todayVerified = orders.filter(
    (o: any) => o.created_at?.startsWith(todayStr) && (o as any).is_payment_verified === true && !(o as any).is_deleted
  );
  const todayVerifiedTotal = todayVerified.reduce((s, o) => s + Number(o.total), 0);

  const lowStockProducts = products.filter((p: any) => (p.stock ?? 0) < 5);
  const totalProducts = products.length;
  const uniqueCustomers = new Set(orders.map((o: any) => `${o.customer_name}-${o.phone}`)).size;

  const getChartData = () => {
    if (timeRange === "daily") {
      return Array.from({ length: 24 }, (_, i) => ({
        label: `${i}:00`,
        orders: orders.filter((o) => {
          const d = new Date(o.created_at!);
          return d.toDateString() === new Date().toDateString() && d.getHours() === i;
        }).length,
        revenue: orders.filter((o) => {
          const d = new Date(o.created_at!);
          return d.toDateString() === new Date().toDateString() && d.getHours() === i;
        }).reduce((s, o) => s + Number(o.total), 0),
      }));
    } else if (timeRange === "weekly") {
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const dayStr = d.toISOString().split("T")[0];
        return {
          label: d.toLocaleDateString("bn-BD", { weekday: "short" }),
          orders: orders.filter((o) => o.created_at?.startsWith(dayStr)).length,
          revenue: orders.filter((o) => o.created_at?.startsWith(dayStr)).reduce((s, o) => s + Number(o.total), 0),
        };
      });
    } else {
      return Array.from({ length: 30 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (29 - i));
        const dayStr = d.toISOString().split("T")[0];
        return {
          label: d.getDate().toString(),
          orders: orders.filter((o) => o.created_at?.startsWith(dayStr)).length,
          revenue: orders.filter((o) => o.created_at?.startsWith(dayStr)).reduce((s, o) => s + Number(o.total), 0),
        };
      });
    }
  };

  const chartData = getChartData();
  const isDark = theme === "dark";
  const gridColor = isDark ? "hsl(0,0%,25%)" : "hsl(0,0%,92%)";
  const tickColor = isDark ? "hsl(0,0%,60%)" : "hsl(0,0%,40%)";
  const tooltipBg = isDark ? "hsl(0,0%,15%)" : "#fff";
  const tooltipBorder = isDark ? "hsl(0,0%,25%)" : "hsl(0,0%,90%)";

  const statusData = [
    { name: "Pending", value: pendingOrders, color: "#f59e0b" },
    { name: "Processing", value: processingOrders, color: "#3b82f6" },
    { name: "Shipped", value: shippedOrders, color: "#8b5cf6" },
    { name: "Delivered", value: deliveredOrders, color: "#10b981" },
  ].filter((d) => d.value > 0);

  const stats = [
    { label: "মোট বিক্রয়", value: formatPrice(totalRevenue), icon: TrendingUp, bg: "bg-emerald-500/10", color: "text-emerald-500" },
    { label: "মোট খরচ", value: formatPrice(totalExpenses), icon: TrendingDown, bg: "bg-destructive/10", color: "text-destructive" },
    { label: "নেট প্রফিট", value: formatPrice(netProfit), icon: Wallet, bg: netProfit >= 0 ? "bg-emerald-500/10" : "bg-destructive/10", color: netProfit >= 0 ? "text-emerald-500" : "text-destructive" },
    { label: "মোট অর্ডার", value: orders.length, icon: ShoppingCart, bg: "bg-blue-500/10", color: "text-blue-500" },
    { label: "পেন্ডিং অর্ডার", value: pendingOrders, icon: Clock, bg: "bg-amber-500/10", color: "text-amber-500" },
    { label: "ডেলিভারড", value: deliveredOrders, icon: Package, bg: "bg-emerald-500/10", color: "text-emerald-500" },
    { label: "কাস্টমার", value: uniqueCustomers, icon: Users, bg: "bg-purple-500/10", color: "text-purple-500" },
    { label: "মোট প্রোডাক্ট", value: totalProducts, icon: DollarSign, bg: "bg-pink-500/10", color: "text-pink-500" },
  ];

  const timeLabels: Record<TimeRange, string> = { daily: "আজকের", weekly: "সাপ্তাহিক", monthly: "মাসিক" };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-card p-4 rounded-xl shadow-sm border border-border">
            <div className={`p-2 rounded-lg ${s.bg} w-fit mb-2`}>
              <s.icon size={16} className={s.color} />
            </div>
            <p className="text-xl font-bold text-foreground">{s.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Today's Verified Invoices Download Card */}
      <div className="bg-card p-5 rounded-xl shadow-sm border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-serif text-base text-foreground flex items-center gap-2">
            <FileDown size={18} className="text-emerald-500" />
            আজকের ভেরিফাইড ইনভয়েস
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            আজ {todayVerified.length} টি ভেরিফাইড অর্ডার · মোট {formatPrice(todayVerifiedTotal)}
          </p>
        </div>
        <button
          onClick={() => {
            if (todayVerified.length === 0) {
              toast({ title: "আজকে কোনো ভেরিফাইড অর্ডার নেই", variant: "destructive" });
              return;
            }
            openBulkInvoicesInNewTab(todayVerified as any, siteSettings.store_name || "Modest Mart", siteSettings.website_url || "");
          }}
          disabled={todayVerified.length === 0}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FileDown size={16} /> আজকের ইনভয়েস ডাউনলোড করুন
        </button>
      </div>

      {/* Revenue Chart */}
      <div className="bg-card p-5 rounded-xl shadow-sm border border-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-base text-foreground">সেলস ওভারভিউ ({timeLabels[timeRange]})</h3>
          <div className="flex gap-1 bg-secondary p-1 rounded-lg">
            {(["daily", "weekly", "monthly"] as TimeRange[]).map((t) => (
              <button key={t} onClick={() => setTimeRange(t)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${timeRange === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                {t === "daily" ? "দৈনিক" : t === "weekly" ? "সাপ্তাহিক" : "মাসিক"}
              </button>
            ))}
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: tickColor }} />
              <YAxis tick={{ fontSize: 11, fill: tickColor }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${tooltipBorder}`, backgroundColor: tooltipBg, color: isDark ? "#e5e5e5" : "#333" }} formatter={(value: number, name: string) => name === "revenue" ? [formatPrice(value), "আয়"] : [value, "অর্ডার"]} />
              <Bar dataKey="revenue" fill="hsl(160,84%,30%)" radius={[4, 4, 0, 0]} name="revenue" />
              <Bar dataKey="orders" fill="hsl(210,80%,55%)" radius={[4, 4, 0, 0]} name="orders" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pie */}
        <div className="bg-card p-5 rounded-xl shadow-sm border border-border">
          <h3 className="font-serif text-base mb-4 text-foreground">অর্ডার স্ট্যাটাস</h3>
          {statusData.length > 0 ? (
            <div className="flex items-center gap-6">
              <div className="h-48 w-48 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" stroke="none">
                      {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, color: isDark ? "#e5e5e5" : "#333", borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {statusData.map((s) => (
                  <div key={s.name} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-muted-foreground">{s.name}</span>
                    <span className="font-semibold ml-auto text-foreground">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">কোনো অর্ডার নেই</p>
          )}
        </div>

        {/* Line */}
        <div className="bg-card p-5 rounded-xl shadow-sm border border-border">
          <h3 className="font-serif text-base mb-4 text-foreground">আয়ের ট্রেন্ড</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: tickColor }} />
                <YAxis tick={{ fontSize: 10, fill: tickColor }} />
                <Tooltip formatter={(value: number) => [formatPrice(value), "আয়"]} contentStyle={{ fontSize: 12, borderRadius: 8, backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, color: isDark ? "#e5e5e5" : "#333" }} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(160,84%,30%)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-card p-5 rounded-xl shadow-sm border border-border">
        <h3 className="font-serif text-base mb-4 text-foreground">সাম্প্রতিক অর্ডার</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">অর্ডার</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">কাস্টমার</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">স্ট্যাটাস</th>
                <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs">মোট</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 5).map((o: any) => (
                <tr key={o.id} className="border-b border-border/50">
                  <td className="py-2.5 px-3 font-mono text-xs text-foreground">#{o.id.slice(0, 8)}</td>
                  <td className="py-2.5 px-3 text-foreground">{o.customer_name}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${
                      o.status === "delivered" ? "bg-emerald-500/10 text-emerald-500" :
                      o.status === "shipped" ? "bg-purple-500/10 text-purple-500" :
                      o.status === "processing" ? "bg-blue-500/10 text-blue-500" :
                      "bg-amber-500/10 text-amber-500"
                    }`}>{o.status || "pending"}</span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium text-foreground">{formatPrice(o.total)}</td>
                </tr>
              ))}
              {orders.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">কোনো অর্ডার নেই</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Low Stock */}
      {lowStockProducts.length > 0 && (
        <div className="bg-card p-5 rounded-xl shadow-sm border-l-4 border-amber-400">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} className="text-amber-500" />
            <h3 className="font-medium text-sm text-foreground">স্টক অ্যালার্ট — কম স্টক</h3>
          </div>
          <div className="space-y-2">
            {lowStockProducts.map((p: any) => (
              <div key={p.id} className="flex justify-between text-sm p-2 bg-amber-500/10 rounded-lg">
                <span className="text-foreground">{p.name}</span>
                <span className="text-amber-500 font-semibold">{p.stock} টি বাকি</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
