import { useState, useEffect } from "react";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/currency";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowLeft, ShoppingBag, FileDown, Truck, Copy, MapPin, Smartphone, ChevronDown, ChevronUp } from "lucide-react";
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
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponChecking, setCouponChecking] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const { data: deliverySettings } = useQuery({
    queryKey: ["checkout-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("key, value")
        .in("key", ["delivery_inside_dhaka", "delivery_outside_dhaka", "bkash_number", "nagad_number", "rocket_number"]);
      if (error) throw error;
      const map: Record<string, string> = {};
      data?.forEach((s) => { map[s.key] = s.value || ""; });
      return {
        inside_dhaka: Number(map["delivery_inside_dhaka"]) || 80,
        outside_dhaka: Number(map["delivery_outside_dhaka"]) || 130,
        bkash_number: map["bkash_number"] || "",
        nagad_number: map["nagad_number"] || "",
        rocket_number: map["rocket_number"] || "",
      };
    },
  });

  const deliveryCharge = deliveryZone === "inside_dhaka"
    ? (deliverySettings?.inside_dhaka ?? 80)
    : (deliverySettings?.outside_dhaka ?? 130);

  const discount = appliedCoupon
    ? appliedCoupon.discount_type === "percentage"
      ? Math.round(totalPrice * appliedCoupon.discount_value / 100)
      : appliedCoupon.discount_value
    : 0;

  const grandTotal = totalPrice - discount + deliveryCharge;

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponChecking(true);
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", couponCode.toUpperCase().trim())
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        toast({ title: "অবৈধ কুপন কোড", description: "এই কুপনটি বিদ্যমান নেই বা নিষ্ক্রিয়।", variant: "destructive" });
        return;
      }
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        toast({ title: "কুপনের মেয়াদ শেষ", variant: "destructive" });
        return;
      }
      if (data.max_uses > 0 && (data.used_count || 0) >= data.max_uses) {
        toast({ title: "কুপনের সীমা শেষ হয়ে গেছে", variant: "destructive" });
        return;
      }
      if (data.min_order > 0 && totalPrice < data.min_order) {
        toast({ title: `সর্বনিম্ন অর্ডার ৳${data.min_order} হতে হবে`, variant: "destructive" });
        return;
      }
      setAppliedCoupon(data);
      toast({ title: "কুপন প্রযোজ্য হয়েছে! 🎉", description: data.discount_type === "percentage" ? `${data.discount_value}% ছাড় পেয়েছেন` : `৳${data.discount_value} ছাড় পেয়েছেন` });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setCouponChecking(false);
    }
  };

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
    const cartItems = Array.isArray(orderSuccess.cart_items) ? orderSuccess.cart_items : [];
    const subtotal = orderSuccess.total - savedDelivery;

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Invoice - ${orderSuccess.tracking_id || ""}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Tahoma,sans-serif;padding:40px;color:#111;max-width:800px;margin:auto}
h1{font-size:28px;font-weight:700;margin-bottom:4px}h2{font-size:14px;font-weight:400;color:#666;margin-bottom:16px}
.line{border-top:2px solid #111;margin:12px 0 20px}.meta{display:flex;justify-content:space-between;font-size:13px;line-height:1.8}
.section-title{font-size:15px;font-weight:600;margin:20px 0 8px}.detail{font-size:13px;line-height:1.8;padding-left:12px}
table{width:100%;border-collapse:collapse;margin-top:20px;font-size:13px}th{background:#f5f5f5;text-align:left;padding:10px 12px;border:1px solid #ddd}
td{padding:10px 12px;border:1px solid #eee}.total-row{text-align:right;font-size:13px;margin-top:12px;line-height:2}
.grand-total{font-size:20px;font-weight:700;text-align:right;margin-top:8px}
@media print{body{padding:20px}button{display:none!important}}</style></head><body>
<h1>SAILOR</h1><h2>Invoice / Memo</h2><div class="line"></div>
<div class="meta"><div><div>Order ID: #${(orderSuccess.id || "").slice(0, 8)}</div><div>Date: ${new Date(orderSuccess.created_at).toLocaleDateString("en-GB")}</div></div>
<div style="text-align:right"><div>Status: ${(orderSuccess.status || "PENDING").toUpperCase()}</div><div>Payment: ${orderSuccess.payment_method || "Cash on Delivery"}${orderSuccess.transaction_id ? ` (TxnID: ${orderSuccess.transaction_id})` : ""}</div></div></div>
<div class="section-title">Customer Details:</div>
<div class="detail">Name: ${orderSuccess.customer_name}<br>Phone: ${orderSuccess.phone}<br>Address: ${orderSuccess.address}</div>
<table><thead><tr><th>Item</th><th style="width:60px">Qty</th><th style="width:90px">Price</th><th style="width:90px">Total</th></tr></thead><tbody>
${cartItems.map((item: any) => `<tr><td>${item.name || "Item"}</td><td>${item.quantity || 1}</td><td>BDT ${item.price || 0}</td><td>BDT ${(item.price || 0) * (item.quantity || 1)}</td></tr>`).join("")}
</tbody></table>
<div class="total-row">Subtotal: BDT ${subtotal}<br>Delivery: BDT ${savedDelivery}</div>
<div class="grand-total">Total: BDT ${orderSuccess.total}</div>
<script>window.onload=function(){window.print()}<\/script></body></html>`;

    const win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); }
  };

  const copyTrackingId = () => {
    if (orderSuccess?.tracking_id) {
      navigator.clipboard.writeText(orderSuccess.tracking_id);
      toast({ title: "ট্র্যাকিং আইডি কপি হয়েছে!" });
    }
  };

  const inputCls = "w-full px-4 py-3 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground transition-all min-h-[44px]";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-6 md:py-12">
        <Link to="/shop" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 md:mb-6 transition-colors min-h-[44px]">
          <ArrowLeft size={16} /> শপিং চালিয়ে যান
        </Link>

        <h1 className="font-serif text-xl md:text-3xl tracking-wide mb-6 md:mb-8 text-foreground">Checkout</h1>

        <AnimatePresence mode="wait">
          {orderSuccess ? (
            <motion.div key="success" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg mx-auto text-center py-10 md:py-16">
              <SuccessAnimation />
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
                <h2 className="font-serif text-xl md:text-2xl mb-2 text-foreground mt-6">অর্ডার সফল হয়েছে!</h2>
                <div className="bg-card border border-border rounded-xl p-4 mb-4 inline-block">
                  <p className="text-xs text-muted-foreground mb-1">ট্র্যাকিং আইডি</p>
                  <div className="flex items-center gap-2 justify-center">
                    <span className="font-mono text-lg md:text-xl font-bold text-primary">{orderSuccess.tracking_id}</span>
                    <button onClick={copyTrackingId} className="p-2 hover:bg-secondary rounded min-w-[44px] min-h-[44px] flex items-center justify-center"><Copy size={14} /></button>
                  </div>
                </div>
                <p className="text-muted-foreground text-sm mb-6">আমরা শীঘ্রই আপনার সাথে যোগাযোগ করবো।</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button onClick={downloadInvoice} className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:opacity-90 transition-opacity min-h-[48px]">
                    <FileDown size={16} /> ইনভয়েস ডাউনলোড
                  </button>
                  <Link to="/track-order" className="px-6 py-3 border border-border rounded-full text-sm font-medium text-foreground hover:bg-secondary transition-colors text-center min-h-[48px] flex items-center justify-center">
                    অর্ডার ট্র্যাক করুন
                  </Link>
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid lg:grid-cols-5 gap-6 md:gap-8">
              <div className="lg:col-span-3">
                <div className="bg-card p-5 md:p-8 rounded-2xl shadow-sm border border-border">
                  <h2 className="font-serif text-lg mb-1 text-foreground">ডেলিভারি তথ্য</h2>
                  <p className="text-xs text-muted-foreground mb-5 md:mb-6">লগিন ছাড়াই অর্ডার করুন</p>
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
                    {/* District & Thana — full width on mobile */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                    {/* Coupon Code */}
                    <div className="pt-2 border-t border-border">
                      <label className="text-xs font-medium text-muted-foreground mb-2 block">কুপন কোড</label>
                      {appliedCoupon ? (
                        <div className="flex items-center justify-between p-3 bg-primary/10 border border-primary/30 rounded-xl">
                          <div>
                            <span className="font-mono font-bold text-sm text-primary">{appliedCoupon.code}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              {appliedCoupon.discount_type === "percentage" ? `${appliedCoupon.discount_value}% ছাড়` : `৳${appliedCoupon.discount_value} ছাড়`}
                            </span>
                          </div>
                          <button type="button" onClick={() => { setAppliedCoupon(null); setCouponCode(""); }} className="text-xs text-destructive hover:underline min-h-[44px] px-2">সরান</button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                            placeholder="কুপন কোড লিখুন"
                            className={`${inputCls} flex-1`}
                            maxLength={20}
                            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyCoupon())}
                          />
                          <button
                            type="button"
                            onClick={applyCoupon}
                            disabled={!couponCode.trim() || couponChecking}
                            className="px-4 py-3 bg-secondary text-foreground border border-border rounded-xl text-sm font-medium hover:bg-secondary/80 disabled:opacity-50 transition-colors whitespace-nowrap min-h-[44px]"
                          >
                            {couponChecking ? "..." : "প্রযোজ্য করুন"}
                          </button>
                        </div>
                      )}
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
                            className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-all min-h-[48px] ${
                              paymentMethod === opt.value
                                ? "border-primary bg-primary/10 text-primary"
                                : "border-border text-muted-foreground hover:border-ring"
                            }`}
                          >
                            {opt.icon}
                            <span className="truncate">{opt.label}</span>
                          </button>
                        ))}
                      </div>

                      {paymentMethod !== "cod" && (() => {
                        const numberMap: Record<string, string> = {
                          bkash: deliverySettings?.bkash_number || "",
                          nagad: deliverySettings?.nagad_number || "",
                          rocket: deliverySettings?.rocket_number || "",
                        };
                        const displayNumber = numberMap[paymentMethod];
                        const methodLabel = paymentMethod === "bkash" ? "bKash" : paymentMethod === "nagad" ? "Nagad" : "Rocket";
                        return (
                          <div className="mt-3 p-3 bg-secondary/50 rounded-xl border border-border space-y-2">
                            <p className="text-xs text-muted-foreground">
                              নিচের {methodLabel} নম্বরে <strong className="text-foreground">{formatPrice(grandTotal)}</strong> Send Money করুন:
                            </p>
                            <p className="text-sm font-mono font-bold text-foreground">
                              {displayNumber || <span className="text-destructive text-xs font-sans">নম্বর সেট করা হয়নি (Admin Settings এ দিন)</span>}
                              {displayNumber && " (Personal)"}
                            </p>
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
                        );
                      })()}
                    </div>

                    <button type="submit" disabled={submitting || items.length === 0} className="w-full py-3.5 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 min-h-[48px]">
                      {submitting ? "অর্ডার হচ্ছে..." : `অর্ডার করুন · ${formatPrice(grandTotal)}`}
                    </button>
                  </form>
                </div>
              </div>

              {/* Order Summary — collapsible on mobile */}
              <div className="lg:col-span-2 order-first lg:order-last">
                <div className="bg-card p-5 md:p-6 rounded-2xl shadow-sm border border-border lg:sticky lg:top-24">
                  {/* Mobile: collapsible header */}
                  <button
                    onClick={() => setSummaryOpen(!summaryOpen)}
                    className="w-full flex items-center justify-between lg:hidden mb-2"
                  >
                    <h2 className="font-serif text-lg text-foreground flex items-center gap-2">
                      <ShoppingBag size={18} /> অর্ডার সারাংশ ({items.length})
                    </h2>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">{formatPrice(grandTotal)}</span>
                      {summaryOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </button>
                  {/* Desktop: always visible header */}
                  <h2 className="font-serif text-lg mb-4 text-foreground items-center gap-2 hidden lg:flex">
                    <ShoppingBag size={18} /> অর্ডার সারাংশ
                  </h2>

                  {/* Content — always visible on desktop, toggle on mobile */}
                  <div className={`${summaryOpen ? "block" : "hidden"} lg:block`}>
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
                          {appliedCoupon && (
                            <div className="flex justify-between text-sm text-primary font-medium">
                              <span>ছাড় ({appliedCoupon.code})</span>
                              <span>- {formatPrice(discount)}</span>
                            </div>
                          )}
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
