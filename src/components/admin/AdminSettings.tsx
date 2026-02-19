import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/currency";
import { Download, Save, Globe, Share2, Truck, Smartphone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminSettings = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: settings = [] } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => { const { data, error } = await supabase.from("site_settings").select("*"); if (error) throw error; return data; },
  });

  const getSetting = (key: string) => settings.find((s: any) => s.key === key)?.value || "";
  const [siteName, setSiteName] = useState("");
  const [facebook, setFacebook] = useState("");
  const [instagram, setInstagram] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [insideDhaka, setInsideDhaka] = useState("80");
  const [outsideDhaka, setOutsideDhaka] = useState("130");
  const [bkashNumber, setBkashNumber] = useState("");
  const [nagadNumber, setNagadNumber] = useState("");
  const [rocketNumber, setRocketNumber] = useState("");
  const [loaded, setLoaded] = useState(false);

  if (settings.length > 0 && !loaded) {
    setSiteName(getSetting("site_name") || "SAILOR"); setFacebook(getSetting("facebook") || "");
    setInstagram(getSetting("instagram") || ""); setContactPhone(getSetting("contact_phone") || "");
    setContactEmail(getSetting("contact_email") || "");
    setInsideDhaka(getSetting("delivery_inside_dhaka") || "80");
    setOutsideDhaka(getSetting("delivery_outside_dhaka") || "130");
    setBkashNumber(getSetting("bkash_number") || "");
    setNagadNumber(getSetting("nagad_number") || "");
    setRocketNumber(getSetting("rocket_number") || "");
    setLoaded(true);
  }

  const saveSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const existing = settings.find((s: any) => s.key === key);
      if (existing) { const { error } = await supabase.from("site_settings").update({ value, updated_at: new Date().toISOString() }).eq("id", existing.id); if (error) throw error; }
      else { const { error } = await supabase.from("site_settings").insert({ key, value }); if (error) throw error; }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["site-settings"] }),
  });

  const handleSave = () => {
    saveSetting.mutate({ key: "site_name", value: siteName }); saveSetting.mutate({ key: "facebook", value: facebook });
    saveSetting.mutate({ key: "instagram", value: instagram }); saveSetting.mutate({ key: "contact_phone", value: contactPhone });
    saveSetting.mutate({ key: "contact_email", value: contactEmail });
    saveSetting.mutate({ key: "delivery_inside_dhaka", value: insideDhaka });
    saveSetting.mutate({ key: "delivery_outside_dhaka", value: outsideDhaka });
    saveSetting.mutate({ key: "bkash_number", value: bkashNumber });
    saveSetting.mutate({ key: "nagad_number", value: nagadNumber });
    saveSetting.mutate({ key: "rocket_number", value: rocketNumber });
    toast({ title: "সেটিংস সেভ হয়েছে" });
  };

  const { data: orders = [] } = useQuery({ queryKey: ["admin-orders"], queryFn: async () => { const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false }); if (error) throw error; return data; } });
  const { data: products = [] } = useQuery({ queryKey: ["admin-products"], queryFn: async () => { const { data, error } = await supabase.from("products").select("*"); if (error) throw error; return data; } });

  const downloadCSV = (filename: string, headers: string, rows: string) => {
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadSalesReport = () => downloadCSV("sales-report", "Order ID,Customer,Phone,Address,Status,Payment,Total,Date\n", orders.map((o: any) => `${o.id.slice(0, 8)},"${o.customer_name}",${o.phone},"${o.address}",${o.status || "pending"},${o.payment_method || "N/A"},${o.total},${new Date(o.created_at).toLocaleDateString("en-GB")}`).join("\n"));
  const downloadStockReport = () => downloadCSV("stock-report", "Product,Category,Brand,Stock,Price\n", products.map((p: any) => `"${p.name}",${p.category || "N/A"},${p.brand || "N/A"},${p.stock ?? 0},${p.price}`).join("\n"));
  const downloadCustomerReport = () => {
    const m = new Map<string, any>();
    orders.forEach((o: any) => { const k = `${o.customer_name}-${o.phone}`; if (!m.has(k)) m.set(k, { name: o.customer_name, phone: o.phone, address: o.address, cnt: 0, total: 0 }); const c = m.get(k); c.cnt++; c.total += Number(o.total); });
    downloadCSV("customer-report", "Customer,Phone,Address,Orders,Total Spent\n", Array.from(m.values()).map((c) => `"${c.name}",${c.phone},"${c.address}",${c.cnt},${c.total}`).join("\n"));
  };

  const inputCls = "w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none bg-transparent text-foreground placeholder:text-muted-foreground";

  return (
    <div className="space-y-6">
      <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
        <div className="flex items-center gap-2 mb-4"><Globe size={18} className="text-muted-foreground" /><h3 className="font-serif text-base text-foreground">সিস্টেম সেটিংস</h3></div>
        <div className="space-y-3 max-w-lg">
          <div><label className="text-xs text-muted-foreground mb-1 block">সাইটের নাম</label><input value={siteName} onChange={(e) => setSiteName(e.target.value)} className={inputCls} /></div>
          <div><label className="text-xs text-muted-foreground mb-1 block">কন্টাক্ট ফোন</label><input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="01XXXXXXXXX" className={inputCls} /></div>
          <div><label className="text-xs text-muted-foreground mb-1 block">কন্টাক্ট ইমেইল</label><input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="info@example.com" className={inputCls} /></div>
        </div>
      </div>

      {/* Delivery Charges */}
      <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
        <div className="flex items-center gap-2 mb-4"><Truck size={18} className="text-muted-foreground" /><h3 className="font-serif text-base text-foreground">ডেলিভারি চার্জ</h3></div>
        <div className="grid sm:grid-cols-2 gap-4 max-w-lg">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">ঢাকার ভিতরে (৳)</label>
            <input type="number" value={insideDhaka} onChange={(e) => setInsideDhaka(e.target.value)} className={inputCls} min="0" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">ঢাকার বাইরে (৳)</label>
            <input type="number" value={outsideDhaka} onChange={(e) => setOutsideDhaka(e.target.value)} className={inputCls} min="0" />
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">এই চার্জ চেকআউট পেজে স্বয়ংক্রিয়ভাবে প্রয়োগ হবে।</p>
      </div>

      {/* Payment Numbers */}
      <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
        <div className="flex items-center gap-2 mb-4"><Smartphone size={18} className="text-muted-foreground" /><h3 className="font-serif text-base text-foreground">পেমেন্ট নম্বর</h3></div>
        <div className="space-y-3 max-w-lg">
          <div><label className="text-xs text-muted-foreground mb-1 block">bKash নম্বর</label><input value={bkashNumber} onChange={(e) => setBkashNumber(e.target.value)} placeholder="01XXXXXXXXX" className={inputCls} maxLength={15} /></div>
          <div><label className="text-xs text-muted-foreground mb-1 block">Nagad নম্বর</label><input value={nagadNumber} onChange={(e) => setNagadNumber(e.target.value)} placeholder="01XXXXXXXXX" className={inputCls} maxLength={15} /></div>
          <div><label className="text-xs text-muted-foreground mb-1 block">Rocket নম্বর</label><input value={rocketNumber} onChange={(e) => setRocketNumber(e.target.value)} placeholder="01XXXXXXXXX" className={inputCls} maxLength={15} /></div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">কাস্টমার চেকআউটে এই নম্বরগুলো দেখবে।</p>
      </div>

      <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
        <div className="flex items-center gap-2 mb-4"><Share2 size={18} className="text-muted-foreground" /><h3 className="font-serif text-base text-foreground">সোশ্যাল মিডিয়া</h3></div>
        <div className="space-y-3 max-w-lg">
          <div><label className="text-xs text-muted-foreground mb-1 block">Facebook URL</label><input value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="https://facebook.com/..." className={inputCls} /></div>
          <div><label className="text-xs text-muted-foreground mb-1 block">Instagram URL</label><input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://instagram.com/..." className={inputCls} /></div>
        </div>
        <button onClick={handleSave} className="mt-4 flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity"><Save size={14} /> সেটিংস সেভ করুন</button>
      </div>

      <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
        <div className="flex items-center gap-2 mb-4"><Download size={18} className="text-muted-foreground" /><h3 className="font-serif text-base text-foreground">রিপোর্ট ডাউনলোড</h3></div>
        <div className="space-y-3">
          {[
            { title: "সেলস রিপোর্ট", desc: `${orders.length} অর্ডার · মোট ${formatPrice(orders.reduce((s: number, o: any) => s + Number(o.total), 0))}`, fn: downloadSalesReport },
            { title: "স্টক রিপোর্ট", desc: `${products.length} প্রোডাক্ট`, fn: downloadStockReport },
            { title: "কাস্টমার রিপোর্ট", desc: "কাস্টমার তালিকা ও খরচ", fn: downloadCustomerReport },
          ].map((r) => (
            <div key={r.title} className="flex items-center justify-between p-4 bg-secondary rounded-xl">
              <div><p className="font-medium text-sm text-foreground">{r.title} (CSV)</p><p className="text-xs text-muted-foreground">{r.desc}</p></div>
              <button onClick={r.fn} className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-full text-xs font-medium hover:opacity-90 transition-opacity"><Download size={14} /> ডাউনলোড</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
