import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/currency";
import { TrendingUp, TrendingDown, DollarSign, Download, Printer } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { useTheme } from "@/contexts/ThemeContext";
import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

type TimeRange = "week" | "month" | "quarter" | "year";

const AdminReports = () => {
  const [timeRange, setTimeRange] = useState<TimeRange>("month");
  const { theme } = useTheme();

  const getDateFrom = (range: TimeRange) => {
    const d = new Date();
    if (range === "week") d.setDate(d.getDate() - 7);
    else if (range === "month") d.setMonth(d.getMonth() - 1);
    else if (range === "quarter") d.setMonth(d.getMonth() - 3);
    else d.setFullYear(d.getFullYear() - 1);
    return d.toISOString().split("T")[0];
  };

  const dateFrom = getDateFrom(timeRange);

  const { data: deliveredOrders = [] } = useQuery({
    queryKey: ["report-orders", timeRange],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("id,total,created_at,delivery_charge,customer_name,phone")
        .eq("status", "delivered")
        .gte("created_at", dateFrom)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 2,
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ["report-expenses", timeRange],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("expenses").select("id,amount,category,expense_date,title")
        .gte("expense_date", dateFrom)
        .order("expense_date", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
    staleTime: 1000 * 60 * 2,
  });

  const totalSales = deliveredOrders.reduce((s, o) => s + Number(o.total), 0);
  const totalExpenses = expenses.reduce((s: number, e: any) => s + Number(e.amount), 0);
  const netProfit = totalSales - totalExpenses;
  const profitMargin = totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(1) : "0";

  // Build daily chart data
  const buildChartData = () => {
    const days: Record<string, { sales: number; expenses: number }> = {};
    const start = new Date(dateFrom);
    const end = new Date();
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      days[d.toISOString().split("T")[0]] = { sales: 0, expenses: 0 };
    }
    deliveredOrders.forEach((o) => {
      const day = o.created_at?.split("T")[0];
      if (day && days[day] !== undefined) days[day].sales += Number(o.total);
    });
    expenses.forEach((e: any) => {
      const day = e.expense_date;
      if (day && days[day] !== undefined) days[day].expenses += Number(e.amount);
    });
    return Object.entries(days).map(([date, data]) => ({
      date: new Date(date).toLocaleDateString("bn-BD", { day: "numeric", month: "short" }),
      sales: data.sales,
      expenses: data.expenses,
      profit: data.sales - data.expenses,
    }));
  };

  const chartData = buildChartData();
  const isDark = theme === "dark";
  const gridColor = isDark ? "hsl(0,0%,25%)" : "hsl(0,0%,92%)";
  const tickColor = isDark ? "hsl(0,0%,60%)" : "hsl(0,0%,40%)";
  const tooltipBg = isDark ? "hsl(0,0%,15%)" : "#fff";
  const tooltipBorder = isDark ? "hsl(0,0%,25%)" : "hsl(0,0%,90%)";

  const stats = [
    { label: "মোট বিক্রয়", value: formatPrice(totalSales), icon: TrendingUp, bg: "bg-emerald-500/10", color: "text-emerald-500" },
    { label: "মোট খরচ", value: formatPrice(totalExpenses), icon: TrendingDown, bg: "bg-destructive/10", color: "text-destructive" },
    { label: "নেট প্রফিট", value: formatPrice(netProfit), icon: DollarSign, bg: netProfit >= 0 ? "bg-emerald-500/10" : "bg-destructive/10", color: netProfit >= 0 ? "text-emerald-500" : "text-destructive" },
    { label: "প্রফিট মার্জিন", value: `${profitMargin}%`, icon: TrendingUp, bg: "bg-blue-500/10", color: "text-blue-500" },
  ];

  const timeLabels: Record<TimeRange, string> = { week: "সাপ্তাহিক", month: "মাসিক", quarter: "ত্রৈমাসিক", year: "বাৎসরিক" };

  const exportExcel = () => {
    const salesSheet = XLSX.utils.json_to_sheet(deliveredOrders.map((o) => ({
      "Date": o.created_at?.split("T")[0], "Customer": o.customer_name, "Phone": o.phone, "Total": o.total, "Delivery": o.delivery_charge,
    })));
    const expenseSheet = XLSX.utils.json_to_sheet(expenses.map((e: any) => ({
      "Date": e.expense_date, "Title": e.title, "Category": e.category, "Amount": e.amount,
    })));
    const summarySheet = XLSX.utils.json_to_sheet([{
      "Total Sales": totalSales, "Total Expenses": totalExpenses, "Net Profit": netProfit, "Profit Margin": `${profitMargin}%`,
    }]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");
    XLSX.utils.book_append_sheet(wb, salesSheet, "Sales");
    XLSX.utils.book_append_sheet(wb, expenseSheet, "Expenses");
    XLSX.writeFile(wb, `business-report-${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Business Report", 14, 20);
    doc.setFontSize(10);
    doc.text(`Period: ${timeLabels[timeRange]} | Date: ${new Date().toLocaleDateString("en-GB")}`, 14, 28);
    doc.setFontSize(12);
    doc.text(`Total Sales: ${totalSales.toFixed(0)} BDT`, 14, 40);
    doc.text(`Total Expenses: ${totalExpenses.toFixed(0)} BDT`, 14, 48);
    doc.text(`Net Profit: ${netProfit.toFixed(0)} BDT`, 14, 56);
    doc.text(`Profit Margin: ${profitMargin}%`, 14, 64);

    autoTable(doc, {
      startY: 75,
      head: [["Date", "Customer", "Total"]],
      body: deliveredOrders.slice(0, 50).map((o) => [o.created_at?.split("T")[0], o.customer_name, o.total]),
      theme: "grid",
    });
    doc.save(`business-report-${new Date().toISOString().split("T")[0]}.pdf`);
  };

  const handlePrint = () => {
    const printContent = `
      <html><head><title>Business Report</title>
      <style>body{font-family:sans-serif;padding:20px}table{width:100%;border-collapse:collapse;margin-top:16px}
      th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:12px}
      th{background:#f5f5f5}h1{font-size:20px}h2{font-size:16px;margin-top:24px}.stats{display:flex;gap:16px;margin:16px 0}
      .stat{border:1px solid #ddd;padding:12px;border-radius:8px;flex:1;text-align:center}
      .stat .val{font-size:20px;font-weight:bold}.stat .lbl{font-size:11px;color:#666}</style></head>
      <body>
      <h1>Business Report — ${timeLabels[timeRange]}</h1>
      <p>Date: ${new Date().toLocaleDateString("en-GB")}</p>
      <div class="stats">
        <div class="stat"><div class="val">${totalSales.toFixed(0)} ৳</div><div class="lbl">Total Sales</div></div>
        <div class="stat"><div class="val">${totalExpenses.toFixed(0)} ৳</div><div class="lbl">Total Expenses</div></div>
        <div class="stat"><div class="val">${netProfit.toFixed(0)} ৳</div><div class="lbl">Net Profit</div></div>
        <div class="stat"><div class="val">${profitMargin}%</div><div class="lbl">Margin</div></div>
      </div>
      <h2>Delivered Orders (${deliveredOrders.length})</h2>
      <table><tr><th>Date</th><th>Customer</th><th>Total</th></tr>
      ${deliveredOrders.map((o) => `<tr><td>${o.created_at?.split("T")[0]}</td><td>${o.customer_name}</td><td>${o.total} ৳</td></tr>`).join("")}
      </table>
      </body></html>`;
    const win = window.open("", "_blank");
    if (win) { win.document.write(printContent); win.document.close(); win.print(); }
  };

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

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex gap-1 bg-secondary p-1 rounded-lg">
          {(Object.keys(timeLabels) as TimeRange[]).map((t) => (
            <button key={t} onClick={() => setTimeRange(t)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${timeRange === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {timeLabels[t]}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={exportExcel} className="flex items-center gap-1.5 px-3 py-2 bg-secondary text-foreground border border-border rounded-lg text-xs font-medium hover:bg-secondary/80">
            <Download size={12} /> Excel
          </button>
          <button onClick={exportPDF} className="flex items-center gap-1.5 px-3 py-2 bg-secondary text-foreground border border-border rounded-lg text-xs font-medium hover:bg-secondary/80">
            <Download size={12} /> PDF
          </button>
          <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-2 bg-secondary text-foreground border border-border rounded-lg text-xs font-medium hover:bg-secondary/80">
            <Printer size={12} /> প্রিন্ট
          </button>
        </div>
      </div>

      {/* Sales vs Expenses Chart */}
      <div className="bg-card p-5 rounded-xl shadow-sm border border-border">
        <h3 className="font-serif text-base mb-4 text-foreground">বিক্রয় vs খরচ</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: tickColor }} />
              <YAxis tick={{ fontSize: 10, fill: tickColor }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${tooltipBorder}`, backgroundColor: tooltipBg, color: isDark ? "#e5e5e5" : "#333" }}
                formatter={(value: number, name: string) => [formatPrice(value), name === "sales" ? "বিক্রয়" : "খরচ"]} />
              <Legend formatter={(val) => val === "sales" ? "বিক্রয়" : "খরচ"} />
              <Bar dataKey="sales" fill="hsl(160,84%,30%)" radius={[4, 4, 0, 0]} name="sales" />
              <Bar dataKey="expenses" fill="hsl(0,70%,50%)" radius={[4, 4, 0, 0]} name="expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Profit Trend */}
      <div className="bg-card p-5 rounded-xl shadow-sm border border-border">
        <h3 className="font-serif text-base mb-4 text-foreground">প্রফিট ট্রেন্ড</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: tickColor }} />
              <YAxis tick={{ fontSize: 10, fill: tickColor }} />
              <Tooltip formatter={(value: number) => [formatPrice(value), "প্রফিট"]} contentStyle={{ fontSize: 12, borderRadius: 8, backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, color: isDark ? "#e5e5e5" : "#333" }} />
              <Line type="monotone" dataKey="profit" stroke="hsl(160,84%,30%)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AdminReports;
