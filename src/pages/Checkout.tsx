import { useState, useEffect } from "react";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/currency";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowLeft, ShoppingBag, FileDown, Truck, Copy, MapPin, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SuccessAnimation from "@/components/SuccessAnimation";
import jsPDF from "jspdf";
import bkashLogo from "@/assets/bkash-logo.png";
import nagadLogo from "@/assets/nagad-logo.png";
import rocketLogo from "@/assets/rocket-logo.png";

const BD_DISTRICTS = [
  "ঢাকা", "গাজীপুর", "নারায়ণগঞ্জ", "মানিকগঞ্জ", "মুন্সিগঞ্জ", "নরসিংদী", "টাঙ্গাইল", "কিশোরগঞ্জ",
  "ময়মনসিংহ", "জামালপুর", "শেরপুর", "নেত্রকোনা", "ফরিদপুর", "মাদারীপুর", "শরীয়তপুর", "রাজবাড়ী",
  "গোপালগঞ্জ", "চট্টগ্রাম", "কক্সবাজার", "রাঙামাটি", "বান্দরবান", "খাগড়াছড়ি", "কুমিল্লা", "চাঁদপুর",
  "লক্ষ্মীপুর", "নোয়াখালী", "ফেনী", "ব্রাহ্মণবাড়িয়া", "রাজশাহী", "নাটোর", "নওগাঁ", "চাঁপাইনবাবগঞ্জ",
  "পাবনা", "সিরাজগঞ্জ", "বগুড়া", "জয়পুরহাট", "খুলনা", "বাগেরহাট", "সাতক্ষীরা", "যশোর",
  "নড়াইল", "মাগুরা", "কুষ্টিয়া", "মেহেরপুর", "চুয়াডাঙ্গা", "ঝিনাইদহ", "বরিশাল", "পটুয়াখালী",
  "ভোলা", "পিরোজপুর", "ঝালকাঠি", "বরগুনা", "সিলেট", "মৌলভীবাজার", "হবিগঞ্জ", "সুনামগঞ্জ",
  "রংপুর", "দিনাজপুর", "গাইবান্ধা", "কুড়িগ্রাম", "লালমনিরহাট", "নীলফামারী", "ঠাকুরগাঁও", "পঞ্চগড়",
];

