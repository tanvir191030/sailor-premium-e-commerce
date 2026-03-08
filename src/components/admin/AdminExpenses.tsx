import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/currency";
import { useToast } from "@/hooks/use-toast";
import { Wallet, Plus, Trash2, Download, Calendar, X, Printer, Pencil, Package, ShoppingCart } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type TimeFilter = "today" | "week" | "month" | "year" | "all";

const EXPENSE_CATEGORIES = [
  { value: "purchase", label: "পণ্য কেনা" },
  { value: "packaging", label: "প্যাকেজিং" },
  { value: "ads", label: "বিজ্ঞাপন/মার্কেটিং" },
  { value: "shipping", label: "শিপিং/কুরিয়ার" },
  { value: "rent", label: "অফিস ভাড়া" },
  { value: "salary", label: "বেতন" },
  { value: "utility", label: "ইউটিলিটি বিল" },
  { value: "other", label: "অন্যান্য" },
];

interface ExpenseForm {
  id?: string;
  title: string;
  amount: string;
  category: string;
  description: string;
  expense_date: string;
  product_id: string;
  product_category: string;
  product_sub_category: string;
  quantity: string;
  unit_price: string;
}

const emptyForm: ExpenseForm = {
  title: "",
  amount: "",
  category: "purchase",
  description: "",
  expense_date: new Date().toISOString().split("T")[0],
  product_id: "",
  product_category: "",
  product_sub_category: "",
  quantity: "",
  unit_price: "",
};

