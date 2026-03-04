import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Star, Check, Trash2, Clock, CheckCircle } from "lucide-react";

const AdminReviews = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("id, name");
      if (error) throw error;
      return data;
    },
  });

  const productMap = new Map(products.map((p: any) => [p.id, p.name]));

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reviews").update({ is_approved: true }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      toast({ title: "✓ রিভিউ অনুমোদিত হয়েছে" });
    },
    onError: (e: any) => toast({ title: "ত্রুটি", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reviews").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      toast({ title: "✓ রিভিউ মুছে ফেলা হয়েছে" });
    },
    onError: (e: any) => toast({ title: "ত্রুটি", description: e.message, variant: "destructive" }),
  });

  const pending = reviews.filter((r: any) => !(r as any).is_approved);
  const approved = reviews.filter((r: any) => (r as any).is_approved);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent animate-spin rounded-full" />
      </div>
    );
  }

  const ReviewCard = ({ review }: { review: any }) => (
    <div className="flex flex-col sm:flex-row sm:items-start gap-3 p-4 bg-secondary rounded-xl border border-border">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm font-semibold text-foreground">{review.customer_name}</span>
          {review.is_approved ? (
            <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-medium">
              <CheckCircle size={10} /> অনুমোদিত
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded-full font-medium">
              <Clock size={10} /> পেন্ডিং
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-1">
          পণ্য: {productMap.get(review.product_id) || review.product_id?.slice(0, 8)}
        </p>
        <div className="flex gap-0.5 mb-1.5">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star key={s} size={12} className={s <= review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"} />
          ))}
        </div>
        {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
        {review.image_url && (
          <img src={review.image_url} alt="Review" className="mt-2 w-16 h-16 object-cover rounded-lg border border-border" />
        )}
        <p className="text-[10px] text-muted-foreground mt-2">
          {new Date(review.created_at).toLocaleDateString("bn-BD", { year: "numeric", month: "short", day: "numeric" })}
        </p>
      </div>
      <div className="flex sm:flex-col gap-2 flex-shrink-0">
        {!review.is_approved && (
          <button
            onClick={() => approveMutation.mutate(review.id)}
            disabled={approveMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50 min-h-[36px]"
          >
            <Check size={13} /> অনুমোদন
          </button>
        )}
        <button
          onClick={() => {
            if (confirm("এই রিভিউ মুছে ফেলতে চান?")) deleteMutation.mutate(review.id);
          }}
          disabled={deleteMutation.isPending}
          className="flex items-center gap-1.5 px-3 py-2 bg-destructive text-destructive-foreground rounded-lg text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50 min-h-[36px]"
        >
          <Trash2 size={13} /> মুছুন
        </button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Pending Reviews */}
      <div className="bg-card p-5 rounded-xl shadow-sm border border-border">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={18} className="text-yellow-500" />
          <h3 className="font-serif text-base text-foreground">
            পেন্ডিং রিভিউ ({pending.length})
          </h3>
        </div>
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">কোনো পেন্ডিং রিভিউ নেই।</p>
        ) : (
          <div className="space-y-3">
            {pending.map((r: any) => <ReviewCard key={r.id} review={r} />)}
          </div>
        )}
      </div>

      {/* Approved Reviews */}
      <div className="bg-card p-5 rounded-xl shadow-sm border border-border">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle size={18} className="text-emerald-500" />
          <h3 className="font-serif text-base text-foreground">
            অনুমোদিত রিভিউ ({approved.length})
          </h3>
        </div>
        {approved.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">কোনো অনুমোদিত রিভিউ নেই।</p>
        ) : (
          <div className="space-y-3">
            {approved.map((r: any) => <ReviewCard key={r.id} review={r} />)}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminReviews;
