import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/currency";
import { Download, Save, Globe, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminSettings = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: settings = [] } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*");
      if (error) throw error;
      return data;
    },
  });

  const getSetting = (key: string) => settings.find((s: any) => s.key === key)?.value || "";

  const [siteName, setSiteName] = useState("");
  const [facebook, setFacebook] = useState("");
  const [instagram, setInstagram] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [loaded, setLoaded] = useState(false);

  if (settings.length > 0 && !loaded) {
    setSiteName(getSetting("site_name") || "SAILOR");
    setFacebook(getSetting("facebook") || "");
    setInstagram(getSetting("instagram") || "");
    setContactPhone(getSetting("contact_phone") || "");
    setContactEmail(getSetting("contact_email") || "");
    setLoaded(true);
  }

  const saveSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const existing = settings.find((s: any) => s.key === key);
      if (existing) {
        const { error } = await supabase.from("site_settings").update({ value, updated_at: new Date().toISOString() }).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("site_settings").insert({ key, value });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["site-settings"] }),
  });

  const handleSave = () => {
    saveSetting.mutate({ key: "site_name", value: siteName });
    saveSetting.mutate({ key: "facebook", value: facebook });
    saveSetting.mutate({ key: "instagram", value: instagram });
    saveSetting.mutate({ key: "contact_phone", value: contactPhone });
    saveSetting.mutate({ key: "contact_email", value: contactEmail });
    toast({ title: "সেটিংস সেভ হয়েছে" });
  };

  // Reports
  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*");
      if (error) throw error;
      return data;
    },
  });

  const downloadSalesReport = () => {
    const headers = "Order ID,Customer,Phone,Address,Status,Payment,Total,Date\n";
    const rows = orders.map((o: any) =>
      `${o.id.slice(0, 8)},"${o.customer_name}",${o.phone},"${o.address}",${o.status || "pending"},${o.payment_method || "N/A"},${o.total},${new Date(o.created_at).toLocaleDateString("en-GB")}`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadStockReport = () => {
    const headers = "Product,Category,Brand,Stock,Price\n";
    const rows = products.map((p: any) =>
      `"${p.name}",${p.category || "N/A"},${p.brand || "N/A"},${p.stock ?? 0},${p.price}`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stock-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadCustomerReport = () => {
    const customerMap = new Map<string, { name: string; phone: string; address: string; totalOrders: number; totalSpent: number }>();
    orders.forEach((o: any) => {
      const key = `${o.customer_name}-${o.phone}`;
      if (!customerMap.has(key)) {
        customerMap.set(key, { name: o.customer_name, phone: o.phone, address: o.address, totalOrders: 0, totalSpent: 0 });
      }
      const c = customerMap.get(key)!;
      c.totalOrders++;
      c.totalSpent += Number(o.total);
    });
    const headers = "Customer,Phone,Address,Total Orders,Total Spent\n";
    const rows = Array.from(customerMap.values()).map((c) =>
      `"${c.name}",${c.phone},"${c.address}",${c.totalOrders},${c.totalSpent}`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `customer-report-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Site Settings */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-[hsl(0,0%,92%)]">
        <div className="flex items-center gap-2 mb-4">
          <Globe size={18} className="text-[hsl(0,0%,40%)]" />
          <h3 className="font-serif text-base">সিস্টেম সেটিংস</h3>
        </div>
        <div className="space-y-3 max-w-lg">
          <div>
            <label className="text-xs text-[hsl(0,0%,50%)] mb-1 block">সাইটের নাম</label>
            <input value={siteName} onChange={(e) => setSiteName(e.target.value)} className="w-full px-3 py-2.5 border border-[hsl(0,0%,88%)] rounded-lg text-sm focus:outline-none" />
          </div>
          <div>
            <label className="text-xs text-[hsl(0,0%,50%)] mb-1 block">কন্টাক্ট ফোন</label>
            <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="01XXXXXXXXX" className="w-full px-3 py-2.5 border border-[hsl(0,0%,88%)] rounded-lg text-sm focus:outline-none" />
          </div>
          <div>
            <label className="text-xs text-[hsl(0,0%,50%)] mb-1 block">কন্টাক্ট ইমেইল</label>
            <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="info@example.com" className="w-full px-3 py-2.5 border border-[hsl(0,0%,88%)] rounded-lg text-sm focus:outline-none" />
          </div>
        </div>
      </div>

      {/* Social Links */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-[hsl(0,0%,92%)]">
        <div className="flex items-center gap-2 mb-4">
          <Share2 size={18} className="text-[hsl(0,0%,40%)]" />
          <h3 className="font-serif text-base">সোশ্যাল মিডিয়া</h3>
        </div>
        <div className="space-y-3 max-w-lg">
          <div>
            <label className="text-xs text-[hsl(0,0%,50%)] mb-1 block">Facebook URL</label>
            <input value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="https://facebook.com/..." className="w-full px-3 py-2.5 border border-[hsl(0,0%,88%)] rounded-lg text-sm focus:outline-none" />
          </div>
          <div>
            <label className="text-xs text-[hsl(0,0%,50%)] mb-1 block">Instagram URL</label>
            <input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://instagram.com/..." className="w-full px-3 py-2.5 border border-[hsl(0,0%,88%)] rounded-lg text-sm focus:outline-none" />
          </div>
        </div>

        <button onClick={handleSave} className="mt-4 flex items-center gap-2 bg-[hsl(160,84%,20%)] text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-[hsl(160,84%,15%)] transition-colors">
          <Save size={14} /> সেটিংস সেভ করুন
        </button>
      </div>

      {/* Reports */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-[hsl(0,0%,92%)]">
        <div className="flex items-center gap-2 mb-4">
          <Download size={18} className="text-[hsl(0,0%,40%)]" />
          <h3 className="font-serif text-base">রিপোর্ট ডাউনলোড</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-[hsl(0,0%,97%)] rounded-xl">
            <div>
              <p className="font-medium text-sm">সেলস রিপোর্ট (CSV)</p>
              <p className="text-xs text-[hsl(0,0%,50%)]">{orders.length} অর্ডার · মোট {formatPrice(orders.reduce((s: number, o: any) => s + Number(o.total), 0))}</p>
            </div>
            <button onClick={downloadSalesReport} className="flex items-center gap-1.5 px-4 py-2 bg-[hsl(160,84%,20%)] text-white rounded-full text-xs font-medium hover:bg-[hsl(160,84%,15%)] transition-colors">
              <Download size={14} /> ডাউনলোড
            </button>
          </div>
          <div className="flex items-center justify-between p-4 bg-[hsl(0,0%,97%)] rounded-xl">
            <div>
              <p className="font-medium text-sm">স্টক রিপোর্ট (CSV)</p>
              <p className="text-xs text-[hsl(0,0%,50%)]">{products.length} প্রোডাক্ট</p>
            </div>
            <button onClick={downloadStockReport} className="flex items-center gap-1.5 px-4 py-2 bg-[hsl(160,84%,20%)] text-white rounded-full text-xs font-medium hover:bg-[hsl(160,84%,15%)] transition-colors">
              <Download size={14} /> ডাউনলোড
            </button>
          </div>
          <div className="flex items-center justify-between p-4 bg-[hsl(0,0%,97%)] rounded-xl">
            <div>
              <p className="font-medium text-sm">কাস্টমার রিপোর্ট (CSV)</p>
              <p className="text-xs text-[hsl(0,0%,50%)]">কাস্টমার তালিকা ও খরচের ইতিহাস</p>
            </div>
            <button onClick={downloadCustomerReport} className="flex items-center gap-1.5 px-4 py-2 bg-[hsl(160,84%,20%)] text-white rounded-full text-xs font-medium hover:bg-[hsl(160,84%,15%)] transition-colors">
              <Download size={14} /> ডাউনলোড
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
