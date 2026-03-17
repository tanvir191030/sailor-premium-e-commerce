import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, Minus, Plus } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/currency";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const BuyNowDrawer = () => {
  const { items, totalPrice, totalItems, updateQuantity, removeItem, isBuyNowOpen, setIsBuyNowOpen } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === "/checkout") setIsBuyNowOpen(false);
  }, [location.pathname, setIsBuyNowOpen]);

  const { data: deliverySettings } = useQuery({
    queryKey: ["delivery-charges"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("key, value").in("key", ["delivery_inside_dhaka", "delivery_outside_dhaka"]);
      if (error) throw error;
      const map: Record<string, number> = {};
      data?.forEach((s) => { map[s.key] = Number(s.value) || 0; });
      return { inside: map["delivery_inside_dhaka"] ?? 80, outside: map["delivery_outside_dhaka"] ?? 130 };
    },
  });
  const minDelivery = deliverySettings?.inside ?? 80;

  const handleCheckout = () => {
    setIsBuyNowOpen(false);
    navigate("/checkout");
  };

  return (
    <AnimatePresence>
      {isBuyNowOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setIsBuyNowOpen(false)}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-background border-l border-border z-50 flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-serif text-lg text-foreground flex items-center gap-2">
                <ShoppingBag size={18} /> দ্রুত চেকআউট
              </h2>
              <button onClick={() => setIsBuyNowOpen(false)} className="p-2 hover:bg-secondary rounded-lg transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-12">কার্ট খালি</p>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="flex gap-3 bg-card border border-border rounded-xl p-3">
                    <div className="w-16 h-20 bg-secondary rounded-lg overflow-hidden flex-shrink-0">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate text-foreground">{item.name}</p>
                      <p className="text-xs text-muted-foreground mb-2">
                        {[
                          formatPrice(item.price),
                          item.size ? `Size: ${item.size}` : null,
                          item.color ? `Color: ${item.color}` : null,
                        ].filter(Boolean).join(" · ")}
                      </p>
                      <div className="flex items-center gap-2">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-6 h-6 flex items-center justify-center bg-secondary rounded text-foreground">
                          <Minus size={12} />
                        </button>
                        <span className="text-sm font-medium text-foreground w-6 text-center">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-6 h-6 flex items-center justify-center bg-secondary rounded text-foreground">
                          <Plus size={12} />
                        </button>
                        <button onClick={() => removeItem(item.id)} className="ml-auto text-xs text-destructive">মুছুন</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-border p-4 space-y-3">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>সাবটোটাল ({totalItems} আইটেম)</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>ডেলিভারি (থেকে)</span>
                  <span>{formatPrice(minDelivery)}+</span>
                </div>
                <div className="flex justify-between font-bold text-foreground pt-2 border-t border-border">
                  <span>মোট (আনুমানিক)</span>
                  <span>{formatPrice(totalPrice + minDelivery)}</span>
                </div>
                <button
                  onClick={handleCheckout}
                  className="w-full py-3.5 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  চেকআউটে যান →
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default BuyNowDrawer;
