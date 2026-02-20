import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, ChevronDown } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const FAQ = () => {
  const { settings } = useSiteSettings();
  const [open, setOpen] = useState<number | null>(0);
  const insideDhaka = settings.delivery_inside_dhaka || "80";
  const outsideDhaka = settings.delivery_outside_dhaka || "130";
  const supportEmail = settings.support_email || settings.contact_email || "info@sailor.com.bd";
  const phoneNumber = settings.phone_number || settings.contact_phone || "01700000000";

  const faqs = [
    {
      q: "কিভাবে অর্ডার করবো?",
      a: "আমাদের ওয়েবসাইটে পণ্য বেছে কার্টে যোগ করুন। তারপর চেকআউটে গিয়ে আপনার নাম, ফোন নম্বর ও ঠিকানা দিন। পেমেন্ট মেথড বেছে অর্ডার কনফার্ম করুন। আমরা SMS-এ আপনার ট্র্যাকিং আইডি পাঠাবো।",
    },
    {
      q: `ডেলিভারি চার্জ কত?`,
      a: `ঢাকার ভিতরে ডেলিভারি চার্জ ৳${insideDhaka} এবং ঢাকার বাইরে ৳${outsideDhaka}। ৳২,০০০ এর বেশি অর্ডারে বিনামূল্যে ডেলিভারি পাওয়া যায়।`,
    },
    {
      q: "ডেলিভারি কতদিনে পাবো?",
      a: "ঢাকার ভিতরে ১-২ কার্যদিবস এবং ঢাকার বাইরে ২-৪ কার্যদিবসের মধ্যে ডেলিভারি দেওয়া হয়। ছুটির দিনে ডেলিভারি বন্ধ থাকে।",
    },
    {
      q: "কোন পেমেন্ট মেথড সাপোর্ট করা হয়?",
      a: "আমরা বিকাশ, নগদ, রকেট এবং ক্যাশ অন ডেলিভারি গ্রহণ করি। নিরাপদ ট্রানজেকশনের জন্য সর্বদা আমাদের অফিশিয়াল নম্বরে পেমেন্ট করুন।",
    },
    {
      q: "পণ্য রিটার্ন বা এক্সচেঞ্জ করা যাবে?",
      a: "হ্যাঁ, পণ্য পাওয়ার ৭ দিনের মধ্যে রিটার্ন বা এক্সচেঞ্জ করা যাবে। পণ্যটি অব্যবহৃত ও আনওয়াশড থাকতে হবে এবং সব ট্যাগ সম্পূর্ণ থাকতে হবে। ত্রুটিপূর্ণ পণ্যের ক্ষেত্রে সম্পূর্ণ রিফান্ড দেওয়া হবে।",
    },
    {
      q: "কিভাবে অর্ডার ট্র্যাক করবো?",
      a: "আমাদের 'ট্র্যাক অর্ডার' পেজে গিয়ে আপনার ট্র্যাকিং আইডি (SN-XXXXX) অথবা ফোন নম্বর দিয়ে অর্ডারের অবস্থান জানুন।",
    },
    {
      q: "সাইজ সম্পর্কে কিভাবে জানবো?",
      a: "প্রতিটি পণ্যের পেজে 'সাইজ গাইড' বাটন আছে। সেখানে বিস্তারিত মাপ দেওয়া আছে। সঠিক সাইজ বেছে নিতে আমাদের সাইজ চার্ট দেখুন অথবা আমাদের সাথে যোগাযোগ করুন।",
    },
    {
      q: "অর্ডার বাতিল করা যাবে?",
      a: "অর্ডার দেওয়ার ২ ঘণ্টার মধ্যে বাতিল করা যাবে। পরবর্তীতে বাতিলের জন্য আমাদের সাথে যোগাযোগ করুন এবং সম্ভব হলে বাতিল করা হবে।",
    },
    {
      q: "পণ্যের মান কেমন?",
      a: "আমরা সর্বোচ্চ মানের কাপড় ব্যবহার করি। প্রতিটি পণ্য কঠোর মান নিয়ন্ত্রণের মধ্যে দিয়ে যায়। আমাদের পণ্য আন্তর্জাতিক মানের এবং দীর্ঘস্থায়ী।",
    },
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
              <h1 className="font-serif text-3xl md:text-4xl text-foreground mb-4">সাধারণ প্রশ্নাবলী</h1>
              <p className="text-sm text-muted-foreground">আপনার মনে কোনো প্রশ্ন থাকলে এখানে উত্তর খুঁজুন</p>
            </div>

            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="bg-card border border-border rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => setOpen(open === i ? null : i)}
                    className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-secondary/50 transition-colors"
                  >
                    <span className="font-medium text-sm text-foreground pr-4">{faq.q}</span>
                    <motion.div animate={{ rotate: open === i ? 180 : 0 }} transition={{ duration: 0.2 }} className="flex-shrink-0">
                      <ChevronDown size={18} className="text-muted-foreground" />
                    </motion.div>
                  </button>
                  <AnimatePresence>
                    {open === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <div className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border pt-4">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>

            <div className="mt-10 p-6 bg-secondary rounded-2xl text-center">
              <p className="font-medium text-foreground mb-2">আপনার প্রশ্নের উত্তর পাননি?</p>
              <p className="text-sm text-muted-foreground mb-4">আমাদের সাপোর্ট টিমের সাথে যোগাযোগ করুন</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a href={`tel:${phoneNumber}`} className="px-6 py-2.5 bg-primary text-primary-foreground rounded-full text-sm font-medium hover:opacity-90 transition-opacity">
                  ফোন করুন
                </a>
                <a href={`mailto:${supportEmail}`} className="px-6 py-2.5 border border-border text-foreground rounded-full text-sm font-medium hover:bg-card transition-colors">
                  ইমেইল করুন
                </a>
              </div>
            </div>
          </motion.div>
        </main>
        <Footer />
      </div>
    </PageTransition>
  );
};

export default FAQ;
