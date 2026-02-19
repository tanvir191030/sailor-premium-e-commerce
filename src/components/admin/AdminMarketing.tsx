import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { uploadProductImage } from "@/hooks/useProducts";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminMarketing = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: coupons = [] } = useQuery({
    queryKey: ["coupons"],
    queryFn: async () => { const { data, error } = await supabase.from("coupons").select("*").order("created_at", { ascending: false }); if (error) throw error; return data; },
  });

  const [couponForm, setCouponForm] = useState({ code: "", discount_type: "percentage", discount_value: "", min_order: "", max_uses: "" });

  const addCoupon = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("coupons").insert({ code: couponForm.code.toUpperCase(), discount_type: couponForm.discount_type, discount_value: parseFloat(couponForm.discount_value) || 0, min_order: parseFloat(couponForm.min_order) || 0, max_uses: parseInt(couponForm.max_uses) || 0 });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["coupons"] }); setCouponForm({ code: "", discount_type: "percentage", discount_value: "", min_order: "", max_uses: "" }); toast({ title: "Coupon created" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteCoupon = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("coupons").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["coupons"] }),
  });

  const { data: banners = [] } = useQuery({
    queryKey: ["banners"],
    queryFn: async () => { const { data, error } = await supabase.from("banners").select("*").order("sort_order"); if (error) throw error; return data; },
  });

  const [bannerTitle, setBannerTitle] = useState("");
  const [bannerFile, setBannerFile] = useState<File | null>(null);

  const addBanner = useMutation({
    mutationFn: async () => {
      if (!bannerFile) throw new Error("Select an image");
      const image_url = await uploadProductImage(bannerFile);
      const { error } = await supabase.from("banners").insert({ title: bannerTitle, image_url });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["banners"] }); setBannerTitle(""); setBannerFile(null); toast({ title: "Banner added" }); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteBanner = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("banners").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["banners"] }),
  });

  return (
    <div className="space-y-6">
      {/* Coupons */}
      <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
        <h3 className="font-serif text-base mb-4 text-foreground">কুপন কোড</h3>
        <div className="grid md:grid-cols-5 gap-2 mb-4">
          <input value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value })} placeholder="Code" className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none bg-transparent text-foreground placeholder:text-muted-foreground" />
          <select value={couponForm.discount_type} onChange={(e) => setCouponForm({ ...couponForm, discount_type: e.target.value })} className="px-3 py-2 border border-border rounded-lg text-sm bg-card text-foreground focus:outline-none">
            <option value="percentage">%</option><option value="fixed">৳ Fixed</option>
          </select>
          <input value={couponForm.discount_value} onChange={(e) => setCouponForm({ ...couponForm, discount_value: e.target.value })} placeholder="Value" type="number" className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none bg-transparent text-foreground placeholder:text-muted-foreground" />
          <input value={couponForm.min_order} onChange={(e) => setCouponForm({ ...couponForm, min_order: e.target.value })} placeholder="Min order ৳" type="number" className="px-3 py-2 border border-border rounded-lg text-sm focus:outline-none bg-transparent text-foreground placeholder:text-muted-foreground" />
          <button onClick={() => addCoupon.mutate()} disabled={!couponForm.code || !couponForm.discount_value} className="flex items-center justify-center gap-1 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">
            <Plus size={14} /> Add
          </button>
        </div>
        <div className="space-y-2">
          {coupons.map((c: any) => (
            <div key={c.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
              <div className="flex items-center gap-3">
                <span className="font-mono font-semibold text-sm bg-card px-2.5 py-1 rounded border border-border text-foreground">{c.code}</span>
                <span className="text-xs text-muted-foreground">{c.discount_type === "percentage" ? `${c.discount_value}% off` : `৳${c.discount_value} off`}{c.min_order > 0 && ` · Min ৳${c.min_order}`}</span>
              </div>
              <button onClick={() => deleteCoupon.mutate(c.id)} className="p-1 hover:bg-red-500/10 text-red-500 rounded"><Trash2 size={14} /></button>
            </div>
          ))}
          {coupons.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No coupons yet</p>}
        </div>
      </div>

      {/* Banners */}
      <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
        <h3 className="font-serif text-base mb-4 text-foreground">হোমপেজ ব্যানার</h3>
        <div className="flex flex-col md:flex-row gap-2 mb-4">
          <input value={bannerTitle} onChange={(e) => setBannerTitle(e.target.value)} placeholder="Banner title" className="flex-1 px-3 py-2 border border-border rounded-lg text-sm focus:outline-none bg-transparent text-foreground placeholder:text-muted-foreground" />
          <input type="file" accept="image/*" onChange={(e) => setBannerFile(e.target.files?.[0] || null)} className="text-sm text-muted-foreground" />
          <button onClick={() => addBanner.mutate()} disabled={!bannerTitle || !bannerFile} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">Upload</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {banners.map((b: any) => (
            <div key={b.id} className="relative group rounded-lg overflow-hidden">
              <img src={b.image_url} alt={b.title} className="w-full h-32 object-cover" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => deleteBanner.mutate(b.id)} className="p-2 bg-card rounded-full text-red-500 hover:bg-red-500/10"><Trash2 size={14} /></button>
              </div>
              <p className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1.5 truncate">{b.title}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminMarketing;
