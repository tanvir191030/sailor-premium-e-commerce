import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Save, Truck, Gift, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const ORDER_MODES = [
  { value: "cod", label: "ফুল ক্যাশ অন ডেলিভারি (COD)", desc: "অগ্রিম পেমেন্ট লাগবে না" },
  { value: "delivery_charge_advance", label: "শুধু ডেলিভারি চার্জ অগ্রিম", desc: "কাস্টমার শুধু ডেলিভারি ফি bKash/Nagad এ পে করবে" },
  { value: "full_advance", label: "সম্পূর্ণ অগ্রিম পেমেন্ট", desc: "পুরো মূল্য + ডেলিভারি ফি আগেই পে করতে হবে" },
];

const AdminPayments = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: settings = [] } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => { const { data, error } = await supabase.from("site_settings").select("*"); if (error) throw error; return data; },
  });

  const getSetting = (key: string) => settings.find((s: any) => s.key === key)?.value || "";
  const [bkashNumber, setBkashNumber] = useState("");
  const [nagadNumber, setNagadNumber] = useState("");
  const [rocketNumber, setRocketNumber] = useState("");
  const [defaultCourier, setDefaultCourier] = useState("");
  const [shippingCost, setShippingCost] = useState("");
  const [freeDelivery, setFreeDelivery] = useState(false);
  const [orderMode, setOrderMode] = useState("cod");
  const [loaded, setLoaded] = useState(false);

  if (settings.length > 0 && !loaded) {
    setBkashNumber(getSetting("bkash_number")); setNagadNumber(getSetting("nagad_number")); setRocketNumber(getSetting("rocket_number"));
    setDefaultCourier(getSetting("default_courier")); setShippingCost(getSetting("shipping_cost"));
    setFreeDelivery(getSetting("free_delivery") === "true");
    setOrderMode(getSetting("order_confirmation_mode") || "cod");
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
    saveSetting.mutate({ key: "bkash_number", value: bkashNumber }); saveSetting.mutate({ key: "nagad_number", value: nagadNumber });
    saveSetting.mutate({ key: "rocket_number", value: rocketNumber }); saveSetting.mutate({ key: "default_courier", value: defaultCourier });
    saveSetting.mutate({ key: "shipping_cost", value: shippingCost }); saveSetting.mutate({ key: "free_delivery", value: freeDelivery ? "true" : "false" });
    toast({ title: "সেটিংস সেভ হয়েছে" });
  };

  const gateways = [
    { name: "বিকাশ (Bkash)", desc: "মোবাইল পেমেন্ট", color: "bg-pink-500/10", iconColor: "text-pink-500", value: bkashNumber, onChange: setBkashNumber, placeholder: "বিকাশ মার্চেন্ট নম্বর" },
    { name: "নগদ (Nagad)", desc: "মোবাইল পেমেন্ট", color: "bg-orange-500/10", iconColor: "text-orange-500", value: nagadNumber, onChange: setNagadNumber, placeholder: "নগদ মার্চেন্ট নম্বর" },
    { name: "রকেট (Rocket)", desc: "মোবাইল পেমেন্ট", color: "bg-violet-500/10", iconColor: "text-violet-500", value: rocketNumber, onChange: setRocketNumber, placeholder: "রকেট মার্চেন্ট নম্বর" },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
        <div className="flex items-center gap-2 mb-1"><CreditCard size={18} className="text-muted-foreground" /><h3 className="font-serif text-base text-foreground">পেমেন্ট গেটওয়ে</h3></div>
        <p className="text-xs text-muted-foreground mb-5">কাস্টমার চেকআউটের জন্য পেমেন্ট মেথড কনফিগার করুন।</p>
        <div className="space-y-4">
          {gateways.map((g) => (
            <div key={g.name} className="border border-border rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 ${g.color} rounded-lg flex items-center justify-center`}><CreditCard size={18} className={g.iconColor} /></div>
                <div><h4 className="font-medium text-sm text-foreground">{g.name}</h4><p className="text-[11px] text-muted-foreground">{g.desc}</p></div>
              </div>
              <input value={g.value} onChange={(e) => g.onChange(e.target.value)} placeholder={g.placeholder} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none bg-transparent text-foreground placeholder:text-muted-foreground" />
            </div>
          ))}
          <div className="border border-border rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center"><CreditCard size={18} className="text-emerald-500" /></div>
              <div><h4 className="font-medium text-sm text-foreground">ক্যাশ অন ডেলিভারি</h4><p className="text-[11px] text-muted-foreground">সবসময় চালু</p></div>
              <span className="ml-auto px-2.5 py-1 bg-emerald-500/10 text-emerald-500 text-xs rounded-full font-medium">Active</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
        <div className="flex items-center gap-2 mb-1"><Truck size={18} className="text-muted-foreground" /><h3 className="font-serif text-base text-foreground">শিপিং কনফিগারেশন</h3></div>
        <p className="text-xs text-muted-foreground mb-4">কুরিয়ার এবং শিপিং খরচ সেট করুন।</p>

        {/* Free Delivery Toggle */}
        <div className="border border-border rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center"><Gift size={18} className="text-primary" /></div>
              <div>
                <h4 className="font-medium text-sm text-foreground">ফ্রি ডেলিভারি সর্বত্র</h4>
                <p className="text-[11px] text-muted-foreground">চালু করলে সব অর্ডারে ডেলিভারি চার্জ ০ হবে</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {freeDelivery && <span className="px-2.5 py-1 bg-primary/10 text-primary text-xs rounded-full font-medium">Active</span>}
              <Switch checked={freeDelivery} onCheckedChange={setFreeDelivery} />
            </div>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <div><label className="text-xs text-muted-foreground mb-1 block">ডিফল্ট কুরিয়ার</label><input value={defaultCourier} onChange={(e) => setDefaultCourier(e.target.value)} placeholder="যেমন: পাঠাও" className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none bg-transparent text-foreground placeholder:text-muted-foreground" /></div>
          <div><label className="text-xs text-muted-foreground mb-1 block">শিপিং খরচ (৳)</label><input value={shippingCost} onChange={(e) => setShippingCost(e.target.value)} placeholder="120" type="number" className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none bg-transparent text-foreground placeholder:text-muted-foreground" /></div>
        </div>
      </div>

      <button onClick={handleSave} className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity">
        <Save size={14} /> সব সেভ করুন
      </button>
    </div>
  );
};

export default AdminPayments;