const AdminExpenses = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("month");
  const [form, setForm] = useState<ExpenseForm>({ ...emptyForm });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("name");
      return data || [];
    },
  });

  // Fetch sub-categories
  const { data: subCategories = [] } = useQuery({
    queryKey: ["sub-categories"],
    queryFn: async () => {
      const { data } = await supabase.from("sub_categories").select("*").order("name");
      return data || [];
    },
  });

  // Fetch products
  const { data: products = [] } = useQuery({
    queryKey: ["all-products-for-expense"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id, name, category, sub_category, price, image_url").order("name");
      return data || [];
    },
  });

  // Filter sub-categories by selected category
  const filteredSubCategories = useMemo(() => {
    if (!form.product_category) return [];
    const cat = categories.find((c: any) => c.name === form.product_category);
    if (!cat) return [];
    return subCategories.filter((sc: any) => sc.category_id === cat.id);
  }, [form.product_category, categories, subCategories]);

  // Filter products by selected category & sub-category
  const filteredProducts = useMemo(() => {
    let filtered = products;
    if (form.product_category) {
      filtered = filtered.filter((p: any) => p.category === form.product_category);
    }
    if (form.product_sub_category) {
      filtered = filtered.filter((p: any) => p.sub_category === form.product_sub_category);
    }
    return filtered;
  }, [form.product_category, form.product_sub_category, products]);

  // Auto-calc total
  const calcTotal = (qty: string, unitPrice: string) => {
    const q = Number(qty) || 0;
    const u = Number(unitPrice) || 0;
    return (q * u).toString();
  };

  const handleFormChange = (field: keyof ExpenseForm, value: string) => {
    const updated = { ...form, [field]: value };

    if (field === "product_category") {
      updated.product_sub_category = "";
      updated.product_id = "";
    }
    if (field === "product_sub_category") {
      updated.product_id = "";
    }
    if (field === "product_id" && value) {
      const product = products.find((p: any) => p.id === value);
      if (product) {
        updated.title = updated.title || product.name;
        updated.product_category = updated.product_category || product.category || "";
        updated.product_sub_category = updated.product_sub_category || product.sub_category || "";
      }
    }
    if (field === "quantity" || field === "unit_price") {
      updated.amount = calcTotal(
        field === "quantity" ? value : updated.quantity,
        field === "unit_price" ? value : updated.unit_price
      );
    }

    setForm(updated);
  };

  const getDateRange = (filter: TimeFilter) => {
    const now = new Date();
    if (filter === "today") return now.toISOString().split("T")[0];
    if (filter === "week") { const d = new Date(now); d.setDate(d.getDate() - 7); return d.toISOString().split("T")[0]; }
    if (filter === "month") { const d = new Date(now); d.setMonth(d.getMonth() - 1); return d.toISOString().split("T")[0]; }
    if (filter === "year") { const d = new Date(now); d.setFullYear(d.getFullYear() - 1); return d.toISOString().split("T")[0]; }
    return null;
  };

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["admin-expenses", timeFilter],
    queryFn: async () => {
      let query = (supabase as any).from("expenses").select("*, products:product_id(name, image_url)").order("expense_date", { ascending: false });
      const dateFrom = getDateRange(timeFilter);
      if (dateFrom) query = query.gte("expense_date", dateFrom);
      const { data, error } = await query;
      if (error) throw error;
      return data as any[];
    },
  });

  // Add or Update expense + sync inventory
  const saveExpense = useMutation({
    mutationFn: async () => {
      if (!form.title.trim()) throw new Error("শিরোনাম আবশ্যক");
      const isPurchase = form.category === "purchase";
      if (isPurchase && (!form.quantity || !form.unit_price)) throw new Error("পণ্য কেনার জন্য পরিমাণ ও ইউনিট দাম আবশ্যক");

      const amount = isPurchase ? Number(calcTotal(form.quantity, form.unit_price)) : Number(form.amount);
      if (!amount || amount <= 0) throw new Error("পরিমাণ সঠিক নয়");

      const payload = {
        title: form.title.trim(),
        amount,
        category: form.category,
        description: form.description.trim() || null,
        expense_date: form.expense_date,
        product_id: form.product_id || null,
        product_category: form.product_category || null,
        product_sub_category: form.product_sub_category || null,
        quantity: Number(form.quantity) || 0,
        unit_price: Number(form.unit_price) || 0,
      };

      if (editMode && form.id) {
        // Get old expense to reverse stock
        const { data: oldExpense } = await (supabase as any).from("expenses").select("*").eq("id", form.id).single();

        const { error } = await (supabase as any).from("expenses").update(payload).eq("id", form.id);
        if (error) throw error;

        // Reverse old stock and apply new stock
        if (oldExpense?.category === "purchase" && oldExpense.product_id) {
          const { data: product } = await supabase.from("products").select("stock").eq("id", oldExpense.product_id).single();
          if (product) {
            const newStock = product.stock - (oldExpense.quantity || 0);
            await supabase.from("products").update({ stock: Math.max(0, newStock) }).eq("id", oldExpense.product_id);
          }
        }

        if (isPurchase && form.product_id) {
          const { data: product } = await supabase.from("products").select("stock").eq("id", form.product_id).single();
          if (product) {
            await supabase.from("products").update({ stock: product.stock + (Number(form.quantity) || 0) }).eq("id", form.product_id);
          }
        }
      } else {
        const { error } = await (supabase as any).from("expenses").insert(payload);
        if (error) throw error;

        // Sync inventory for purchase
        if (isPurchase && form.product_id) {
          const { data: product } = await supabase.from("products").select("stock").eq("id", form.product_id).single();
          if (product) {
            await supabase.from("products").update({ stock: product.stock + (Number(form.quantity) || 0) }).eq("id", form.product_id);
          }
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["admin-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["all-products-for-expense"] });
      setForm({ ...emptyForm });
      setShowForm(false);
      setEditMode(false);
      toast({ title: editMode ? "খরচ আপডেট হয়েছে ✅" : "খরচ যোগ হয়েছে ✅" });
    },
    onError: (err: any) => toast({ title: err.message, variant: "destructive" }),
  });

  const deleteExpense = useMutation({
    mutationFn: async (expense: any) => {
      // Reverse stock if it was a purchase
      if (expense.category === "purchase" && expense.product_id) {
        const { data: product } = await supabase.from("products").select("stock").eq("id", expense.product_id).single();
        if (product) {
          const newStock = product.stock - (expense.quantity || 0);
          await supabase.from("products").update({ stock: Math.max(0, newStock) }).eq("id", expense.product_id);
        }
      }
      const { error } = await (supabase as any).from("expenses").delete().eq("id", expense.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-expenses"] });
      queryClient.invalidateQueries({ queryKey: ["admin-inventory"] });
      queryClient.invalidateQueries({ queryKey: ["all-products-for-expense"] });
      toast({ title: "মুছে ফেলা হয়েছে" });
    },
  });

  const startEdit = (e: any) => {
    setForm({
      id: e.id,
      title: e.title,
      amount: String(e.amount),
      category: e.category,
      description: e.description || "",
      expense_date: e.expense_date,
      product_id: e.product_id || "",
      product_category: e.product_category || "",
      product_sub_category: e.product_sub_category || "",
      quantity: String(e.quantity || ""),
      unit_price: String(e.unit_price || ""),
    });
    setEditMode(true);
    setShowForm(true);
  };

  const cancelForm = () => {
    setForm({ ...emptyForm });
    setShowForm(false);
    setEditMode(false);
  };

  const totalExpenses = expenses.reduce((s: number, e: any) => s + Number(e.amount), 0);
  const purchaseTotal = expenses.filter((e: any) => e.category === "purchase").reduce((s: number, e: any) => s + Number(e.amount), 0);
  const otherTotal = totalExpenses - purchaseTotal;

  const isPurchaseCategory = form.category === "purchase";

  const inputCls = "w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 hover:border-primary/50 transition-colors";
  const selectCls = `${inputCls} [&>option]:bg-background [&>option]:text-foreground`;

  // Exports
  const exportExcel = () => {
    const rows = expenses.map((e: any) => ({
      "তারিখ": e.expense_date,
      "শিরোনাম": e.title,
      "ক্যাটাগরি": EXPENSE_CATEGORIES.find((c) => c.value === e.category)?.label || e.category,
      "পণ্য ক্যাটাগরি": e.product_category || "-",
      "সাব-ক্যাটাগরি": e.product_sub_category || "-",
      "পণ্য": e.products?.name || "-",
      "পিস": e.quantity || "-",
      "ইউনিট দাম": e.unit_price || "-",
      "মোট পরিমাণ": e.amount,
      "বিবরণ": e.description || "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Expenses");
    XLSX.writeFile(wb, `expenses-${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(16);
    doc.text("Expense Report", 14, 20);
    doc.setFontSize(10);
    doc.text(`Total: ${totalExpenses.toFixed(0)} BDT | Purchase: ${purchaseTotal.toFixed(0)} BDT | Other: ${otherTotal.toFixed(0)} BDT`, 14, 28);
    autoTable(doc, {
      startY: 35,
      head: [["Date", "Title", "Type", "Category", "Sub-Cat", "Product", "Pcs", "Unit Price", "Total", "Note"]],
      body: expenses.map((e: any) => [
        e.expense_date, e.title,
        EXPENSE_CATEGORIES.find((c) => c.value === e.category)?.label || e.category,
        e.product_category || "-", e.product_sub_category || "-",
        e.products?.name || "-", e.quantity || "-", e.unit_price || "-",
        e.amount, e.description || "",
      ]),
      styles: { fontSize: 8 },
    });
    doc.save(`expenses-${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const { settings } = useSiteSettings();
  const storeName = settings.store_name || "Modest Mart";

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const rows = expenses.map((e: any) => `
      <tr>
        <td style="padding:5px 8px;border-bottom:1px solid #eee;font-size:11px">${new Date(e.expense_date).toLocaleDateString("en-GB")}</td>
        <td style="padding:5px 8px;border-bottom:1px solid #eee;font-size:11px">${e.title}</td>
        <td style="padding:5px 8px;border-bottom:1px solid #eee;font-size:11px">${EXPENSE_CATEGORIES.find((c) => c.value === e.category)?.label || e.category}</td>
        <td style="padding:5px 8px;border-bottom:1px solid #eee;font-size:11px">${e.product_category || "-"}</td>
        <td style="padding:5px 8px;border-bottom:1px solid #eee;font-size:11px">${e.product_sub_category || "-"}</td>
        <td style="padding:5px 8px;border-bottom:1px solid #eee;font-size:11px">${e.products?.name || "-"}</td>
        <td style="padding:5px 8px;border-bottom:1px solid #eee;text-align:center;font-size:11px">${e.quantity || "-"}</td>
        <td style="padding:5px 8px;border-bottom:1px solid #eee;text-align:right;font-size:11px">${e.unit_price ? `৳${Number(e.unit_price).toLocaleString()}` : "-"}</td>
        <td style="padding:5px 8px;border-bottom:1px solid #eee;text-align:right;font-weight:bold;font-size:11px">৳${Number(e.amount).toLocaleString()}</td>
      </tr>`).join("");
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Expense Report</title><style>body{font-family:Arial,sans-serif;padding:30px}table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#f5f5f5;padding:6px 8px;text-align:left;border-bottom:2px solid #ddd;font-size:11px}td{font-size:11px}h1{font-size:20px;margin:0}p{color:#666;font-size:12px;margin:4px 0}@media print{body{padding:15px}}</style></head><body>
      <h1>${storeName} — Expense Report</h1>
      <p>Date: ${new Date().toLocaleDateString("en-GB")} | Total: ৳${totalExpenses.toLocaleString()} | Purchase: ৳${purchaseTotal.toLocaleString()} | Other: ৳${otherTotal.toLocaleString()}</p>
      <table><thead><tr><th>Date</th><th>Title</th><th>Type</th><th>Category</th><th>Sub-Cat</th><th>Product</th><th style="text-align:center">Pcs</th><th style="text-align:right">Unit</th><th style="text-align:right">Total</th></tr></thead><tbody>${rows}</tbody></table>
    </body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  const timeLabels: Record<TimeFilter, string> = { today: "আজকের", week: "সাপ্তাহিক", month: "মাসিক", year: "বাৎসরিক", all: "সব" };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card p-4 rounded-xl shadow-sm border border-border">
          <div className="p-2 rounded-lg bg-destructive/10 w-fit mb-2"><Wallet size={16} className="text-destructive" /></div>
          <p className="text-xl font-bold text-foreground">{formatPrice(totalExpenses)}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">মোট খরচ ({timeLabels[timeFilter]})</p>
        </div>
        <div className="bg-card p-4 rounded-xl shadow-sm border border-border">
          <div className="p-2 rounded-lg bg-blue-500/10 w-fit mb-2"><Package size={16} className="text-blue-500" /></div>
          <p className="text-xl font-bold text-foreground">{formatPrice(purchaseTotal)}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">পণ্য কেনা</p>
        </div>
        <div className="bg-card p-4 rounded-xl shadow-sm border border-border">
          <div className="p-2 rounded-lg bg-amber-500/10 w-fit mb-2"><ShoppingCart size={16} className="text-amber-500" /></div>
          <p className="text-xl font-bold text-foreground">{formatPrice(otherTotal)}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">অন্যান্য খরচ</p>
        </div>
        <div className="bg-card p-4 rounded-xl shadow-sm border border-border">
          <div className="p-2 rounded-lg bg-emerald-500/10 w-fit mb-2"><Calendar size={16} className="text-emerald-500" /></div>
          <p className="text-xl font-bold text-foreground">{expenses.length}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">মোট এন্ট্রি</p>
        </div>
      </div>

      {/* Main Section */}
      <div className="bg-card p-5 rounded-xl shadow-sm border border-border">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Wallet size={18} className="text-muted-foreground" />
            <h3 className="font-serif text-base text-foreground">খরচ ম্যানেজার</h3>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => { cancelForm(); setShowForm(true); }} className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:opacity-90 transition-opacity">
              <Plus size={12} /> খরচ যোগ করুন
            </button>
            <button onClick={exportExcel} className="flex items-center gap-1.5 px-3 py-2 bg-secondary text-foreground border border-border rounded-lg text-xs font-medium hover:bg-secondary/80">
              <Download size={12} /> Excel
            </button>
            <button onClick={exportPDF} className="flex items-center gap-1.5 px-3 py-2 bg-secondary text-foreground border border-border rounded-lg text-xs font-medium hover:bg-secondary/80">
              <Download size={12} /> PDF
            </button>
            <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-2 bg-secondary text-foreground border border-border rounded-lg text-xs font-medium hover:bg-secondary/80">
              <Printer size={12} /> Print
            </button>
          </div>
        </div>

        {/* Time Filter */}
        <div className="flex gap-1 bg-secondary p-1 rounded-lg mb-4 w-fit">
          {(Object.keys(timeLabels) as TimeFilter[]).map((t) => (
            <button key={t} onClick={() => setTimeFilter(t)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${timeFilter === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {timeLabels[t]}
            </button>
          ))}
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <div className="border border-border rounded-xl p-4 sm:p-5 mb-4 bg-secondary/30">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-foreground">{editMode ? "খরচ সম্পাদনা করুন" : "নতুন খরচ যোগ করুন"}</h4>
              <button onClick={cancelForm} className="p-1.5 hover:bg-secondary rounded-lg"><X size={14} /></button>
            </div>

            {/* Row 1: Category type + Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">খরচের ধরন *</label>
                <select value={form.category} onChange={(e) => handleFormChange("category", e.target.value)} className={selectCls}>
                  {EXPENSE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">তারিখ *</label>
                <input value={form.expense_date} onChange={(e) => handleFormChange("expense_date", e.target.value)} type="date" className={inputCls} />
              </div>
            </div>

            {/* Row 2: Product details (shown for "purchase") */}
            {isPurchaseCategory && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">ক্যাটাগরি</label>
                    <select value={form.product_category} onChange={(e) => handleFormChange("product_category", e.target.value)} className={inputCls}>
                      <option value="">সব ক্যাটাগরি</option>
                      {categories.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">সাব-ক্যাটাগরি</label>
                    <select value={form.product_sub_category} onChange={(e) => handleFormChange("product_sub_category", e.target.value)} className={inputCls} disabled={!form.product_category}>
                      <option value="">সব সাব-ক্যাটাগরি</option>
                      {filteredSubCategories.map((sc: any) => <option key={sc.id} value={sc.name}>{sc.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">পণ্য নির্বাচন করুন *</label>
                    <select value={form.product_id} onChange={(e) => handleFormChange("product_id", e.target.value)} className={inputCls}>
                      <option value="">-- পণ্য বেছে নিন --</option>
                      {filteredProducts.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">পরিমাণ (পিস) *</label>
                    <input value={form.quantity} onChange={(e) => handleFormChange("quantity", e.target.value.replace(/[^0-9]/g, ""))} placeholder="যেমন: 50" type="number" className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">ইউনিট দাম (৳) *</label>
                    <input value={form.unit_price} onChange={(e) => handleFormChange("unit_price", e.target.value.replace(/[^0-9.]/g, ""))} placeholder="যেমন: 150" type="number" className={inputCls} />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">মোট খরচ</label>
                    <div className="px-3 py-2.5 border border-border rounded-lg text-sm bg-secondary/50 text-foreground font-bold">
                      {formatPrice(Number(calcTotal(form.quantity, form.unit_price)))}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Row 3: Title + Amount (for non-purchase) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">শিরোনাম *</label>
                <input value={form.title} onChange={(e) => handleFormChange("title", e.target.value)} placeholder="খরচের শিরোনাম" className={inputCls} maxLength={100} />
              </div>
              {!isPurchaseCategory && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">পরিমাণ (৳) *</label>
                  <input value={form.amount} onChange={(e) => handleFormChange("amount", e.target.value.replace(/[^0-9.]/g, ""))} placeholder="পরিমাণ" type="number" className={inputCls} />
                </div>
              )}
            </div>

            {/* Description */}
            <div className="mb-3">
              <label className="text-xs text-muted-foreground mb-1 block">বিবরণ (ঐচ্ছিক)</label>
              <input value={form.description} onChange={(e) => handleFormChange("description", e.target.value)} placeholder="অতিরিক্ত তথ্য..." className={inputCls} maxLength={300} />
            </div>

            <div className="flex gap-2">
              <button onClick={() => saveExpense.mutate()} disabled={saveExpense.isPending} className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">
                {saveExpense.isPending ? "সেভ হচ্ছে..." : editMode ? "আপডেট করুন" : "সেভ করুন"}
              </button>
              <button onClick={cancelForm} className="px-4 py-2.5 bg-secondary text-foreground border border-border rounded-lg text-sm font-medium hover:bg-secondary/80">
                বাতিল
              </button>
            </div>
          </div>
        )}

        {/* Expenses List */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 text-muted-foreground font-medium text-xs"><Calendar size={10} className="inline mr-1" />তারিখ</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">শিরোনাম</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">ধরন</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium text-xs hidden lg:table-cell">পণ্য</th>
                <th className="text-center py-2 px-3 text-muted-foreground font-medium text-xs hidden md:table-cell">পিস</th>
                <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs hidden md:table-cell">ইউনিট</th>
                <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs">মোট</th>
                <th className="text-center py-2 px-3 text-muted-foreground font-medium text-xs w-20">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">লোড হচ্ছে...</td></tr>
              ) : expenses.length === 0 ? (
                <tr><td colSpan={8} className="py-8 text-center text-muted-foreground">কোনো খরচ পাওয়া যায়নি</td></tr>
              ) : expenses.map((e: any) => (
                <tr key={e.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="py-2.5 px-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(e.expense_date).toLocaleDateString("bn-BD")}</td>
                  <td className="py-2.5 px-3 text-foreground font-medium">
                    <div className="flex items-center gap-2">
                      {e.products?.image_url && (
                        <img src={e.products.image_url} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                      )}
                      <div>
                        <p className="text-sm">{e.title}</p>
                        {e.description && <p className="text-[10px] text-muted-foreground">{e.description}</p>}
                        {e.product_category && (
                          <p className="text-[10px] text-muted-foreground">{e.product_category}{e.product_sub_category ? ` › ${e.product_sub_category}` : ""}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${e.category === "purchase" ? "bg-blue-500/10 text-blue-500" : "bg-secondary text-foreground"}`}>
                      {EXPENSE_CATEGORIES.find((c) => c.value === e.category)?.label || e.category}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-xs text-muted-foreground hidden lg:table-cell">{e.products?.name || "-"}</td>
                  <td className="py-2.5 px-3 text-center text-xs text-foreground hidden md:table-cell">{e.quantity || "-"}</td>
                  <td className="py-2.5 px-3 text-right text-xs text-foreground hidden md:table-cell">{e.unit_price ? formatPrice(e.unit_price) : "-"}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-foreground">{formatPrice(e.amount)}</td>
                  <td className="py-2.5 px-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => startEdit(e)} className="p-1.5 hover:bg-primary/10 rounded text-muted-foreground hover:text-primary transition-colors" title="সম্পাদনা">
                        <Pencil size={13} />
                      </button>
                      <button onClick={() => deleteExpense.mutate(e)} className="p-1.5 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive transition-colors" title="মুছুন">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminExpenses;
