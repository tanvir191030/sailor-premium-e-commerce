import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/currency";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Package, Truck, CheckCircle, Clock, ArrowLeft, BoxIcon } from "lucide-react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useTranslation } from "react-i18next";

const courierStatusMap: Record<string, number> = {
  pending: 0,
  in_review: 0,
  unknown: 0,
  delivered_approval_pending: 3,
  partial_delivered_approval_pending: 3,
  cancelled_approval_pending: -1,
  on_hold: 1,
  in_transit: 2,
  delivered: 3,
  partial_delivered: 3,
  cancelled: -1,
  hold: 1,
  // Steadfast specific
  "pending_entry": 0,
  "pickup_assigned": 1,
  "picked_up": 1,
  "in_sorting": 2,
  "out_for_delivery": 2,
};

const TrackOrder = () => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [courierStatus, setCourierStatus] = useState<string | null>(null);
  const [courierLoading, setCourierLoading] = useState(false);
  const [error, setError] = useState("");
  const { t } = useTranslation();

  const statusSteps = [
    { key: "placed", label: "অর্ডার গৃহীত", icon: Clock },
    { key: "handed", label: "কুরিয়ারে হস্তান্তর", icon: BoxIcon },
    { key: "transit", label: "পথে আছে", icon: Truck },
    { key: "delivered", label: "ডেলিভারি সম্পন্ন", icon: CheckCircle },
  ];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError("");
    setOrder(null);
    setCourierStatus(null);

    try {
      let result;
      if (q.toUpperCase().startsWith("MM-") || q.toUpperCase().startsWith("SN-")) {
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

  // Fetch live courier status when order has courier_tracking_id
  useEffect(() => {
    if (!order?.courier_tracking_id) return;
    setCourierLoading(true);
    supabase.functions
      .invoke("steadfast-courier", {
        body: { action: "check_status", consignment_id: order.courier_tracking_id },
      })
      .then(({ data, error: fnErr }) => {
        if (!fnErr && data?.delivery_status) {
          setCourierStatus(data.delivery_status);
        }
      })
      .finally(() => setCourierLoading(false));
  }, [order?.courier_tracking_id]);

  // Determine step index
  const getStepIndex = () => {
    if (!order) return -1;

    // If we have live courier status, use it
    if (courierStatus) {
      const mapped = courierStatusMap[courierStatus];
      if (mapped === -1) return -1; // cancelled
      if (mapped !== undefined) return mapped;
    }

    // Fallback to internal status
    const internalMap: Record<string, number> = {
      pending: 0,
      paid: 0,
      processing: 1,
      shipped: 2,
      delivered: 3,
    };
    return internalMap[order.status || "pending"] ?? 0;
  };

  const currentStepIndex = getStepIndex();
  const isCancelled = courierStatus === "cancelled" || courierStatus === "cancelled_approval_pending" || order?.status === "cancelled";

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

              {/* Courier live status badge */}
              {courierLoading && (
                <p className="text-xs text-muted-foreground text-center mb-4 animate-pulse">কুরিয়ার স্ট্যাটাস লোড হচ্ছে...</p>
              )}
              {courierStatus && (
                <div className="text-center mb-6">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary capitalize">
                    কুরিয়ার স্ট্যাটাস: {courierStatus.replace(/_/g, " ")}
                  </span>
                </div>
              )}

              {isCancelled ? (
                <div className="text-center py-6">
                  <p className="text-destructive font-medium">❌ অর্ডারটি বাতিল করা হয়েছে</p>
                </div>
              ) : (
                <div className="flex items-center justify-between mb-8">
                  {statusSteps.map((step, i) => {
                    const active = i <= currentStepIndex;
                    const Icon = step.icon;
                    return (
                      <div key={step.key} className="flex flex-col items-center flex-1 relative">
                        {i > 0 && (
                          <div
                            className={`absolute top-5 right-1/2 w-full h-0.5 -translate-y-1/2 transition-colors duration-500 ${i <= currentStepIndex ? "bg-primary" : "bg-border"}`}
                            style={{ zIndex: 0 }}
                          />
                        )}
                        <motion.div
                          initial={{ scale: 0.8 }}
                          animate={{ scale: active ? 1 : 0.85 }}
                          className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-500 ${active ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" : "bg-secondary text-muted-foreground"}`}
                        >
                          <Icon size={18} />
                        </motion.div>
                        <span className={`text-[10px] mt-2 text-center ${active ? "text-foreground font-medium" : "text-muted-foreground"}`}>{step.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Progress bar */}
              {!isCancelled && currentStepIndex >= 0 && (
                <div className="w-full bg-secondary rounded-full h-2 mb-6 overflow-hidden">
                  <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(((currentStepIndex + 1) / statusSteps.length) * 100, 100)}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              )}

              <div className="border-t border-border pt-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">{t("track.name")}</span><span className="text-foreground">{order.customer_name}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t("track.phone")}</span><span className="text-foreground">{order.phone}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t("track.address")}</span><span className="text-foreground text-right max-w-[60%]">{order.address}</span></div>
                {order.courier_tracking_id && (
                  <div className="flex justify-between"><span className="text-muted-foreground">কুরিয়ার ID</span><span className="text-foreground font-mono">{order.courier_tracking_id}</span></div>
                )}
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
