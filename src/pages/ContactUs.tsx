import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, MapPin, Mail, Phone, Send, Facebook, Instagram, Twitter, Youtube } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useToast } from "@/hooks/use-toast";

const ContactUs = () => {
  const { settings } = useSiteSettings();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [sending, setSending] = useState(false);

  const storeName = settings.store_name || "SAILOR";
  const supportEmail = settings.support_email || settings.contact_email || "info@sailor.com.bd";
  const phoneNumber = settings.phone_number || settings.contact_phone || "01700000000";
  const officeAddress = settings.office_address || "ঢাকা, বাংলাদেশ";
  const facebookUrl = settings.facebook_url || settings.facebook || "https://facebook.com";
  const instagramUrl = settings.instagram_url || settings.instagram || "https://instagram.com";
  const twitterUrl = settings.twitter_url || "";
  const tiktokUrl = settings.tiktok_url || "";
  const youtubeUrl = settings.youtube_url || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSending(false);
    toast({ title: "✓ বার্তা পাঠানো হয়েছে", description: "আমরা শীঘ্রই আপনার সাথে যোগাযোগ করব।" });
    setForm({ name: "", email: "", phone: "", message: "" });
  };

  const inputCls = "w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-background text-foreground placeholder:text-muted-foreground";

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <Header />
        <main>
          {/* Hero */}
          <section className="bg-secondary py-14 md:py-20">
            <div className="container mx-auto px-4 md:px-6 text-center">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
                  <ArrowLeft size={16} /> হোমে ফিরুন
                </Link>
                <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3 block">সাহায্য</span>
                <h1 className="font-serif text-3xl md:text-5xl text-foreground mb-4">যোগাযোগ করুন</h1>
                <p className="text-muted-foreground max-w-lg mx-auto text-sm">আমরা সবসময় আপনার সেবায় প্রস্তুত। যেকোনো প্রশ্ন বা সমস্যায় আমাদের সাথে যোগাযোগ করুন।</p>
              </motion.div>
            </div>
          </section>

          <section className="py-14 md:py-20">
            <div className="container mx-auto px-4 md:px-6 max-w-5xl">
              <div className="grid md:grid-cols-2 gap-10 md:gap-16">
                {/* Contact Info */}
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
                  <h2 className="font-serif text-2xl text-foreground mb-8">আমাদের তথ্য</h2>
                  <div className="space-y-6">
                    {[
                      { icon: MapPin, label: "ঠিকানা", value: officeAddress, href: undefined },
                      { icon: Mail, label: "ইমেইল", value: supportEmail, href: `mailto:${supportEmail}` },
                      { icon: Phone, label: "ফোন", value: phoneNumber, href: `tel:${phoneNumber}` },
                    ].map((item) => (
                      <div key={item.label} className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <item.icon size={18} className="text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                          {item.href ? (
                            <a href={item.href} className="text-sm text-foreground hover:text-primary transition-colors">{item.value}</a>
                          ) : (
                            <p className="text-sm text-foreground">{item.value}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 pt-8 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-4 uppercase tracking-wider">সোশ্যাল মিডিয়া</p>
                    <div className="flex gap-3 flex-wrap">
                      {facebookUrl && (
                        <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors text-foreground">
                          <Facebook size={18} />
                        </a>
                      )}
                      {instagramUrl && (
                        <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors text-foreground">
                          <Instagram size={18} />
                        </a>
                      )}
                      {twitterUrl && (
                        <a href={twitterUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors text-foreground">
                          <Twitter size={18} />
                        </a>
                      )}
                      {tiktokUrl && (
                        <a href={tiktokUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors text-foreground">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V8.71a8.2 8.2 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.14z"/></svg>
                        </a>
                      )}
                      {youtubeUrl && (
                        <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors text-foreground">
                          <Youtube size={18} />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="mt-8 p-5 bg-secondary rounded-xl">
                    <p className="text-sm font-medium text-foreground mb-1">সাপোর্ট সময়সূচি</p>
                    <p className="text-xs text-muted-foreground">শনি – বৃহস্পতি: সকাল ১০টা – রাত ৮টা</p>
                    <p className="text-xs text-muted-foreground">শুক্রবার: সকাল ১০টা – বিকাল ৫টা</p>
                  </div>
                </motion.div>

                {/* Contact Form */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
                  <h2 className="font-serif text-2xl text-foreground mb-8">বার্তা পাঠান</h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block">আপনার নাম *</label>
                      <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="আপনার পুরো নাম" className={inputCls} />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block">ইমেইল</label>
                        <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" className={inputCls} />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block">ফোন *</label>
                        <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="01XXXXXXXXX" className={inputCls} />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block">বার্তা *</label>
                      <textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="আপনার বার্তা লিখুন..." className={`${inputCls} resize-none`} />
                    </div>
                    <button
                      type="submit"
                      disabled={sending}
                      className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      <Send size={16} />
                      {sending ? "পাঠানো হচ্ছে..." : "বার্তা পাঠান"}
                    </button>
                  </form>
                </motion.div>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </PageTransition>
  );
};

export default ContactUs;
