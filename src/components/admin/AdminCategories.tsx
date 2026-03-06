import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Tag, ChevronDown, ChevronUp, FolderTree } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSubCategories, MEASUREMENT_TEMPLATES } from "@/hooks/useSubCategories";

const AdminCategories = () => {
  const [newName, setNewName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [newSubName, setNewSubName] = useState("");
  const [newSubTemplate, setNewSubTemplate] = useState("clothing");
  const [deleteSubTarget, setDeleteSubTarget] = useState<any>(null);
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

  const { data: subCategories = [] } = useSubCategories();

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
      queryClient.invalidateQueries({ queryKey: ["sub-categories"] });
      toast({ title: "ক্যাটাগরি ডিলিট হয়েছে" });
      setDeleteTarget(null);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const addSubMutation = useMutation({
    mutationFn: async ({ name, categoryId, template }: { name: string; categoryId: string; template: string }) => {
      const { error } = await (supabase as any).from("sub_categories").insert({
        name,
        category_id: categoryId,
        measurement_template: template,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-categories"] });
      toast({ title: "সাব-ক্যাটাগরি যোগ হয়েছে" });
      setNewSubName("");
      setNewSubTemplate("clothing");
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteSubMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("sub_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-categories"] });
      toast({ title: "সাব-ক্যাটাগরি ডিলিট হয়েছে" });
      setDeleteSubTarget(null);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const getSubsForCategory = (catId: string) => subCategories.filter((s: any) => s.category_id === catId);

  return (
    <div className="space-y-6">
      {/* Add Category Form */}
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
            <Plus size={16} /> Add
          </button>
        </div>
      </div>

      {/* Categories with Sub-categories */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-medium text-foreground flex items-center gap-2">
            <Tag size={18} /> All Categories ({categories.length})
          </h3>
        </div>

        <div className="divide-y divide-border">
          {categories.map((c: any) => {
            const subs = getSubsForCategory(c.id);
            const isExpanded = expandedCat === c.id;

            return (
              <div key={c.id}>
                {/* Category Row */}
                <div className="flex items-center justify-between p-3 hover:bg-secondary/50">
                  <button
                    onClick={() => setExpandedCat(isExpanded ? null : c.id)}
                    className="flex items-center gap-3 flex-1 text-left"
                  >
                    {isExpanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
                    <span className="font-medium text-foreground">{c.name}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-accent text-accent-foreground">
                      {productCountMap[c.name] || 0} products
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-secondary text-muted-foreground">
                      {subs.length} sub
                    </span>
                  </button>
                  <button
                    onClick={() => setDeleteTarget(c)}
                    className="p-1.5 hover:bg-destructive/10 text-destructive rounded"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Sub-categories Panel */}
                {isExpanded && (
                  <div className="bg-secondary/30 px-4 py-4 space-y-3 border-t border-border/50">
                    {/* Add sub-category form */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        value={newSubName}
                        onChange={(e) => setNewSubName(e.target.value)}
                        placeholder="Sub-category name (e.g. Panjabi, Shirt)"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newSubName.trim()) {
                            addSubMutation.mutate({ name: newSubName.trim(), categoryId: c.id, template: newSubTemplate });
                          }
                        }}
                        className="flex-1 px-3 py-2 border border-border rounded-lg text-sm bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
                      />
                      <select
                        value={newSubTemplate}
                        onChange={(e) => setNewSubTemplate(e.target.value)}
                        className="px-3 py-2 border border-border rounded-lg text-sm bg-card text-foreground"
                      >
                        {Object.entries(MEASUREMENT_TEMPLATES).map(([key, tmpl]) => (
                          <option key={key} value={key}>{tmpl.label}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => {
                          if (newSubName.trim()) addSubMutation.mutate({ name: newSubName.trim(), categoryId: c.id, template: newSubTemplate });
                        }}
                        disabled={!newSubName.trim() || addSubMutation.isPending}
                        className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-full text-xs font-medium hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
                      >
                        <Plus size={14} /> Add Sub
                      </button>
                    </div>

                    {/* Sub-categories list */}
                    {subs.length > 0 ? (
                      <div className="space-y-1.5">
                        {subs.map((sub: any) => (
                          <div key={sub.id} className="flex items-center justify-between bg-card p-2.5 rounded-lg border border-border/50">
                            <div className="flex items-center gap-2">
                              <FolderTree size={14} className="text-muted-foreground" />
                              <span className="text-sm font-medium text-foreground">{sub.name}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">
                                {MEASUREMENT_TEMPLATES[sub.measurement_template]?.label || sub.measurement_template}
                              </span>
                            </div>
                            <button
                              onClick={() => setDeleteSubTarget(sub)}
                              className="p-1 hover:bg-destructive/10 text-destructive rounded"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">কোনো সাব-ক্যাটাগরি নেই। উপরে যোগ করুন।</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {categories.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">No categories yet. Add one above.</div>
          )}
        </div>
      </div>

      {/* Delete Category Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-sm p-6 border border-border text-center">
            <Trash2 size={32} className="mx-auto mb-3 text-destructive" />
            <h3 className="font-serif text-lg mb-2 text-foreground">ডিলিট নিশ্চিত করুন</h3>
            <p className="text-sm text-muted-foreground mb-1">"{deleteTarget.name}"</p>
            {(productCountMap[deleteTarget.name] || 0) > 0 && (
              <p className="text-xs text-destructive mb-2">⚠️ এই ক্যাটাগরিতে {productCountMap[deleteTarget.name]}টি প্রোডাক্ট আছে</p>
            )}
            <p className="text-xs text-muted-foreground mb-6">এটি ও এর সব সাব-ক্যাটাগরি স্থায়ীভাবে মুছে ফেলা হবে।</p>
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

      {/* Delete Sub-category Confirmation */}
      {deleteSubTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-sm p-6 border border-border text-center">
            <Trash2 size={32} className="mx-auto mb-3 text-destructive" />
            <h3 className="font-serif text-lg mb-2 text-foreground">সাব-ক্যাটাগরি ডিলিট</h3>
            <p className="text-sm text-muted-foreground mb-4">"{deleteSubTarget.name}"</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteSubTarget(null)} className="px-5 py-2 border border-border rounded-full text-sm font-medium text-foreground hover:bg-secondary transition-colors">বাতিল</button>
              <button
                onClick={() => deleteSubMutation.mutate(deleteSubTarget.id)}
                disabled={deleteSubMutation.isPending}
                className="px-5 py-2 bg-destructive text-destructive-foreground rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {deleteSubMutation.isPending ? "ডিলিট হচ্ছে..." : "ডিলিট করুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategories;
