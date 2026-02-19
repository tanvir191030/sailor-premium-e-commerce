import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/currency";
import { Download, Save } from "lucide-react";
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
  const [loaded, setLoaded] = useState(false);

  // Load settings when data arrives
  if (settings.length > 0 && !loaded) {
    setSiteName(getSetting("site_name") || "SAILOR");
    setFacebook(getSetting("facebook") || "");
    setInstagram(getSetting("instagram") || "");
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast({ title: "Settings saved" });
    },
  });

  const handleSave = () => {
    saveSetting.mutate({ key: "site_name", value: siteName });
    saveSetting.mutate({ key: "facebook", value: facebook });
    saveSetting.mutate({ key: "instagram", value: instagram });
  };

  // Sales report
  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const downloadReport = () => {
    const headers = "Order ID,Customer,Phone,Status,Total,Date\n";
    const rows = orders.map((o: any) =>
      `${o.id.slice(0, 8)},${o.customer_name},${o.phone},${o.status || "pending"},${o.total},${new Date(o.created_at).toLocaleDateString()}`
    ).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sales-report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Site Settings */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="font-serif text-lg mb-4">Site Settings</h3>
        <div className="space-y-3 max-w-md">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Site Name</label>
            <input value={siteName} onChange={(e) => setSiteName(e.target.value)} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Facebook URL</label>
            <input value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="https://facebook.com/..." className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Instagram URL</label>
            <input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="https://instagram.com/..." className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none" />
          </div>
          <button onClick={handleSave} className="flex items-center gap-2 bg-[hsl(160,84%,20%)] text-white px-5 py-2.5 rounded-full text-sm font-medium hover:bg-[hsl(160,84%,15%)] transition-colors">
            <Save size={14} /> Save Settings
          </button>
        </div>
      </div>

      {/* Reports */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="font-serif text-lg mb-4">Reports</h3>
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
          <div>
            <p className="font-medium text-sm">Sales Report (CSV)</p>
            <p className="text-xs text-gray-500">{orders.length} orders · Total {formatPrice(orders.reduce((s: number, o: any) => s + Number(o.total), 0))}</p>
          </div>
          <button onClick={downloadReport} className="flex items-center gap-1.5 px-4 py-2 bg-[hsl(160,84%,20%)] text-white rounded-full text-xs font-medium hover:bg-[hsl(160,84%,15%)] transition-colors">
            <Download size={14} /> Download
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
