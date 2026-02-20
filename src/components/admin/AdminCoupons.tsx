import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Tag, ToggleLeft, ToggleRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminCoupons = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: coupons = [], isLoading } = useQuery({
    queryKey: ["coupons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const [form, setForm] = useState({
    code: "",
    discount_type: "percentage",
    discount_value: "",
    min_order: "",
    max_uses: "",
    expires_at: "",
  });

  const addCoupon = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("coupons").insert({
        code: form.code.toUpperCase().trim(),
        discount_type: form.discount_type,
        discount_value: parseFloat(form.discount_value) || 0,
        min_order: parseFloat(form.min_order) || 0,
        max_uses: parseInt(form.max_uses) || 0,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      setForm({ code: "", discount_type: "percentage", discount_value: "", min_order: "", max_uses: "", expires_at: "" });
      toast({ title: "কুপন তৈরি হয়েছে ✓" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteCoupon = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("coupons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      toast({ title: "কুপন মুছে ফেলা হয়েছে" });
    },
  });

  const toggleCoupon = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("coupons").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["coupons"] }),
  });

  const inputCls = "px-3 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring bg-transparent text-foreground placeholder:text-muted-foreground";

  return (
    <div className="space-y-6">
      {/* Create Coupon */}
      <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
        <h3 className="font-serif text-base mb-4 text-foreground flex items-center gap-2">
          <Tag size={16} /> নতুন কুপন তৈরি করুন
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">কুপন কোড *</label>
            <input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="যেমন: SAVE20"
              className={`${inputCls} w-full uppercase`}
              maxLength={20}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">ডিসকাউন্ট ধরন</label>
            <select
              value={form.discount_type}
              onChange={(e) => setForm({ ...form, discount_type: e.target.value })}
              className={`${inputCls} w-full bg-card`}
            >
              <option value="percentage">শতাংশ (%)</option>
              <option value="fixed">নির্দিষ্ট পরিমাণ (৳)</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">
              {form.discount_type === "percentage" ? "পরিমাণ (%) *" : "পরিমাণ (৳) *"}
            </label>
            <input
              value={form.discount_value}
              onChange={(e) => setForm({ ...form, discount_value: e.target.value })}
              placeholder={form.discount_type === "percentage" ? "যেমন: 10" : "যেমন: 50"}
              type="number"
              min="0"
              max={form.discount_type === "percentage" ? "100" : undefined}
              className={`${inputCls} w-full`}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">সর্বনিম্ন অর্ডার (৳)</label>
            <input
              value={form.min_order}
              onChange={(e) => setForm({ ...form, min_order: e.target.value })}
              placeholder="যেমন: 500"
              type="number"
              min="0"
              className={`${inputCls} w-full`}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">সর্বোচ্চ ব্যবহার (0 = সীমাহীন)</label>
            <input
              value={form.max_uses}
              onChange={(e) => setForm({ ...form, max_uses: e.target.value })}
              placeholder="যেমন: 100"
              type="number"
              min="0"
              className={`${inputCls} w-full`}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">মেয়াদ শেষ তারিখ</label>
            <input
              value={form.expires_at}
              onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
              type="date"
              className={`${inputCls} w-full`}
            />
          </div>
        </div>
        <button
          onClick={() => addCoupon.mutate()}
          disabled={!form.code || !form.discount_value || addCoupon.isPending}
          className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          <Plus size={15} />
          {addCoupon.isPending ? "তৈরি হচ্ছে..." : "কুপন তৈরি করুন"}
        </button>
      </div>

      {/* Coupons List */}
      <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
        <h3 className="font-serif text-base mb-4 text-foreground">
          সকল কুপন {coupons.length > 0 && <span className="text-sm text-muted-foreground font-sans">({coupons.length}টি)</span>}
        </h3>
        {isLoading ? (
          <p className="text-sm text-muted-foreground text-center py-8">লোড হচ্ছে...</p>
        ) : coupons.length === 0 ? (
          <div className="text-center py-12">
            <Tag size={32} className="mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">কোনো কুপন নেই</p>
          </div>
        ) : (
          <div className="space-y-2">
            {coupons.map((c: any) => {
              const isExpired = c.expires_at && new Date(c.expires_at) < new Date();
              const isMaxed = c.max_uses > 0 && (c.used_count || 0) >= c.max_uses;
              return (
                <div
                  key={c.id}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                    c.is_active && !isExpired && !isMaxed
                      ? "bg-secondary/50 border-border"
                      : "bg-secondary/20 border-border/50 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="font-mono font-bold text-sm bg-card px-3 py-1.5 rounded-lg border border-border text-foreground whitespace-nowrap">
                      {c.code}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm text-foreground font-medium">
                        {c.discount_type === "percentage" ? `${c.discount_value}% ছাড়` : `৳${c.discount_value} ছাড়`}
                        {c.min_order > 0 && <span className="text-muted-foreground font-normal"> · সর্বনিম্ন ৳{c.min_order}</span>}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        ব্যবহার: {c.used_count || 0}{c.max_uses > 0 ? `/${c.max_uses}` : " (সীমাহীন)"}
                        {c.expires_at && ` · মেয়াদ: ${new Date(c.expires_at).toLocaleDateString("bn-BD")}`}
                        {isExpired && <span className="text-destructive ml-1">· মেয়াদ শেষ</span>}
                        {isMaxed && <span className="text-destructive ml-1">· সীমা পূর্ণ</span>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    <button
                      onClick={() => toggleCoupon.mutate({ id: c.id, is_active: !c.is_active })}
                      className={`p-1.5 rounded-lg transition-colors ${c.is_active ? "text-primary hover:bg-primary/10" : "text-muted-foreground hover:bg-secondary"}`}
                      title={c.is_active ? "নিষ্ক্রিয় করুন" : "সক্রিয় করুন"}
                    >
                      {c.is_active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                    </button>
                    <button
                      onClick={() => deleteCoupon.mutate(c.id)}
                      className="p-1.5 hover:bg-destructive/10 text-destructive rounded-lg transition-colors"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCoupons;
