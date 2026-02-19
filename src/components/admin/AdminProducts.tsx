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
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [form, setForm] = useState({ name: "", price: "", category: "", brand: "", stock: "", description: "", is_featured: false });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
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
      // Upload first image as main product image
      if (imageFiles.length > 0) image_url = await uploadProductImage(imageFiles[0]);
      const payload: any = {
        name: form.name, price: parseFloat(form.price), category: form.category || null,
        brand: form.brand || null, stock: parseInt(form.stock) || 0, description: form.description || null,
        is_featured: form.is_featured, ...(image_url && { image_url }),
      };
      let productId = editingId;
      if (editingId) {
        const { error } = await supabase.from("products").update(payload).eq("id", editingId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("products").insert(payload).select("id").single();
        if (error) throw error;
        productId = data.id;
      }
      // Upload additional images to product_images table
      if (imageFiles.length > 1 && productId) {
        for (let i = 1; i < imageFiles.length; i++) {
          const url = await uploadProductImage(imageFiles[i]);
          await supabase.from("product_images").insert({ product_id: productId, image_url: url, sort_order: i, is_primary: false });
        }
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
    mutationFn: async (product: any) => {
      // 1. Delete associated images from product_images table & storage
      const { data: images } = await supabase.from("product_images").select("*").eq("product_id", product.id);
      if (images && images.length > 0) {
        const paths = images.map((img: any) => {
          try { return new URL(img.image_url).pathname.split("/").slice(-2).join("/"); } catch { return null; }
        }).filter(Boolean);
        if (paths.length > 0) await supabase.storage.from("product-images").remove(paths as string[]);
        await supabase.from("product_images").delete().eq("product_id", product.id);
      }
      // 2. Delete main product image from storage if exists
      if (product.image_url) {
        try {
          const path = new URL(product.image_url).pathname.split("/").slice(-2).join("/");
          await supabase.storage.from("product-images").remove([path]);
        } catch {}
      }
      // 3. Delete the product
      const { error } = await supabase.from("products").delete().eq("id", product.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "প্রোডাক্ট ডিলিট হয়েছে" });
      setDeleteTarget(null);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const resetForm = () => { setForm({ name: "", price: "", category: "", brand: "", stock: "", description: "", is_featured: false }); setImageFiles([]); setImagePreviews([]); setEditingId(null); setShowForm(false); };
  const startEdit = (p: any) => { setForm({ name: p.name, price: String(p.price), category: p.category || "", brand: p.brand || "", stock: String(p.stock ?? 0), description: p.description || "", is_featured: p.is_featured || false }); setEditingId(p.id); setImageFiles([]); setImagePreviews([]); setShowForm(true); };
  const filtered = products.filter((p: any) => (p.name || "").toLowerCase().includes(search.toLowerCase()) || (p.category || "").toLowerCase().includes(search.toLowerCase()));

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
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Images (up to 10)</label>
                <input type="file" accept="image/*" multiple onChange={(e) => {
                  const newFiles = Array.from(e.target.files || []);
                  const combined = [...imageFiles, ...newFiles];
                  if (combined.length > 10) {
                    toast({ title: "সর্বোচ্চ ১০টি ছবি", description: `আপনি ${combined.length}টি সিলেক্ট করেছেন। সর্বোচ্চ ১০টি অনুমোদিত।`, variant: "destructive" });
                    const trimmed = combined.slice(0, 10);
                    setImageFiles(trimmed);
                    // Revoke old previews first
                    imagePreviews.forEach(p => URL.revokeObjectURL(p));
                    setImagePreviews(trimmed.map(f => URL.createObjectURL(f)));
                  } else {
                    setImageFiles(combined);
                    const newPrevs = newFiles.map(f => URL.createObjectURL(f));
                    setImagePreviews(prev => [...prev, ...newPrevs]);
                  }
                  // Reset input so same file can be re-selected
                  e.target.value = "";
                }} className="w-full text-sm text-muted-foreground" />
                {imagePreviews.length > 0 && (
                  <div className="grid grid-cols-5 gap-2 mt-3">
                    {imagePreviews.map((src, i) => (
                      <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-border group">
                        <img src={src} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                        {i === 0 && <span className="absolute bottom-0 left-0 right-0 bg-primary/80 text-primary-foreground text-[9px] text-center py-0.5">Main</span>}
                        <button type="button" onClick={() => {
                          const newFiles = [...imageFiles]; newFiles.splice(i, 1); setImageFiles(newFiles);
                          const newPreviews = [...imagePreviews]; URL.revokeObjectURL(newPreviews[i]); newPreviews.splice(i, 1); setImagePreviews(newPreviews);
                        }} className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">{imageFiles.length}/10 images selected {imageFiles.length > 0 && "• First image = main product image"}</p>
              </div>
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
                      <button onClick={() => setDeleteTarget(p)} className="p-1.5 hover:bg-red-500/10 text-red-500 rounded"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No products found</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-sm p-6 border border-border text-center">
            <Trash2 size={32} className="mx-auto mb-3 text-destructive" />
            <h3 className="font-serif text-lg mb-2 text-foreground">ডিলিট নিশ্চিত করুন</h3>
            <p className="text-sm text-muted-foreground mb-1">"{deleteTarget.name}"</p>
            <p className="text-xs text-muted-foreground mb-6">এটি স্থায়ীভাবে মুছে ফেলা হবে এবং পূর্বাবস্থায় ফেরানো যাবে না।</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteTarget(null)} className="px-5 py-2 border border-border rounded-full text-sm font-medium text-foreground hover:bg-secondary transition-colors">বাতিল</button>
              <button onClick={() => deleteMutation.mutate(deleteTarget)} disabled={deleteMutation.isPending} className="px-5 py-2 bg-destructive text-destructive-foreground rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                {deleteMutation.isPending ? "ডিলিট হচ্ছে..." : "ডিলিট করুন"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
