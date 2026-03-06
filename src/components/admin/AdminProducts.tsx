import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { uploadProductImage } from "@/hooks/useProducts";
import { formatPrice } from "@/lib/currency";
import { Plus, Pencil, Trash2, X, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useSubCategories, MEASUREMENT_TEMPLATES } from "@/hooks/useSubCategories";

const LETTER_SIZES = ["S", "M", "L", "XL", "XXL"];
const SHOE_SIZES = ["36", "37", "38", "39", "40", "41", "42", "43", "44", "45"];

const getTemplateType = (template: string): "clothing" | "hijab" | "shoes" | "none" => {
  if (template === "clothing" || template === "panjabi" || template === "pants") return "clothing";
  if (template === "hijab") return "hijab";
  if (template === "shoes") return "shoes";
  return "none";
};

const AdminProducts = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [form, setForm] = useState({
    name: "", name_bn: "", price: "", original_price: "", category: "", brand: "",
    stock: "", description: "", description_bn: "", is_featured: false,
    sub_category: "",
    sizes: {} as any,
  });
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]); // URLs from DB
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: allSubCategories = [] } = useSubCategories();

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
      // Determine primary image: first existing or first new upload
      let image_url: string | undefined = existingImages.length > 0 ? existingImages[0] : undefined;
      if (imageFiles.length > 0 && existingImages.length === 0) {
        image_url = await uploadProductImage(imageFiles[0]);
      }

      const selectedSub = allSubCategories.find((s: any) => s.name === form.sub_category);
      const subType = selectedSub ? getTemplateType(selectedSub.measurement_template) : "none";
      let finalSizes: any = null;
      let totalStockFromSizes = 0;

      if (subType === "clothing" || subType === "hijab" || subType === "shoes") {
        const variants: any = {};
        Object.entries(form.sizes).forEach(([size, data]: any) => {
          if (data && data.stock && parseInt(data.stock) > 0) {
            variants[size] = {
              stock: parseInt(data.stock),
              measurements: data.measurements || {}
            };
            totalStockFromSizes += parseInt(data.stock);
          }
        });
        if (Object.keys(variants).length > 0) {
          finalSizes = { sub_category: form.sub_category, type: subType, variants };
        }
      }

      const finalStock = finalSizes ? totalStockFromSizes : (parseInt(form.stock) || 0);

      const salePrice = parseFloat(form.price);
      const mrp = form.original_price ? parseFloat(form.original_price) : null;

      const payload: any = {
        name: form.name,
        price: salePrice,
        original_price: mrp && mrp > salePrice ? mrp : null,
        category: form.category || null,
        sub_category: form.sub_category || null,
        brand: form.brand || null,
        stock: finalStock,
        sizes: finalSizes,
        description: form.description || null,
        is_featured: form.is_featured,
        ...(image_url && { image_url }),
      };
      let productId = editingId;
      if (editingId) {
        const { error } = await supabase.from("products").update(payload).eq("id", editingId);
        if (error) throw error;

        // Remove old product_images and re-insert existing (non-primary) + new
        await supabase.from("product_images").delete().eq("product_id", editingId);
        let sortIdx = 1;
        for (const url of existingImages.slice(1)) {
          await supabase.from("product_images").insert({ product_id: editingId, image_url: url, sort_order: sortIdx++, is_primary: false });
        }
        // Upload new files (skip first if it became primary)
        const startIdx = existingImages.length === 0 ? 1 : 0;
        for (let i = startIdx; i < imageFiles.length; i++) {
          const url = await uploadProductImage(imageFiles[i]);
          await supabase.from("product_images").insert({ product_id: editingId, image_url: url, sort_order: sortIdx++, is_primary: false });
        }
      } else {
        const { data, error } = await supabase.from("products").insert(payload).select("id").single();
        if (error) throw error;
        productId = data.id;
        // Upload additional images for new product
        if (imageFiles.length > 1 && productId) {
          for (let i = 1; i < imageFiles.length; i++) {
            const url = await uploadProductImage(imageFiles[i]);
            await supabase.from("product_images").insert({ product_id: productId, image_url: url, sort_order: i, is_primary: false });
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: editingId ? t("admin.editProduct") : t("admin.addProduct") });
      resetForm();
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (product: any) => {
      const { data: images } = await supabase.from("product_images").select("*").eq("product_id", product.id);
      if (images && images.length > 0) {
        const paths = images.map((img: any) => {
          try { return new URL(img.image_url).pathname.split("/").slice(-2).join("/"); } catch { return null; }
        }).filter(Boolean);
        if (paths.length > 0) await supabase.storage.from("product-images").remove(paths as string[]);
        await supabase.from("product_images").delete().eq("product_id", product.id);
      }
      if (product.image_url) {
        try {
          const path = new URL(product.image_url).pathname.split("/").slice(-2).join("/");
          await supabase.storage.from("product-images").remove([path]);
        } catch { }
      }
      const { error } = await supabase.from("products").delete().eq("id", product.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: t("admin.delete") });
      setDeleteTarget(null);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const resetForm = () => {
    setForm({ name: "", name_bn: "", price: "", original_price: "", category: "", brand: "", stock: "", description: "", description_bn: "", is_featured: false, sub_category: "", sizes: {} });
    setImageFiles([]); setImagePreviews([]); setExistingImages([]); setEditingId(null); setShowForm(false);
  };

  const startEdit = async (p: any) => {
    let initialSizes: any = {};
    if (p.sizes) {
      if (p.sizes.variants) {
        Object.entries(p.sizes.variants).forEach(([k, v]: any) => {
          initialSizes[k] = { stock: String(v.stock), measurements: v.measurements || {} };
        });
      } else {
        Object.entries(p.sizes).forEach(([k, v]) => {
          if (k !== 'sub_category' && k !== 'type') {
            initialSizes[k] = typeof v === 'object' ? v : String(v);
          }
        });
      }
    }

    // Fetch existing images
    const urls: string[] = [];
    if (p.image_url) urls.push(p.image_url);
    const { data: extraImages } = await supabase
      .from("product_images")
      .select("image_url")
      .eq("product_id", p.id)
      .order("sort_order");
    if (extraImages) {
      extraImages.forEach((img: any) => {
        if (!urls.includes(img.image_url)) urls.push(img.image_url);
      });
    }

    setForm({
      name: p.name, name_bn: p.name_bn || "", price: String(p.price),
      original_price: p.original_price ? String(p.original_price) : "",
      category: p.category || "", sub_category: p.sub_category || p.sizes?.sub_category || "", brand: p.brand || "", stock: String(p.stock ?? 0),
      description: p.description || "", description_bn: p.description_bn || "",
      is_featured: p.is_featured || false,
      sizes: initialSizes,
    });
    setEditingId(p.id); setImageFiles([]); setImagePreviews([]); setExistingImages(urls); setShowForm(true);
  };

  const filtered = products.filter((p: any) =>
    (p.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.category || "").toLowerCase().includes(search.toLowerCase())
  );

  const inputCls = "w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none bg-transparent text-foreground placeholder:text-muted-foreground";

  const selectedSubCat = allSubCategories.find((s: any) => s.name === form.sub_category);
  const subType = selectedSubCat ? getTemplateType(selectedSubCat.measurement_template) : "none";
  const selectedCatObj = categories.find((c: any) => c.name === form.category);
  const availableSubCats = selectedCatObj ? allSubCategories.filter((s: any) => s.category_id === selectedCatObj.id) : [];

  const renderSizeFields = () => {
    if (!form.sub_category || subType === "none") {
      // No size fields — just total stock
      return (
        <p className="text-xs text-muted-foreground italic">এই সাব-ক্যাটাগরিতে কোনো সাইজ ফিল্ড নেই। শুধু Total Stock ব্যবহার করুন।</p>
      );
    }

    if (subType === "hijab") {
      const hijabSizes = Object.keys(form.sizes);
      // Add default 90x30 if empty
      const ensureDefault = () => {
        if (Object.keys(form.sizes).length === 0) {
          setForm({ ...form, sizes: { "90x30": { stock: "", measurements: { width: "90", length: "30" } } } });
        }
      };
      // eslint-disable-next-line react-hooks/rules-of-hooks
      if (hijabSizes.length === 0) {
        setTimeout(ensureDefault, 0);
      }

      return (
        <div className="space-y-4 border border-border p-3 rounded-lg bg-secondary/20">
          <p className="text-xs font-medium text-muted-foreground">হিজাব/ওড়না — কাস্টম সাইজ যোগ করুন (Width × Length ইঞ্চি)</p>
          
          {/* Existing sizes — use stable index-based keys */}
          {Object.entries(form.sizes).map(([sizeKey, data]: [string, any], idx) => (
            <div key={`hijab-size-${idx}`} className="flex flex-col gap-2 p-2 bg-secondary/30 rounded-lg border border-border/50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">{data?.measurements?.width || "?"}" × {data?.measurements?.length || "?"}"</span>
                <button type="button" onClick={() => {
                  const newSizes = { ...form.sizes };
                  delete newSizes[sizeKey];
                  setForm({ ...form, sizes: newSizes });
                }} className="text-destructive hover:text-destructive/80 p-1"><X size={14} /></button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input type="number" value={data?.stock || ""} onChange={(e) => setForm({ ...form, sizes: { ...form.sizes, [sizeKey]: { ...data, stock: e.target.value } } })} className={inputCls} placeholder="Stock" />
                <input type="text" value={data?.measurements?.width || ""} onChange={(e) => {
                  // Update measurement only, don't change key during typing
                  setForm({ ...form, sizes: { ...form.sizes, [sizeKey]: { ...data, measurements: { ...data?.measurements, width: e.target.value } } } });
                }} onBlur={() => {
                  // Rebuild key on blur
                  const w = data?.measurements?.width || "";
                  const l = data?.measurements?.length || "";
                  const newKey = `${w}x${l}`;
                  if (newKey !== sizeKey && w && l) {
                    const newSizes = { ...form.sizes };
                    const val = newSizes[sizeKey];
                    delete newSizes[sizeKey];
                    newSizes[newKey] = val;
                    setForm({ ...form, sizes: newSizes });
                  }
                }} className={inputCls} placeholder='Width (চওড়া)"' />
                <input type="text" value={data?.measurements?.length || ""} onChange={(e) => {
                  setForm({ ...form, sizes: { ...form.sizes, [sizeKey]: { ...data, measurements: { ...data?.measurements, length: e.target.value } } } });
                }} onBlur={() => {
                  const w = data?.measurements?.width || "";
                  const l = data?.measurements?.length || "";
                  const newKey = `${w}x${l}`;
                  if (newKey !== sizeKey && w && l) {
                    const newSizes = { ...form.sizes };
                    const val = newSizes[sizeKey];
                    delete newSizes[sizeKey];
                    newSizes[newKey] = val;
                    setForm({ ...form, sizes: newSizes });
                  }
                }} className={inputCls} placeholder='Length (লম্বা)"' />
              </div>
            </div>
          ))}

          {/* Add new size button */}
          <button type="button" onClick={() => {
            const newKey = `new_${Date.now()}`;
            setForm({ ...form, sizes: { ...form.sizes, [newKey]: { stock: "", measurements: { width: "", length: "" } } } });
          }} className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium py-2">
            <Plus size={14} /> নতুন সাইজ যোগ করুন
          </button>
        </div>
      );
    }

    if (subType === "shoes") {
      return (
        <div className="space-y-3 border border-border p-3 rounded-lg bg-secondary/20">
          <p className="text-xs font-medium text-muted-foreground">জুতা — প্রতিটি সাইজের স্টক দিন</p>
          <div className="grid grid-cols-5 gap-2">
            {SHOE_SIZES.map((sz) => (
              <div key={sz}>
                <span className="block text-center text-[10px] text-muted-foreground mb-1">{sz}</span>
                <input
                  type="number"
                  value={form.sizes[sz]?.stock || ""}
                  onChange={(e) => setForm({ ...form, sizes: { ...form.sizes, [sz]: { stock: e.target.value, measurements: {} } } })}
                  className={`text-center px-1 py-2 border border-border rounded-lg text-sm focus:outline-none bg-transparent text-foreground placeholder:text-muted-foreground w-full`}
                  placeholder="0"
                />
              </div>
            ))}
          </div>
        </div>
      );
    }

    // clothing
    return (
      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground">পোশাক — সাইজ, স্টক ও মাপ দিন</p>
        {LETTER_SIZES.map((sz) => (
          <div key={sz} className="border border-border p-3 rounded-lg flex flex-col gap-2 bg-secondary/10">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-sm w-12">{sz}</span>
              <input type="number" value={form.sizes[sz]?.stock || ""} onChange={(e) => setForm({ ...form, sizes: { ...form.sizes, [sz]: { ...form.sizes[sz], stock: e.target.value } } })} className={`${inputCls} w-24 py-1.5 px-2 text-center text-sm min-h-0`} placeholder="Stock" />
            </div>
            <div className="grid grid-cols-3 gap-1.5 mt-1">
              <input type="text" value={form.sizes[sz]?.measurements?.bust || ""} onChange={(e) => setForm({ ...form, sizes: { ...form.sizes, [sz]: { ...form.sizes[sz], measurements: { ...form.sizes[sz]?.measurements, bust: e.target.value } } } })} className={`${inputCls} text-[10px] px-1 py-1.5 h-auto text-center`} placeholder="Bust (বডি)" />
              <input type="text" value={form.sizes[sz]?.measurements?.length || ""} onChange={(e) => setForm({ ...form, sizes: { ...form.sizes, [sz]: { ...form.sizes[sz], measurements: { ...form.sizes[sz]?.measurements, length: e.target.value } } } })} className={`${inputCls} text-[10px] px-1 py-1.5 h-auto text-center`} placeholder="Length (লম্বা)" />
              <input type="text" value={form.sizes[sz]?.measurements?.shoulder || ""} onChange={(e) => setForm({ ...form, sizes: { ...form.sizes, [sz]: { ...form.sizes[sz], measurements: { ...form.sizes[sz]?.measurements, shoulder: e.target.value } } } })} className={`${inputCls} text-[10px] px-1 py-1.5 h-auto text-center`} placeholder="Shoulder (কাঁধ)" />
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input type="text" placeholder={t("admin.searchProducts")} value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm focus:outline-none focus:border-ring text-foreground placeholder:text-muted-foreground" />
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity">
          <Plus size={16} /> {t("admin.addProduct")}
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 border border-border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-serif text-lg text-foreground">{editingId ? t("admin.editProduct") : t("admin.addProduct")}</h3>
              <button onClick={resetForm} className="p-1 hover:bg-secondary rounded"><X size={18} /></button>
            </div>
            <div className="space-y-4">
              {/* English name */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">{t("admin.productName")}</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Product name (English)" className={inputCls} />
              </div>
              {/* Bangla name */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">{t("admin.productNameBn")}</label>
                <input value={form.name_bn} onChange={(e) => setForm({ ...form, name_bn: e.target.value })} placeholder="পণ্যের নাম (বাংলা)" className={inputCls} />
              </div>

              {/* Pricing fields */}
              <div className="space-y-3 p-3 border border-border rounded-lg bg-secondary/10">
                <p className="text-xs font-medium text-muted-foreground">মূল্য নির্ধারণ</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] text-muted-foreground mb-1">Original Price (MRP)</label>
                    <input value={form.original_price} onChange={(e) => setForm({ ...form, original_price: e.target.value })} placeholder="MRP ৳" type="number" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-[10px] text-muted-foreground mb-1">Sale Price (বিক্রয় মূল্য)</label>
                    <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="Sale ৳" type="number" className={inputCls} />
                  </div>
                </div>
                {form.original_price && form.price && parseFloat(form.original_price) > parseFloat(form.price) && (
                  <p className="text-xs text-green-600 font-medium">
                    ডিসকাউন্ট: {Math.round(((parseFloat(form.original_price) - parseFloat(form.price)) / parseFloat(form.original_price)) * 100)}% OFF
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <input
                  value={subType !== "none" && Object.keys(form.sizes).length > 0 ? String(Object.values(form.sizes).reduce((acc: number, curr: any) => acc + (parseInt(curr?.stock ?? curr) || 0), 0)) : form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                  disabled={subType !== "none" && Object.keys(form.sizes).length > 0}
                  placeholder={t("admin.stock")}
                  type="number"
                  className={inputCls + (subType !== "none" && Object.keys(form.sizes).length > 0 ? " opacity-50 cursor-not-allowed" : "")}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value, sub_category: "", sizes: {} })} className="px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none bg-card text-foreground">
                  <option value="">{t("admin.selectCategory")}</option>
                  {categories.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
                {availableSubCats.length > 0 ? (
                  <select value={form.sub_category} onChange={(e) => setForm({ ...form, sub_category: e.target.value, sizes: {} })} className="px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none bg-card text-foreground">
                    <option value="">Sub-category</option>
                    {availableSubCats.map((sc) => <option key={sc} value={sc}>{sc}</option>)}
                  </select>
                ) : (
                  <select value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none bg-card text-foreground">
                    <option value="">{t("admin.selectBrand")}</option>
                    {brands.map((b: any) => <option key={b.id} value={b.name}>{b.name}</option>)}
                  </select>
                )}
              </div>

              {availableSubCats.length > 0 && (
                <select value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none bg-card text-foreground">
                  <option value="">{t("admin.selectBrand")}</option>
                  {brands.map((b: any) => <option key={b.id} value={b.name}>{b.name}</option>)}
                </select>
              )}

              {/* Dynamic size/measurement fields */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Sizes & Measurements</label>
                {renderSizeFields()}
              </div>

              {/* English description */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">{t("admin.descriptionEn")}</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description (English)" rows={2} className={`${inputCls} resize-none`} />
              </div>
              {/* Bangla description */}
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">{t("admin.descriptionBn")}</label>
                <textarea value={form.description_bn} onChange={(e) => setForm({ ...form, description_bn: e.target.value })} placeholder="বিবরণ (বাংলা)" rows={2} className={`${inputCls} resize-none`} />
              </div>

              {/* Images */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">{t("admin.images")}</label>
                <input type="file" accept="image/*" multiple onChange={(e) => {
                  const newFiles = Array.from(e.target.files || []);
                  const totalCount = existingImages.length + imageFiles.length + newFiles.length;
                  if (totalCount > 10) {
                    toast({ title: "সর্বোচ্চ ১০টি ছবি", variant: "destructive" });
                    const allowed = 10 - existingImages.length - imageFiles.length;
                    const trimmed = newFiles.slice(0, Math.max(0, allowed));
                    setImageFiles(prev => [...prev, ...trimmed]);
                    setImagePreviews(prev => [...prev, ...trimmed.map(f => URL.createObjectURL(f))]);
                  } else {
                    setImageFiles(prev => [...prev, ...newFiles]);
                    setImagePreviews(prev => [...prev, ...newFiles.map(f => URL.createObjectURL(f))]);
                  }
                  e.target.value = "";
                }} className="w-full text-sm text-muted-foreground" />

                {/* Existing + new image previews */}
                {(existingImages.length > 0 || imagePreviews.length > 0) && (
                  <div className="grid grid-cols-5 gap-2 mt-3">
                    {/* Existing images from DB */}
                    {existingImages.map((url, i) => (
                      <div key={`existing-${i}`} className="relative aspect-square rounded-lg overflow-hidden border border-border group">
                        <img src={url} alt={`Existing ${i + 1}`} className="w-full h-full object-cover" />
                        {i === 0 && <span className="absolute bottom-0 left-0 right-0 bg-primary/80 text-primary-foreground text-[9px] text-center py-0.5">Main</span>}
                        <button type="button" onClick={() => {
                          setExistingImages(prev => prev.filter((_, idx) => idx !== i));
                        }} className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                      </div>
                    ))}
                    {/* Newly selected files */}
                    {imagePreviews.map((src, i) => (
                      <div key={`new-${i}`} className="relative aspect-square rounded-lg overflow-hidden border border-border group">
                        <img src={src} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
                        {existingImages.length === 0 && i === 0 && <span className="absolute bottom-0 left-0 right-0 bg-primary/80 text-primary-foreground text-[9px] text-center py-0.5">Main</span>}
                        <button type="button" onClick={() => {
                          const nf = [...imageFiles]; nf.splice(i, 1); setImageFiles(nf);
                          const np = [...imagePreviews]; URL.revokeObjectURL(np[i]); np.splice(i, 1); setImagePreviews(np);
                        }} className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">×</button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">{existingImages.length + imageFiles.length}/10 images</p>
              </div>

              <label className="flex items-center gap-2 text-sm text-foreground">
                <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} className="rounded" />
                {t("admin.featured")}
              </label>

              <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.name || !form.price} className="w-full bg-primary text-primary-foreground py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                {saveMutation.isPending ? t("admin.saving") : editingId ? t("admin.update") : t("admin.save")}
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
                <th className="text-left p-3 font-medium text-muted-foreground">{t("admin.category")}</th>
                <th className="text-right p-3 font-medium text-muted-foreground">Price</th>
                <th className="text-right p-3 font-medium text-muted-foreground">{t("admin.stockLabel")}</th>
                <th className="text-right p-3 font-medium text-muted-foreground">{t("admin.actions")}</th>
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
                      <div>
                        <span className="font-medium truncate max-w-[200px] text-foreground block">{p.name}</span>
                        {p.sub_category && <span className="text-[10px] text-muted-foreground">{p.sub_category}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground">{p.category || "—"}</td>
                  <td className="p-3 text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-medium text-foreground">{formatPrice(p.price)}</span>
                      {p.original_price && p.original_price > p.price && (
                        <span className="text-[10px] text-muted-foreground line-through">{formatPrice(p.original_price)}</span>
                      )}
                    </div>
                  </td>
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
              {filtered.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">{t("admin.noProducts")}</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-sm p-6 border border-border text-center">
            <Trash2 size={32} className="mx-auto mb-3 text-destructive" />
            <h3 className="font-serif text-lg mb-2 text-foreground">{t("admin.confirmDelete")}</h3>
            <p className="text-sm text-muted-foreground mb-1">"{deleteTarget.name}"</p>
            <p className="text-xs text-muted-foreground mb-6">{t("admin.deleteWarning")}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteTarget(null)} className="px-5 py-2 border border-border rounded-full text-sm font-medium text-foreground hover:bg-secondary transition-colors">{t("admin.cancel")}</button>
              <button onClick={() => deleteMutation.mutate(deleteTarget)} disabled={deleteMutation.isPending} className="px-5 py-2 bg-destructive text-destructive-foreground rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                {deleteMutation.isPending ? t("admin.deleting") : t("admin.delete")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
