import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Truck, RotateCcw, Clock, MapPin } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { formatPrice } from "@/lib/currency";

const ShippingReturns = () => {
  const { settings } = useSiteSettings();
  const insideDhaka = settings.delivery_inside_dhaka || "80";
  const outsideDhaka = settings.delivery_outside_dhaka || "130";
  const supportEmail = settings.support_email || settings.contact_email || "info@sailor.com.bd";
  const phoneNumber = settings.phone_number || settings.contact_phone || "01700000000";

  const shippingZones = [
    { zone: "ঢাকার ভিতরে", time: "১-২ কার্যদিবস", price: `৳${insideDhaka}`, icon: "🏙️" },
    { zone: "ঢাকার বাইরে", time: "২-৪ কার্যদিবস", price: `৳${outsideDhaka}`, icon: "🚚" },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="max-w-3xl mx-auto px-4 md:px-6 py-12 md:py-20">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft size={16} /> হোমে ফিরুন
          </Link>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div className="mb-10">
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3 block">সাহায্য</span>
              <h1 className="font-serif text-3xl md:text-4xl text-foreground mb-4">শিপিং ও রিটার্ন</h1>
              <p className="text-sm text-muted-foreground">আমাদের ডেলিভারি এবং রিটার্ন পলিসি সম্পর্কে বিস্তারিত জানুন</p>
            </div>

            <div className="space-y-6">
              {/* Shipping */}
              <div className="bg-card border border-border rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Truck size={20} className="text-primary" />
                  </div>
                  <h2 className="font-serif text-xl text-foreground">ডেলিভারি তথ্য</h2>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 mb-6">
                  {shippingZones.map((zone) => (
                    <div key={zone.zone} className="bg-secondary rounded-xl p-5">
                      <p className="text-2xl mb-2">{zone.icon}</p>
                      <p className="font-medium text-foreground text-sm mb-1">{zone.zone}</p>
                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Clock size={12} />
                          {zone.time}
                        </div>
                        <p className="font-serif text-lg text-primary">{zone.price}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 text-sm text-muted-foreground">
                  <p className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span> অর্ডার নিশ্চিত হওয়ার পর ১ কার্যদিবসের মধ্যে শিপমেন্ট হবে</p>
                  <p className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span> শিপমেন্টের পর ট্র্যাকিং আইডি SMS-এ পাঠানো হবে</p>
                  <p className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span> ৳২,০০০ এর বেশি অর্ডারে বিনামূল্যে ডেলিভারি</p>
                  <p className="flex items-start gap-2"><span className="text-primary mt-0.5">•</span> ছুটির দিনে ডেলিভারি বন্ধ থাকে</p>
                </div>
              </div>

              {/* Returns */}
              <div className="bg-card border border-border rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <RotateCcw size={20} className="text-primary" />
                  </div>
                  <h2 className="font-serif text-xl text-foreground">রিটার্ন ও এক্সচেঞ্জ</h2>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-secondary rounded-xl">
                    <p className="font-medium text-foreground text-sm mb-2">রিটার্নের শর্ত</p>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> পণ্য পাওয়ার ৭ দিনের মধ্যে রিটার্ন করতে হবে</p>
                      <p className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> পণ্য অব্যবহৃত ও আনওয়াশড থাকতে হবে</p>
                      <p className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> মূল প্যাকেজিং ও ট্যাগ সম্পূর্ণ থাকতে হবে</p>
                      <p className="flex items-start gap-2"><span className="text-primary mt-0.5">✓</span> ত্রুটিপূর্ণ পণ্যের ক্ষেত্রে বিনামূল্যে রিটার্ন</p>
                    </div>
                  </div>

                  <div className="p-4 bg-secondary rounded-xl">
                    <p className="font-medium text-foreground text-sm mb-2">রিফান্ড প্রক্রিয়া</p>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <p className="flex items-start gap-2"><span className="text-muted-foreground mt-0.5">১.</span> আমাদের সাথে যোগাযোগ করুন</p>
                      <p className="flex items-start gap-2"><span className="text-muted-foreground mt-0.5">২.</span> পণ্যের ছবি ও অর্ডার আইডি পাঠান</p>
                      <p className="flex items-start gap-2"><span className="text-muted-foreground mt-0.5">৩.</span> অনুমোদনের পর পণ্য কুরিয়ারে পাঠান</p>
                      <p className="flex items-start gap-2"><span className="text-muted-foreground mt-0.5">৪.</span> পণ্য পাওয়ার ২-৩ দিনের মধ্যে রিফান্ড/এক্সচেঞ্জ হবে</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6">
                <p className="font-medium text-foreground text-sm mb-3">সাহায্য দরকার?</p>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>ইমেইল: <a href={`mailto:${supportEmail}`} className="text-primary hover:underline">{supportEmail}</a></p>
                  <p>ফোন: <a href={`tel:${phoneNumber}`} className="text-primary hover:underline">{phoneNumber}</a></p>
                </div>
              </div>
            </div>
          </motion.div>
        </main>
        <Footer />
      </div>
    </PageTransition>
  );
};

export default ShippingReturns;