const Checkout = () => {
  const { items, totalPrice, clearCart } = useCart();
  const { toast } = useToast();
  const [form, setForm] = useState({
    name: "", phone: "", email: "", district: "", thana: "", address: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "bkash" | "nagad" | "rocket">("cod");
  const [transactionId, setTransactionId] = useState("");
  const [deliveryZone, setDeliveryZone] = useState<"inside_dhaka" | "outside_dhaka">("inside_dhaka");
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any>(null);

  // Fetch delivery charges from settings
  const { data: deliverySettings } = useQuery({
    queryKey: ["delivery-charges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["delivery_inside_dhaka", "delivery_outside_dhaka"]);
      if (error) throw error;
      const map: Record<string, number> = {};
      data?.forEach((s) => { map[s.key] = Number(s.value) || 0; });
      return {
        inside_dhaka: map["delivery_inside_dhaka"] ?? 80,
        outside_dhaka: map["delivery_outside_dhaka"] ?? 130,
      };
    },
  });

  const deliveryCharge = deliveryZone === "inside_dhaka"
    ? (deliverySettings?.inside_dhaka ?? 80)
    : (deliverySettings?.outside_dhaka ?? 130);

  const grandTotal = totalPrice + deliveryCharge;

  // Auto-detect zone from district
  useEffect(() => {
    if (form.district === "ঢাকা" || form.district === "গাজীপুর" || form.district === "নারায়ণগঞ্জ") {
      setDeliveryZone("inside_dhaka");
    } else if (form.district) {
      setDeliveryZone("outside_dhaka");
    }
  }, [form.district]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      toast({ title: "নাম, ফোন ও ঠিকানা আবশ্যক", variant: "destructive" });
      return;
    }
    if (!form.district) {
      toast({ title: "জেলা নির্বাচন করুন", variant: "destructive" });
      return;
    }
    if (!/^01\d{9}$/.test(form.phone.trim())) {
      toast({ title: "ফোন নম্বর ১১ ডিজিট হতে হবে (01XXXXXXXXX)", variant: "destructive" });
      return;
    }
    if (items.length === 0) {
      toast({ title: "কার্ট খালি", variant: "destructive" });
      return;
    }
    if (paymentMethod !== "cod" && !transactionId.trim()) {
      toast({ title: "ট্রানজেকশন আইডি দিন", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const fullAddress = [form.thana, form.district, form.address].filter(Boolean).join(", ");
      const { data, error } = await supabase.from("orders").insert({
        customer_name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        district: form.district || null,
        thana: form.thana.trim() || null,
        address: fullAddress,
        cart_items: items.map((i) => ({ name: i.name, price: i.price, quantity: i.quantity, image: i.image })),
        total: grandTotal,
        delivery_charge: deliveryCharge,
        payment_method: paymentMethod === "cod" ? "Cash on Delivery" : paymentMethod === "bkash" ? "bKash" : paymentMethod === "nagad" ? "Nagad" : "Rocket",
        transaction_id: paymentMethod !== "cod" ? transactionId.trim() : null,
      }).select().single();

      if (error) throw error;
      setOrderSuccess(data);
      clearCart();
      window.scrollTo({ top: 0, behavior: "smooth" });
      toast({ title: "অর্ডার সফল হয়েছে! 🎉" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const downloadInvoice = () => {
    if (!orderSuccess) return;
    const savedDelivery = orderSuccess.delivery_charge ?? deliveryCharge;
    const doc = new jsPDF();
    doc.setFontSize(22); doc.text("SAILOR", 20, 25);
    doc.setFontSize(10); doc.setTextColor(100); doc.text("Order Invoice", 20, 33);
    doc.line(20, 36, 190, 36);
    doc.setTextColor(0);
    doc.text(`Tracking ID: ${orderSuccess.tracking_id || "N/A"}`, 20, 45);
    doc.text(`Date: ${new Date(orderSuccess.created_at).toLocaleDateString("en-GB")}`, 20, 52);
    doc.text(`Payment: ${orderSuccess.payment_method || "Cash on Delivery"}${orderSuccess.transaction_id ? ` (TxnID: ${orderSuccess.transaction_id})` : ""}`, 130, 45);
    doc.setFontSize(11); doc.text("Customer:", 20, 65);
    doc.setFontSize(9);
    doc.text(`Name: ${orderSuccess.customer_name}`, 25, 73);
    doc.text(`Phone: ${orderSuccess.phone}`, 25, 80);
    doc.text(`Address: ${orderSuccess.address}`, 25, 87);

    let y = 100;
    doc.setFontSize(9); doc.setFillColor(245, 245, 245); doc.rect(20, y - 5, 170, 10, "F");
    doc.text("Item", 25, y + 2); doc.text("Qty", 120, y + 2); doc.text("Price", 145, y + 2); doc.text("Total", 170, y + 2);
    y += 12;
    const cartItems = Array.isArray(orderSuccess.cart_items) ? orderSuccess.cart_items : [];
    cartItems.forEach((item: any) => {
      doc.text(String(item.name || "Item").substring(0, 40), 25, y);
      doc.text(String(item.quantity || 1), 123, y);
      doc.text(`${item.price || 0}`, 145, y);
      doc.text(`${(item.price || 0) * (item.quantity || 1)}`, 170, y);
      y += 8;
    });
    doc.line(20, y, 190, y); y += 8;
    doc.setFontSize(9); doc.text(`Subtotal: BDT ${orderSuccess.total - savedDelivery}`, 140, y); y += 7;
    doc.text(`Delivery: BDT ${savedDelivery}`, 140, y); y += 7;
    doc.setFontSize(12); doc.text(`Total: BDT ${orderSuccess.total}`, 140, y);
    doc.save(`invoice-${orderSuccess.tracking_id || orderSuccess.id.slice(0, 8)}.pdf`);
  };

  const copyTrackingId = () => {
    if (orderSuccess?.tracking_id) {
      navigator.clipboard.writeText(orderSuccess.tracking_id);
      toast({ title: "ট্র্যাকিং আইডি কপি হয়েছে!" });
    }
  };

  const inputCls = "w-full px-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground transition-all";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-8 md:py-12">
        <Link to="/shop" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft size={16} /> শপিং চালিয়ে যান
        </Link>

        <h1 className="font-serif text-2xl md:text-3xl tracking-wide mb-8 text-foreground">Checkout</h1>

        <AnimatePresence mode="wait">
          {orderSuccess ? (
            <motion.div key="success" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto text-center py-16">
              <SuccessAnimation />
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
                <h2 className="font-serif text-2xl mb-2 text-foreground mt-6">অর্ডার সফল হয়েছে!</h2>
                <div className="bg-card border border-border rounded-xl p-4 mb-4 inline-block">
                  <p className="text-xs text-muted-foreground mb-1">ট্র্যাকিং আইডি</p>
                  <div className="flex items-center gap-2 justify-center">
                    <span className="font-mono text-xl font-bold text-primary">{orderSuccess.tracking_id}</span>
                    <button onClick={copyTrackingId} className="p-1 hover:bg-secondary rounded"><Copy size={14} /></button>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm mb-6">আমরা শীঘ্রই আপনার সাথে যোগাযোগ করবো।</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button onClick={downloadInvoice} className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:opacity-90 transition-opacity">
                    <FileDown size={16} /> ইনভয়েস ডাউনলোড
                  </button>
                  <Link to="/track-order" className="px-6 py-3 border border-border rounded-full text-sm font-medium text-foreground hover:bg-secondary transition-colors text-center">
                    অর্ডার ট্র্যাক করুন
                  </Link>
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid lg:grid-cols-5 gap-8">
              <div className="lg:col-span-3">
                <div className="bg-card p-6 md:p-8 rounded-2xl shadow-sm border border-border">
                  <h2 className="font-serif text-lg mb-1 text-foreground">ডেলিভারি তথ্য</h2>
                  <p className="text-xs text-muted-foreground mb-6">লগিন ছাড়াই অর্ডার করুন</p>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">আপনার নাম *</label>
                      <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="পুরো নাম লিখুন" className={inputCls} required maxLength={100} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">ফোন নম্বর * (১১ ডিজিট)</label>
                      <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 11) })} placeholder="01XXXXXXXXX" className={inputCls} required maxLength={11} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">ইমেইল (ঐচ্ছিক)</label>
                      <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" className={inputCls} maxLength={100} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                         <label className="text-xs font-medium text-muted-foreground mb-1.5 block">জেলা *</label>
                        <select value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} className={inputCls} required>
                          <option value="">জেলা নির্বাচন করুন</option>
                          {BD_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                        </select>
                        {form.district && (
                          <p className="text-xs mt-1 text-muted-foreground">
                            ডেলিভারি: {deliveryZone === "inside_dhaka" ? "ঢাকার ভিতরে" : "ঢাকার বাইরে"} — {formatPrice(deliveryCharge)}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">থানা/উপজেলা</label>
                        <input value={form.thana} onChange={(e) => setForm({ ...form, thana: e.target.value })} placeholder="থানা/উপজেলার নাম" className={inputCls} maxLength={100} />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">সম্পূর্ণ ঠিকানা *</label>
                      <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="বাড়ি নম্বর, রোড, এলাকা" rows={3} className={`${inputCls} resize-none`} required maxLength={500} />
                    </div>

                    {/* Payment Method */}
                    <div className="pt-2 border-t border-border">
                      <label className="text-xs font-medium text-muted-foreground mb-3 block flex items-center gap-1.5">
                        <Smartphone size={14} /> পেমেন্ট মেথড *
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: "cod", label: "ক্যাশ অন ডেলিভারি", icon: <Truck size={16} /> },
                          { value: "bkash", label: "bKash", icon: <img src={bkashLogo} alt="bKash" className="w-5 h-5 object-contain" /> },
                          { value: "nagad", label: "Nagad", icon: <img src={nagadLogo} alt="Nagad" className="w-5 h-5 object-contain" /> },
                          { value: "rocket", label: "Rocket", icon: <img src={rocketLogo} alt="Rocket" className="w-5 h-5 object-contain" /> },
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => { setPaymentMethod(opt.value as any); if (opt.value === "cod") setTransactionId(""); }}
                            className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all ${
                              paymentMethod === opt.value
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border text-muted-foreground hover:border-ring"
                            }`}
                          >
                            {opt.icon}
                            {opt.label}
                          </button>
                        ))}
                      </div>

                      {paymentMethod !== "cod" && (
                        <div className="mt-3 p-3 bg-secondary/50 rounded-xl border border-border space-y-2">
                          <p className="text-xs text-muted-foreground">
                            নিচের নম্বরে <strong className="text-foreground">{formatPrice(grandTotal)}</strong> Send Money করুন:
                          </p>
                          <p className="text-sm font-mono font-bold text-foreground">01XXXXXXXXX (Personal)</p>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">ট্রানজেকশন আইডি *</label>
                            <input
                              value={transactionId}
                              onChange={(e) => setTransactionId(e.target.value.replace(/\s/g, "").slice(0, 30))}
                              placeholder="যেমন: TXN123ABC456"
                              className={inputCls}
                              required
                              maxLength={30}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    <button type="submit" disabled={submitting || items.length === 0} className="w-full py-3.5 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                      {submitting ? "অর্ডার হচ্ছে..." : `অর্ডার করুন · ${formatPrice(grandTotal)}`}
                    </button>
                  </form>
                </div>
              </div>

              <div className="lg:col-span-2">
                <div className="bg-card p-6 rounded-2xl shadow-sm border border-border sticky top-24">
                  <h2 className="font-serif text-lg mb-4 text-foreground flex items-center gap-2">
                    <ShoppingBag size={18} /> অর্ডার সারাংশ
                  </h2>
                  {items.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">কার্ট খালি</p>
                  ) : (
                    <>
                      <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                        {items.map((item) => (
                          <div key={item.id} className="flex gap-3">
                            <div className="w-14 h-16 bg-secondary rounded-lg overflow-hidden flex-shrink-0">
                              <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate text-foreground">{item.name}</p>
                              <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                            </div>
                            <p className="text-sm font-medium text-foreground whitespace-nowrap">{formatPrice(item.price * item.quantity)}</p>
                          </div>
                        ))}
                      </div>
                      <div className="border-t border-border pt-3 space-y-2">
                        <div className="flex justify-between text-sm text-muted-foreground"><span>সাবটোটাল</span><span>{formatPrice(totalPrice)}</span></div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>ডেলিভারি ({deliveryZone === "inside_dhaka" ? "ঢাকা" : "ঢাকার বাইরে"})</span>
                          <span>{formatPrice(deliveryCharge)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-base pt-2 border-t border-border text-foreground"><span>মোট</span><span>{formatPrice(grandTotal)}</span></div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;
