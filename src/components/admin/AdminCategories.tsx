import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Tag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminCategories = () => {
  const [newName, setNewName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  // Count products per category
  const { data: products = [] } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("id, category");
      if (error) throw error;
      return data;
    },
  });

  const productCountMap = products.reduce((acc: Record<string, number>, p: any) => {
    if (p.category) acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {});

  const addMutation = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.from("categories").insert({ name });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({ title: "ক্যাটাগরি যোগ হয়েছে" });
      setNewName("");
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast({ title: "ক্যাটাগরি ডিলিট হয়েছে" });
      setDeleteTarget(null);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      {/* Add Form */}
      <div className="bg-card p-5 rounded-xl shadow-sm border border-border">
        <h3 className="font-serif text-lg text-foreground mb-4">Add New Category</h3>
        <div className="flex gap-3">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Category name (e.g. Men, Women, Kids)"
            onKeyDown={(e) => { if (e.key === "Enter" && newName.trim()) addMutation.mutate(newName.trim()); }}
            className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-ring bg-transparent text-foreground placeholder:text-muted-foreground"
          />
          <button
            onClick={() => { if (newName.trim()) addMutation.mutate(newName.trim()); }}
            disabled={!newName.trim() || addMutation.isPending}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Plus size={16} /> Add Category
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-medium text-foreground flex items-center gap-2">
            <Tag size={18} /> All Categories ({categories.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary border-b border-border">
              <tr>
                <th className="text-left p-3 font-medium text-muted-foreground">Name</th>
                <th className="text-center p-3 font-medium text-muted-foreground">Products</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Created</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c: any) => (
                <tr key={c.id} className="border-b border-border/50 hover:bg-secondary/50">
                  <td className="p-3 font-medium text-foreground">{c.name}</td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-accent text-accent-foreground">
                      {productCountMap[c.name] || 0}
                    </span>
                  </td>
                  <td className="p-3 text-muted-foreground text-xs">
                    {new Date(c.created_at).toLocaleDateString("bn-BD")}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => setDeleteTarget(c)}
                      className="p-1.5 hover:bg-destructive/10 text-destructive rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No categories yet. Add one above.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-sm p-6 border border-border text-center">
            <Trash2 size={32} className="mx-auto mb-3 text-destructive" />
            <h3 className="font-serif text-lg mb-2 text-foreground">ডিলিট নিশ্চিত করুন</h3>
            <p className="text-sm text-muted-foreground mb-1">"{deleteTarget.name}"</p>
            {(productCountMap[deleteTarget.name] || 0) > 0 && (
              <p className="text-xs text-destructive mb-2">⚠️ এই ক্যাটাগরিতে {productCountMap[deleteTarget.name]}টি প্রোডাক্ট আছে</p>
            )}
            <p className="text-xs text-muted-foreground mb-6">এটি স্থায়ীভাবে মুছে ফেলা হবে।</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteTarget(null)} className="px-5 py-2 border border-border rounded-full text-sm font-medium text-foreground hover:bg-secondary transition-colors">বাতিল</button>
              <button
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
                disabled={deleteMutation.isPending}
                className="px-5 py-2 bg-destructive text-destructive-foreground rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {deleteMutation.isPending ? "ডিলিট হচ্ছে..." : "ডিলিট করুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;
