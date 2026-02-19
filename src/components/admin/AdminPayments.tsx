import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Save, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminPayments = () => {
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

  const [bkashNumber, setBkashNumber] = useState("");
  const [nagadNumber, setNagadNumber] = useState("");
  const [rocketNumber, setRocketNumber] = useState("");
  const [defaultCourier, setDefaultCourier] = useState("");
  const [shippingCost, setShippingCost] = useState("");
  const [loaded, setLoaded] = useState(false);

  if (settings.length > 0 && !loaded) {
    setBkashNumber(getSetting("bkash_number"));
    setNagadNumber(getSetting("nagad_number"));
    setRocketNumber(getSetting("rocket_number"));
    setDefaultCourier(getSetting("default_courier"));
    setShippingCost(getSetting("shipping_cost"));
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
    saveSetting.mutate({ key: "bkash_number", value: bkashNumber });
    saveSetting.mutate({ key: "nagad_number", value: nagadNumber });
    saveSetting.mutate({ key: "rocket_number", value: rocketNumber });
    saveSetting.mutate({ key: "default_courier", value: defaultCourier });
    saveSetting.mutate({ key: "shipping_cost", value: shippingCost });
    toast({ title: "সেটিংস সেভ হয়েছে" });
  };

  const gateways = [
    { name: "বিকাশ (Bkash)", desc: "মোবাইল পেমেন্ট গেটওয়ে", color: "bg-pink-50", iconColor: "text-pink-600", value: bkashNumber, onChange: setBkashNumber, placeholder: "বিকাশ মার্চেন্ট নম্বর" },
    { name: "নগদ (Nagad)", desc: "মোবাইল পেমেন্ট গেটওয়ে", color: "bg-orange-50", iconColor: "text-orange-600", value: nagadNumber, onChange: setNagadNumber, placeholder: "নগদ মার্চেন্ট নম্বর" },
    { name: "রকেট (Rocket)", desc: "মোবাইল পেমেন্ট গেটওয়ে", color: "bg-violet-50", iconColor: "text-violet-600", value: rocketNumber, onChange: setRocketNumber, placeholder: "রকেট মার্চেন্ট নম্বর" },
  ];

  return (
    <div className="space-y-6">
      {/* Payment Gateways */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-[hsl(0,0%,92%)]">
        <div className="flex items-center gap-2 mb-1">
          <CreditCard size={18} className="text-[hsl(0,0%,40%)]" />
          <h3 className="font-serif text-base">পেমেন্ট গেটওয়ে কনফিগারেশন</h3>
        </div>
        <p className="text-xs text-[hsl(0,0%,50%)] mb-5">কাস্টমার চেকআউটের জন্য পেমেন্ট মেথড কনফিগার করুন।</p>

        <div className="space-y-4">
          {gateways.map((g) => (
            <div key={g.name} className="border border-[hsl(0,0%,90%)] rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 ${g.color} rounded-lg flex items-center justify-center`}>
                  <CreditCard size={18} className={g.iconColor} />
                </div>
                <div>
                  <h4 className="font-medium text-sm">{g.name}</h4>
                  <p className="text-[11px] text-[hsl(0,0%,50%)]">{g.desc}</p>
                </div>
              </div>
              <input
                value={g.value}
                onChange={(e) => g.onChange(e.target.value)}
                placeholder={g.placeholder}
                className="w-full px-3 py-2.5 border border-[hsl(0,0%,88%)] rounded-lg text-sm focus:outline-none focus:border-[hsl(0,0%,70%)]"
              />
            </div>
          ))}

          {/* COD */}
          <div className="border border-[hsl(0,0%,90%)] rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                <CreditCard size={18} className="text-emerald-600" />
              </div>
              <div>
                <h4 className="font-medium text-sm">ক্যাশ অন ডেলিভারি</h4>
                <p className="text-[11px] text-[hsl(0,0%,50%)]">সবসময় চালু থাকবে</p>
              </div>
              <span className="ml-auto px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-full font-medium">Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Shipping */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-[hsl(0,0%,92%)]">
        <div className="flex items-center gap-2 mb-1">
          <Truck size={18} className="text-[hsl(0,0%,40%)]" />
          <h3 className="font-serif text-base">শিপিং কনফিগারেশন</h3>
        </div>
        <p className="text-xs text-[hsl(0,0%,50%)] mb-4">কুরিয়ার এবং শিপিং খরচ সেট করুন।</p>
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-[hsl(0,0%,50%)] mb-1 block">ডিফল্ট কুরিয়ার</label>
            <input value={defaultCourier} onChange={(e) => setDefaultCourier(e.target.value)} placeholder="যেমন: পাঠাও, স্টিডফাস্ট" className="w-full px-3 py-2.5 border border-[hsl(0,0%,88%)] rounded-lg text-sm focus:outline-none" />
          </div>
          <div>
            <label className="text-xs text-[hsl(0,0%,50%)] mb-1 block">শিপিং খরচ (৳)</label>
            <input value={shippingCost} onChange={(e) => setShippingCost(e.target.value)} placeholder="যেমন: 120" type="number" className="w-full px-3 py-2.5 border border-[hsl(0,0%,88%)] rounded-lg text-sm focus:outline-none" />
          </div>
        </div>
        <p className="text-[11px] text-[hsl(0,0%,55%)] mt-2">প্রতিটি অর্ডারের জন্য ট্র্যাকিং ID Orders সেকশনে যোগ করতে পারবেন।</p>
      </div>

      {/* Save */}
      <button onClick={handleSave} className="flex items-center gap-2 bg-[hsl(160,84%,20%)] text-white px-6 py-2.5 rounded-full text-sm font-medium hover:bg-[hsl(160,84%,15%)] transition-colors">
        <Save size={14} /> সব সেভ করুন
      </button>
    </div>
  );
};

export default AdminPayments;
