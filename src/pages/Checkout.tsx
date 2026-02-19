import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/currency";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { ArrowLeft, ShoppingBag, CheckCircle, FileDown, Truck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import jsPDF from "jspdf";

const DELIVERY_CHARGE = 120;

const Checkout = () => {
  const { items, totalPrice, clearCart } = useCart();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any>(null);

  const grandTotal = totalPrice + DELIVERY_CHARGE;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !form.address.trim()) {
      toast({ title: "সব তথ্য পূরণ করুন", variant: "destructive" });
      return;
    }
    if (items.length === 0) {
      toast({ title: "কার্ট খালি", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.from("orders").insert({
        customer_name: form.name.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        cart_items: items.map((i) => ({ name: i.name, price: i.price, quantity: i.quantity, image: i.image })),
        total: grandTotal,
        payment_method: "Cash on Delivery",
      }).select().single();

      if (error) throw error;
      setOrderSuccess(data);
      clearCart();
      toast({ title: "অর্ডার সফল হয়েছে! 🎉" });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const downloadInvoice = () => {
    if (!orderSuccess) return;
    const doc = new jsPDF();
    doc.setFontSize(22); doc.text("SAILOR", 20, 25);
    doc.setFontSize(10); doc.setTextColor(100); doc.text("Order Invoice", 20, 33);
    doc.line(20, 36, 190, 36);
    doc.setTextColor(0);
    doc.text(`Order ID: #${orderSuccess.id.slice(0, 8)}`, 20, 45);
    doc.text(`Date: ${new Date(orderSuccess.created_at).toLocaleDateString("en-GB")}`, 20, 52);
    doc.text(`Payment: Cash on Delivery`, 130, 45);
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
    doc.setFontSize(9); doc.text(`Subtotal: BDT ${orderSuccess.total - DELIVERY_CHARGE}`, 140, y); y += 7;
    doc.text(`Delivery: BDT ${DELIVERY_CHARGE}`, 140, y); y += 7;
    doc.setFontSize(12); doc.text(`Total: BDT ${orderSuccess.total}`, 140, y);
    doc.save(`invoice-${orderSuccess.id.slice(0, 8)}.pdf`);
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
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={40} className="text-emerald-500" />
              </div>
              <h2 className="font-serif text-2xl mb-2 text-foreground">অর্ডার সফল হয়েছে!</h2>
              <p className="text-muted-foreground text-sm mb-1">Order ID: #{orderSuccess.id.slice(0, 8)}</p>
              <p className="text-muted-foreground text-sm mb-6">আমরা শীঘ্রই আপনার সাথে যোগাযোগ করবো।</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={downloadInvoice} className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:opacity-90 transition-opacity">
                  <FileDown size={16} /> ইনভয়েস ডাউনলোড
                </button>
                <Link to="/" className="px-6 py-3 border border-border rounded-full text-sm font-medium text-foreground hover:bg-secondary transition-colors text-center">
                  হোম পেজে যান
                </Link>
              </div>
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid lg:grid-cols-5 gap-8">
              {/* Form */}
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
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">ফোন নম্বর *</label>
                      <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="01XXXXXXXXX" className={inputCls} required maxLength={15} />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">সম্পূর্ণ ঠিকানা *</label>
                      <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="বাড়ি, রোড, এলাকা, জেলা" rows={3} className={`${inputCls} resize-none`} required maxLength={500} />
                    </div>

                    <div className="pt-2 border-t border-border">
                      <div className="flex items-center gap-2 py-3 text-sm text-muted-foreground">
                        <Truck size={16} /> ক্যাশ অন ডেলিভারি
                      </div>
                    </div>

                    <button type="submit" disabled={submitting || items.length === 0} className="w-full py-3.5 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                      {submitting ? "অর্ডার হচ্ছে..." : `অর্ডার করুন · ${formatPrice(grandTotal)}`}
                    </button>
                  </form>
                </div>
              </div>

              {/* Summary */}
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
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>সাবটোটাল</span>
                          <span>{formatPrice(totalPrice)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-muted-foreground">
                          <span>ডেলিভারি চার্জ</span>
                          <span>{formatPrice(DELIVERY_CHARGE)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-base pt-2 border-t border-border text-foreground">
                          <span>মোট</span>
                          <span>{formatPrice(grandTotal)}</span>
                        </div>
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
