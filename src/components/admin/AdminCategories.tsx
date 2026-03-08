import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Tag, ChevronDown, ChevronUp, FolderTree, Pencil, Check, X, Ruler, Upload, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useSubCategories, MEASUREMENT_TEMPLATES } from "@/hooks/useSubCategories";
import browserImageCompression from "browser-image-compression";

const AdminCategories = () => {
  const [newName, setNewName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [newSubName, setNewSubName] = useState("");
  const [newSubTemplate, setNewSubTemplate] = useState("clothing");
  const [deleteSubTarget, setDeleteSubTarget] = useState<any>(null);
  const [editingSub, setEditingSub] = useState<string | null>(null);
  const [editSubName, setEditSubName] = useState("");
  const [editSubTemplate, setEditSubTemplate] = useState("");
  // Size chart editor
  const [sizeChartSub, setSizeChartSub] = useState<any>(null);
  const [sizeChartRows, setSizeChartRows] = useState<Record<string, string>[]>([]);
  const [sizeChartImage, setSizeChartImage] = useState<string>("");
  const [uploadingSizeChart, setUploadingSizeChart] = useState(false);
  const sizeChartFileRef = useRef<HTMLInputElement>(null);

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

  // --- Mutations ---
  const addMutation = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase.from("categories").insert({ name });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["categories"] }); toast({ title: "ক্যাটাগরি যোগ হয়েছে" }); setNewName(""); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("categories").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["categories"] }); queryClient.invalidateQueries({ queryKey: ["sub-categories"] }); toast({ title: "ক্যাটাগরি ডিলিট হয়েছে" }); setDeleteTarget(null); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const addSubMutation = useMutation({
    mutationFn: async ({ name, categoryId, template }: { name: string; categoryId: string; template: string }) => {
      const { error } = await (supabase as any).from("sub_categories").insert({ name, category_id: categoryId, measurement_template: template });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["sub-categories"] }); toast({ title: "সাব-ক্যাটাগরি যোগ হয়েছে" }); setNewSubName(""); setNewSubTemplate("clothing"); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const editSubMutation = useMutation({
    mutationFn: async ({ id, name, template }: { id: string; name: string; template: string }) => {
      const { error } = await (supabase as any).from("sub_categories").update({ name, measurement_template: template }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["sub-categories"] }); toast({ title: "সাব-ক্যাটাগরি আপডেট হয়েছে" }); setEditingSub(null); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const deleteSubMutation = useMutation({
    mutationFn: async (id: string) => { const { error } = await (supabase as any).from("sub_categories").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["sub-categories"] }); toast({ title: "সাব-ক্যাটাগরি ডিলিট হয়েছে" }); setDeleteSubTarget(null); },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const saveSizeChartMutation = useMutation({
    mutationFn: async () => {
      if (!sizeChartSub) return;
      const { error } = await (supabase as any).from("sub_categories").update({
        size_chart_image: sizeChartImage || null,
        size_chart_data: sizeChartRows.length > 0 ? sizeChartRows : null,
      }).eq("id", sizeChartSub.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sub-categories"] });
      toast({ title: "সাইজ চার্ট সেভ হয়েছে ✅" });
      setSizeChartSub(null);
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const getSubsForCategory = (catId: string) => subCategories.filter((s: any) => s.category_id === catId);

  const startEditSub = (sub: any) => { setEditingSub(sub.id); setEditSubName(sub.name); setEditSubTemplate(sub.measurement_template); };

  // Size chart editor helpers
  const openSizeChartEditor = (sub: any) => {
    setSizeChartSub(sub);
    setSizeChartImage(sub.size_chart_image || "");
    setSizeChartRows(Array.isArray(sub.size_chart_data) ? sub.size_chart_data : []);
  };

  const getFieldsForTemplate = (template: string): string[] => {
    const templateMap: Record<string, string[]> = {
      clothing: ["size", "chest", "length", "shoulder"],
      panjabi: ["size", "chest", "length"],
      pants: ["size", "waist", "length"],
      hijab: ["size", "width", "length"],
      shoes: ["size", "eu", "uk", "us", "foot_length_cm"],
      salwar_kameez: ["size", "bust", "waist", "length"],
      jewellery: ["size", "diameter", "length"],
      watch: ["size", "case_mm"],
      none: ["size"],
    };
    return templateMap[template] || ["size"];
  };

  const addSizeChartRow = () => {
    const fields = getFieldsForTemplate(sizeChartSub?.measurement_template || "clothing");
    const row: Record<string, string> = {};
    fields.forEach(f => row[f] = "");
    setSizeChartRows([...sizeChartRows, row]);
  };

  const updateSizeChartRow = (idx: number, field: string, value: string) => {
    const updated = [...sizeChartRows];
    updated[idx] = { ...updated[idx], [field]: value };
    setSizeChartRows(updated);
  };

  const removeSizeChartRow = (idx: number) => {
    setSizeChartRows(sizeChartRows.filter((_, i) => i !== idx));
  };

  const handleSizeChartImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingSizeChart(true);
    try {
      const compressed = await browserImageCompression(file, { maxSizeMB: 0.5, maxWidthOrHeight: 1200, useWebWorker: true, fileType: "image/webp" });
      const fileName = `size-chart-${sizeChartSub.id}-${Date.now()}.webp`;
      const { error: uploadErr } = await supabase.storage.from("site-assets").upload(fileName, compressed, { contentType: "image/webp", upsert: true });
      if (uploadErr) throw uploadErr;
      const { data: urlData } = supabase.storage.from("site-assets").getPublicUrl(fileName);
      setSizeChartImage(urlData.publicUrl);
      toast({ title: "ছবি আপলোড হয়েছে ✅" });
    } catch (err: any) {
      toast({ title: "আপলোড ব্যর্থ", description: err.message, variant: "destructive" });
    } finally {
      setUploadingSizeChart(false);
    }
  };

  const fieldLabels: Record<string, string> = {
    size: "সাইজ", chest: "বুক (Chest)", length: "দৈর্ঘ্য (Length)", shoulder: "কাঁধ (Shoulder)",
    waist: "কোমর (Waist)", width: "চওড়া (Width)", bust: "বাস্ট (Bust)",
    eu: "EU", uk: "UK", us: "US", foot_length_cm: "পায়ের দৈর্ঘ্য (cm)",
    diameter: "ব্যাস", case_mm: "Case (mm)",
  };

  const inputCls = "px-3 py-2 border border-border rounded-lg text-sm bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none";

  return (
    <div className="space-y-6">
      {/* Add Category Form */}
      <div className="bg-card p-5 rounded-xl shadow-sm border border-border">
        <h3 className="font-serif text-lg text-foreground mb-4">Add New Category</h3>
        <div className="flex gap-3">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Category name (e.g. Men, Women, Kids)"
            onKeyDown={(e) => { if (e.key === "Enter" && newName.trim()) addMutation.mutate(newName.trim()); }}
            className="flex-1 px-4 py-2.5 border border-border rounded-lg text-sm focus:outline-none focus:border-ring bg-transparent text-foreground placeholder:text-muted-foreground" />
          <button onClick={() => { if (newName.trim()) addMutation.mutate(newName.trim()); }} disabled={!newName.trim() || addMutation.isPending}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
            <Plus size={16} /> Add
          </button>
        </div>
      </div>

      {/* Categories with Sub-categories */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-medium text-foreground flex items-center gap-2"><Tag size={18} /> All Categories ({categories.length})</h3>
        </div>
        <div className="divide-y divide-border">
          {categories.map((c: any) => {
            const subs = getSubsForCategory(c.id);
            const isExpanded = expandedCat === c.id;
            return (
              <div key={c.id}>
                <div className="flex items-center justify-between p-3 hover:bg-secondary/50">
                  <button onClick={() => setExpandedCat(isExpanded ? null : c.id)} className="flex items-center gap-3 flex-1 text-left">
                    {isExpanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
                    <span className="font-medium text-foreground">{c.name}</span>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-accent text-accent-foreground">{productCountMap[c.name] || 0} products</span>
                    <span className="px-2 py-0.5 rounded-full text-xs bg-secondary text-muted-foreground">{subs.length} sub</span>
                  </button>
                  <button onClick={() => setDeleteTarget(c)} className="p-1.5 hover:bg-destructive/10 text-destructive rounded"><Trash2 size={14} /></button>
                </div>

                {isExpanded && (
                  <div className="bg-secondary/30 px-4 py-4 space-y-3 border-t border-border/50">
                    {/* Add sub-category form */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input value={newSubName} onChange={(e) => setNewSubName(e.target.value)} placeholder="Sub-category name"
                        onKeyDown={(e) => { if (e.key === "Enter" && newSubName.trim()) addSubMutation.mutate({ name: newSubName.trim(), categoryId: c.id, template: newSubTemplate }); }}
                        className={`flex-1 ${inputCls}`} />
                      <select value={newSubTemplate} onChange={(e) => setNewSubTemplate(e.target.value)} className={`${inputCls} bg-card`}>
                        {Object.entries(MEASUREMENT_TEMPLATES).map(([key, tmpl]) => (<option key={key} value={key}>{tmpl.label}</option>))}
                      </select>
                      <button onClick={() => { if (newSubName.trim()) addSubMutation.mutate({ name: newSubName.trim(), categoryId: c.id, template: newSubTemplate }); }}
                        disabled={!newSubName.trim() || addSubMutation.isPending}
                        className="flex items-center gap-1.5 bg-primary text-primary-foreground px-4 py-2 rounded-full text-xs font-medium hover:opacity-90 disabled:opacity-50 whitespace-nowrap">
                        <Plus size={14} /> Add Sub
                      </button>
                    </div>

                    {/* Sub-categories list */}
                    {subs.length > 0 ? (
                      <div className="space-y-1.5">
                        {subs.map((sub: any) => (
                          <div key={sub.id} className="flex items-center justify-between bg-card p-2.5 rounded-lg border border-border/50">
                            {editingSub === sub.id ? (
                              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-1 mr-2">
                                <input value={editSubName} onChange={(e) => setEditSubName(e.target.value)} className={`flex-1 min-w-0 ${inputCls}`} autoFocus />
                                <select value={editSubTemplate} onChange={(e) => setEditSubTemplate(e.target.value)} className={`${inputCls} bg-card text-xs`}>
                                  {Object.entries(MEASUREMENT_TEMPLATES).map(([key, tmpl]) => (<option key={key} value={key}>{tmpl.label}</option>))}
                                </select>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <FolderTree size={14} className="text-muted-foreground flex-shrink-0" />
                                <span className="text-sm font-medium text-foreground truncate">{sub.name}</span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground flex-shrink-0">
                                  {MEASUREMENT_TEMPLATES[sub.measurement_template]?.label || sub.measurement_template}
                                </span>
                                {(sub.size_chart_image || (sub.size_chart_data && sub.size_chart_data.length > 0)) && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary flex-shrink-0">📏 সাইজ চার্ট</span>
                                )}
                              </div>
                            )}
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {editingSub === sub.id ? (
                                <>
                                  <button onClick={() => { if (editSubName.trim()) editSubMutation.mutate({ id: sub.id, name: editSubName.trim(), template: editSubTemplate }); }}
                                    disabled={!editSubName.trim() || editSubMutation.isPending} className="p-1 hover:bg-primary/10 text-primary rounded"><Check size={14} /></button>
                                  <button onClick={() => setEditingSub(null)} className="p-1 hover:bg-secondary text-muted-foreground rounded"><X size={14} /></button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => openSizeChartEditor(sub)} className="p-1 hover:bg-primary/10 text-primary rounded" title="সাইজ চার্ট সেটআপ">
                                    <Ruler size={12} />
                                  </button>
                                  <button onClick={() => startEditSub(sub)} className="p-1 hover:bg-secondary text-muted-foreground rounded"><Pencil size={12} /></button>
                                  <button onClick={() => setDeleteSubTarget(sub)} className="p-1 hover:bg-destructive/10 text-destructive rounded"><Trash2 size={12} /></button>
                                </>
                              )}
                            </div>
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
          {categories.length === 0 && (<div className="p-8 text-center text-muted-foreground">No categories yet. Add one above.</div>)}
        </div>
      </div>

      {/* Size Chart Editor Modal */}
      {sizeChartSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setSizeChartSub(null)}>
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden border border-border" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <h3 className="font-serif text-base text-foreground">সাইজ চার্ট সেটআপ</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{sizeChartSub.name} — {MEASUREMENT_TEMPLATES[sizeChartSub.measurement_template]?.label}</p>
              </div>
              <button onClick={() => setSizeChartSub(null)} className="p-1.5 hover:bg-secondary rounded-lg"><X size={16} /></button>
            </div>

            <div className="p-5 space-y-5 overflow-y-auto max-h-[calc(85vh-130px)]">
              {/* Image Upload */}
              <div>
                <label className="text-xs font-medium text-foreground mb-2 block">সাইজ চার্ট ছবি (ঐচ্ছিক)</label>
                <div className="flex items-start gap-3">
                  {sizeChartImage ? (
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-border">
                      <img src={sizeChartImage} alt="Size chart" className="w-full h-full object-contain bg-secondary" />
                      <button onClick={() => setSizeChartImage("")} className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full"><X size={10} /></button>
                    </div>
                  ) : (
                    <button onClick={() => sizeChartFileRef.current?.click()} disabled={uploadingSizeChart}
                      className="w-32 h-32 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors">
                      {uploadingSizeChart ? <span className="text-xs">আপলোড হচ্ছে...</span> : <><Upload size={18} /><span className="text-[10px]">ছবি আপলোড</span></>}
                    </button>
                  )}
                  <input ref={sizeChartFileRef} type="file" accept="image/*" className="hidden" onChange={handleSizeChartImageUpload} />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground">অথবা সরাসরি URL দিন:</p>
                    <input value={sizeChartImage} onChange={(e) => setSizeChartImage(e.target.value)} placeholder="https://..." className={`w-full mt-1 ${inputCls} text-xs`} />
                  </div>
                </div>
              </div>

              {/* Size Chart Table Editor */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-foreground">সাইজ চার্ট ডাটা (টেবিল)</label>
                  <button onClick={addSizeChartRow} className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-full text-[10px] font-medium hover:opacity-90">
                    <Plus size={10} /> সারি যোগ করুন
                  </button>
                </div>

                {sizeChartRows.length > 0 ? (
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-secondary">
                          {getFieldsForTemplate(sizeChartSub.measurement_template).map((f) => (
                            <th key={f} className="px-2 py-2 text-left font-medium text-muted-foreground">{fieldLabels[f] || f}</th>
                          ))}
                          <th className="px-2 py-2 w-8"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {sizeChartRows.map((row, idx) => (
                          <tr key={idx} className="border-t border-border">
                            {getFieldsForTemplate(sizeChartSub.measurement_template).map((f) => (
                              <td key={f} className="px-1 py-1">
                                <input value={row[f] || ""} onChange={(e) => updateSizeChartRow(idx, f, e.target.value)}
                                  className="w-full px-2 py-1.5 bg-transparent border border-border/50 rounded text-xs text-foreground focus:outline-none focus:border-primary/50"
                                  placeholder={f === "size" ? "M, L, XL..." : "—"} />
                              </td>
                            ))}
                            <td className="px-1 py-1 text-center">
                              <button onClick={() => removeSizeChartRow(idx)} className="p-1 hover:bg-destructive/10 text-destructive rounded"><Trash2 size={11} /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-6 border border-dashed border-border rounded-lg">
                    <Ruler size={24} className="mx-auto text-muted-foreground mb-2" />
                    <p className="text-xs text-muted-foreground">কোনো সাইজ ডাটা নেই। উপরে "সারি যোগ করুন" ক্লিক করুন।</p>
                    <p className="text-[10px] text-muted-foreground mt-1">অথবা শুধু ছবি আপলোড করুন।</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-border flex justify-end gap-2">
              <button onClick={() => setSizeChartSub(null)} className="px-4 py-2 border border-border rounded-lg text-sm text-foreground hover:bg-secondary">বাতিল</button>
              <button onClick={() => saveSizeChartMutation.mutate()} disabled={saveSizeChartMutation.isPending}
                className="px-5 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">
                {saveSizeChartMutation.isPending ? "সেভ হচ্ছে..." : "সেভ করুন"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Category Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-card rounded-xl shadow-2xl w-full max-w-sm p-6 border border-border text-center">
            <Trash2 size={32} className="mx-auto mb-3 text-destructive" />
            <h3 className="font-serif text-lg mb-2 text-foreground">ডিলিট নিশ্চিত করুন</h3>
            <p className="text-sm text-muted-foreground mb-1">"{deleteTarget.name}"</p>
            {(productCountMap[deleteTarget.name] || 0) > 0 && (<p className="text-xs text-destructive mb-2">⚠️ এই ক্যাটাগরিতে {productCountMap[deleteTarget.name]}টি প্রোডাক্ট আছে</p>)}
            <p className="text-xs text-muted-foreground mb-6">এটি ও এর সব সাব-ক্যাটাগরি স্থায়ীভাবে মুছে ফেলা হবে।</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setDeleteTarget(null)} className="px-5 py-2 border border-border rounded-full text-sm font-medium text-foreground hover:bg-secondary transition-colors">বাতিল</button>
              <button onClick={() => deleteMutation.mutate(deleteTarget.id)} disabled={deleteMutation.isPending}
                className="px-5 py-2 bg-destructive text-destructive-foreground rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
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
              <button onClick={() => deleteSubMutation.mutate(deleteSubTarget.id)} disabled={deleteSubMutation.isPending}
                className="px-5 py-2 bg-destructive text-destructive-foreground rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
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
