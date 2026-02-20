import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/currency";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Package, Truck, CheckCircle, Clock, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useTranslation } from "react-i18next";

const TrackOrder = () => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState("");
  const { t } = useTranslation();

  const statusSteps = [
    { key: "pending", label: t("track.pending"), icon: Clock },
    { key: "processing", label: t("track.processing"), icon: Package },
    { key: "shipped", label: t("track.shipped"), icon: Truck },
    { key: "delivered", label: t("track.delivered"), icon: CheckCircle },
  ];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError("");
    setOrder(null);

    try {
      let result;
      if (q.toUpperCase().startsWith("SN-")) {
        result = await supabase.from("orders").select("*").eq("tracking_id", q.toUpperCase()).maybeSingle();
      } else {
        result = await supabase.from("orders").select("*").eq("phone", q).order("created_at", { ascending: false }).limit(1).maybeSingle();
      }

      if (result.error) throw result.error;
      if (!result.data) {
        setError(t("track.notFound"));
      } else {
        setOrder(result.data);
      }
    } catch {
      setError(t("track.error"));
    } finally {
      setLoading(false);
    }
  };

  const currentStepIndex = order ? statusSteps.findIndex((s) => s.key === (order.status || "pending")) : -1;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-2xl mx-auto px-4 py-12 md:py-20">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft size={16} /> {t("track.backHome")}
        </Link>

        <div className="text-center mb-10">
          <Package size={40} className="mx-auto mb-4 text-primary" />
          <h1 className="font-serif text-2xl md:text-3xl tracking-wide mb-2 text-foreground">{t("track.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("track.subtitle")}</p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 mb-8">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("track.placeholder")}
            className="flex-1 px-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
            maxLength={20}
          />
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
          >
            <Search size={16} /> {loading ? t("track.searching") : t("track.search")}
          </button>
        </form>

        <AnimatePresence mode="wait">
          {error && (
            <motion.p key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center text-destructive text-sm py-8">
              {error}
            </motion.p>
          )}

          {order && (
            <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-6 md:p-8">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-xs text-muted-foreground">{t("track.trackingIdLabel")}</p>
                  <p className="font-serif text-lg text-foreground">{order.tracking_id}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">{t("track.date")}</p>
                  <p className="text-sm text-foreground">{new Date(order.created_at).toLocaleDateString("bn-BD")}</p>
                </div>
              </div>

              <div className="flex items-center justify-between mb-8">
                {statusSteps.map((step, i) => {
                  const active = i <= currentStepIndex;
                  const Icon = step.icon;
                  return (
                    <div key={step.key} className="flex flex-col items-center flex-1 relative">
                      {i > 0 && (
                        <div className={`absolute top-5 right-1/2 w-full h-0.5 -translate-y-1/2 ${i <= currentStepIndex ? "bg-primary" : "bg-border"}`} style={{ zIndex: 0 }} />
                      )}
                      <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center ${active ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"} transition-colors`}>
                        <Icon size={18} />
                      </div>
                      <span className={`text-[10px] mt-2 text-center ${active ? "text-foreground font-medium" : "text-muted-foreground"}`}>{step.label}</span>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-border pt-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">{t("track.name")}</span><span className="text-foreground">{order.customer_name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t("track.phone")}</span><span className="text-foreground">{order.phone}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t("track.address")}</span><span className="text-foreground text-right max-w-[60%]">{order.address}</span></div>
                <div className="flex justify-between font-medium pt-2 border-t border-border"><span>{t("track.total")}</span><span>{formatPrice(order.total)}</span></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
};

export default TrackOrder;
