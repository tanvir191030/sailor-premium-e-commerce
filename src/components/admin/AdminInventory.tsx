import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/currency";
import { Package, AlertTriangle, Search, Download, ArrowUpDown, Printer } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const LOW_STOCK_THRESHOLD = 5;

const AdminInventory = () => {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "stock" | "price">("stock");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-products-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("id, name, stock, price, category, sub_category, image_url, sizes");
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 30,
    refetchOnWindowFocus: true,
  });

  const filtered = products
    .filter((p: any) => {
      if (filter === "low") return p.stock > 0 && p.stock < LOW_STOCK_THRESHOLD;
      if (filter === "out") return p.stock <= 0;
      return true;
    })
    .filter((p: any) => p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a: any, b: any) => {
      const mul = sortDir === "asc" ? 1 : -1;
      if (sortBy === "name") return mul * a.name.localeCompare(b.name);
      if (sortBy === "stock") return mul * (a.stock - b.stock);
      return mul * (a.price - b.price);
    });

  const totalStock = products.reduce((s: number, p: any) => s + (p.stock ?? 0), 0);
  const lowStockCount = products.filter((p: any) => p.stock > 0 && p.stock < LOW_STOCK_THRESHOLD).length;
  const outOfStockCount = products.filter((p: any) => p.stock <= 0).length;
  const totalValue = products.reduce((s: number, p: any) => s + (p.stock ?? 0) * Number(p.price), 0);

  const toggleSort = (col: "name" | "stock" | "price") => {
    if (sortBy === col) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortBy(col); setSortDir("asc"); }
  };

  const exportExcel = () => {
    const rows = filtered.map((p: any) => ({
      "পণ্যের নাম": p.name,
      "ক্যাটাগরি": p.category || "-",
      "স্টক": p.stock,
      "দাম": p.price,
      "মোট মূল্য": p.stock * Number(p.price),
      "স্ট্যাটাস": p.stock <= 0 ? "Out of Stock" : p.stock < LOW_STOCK_THRESHOLD ? "Low Stock" : "In Stock",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventory");
    XLSX.writeFile(wb, `inventory-${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("Inventory Report", 14, 20);
    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleDateString("en-GB")}`, 14, 28);
    autoTable(doc, {
      startY: 35,
      head: [["Product", "Category", "Stock", "Price", "Value", "Status"]],
      body: filtered.map((p: any) => [
        p.name, p.category || "-", p.stock, p.price,
        (p.stock * Number(p.price)).toFixed(0),
        p.stock <= 0 ? "Out of Stock" : p.stock < LOW_STOCK_THRESHOLD ? "Low Stock" : "In Stock",
      ]),
    });
    doc.save(`inventory-${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const { settings } = useSiteSettings();
  const storeName = settings.store_name || "Modest Mart";

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const rows = filtered.map((p: any) => `
      <tr>
        <td style="padding:6px 10px;border-bottom:1px solid #eee">${p.name}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee">${p.category || "-"}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:center;font-weight:bold;${p.stock <= 0 ? "color:red" : p.stock < LOW_STOCK_THRESHOLD ? "color:orange" : ""}">${p.stock}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right">${p.price}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:right">${(p.stock * Number(p.price)).toFixed(0)}</td>
        <td style="padding:6px 10px;border-bottom:1px solid #eee;text-align:center">${p.stock <= 0 ? "Out of Stock" : p.stock < LOW_STOCK_THRESHOLD ? "Low Stock" : "In Stock"}</td>
      </tr>`).join("");
    printWindow.document.write(`<!DOCTYPE html><html><head><title>Inventory Report</title><style>body{font-family:Arial,sans-serif;padding:30px}table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#f5f5f5;padding:8px 10px;text-align:left;border-bottom:2px solid #ddd;font-size:12px}td{font-size:12px}h1{font-size:20px;margin:0}p{color:#666;font-size:12px;margin:4px 0}@media print{body{padding:15px}}</style></head><body>
      <h1>${storeName} — Inventory Report</h1>
      <p>Date: ${new Date().toLocaleDateString("en-GB")} | Total Items: ${filtered.length} | Total Stock: ${totalStock} | Inventory Value: ৳${totalValue.toFixed(0)}</p>
      <table><thead><tr><th>Product</th><th>Category</th><th style="text-align:center">Stock</th><th style="text-align:right">Price</th><th style="text-align:right">Value</th><th style="text-align:center">Status</th></tr></thead><tbody>${rows}</tbody></table>
    </body></html>`);
    printWindow.document.close();
    printWindow.print();
  };

  const stats = [
    { label: "মোট স্টক", value: totalStock, icon: Package, bg: "bg-blue-500/10", color: "text-blue-500" },
    { label: "কম স্টক", value: lowStockCount, icon: AlertTriangle, bg: "bg-amber-500/10", color: "text-amber-500" },
    { label: "স্টক আউট", value: outOfStockCount, icon: AlertTriangle, bg: "bg-destructive/10", color: "text-destructive" },
    { label: "ইনভেন্টরি মূল্য", value: formatPrice(totalValue), icon: Package, bg: "bg-emerald-500/10", color: "text-emerald-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-card p-4 rounded-xl shadow-sm border border-border">
            <div className={`p-2 rounded-lg ${s.bg} w-fit mb-2`}><s.icon size={16} className={s.color} /></div>
            <p className="text-xl font-bold text-foreground">{s.value}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters & Actions */}
      <div className="bg-card p-5 rounded-xl shadow-sm border border-border">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Package size={18} className="text-muted-foreground" />
            <h3 className="font-serif text-base text-foreground">ইনভেন্টরি ম্যানেজমেন্ট</h3>
          </div>
          <div className="flex gap-2">
            <button onClick={exportExcel} className="flex items-center gap-1.5 px-3 py-2 bg-secondary text-foreground border border-border rounded-lg text-xs font-medium hover:bg-secondary/80 transition-colors">
              <Download size={12} /> Excel
            </button>
            <button onClick={exportPDF} className="flex items-center gap-1.5 px-3 py-2 bg-secondary text-foreground border border-border rounded-lg text-xs font-medium hover:bg-secondary/80 transition-colors">
              <Download size={12} /> PDF
            </button>
            <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-2 bg-secondary text-foreground border border-border rounded-lg text-xs font-medium hover:bg-secondary/80 transition-colors">
              <Printer size={12} /> Print
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="পণ্য খুঁজুন..." className="w-full pl-9 pr-3 py-2.5 border border-border rounded-lg text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 hover:border-primary/50 transition-colors" />
          </div>
          <div className="flex gap-1 bg-secondary p-1 rounded-lg">
            {([["all", "সব"], ["low", "কম স্টক"], ["out", "স্টক আউট"]] as const).map(([val, label]) => (
              <button key={val} onClick={() => setFilter(val)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${filter === val ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">ছবি</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium text-xs cursor-pointer" onClick={() => toggleSort("name")}>
                  <span className="flex items-center gap-1">পণ্য <ArrowUpDown size={10} /></span>
                </th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium text-xs">ক্যাটাগরি</th>
                <th className="text-center py-2 px-3 text-muted-foreground font-medium text-xs cursor-pointer" onClick={() => toggleSort("stock")}>
                  <span className="flex items-center justify-center gap-1">স্টক <ArrowUpDown size={10} /></span>
                </th>
                <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs cursor-pointer" onClick={() => toggleSort("price")}>
                  <span className="flex items-center justify-end gap-1">দাম <ArrowUpDown size={10} /></span>
                </th>
                <th className="text-right py-2 px-3 text-muted-foreground font-medium text-xs">মোট মূল্য</th>
                <th className="text-center py-2 px-3 text-muted-foreground font-medium text-xs">স্ট্যাটাস</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">লোড হচ্ছে...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">কোনো পণ্য পাওয়া যায়নি</td></tr>
              ) : filtered.map((p: any) => (
                <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="py-2 px-3">
                    <div className="w-10 h-10 rounded-lg overflow-hidden bg-secondary">
                      {p.image_url && <img src={p.image_url} alt="" className="w-full h-full object-cover" />}
                    </div>
                  </td>
                  <td className="py-2 px-3 text-foreground font-medium max-w-[200px] truncate">{p.name}</td>
                  <td className="py-2 px-3 text-muted-foreground text-xs">{p.category || "-"}</td>
                  <td className="py-2 px-3 text-center font-bold text-foreground">{p.stock}</td>
                  <td className="py-2 px-3 text-right text-foreground">{formatPrice(p.price)}</td>
                  <td className="py-2 px-3 text-right text-foreground">{formatPrice(p.stock * Number(p.price))}</td>
                  <td className="py-2 px-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      p.stock <= 0 ? "bg-destructive/10 text-destructive" :
                      p.stock < LOW_STOCK_THRESHOLD ? "bg-amber-500/10 text-amber-500" :
                      "bg-emerald-500/10 text-emerald-500"
                    }`}>
                      {p.stock <= 0 ? "Out" : p.stock < LOW_STOCK_THRESHOLD ? "Low" : "In Stock"}
                    </span>
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

export default AdminInventory;
