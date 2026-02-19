import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { uploadProductImage } from "@/hooks/useProducts";
import { formatPrice } from "@/lib/currency";
import { Plus, Pencil, Trash2, X, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminProducts = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", price: "", category: "", brand: "", stock: "", description: "", is_featured: false });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: brands = [] } = useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const { data, error } = await supabase.from("brands").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      let image_url = undefined;
      if (imageFile) image_url = await uploadProductImage(imageFile);
      const payload: any = {
        name: form.name, price: parseFloat(form.price), category: form.category || null,
        brand: form.brand || null, stock: parseInt(form.stock) || 0, description: form.description || null,
        is_featured: form.is_featured, ...(image_url && { image_url }),
      };
      if (editingId) {
        const { error } = await supabase.from("products").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: editingId ? "Product updated" : "Product added" });
      resetForm();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Product deleted" });
    },
  });

  const addCategoryMutation = useMutation({
    mutationFn: async (name: string) => { const { error } = await supabase.from("categories").insert({ name }); if (error) throw error; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["categories"] }),
  });

  const addBrandMutation = useMutation({
    mutationFn: async (name: string) => { const { error } = await supabase.from("brands").insert({ name }); if (error) throw error; },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["brands"] }),
  });

  const resetForm = () => { setForm({ name: "", price: "", category: "", brand: "", stock: "", description: "", is_featured: false }); setImageFile(null); setEditingId(null); setShowForm(false); };
  const startEdit = (p: any) => { setForm({ name: p.name, price: String(p.price), category: p.category || "", brand: p.brand || "", stock: String(p.stock ?? 0), description: p.description || "", is_featured: p.is_featured || false }); setEditingId(p.id); setShowForm(true); };
  const filtered = products.filter((p: any) => p.name.toLowerCase().includes(search.toLowerCase()) || (p.category || "").toLowerCase().includes(search.toLowerCase()));
  const [newCategory, setNewCategory] = useState("");
  const [newBrand, setNewBrand] = useState("");

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm focus:outline-none focus:border-ring text-foreground placeholder:text-muted-foreground" />
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Categories & Brands */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-card p-4 rounded-xl shadow-sm border border-border">
          <h4 className="font-medium text-sm mb-3 text-foreground">Categories</h4>
          <div className="flex gap-2 mb-2">
            <input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="New category" className="flex-1 px-3 py-1.5 border border-border rounded-lg text-sm focus:outline-none bg-transparent text-foreground placeholder:text-muted-foreground" />
            <button onClick={() => { if (newCategory.trim()) { addCategoryMutation.mutate(newCategory.trim()); setNewCategory(""); } }} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium">Add</button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((c: any) => <span key={c.id} className="px-2.5 py-1 bg-emerald-500/10 text-emerald-500 text-xs rounded-full">{c.name}</span>)}
          </div>
        </div>
        <div className="bg-card p-4 rounded-xl shadow-sm border border-border">
          <h4 className="font-medium text-sm mb-3 text-foreground">Brands</h4>
          <div className="flex gap-2 mb-2">
            <input value={newBrand} onChange={(e) => setNewBrand(e.target.value)} placeholder="New brand" className="flex-1 px-3 py-1.5 border border-border rounded-lg text-sm focus:outline-none bg-transparent text-foreground placeholder:text-muted-foreground" />
            <button onClick={() => { if (newBrand.trim()) { addBrandMutation.mutate(newBrand.trim()); setNewBrand(""); } }} className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium">Add</button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {brands.map((b: any) => <span key={b.id} className="px-2.5 py-1 bg-blue-500/10 text-blue-500 text-xs rounded-full">{b.name}</span>)}
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 border border-border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-serif text-lg text-foreground">{editingId ? "Edit Product" : "Add Product"}</h3>
              <button onClick={resetForm} className="p-1 hover:bg-secondary rounded"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Product name" className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none bg-transparent text-foreground placeholder:text-muted-foreground" />
              <div className="grid grid-cols-2 gap-3">
                <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="Price (৳)" type="number" className="px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none bg-transparent text-foreground placeholder:text-muted-foreground" />
                <input value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="Stock qty" type="number" className="px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none bg-transparent text-foreground placeholder:text-muted-foreground" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none bg-card text-foreground">
                  <option value="">Select category</option>
                  {categories.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
                <select value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none bg-card text-foreground">
                  <option value="">Select brand</option>
                  {brands.map((b: any) => <option key={b.id} value={b.name}>{b.name}</option>)}
                </select>
              </div>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" rows={3} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none resize-none bg-transparent text-foreground placeholder:text-muted-foreground" />
              <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="w-full text-sm text-muted-foreground" />
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} className="rounded" />
                Featured product
              </label>
              <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.name || !form.price} className="w-full bg-primary text-primary-foreground py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                {saveMutation.isPending ? "Saving..." : editingId ? "Update Product" : "Add Product"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary border-b border-border">
              <tr>
                <th className="text-left p-3 font-medium text-muted-foreground">Product</th>
                <th className="text-left p-3 font-medium text-muted-foreground">Category</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Price</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Stock</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p: any) => (
                <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/50">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-secondary overflow-hidden rounded flex-shrink-0">
                        {p.image_url && <img src={p.image_url} alt="" className="w-full h-full object-cover" />}
                      </div>
                      <span className="font-medium truncate max-w-[200px] text-foreground">{p.name}</span>
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground">{p.category || "—"}</td>
                  <td className="p-3 text-right font-medium text-foreground">{formatPrice(p.price)}</td>
                  <td className="p-3 text-right">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${(p.stock ?? 0) < 5 ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"}`}>{p.stock ?? 0}</span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => startEdit(p)} className="p-1.5 hover:bg-secondary rounded text-foreground"><Pencil size={14} /></button>
                      <button onClick={() => deleteMutation.mutate(p.id)} className="p-1.5 hover:bg-red-500/10 text-red-500 rounded"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No products found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminProducts;
