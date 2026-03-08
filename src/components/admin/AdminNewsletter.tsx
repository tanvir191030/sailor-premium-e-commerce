import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Trash2, Search, Mail } from "lucide-react";
import * as XLSX from "xlsx";

interface Subscriber {
  id: string;
  email: string;
  subscribed_at: string;
}

const AdminNewsletter = () => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const { toast } = useToast();

  const fetchSubscribers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("newsletter_subscribers" as any)
      .select("*")
      .order("subscribed_at", { ascending: false });
    if (!error && data) setSubscribers(data as any);
    setLoading(false);
  };

  useEffect(() => { fetchSubscribers(); }, []);

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("newsletter_subscribers" as any)
      .delete()
      .eq("id", id);
    if (!error) {
      setSubscribers((prev) => prev.filter((s) => s.id !== id));
      toast({ title: "মুছে ফেলা হয়েছে" });
    }
  };

  const handleExport = () => {
    const rows = subscribers.map((s) => ({
      Email: s.email,
      "Subscribed At": new Date(s.subscribed_at).toLocaleString("bn-BD"),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Subscribers");
    XLSX.writeFile(wb, `newsletter_subscribers_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const filtered = subscribers.filter((s) =>
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Mail size={20} className="text-primary" />
          <h2 className="text-lg font-semibold text-foreground">
            নিউজলেটার সাবস্ক্রাইবার ({subscribers.length})
          </h2>
        </div>
        <Button onClick={handleExport} size="sm" className="gap-2" disabled={subscribers.length === 0}>
          <Download size={14} /> Excel এ ডাউনলোড
        </Button>
      </div>

      <div className="relative max-w-xs">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="ইমেইল খুঁজুন..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">কোনো সাবস্ক্রাইবার পাওয়া যায়নি।</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>ইমেইল</TableHead>
                <TableHead>তারিখ</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s, i) => (
                <TableRow key={s.id}>
                  <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                  <TableCell className="font-medium">{s.email}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {new Date(s.subscribed_at).toLocaleDateString("bn-BD")}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)} className="h-8 w-8 text-destructive hover:text-destructive">
                      <Trash2 size={14} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default AdminNewsletter;
