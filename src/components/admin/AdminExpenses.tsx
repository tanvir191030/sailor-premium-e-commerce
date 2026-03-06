import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/currency";
import { useToast } from "@/hooks/use-toast";
import { Wallet, Plus, Trash2, Download, Calendar, X } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type TimeFilter = "today" | "week" | "month" | "year" | "all";

const EXPENSE_CATEGORIES = [
  { value: "packaging", label: "প্যাকেজিং" },
  { value: "ads", label: "বিজ্ঞাপন/মার্কেটিং" },
  { value: "shipping", label: "শিপিং/কুরিয়ার" },
  { value: "rent", label: "অফিস ভাড়া" },
  { value: "salary", label: "বেতন" },
  { value: "utility", label: "ইউটিলিটি বিল" },
  { value: "purchase", label: "পণ্য কেনা" },
  { value: "other", label: "অন্যান্য" },
];

const AdminExpenses = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("month");
  const [form, setForm] = useState({ title: "", amount: "", category: "other", description: "", expense_date: new Date().toISOString().split("T")[0] });

  const getDateRange = (filter: TimeFilter) => {
    const now = new Date();
    if (filter === "today") {
      return now.toISOString().split("T")[0];
    } else if (filter === "week") {
      const d = new Date(now); d.setDate(d.getDate() - 7);
      return d.toISOString().split("T")[0];
    } else if (filter === "month") {
      const d = new Date(now); d.setMonth(d.getMonth() - 1);
      return d.toISOString().split("T")[0];
    } else if (filter === "year") {
      const d = new Date(now); d.setFullYear(d.getFullYear() - 1);
      return d.toISOString().split("T")[0];
    }
    return null;
  };

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["admin-expenses", timeFilter],
    queryFn: async () => {
      let query = (supabase as any).from("expenses").select("*").order("expense_date", { ascending: false });
      const dateFrom = getDateRange(timeFilter);
      if (dateFrom) query = query.gte("expense_date", dateFrom);
      const { data, error } = await query;
      if (error) throw error;
      return data as any[];
    },
  });

  const addExpense = useMutation({
    mutationFn: async () => {
      if (!form.title.trim() || !form.amount) throw new Error("শিরোনাম ও পরিমাণ আবশ্যক");
      const { error } = await (supabase as any).from("expenses").insert({
        title: form.title.trim(),
        amount: Number(form.amount),
        category: form.category,
        description: form.description.trim() || null,
        expense_date: form.expense_date,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-expenses"] });
      setForm({ title: "", amount: "", category: "other", description: "", expense_date: new Date().toISOString().split("T")[0] });
      setShowForm(false);
      toast({ title: "খরচ যোগ হয়েছে ✅" });
    },
    onError: (err: any) => toast({ title: err.message, variant: "destructive" }),
  });

  const deleteExpense = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("expenses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-expenses"] });
      toast({ title: "মুছে ফেলা হয়েছে" });
    },
  });

  const totalExpenses = expenses.reduce((s: number, e: any) => s + Number(e.amount), 0);
  const categoryTotals = EXPENSE_CATEGORIES.map((c) => ({
    ...c,
    total: expenses.filter((e: any) => e.category === c.value).reduce((s: number, e: any) => s + Number(e.amount), 0),
  })).filter((c) => c.total > 0).sort((a, b) => b.total - a.total);

  const inputCls = "w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none";

  const exportExcel = () => {
    const rows = expenses.map((e: any) => ({
      "তারিখ": e.expense_date,
      "শিরোনাম": e.title,
      "ক্যাটাগরি": EXPENSE_CATEGORIES.find((c) => c.value === e.category)?.label || e.category,
      "পরিমাণ": e.amount,
      "বিবরণ": e.description || "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Expenses");
    XLSX.writeFile(wb, `expenses-${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Expense Report", 14, 20);
    doc.setFontSize(10);
    doc.text(`Total: ${totalExpenses.toFixed(0)} BDT`, 14, 28);
    autoTable(doc, {
      startY: 35,
      head: [["Date", "Title", "Category", "Amount", "Description"]],
      body: expenses.map((e: any) => [
        e.expense_date, e.title,
        EXPENSE_CATEGORIES.find((c) => c.value === e.category)?.label || e.category,
        e.amount, e.description || "",
      ]),
    });
    doc.save(`expenses-${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const timeLabels: Record<TimeFilter, string> = { today: "আজকের", week: "সাপ্তাহিক", month: "মাসিক", year: "বাৎসরিক", all: "সব" };

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card p-4 rounded-xl shadow-sm border border-border col-span-2 lg:col-span-1">
          <div className="p-2 rounded-lg bg-destructive/10 w-fit mb-2"><Wallet size={16} className="text-destructive" /></div>
          <p className="text-xl font-bold text-foreground">{formatPrice(totalExpenses)}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">মোট খরচ ({timeLabels[timeFilter]})</p>
        </div>
        {categoryTotals.slice(0, 3).map((c) => (
          <div key={c.value} className="bg-card p-4 rounded-xl shadow-sm border border-border">
            <p className="text-xs text-muted-foreground mb-1">{c.label}</p>
            <p className="text-lg font-bold text-foreground">{formatPrice(c.total)}</p>
          </div>
        ))}
      </div>

      {/* Main Section */}
      <div className="bg-card p-5 rounded-xl shadow-sm border border-border">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Wallet size={18} className="text-muted-foreground" />
            <h3 className="font-serif text-base text-foreground">খরচ ম্যানেজার</h3>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:opacity-90 transition-opacity">
              <Plus size={12} /> খরচ যোগ করুন
            </button>
            <button onClick={exportExcel} className="flex items-center gap-1.5 px-3 py-2 bg-secondary text-foreground border border-border rounded-lg text-xs font-medium hover:bg-secondary/80">
              <Download size={12} /> Excel
            </button>
            <button onClick={exportPDF} className="flex items-center gap-1.5 px-3 py-2 bg-secondary text-foreground border border-border rounded-lg text-xs font-medium hover:bg-secondary/80">
              <Download size={12} /> PDF
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

        {/* Add Form */}
        {showForm && (
          <div className="border border-border rounded-xl p-4 mb-4 bg-secondary/30">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-foreground">নতুন খরচ যোগ করুন</h4>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-secondary rounded"><X size={14} /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="শিরোনাম *" className={inputCls} maxLength={100} />
              <input value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value.replace(/[^0-9.]/g, "") })} placeholder="পরিমাণ (৳) *" type="number" className={inputCls} />
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputCls}>
                {EXPENSE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
              <input value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} type="date" className={inputCls} />
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="বিবরণ (ঐচ্ছিক)" className={`${inputCls} sm:col-span-2`} maxLength={300} />
            </div>
            <button onClick={() => addExpense.mutate()} disabled={addExpense.isPending} className="mt-3 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50">
              {addExpense.isPending ? "সেভ হচ্ছে..." : "সেভ করুন"}
            </button>
          </div>
        )}

        {/* Expenses List */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 text-muted-foreground font-medium text-xs"><Calendar size={10} className="inline mr-1" />তারিখ</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">শিরোনাম</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">ক্যাটাগরি</th>
                <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs">পরিমাণ</th>
                <th className="text-center py-2 px-3 text-muted-foreground font-medium text-xs w-12"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">লোড হচ্ছে...</td></tr>
              ) : expenses.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-muted-foreground">কোনো খরচ পাওয়া যায়নি</td></tr>
              ) : expenses.map((e: any) => (
                <tr key={e.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="py-2.5 px-3 text-xs text-muted-foreground">{new Date(e.expense_date).toLocaleDateString("bn-BD")}</td>
                  <td className="py-2.5 px-3 text-foreground font-medium">
                    {e.title}
                    {e.description && <p className="text-[10px] text-muted-foreground mt-0.5">{e.description}</p>}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 bg-secondary text-foreground rounded-full text-[10px] font-medium">
                      {EXPENSE_CATEGORIES.find((c) => c.value === e.category)?.label || e.category}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-foreground">{formatPrice(e.amount)}</td>
                  <td className="py-2.5 px-3 text-center">
                    <button onClick={() => deleteExpense.mutate(e.id)} className="p-1.5 hover:bg-destructive/10 rounded text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 size={13} />
                    </button>
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
