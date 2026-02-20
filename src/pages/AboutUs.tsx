import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { MapPin, Mail, Phone, Heart, Star, Shield } from "lucide-react";

const AboutUs = () => {
  const { settings } = useSiteSettings();

  const storeName = settings.store_name || "SAILOR";
  const aboutUs = settings.about_us || "SAILOR হলো বাংলাদেশের একটি প্রিমিয়াম ফ্যাশন ব্র্যান্ড যা আপনার জীবনধারার সাথে মিলে যায়।";
  const aboutUsExtended = settings.about_us_extended || `${storeName} প্রতিষ্ঠিত হয়েছিল একটি সরল কিন্তু শক্তিশালী বিশ্বাস নিয়ে — প্রতিটি মানুষ সর্বোচ্চ মানের পোশাক পাওয়ার যোগ্য। আমরা বিশ্বাস করি যে পোশাক শুধু একটি প্রয়োজনীয়তা নয়, এটি আপনার ব্যক্তিত্বের প্রকাশ।

আমাদের ডিজাইন টিম প্রতিনিয়ত বিশ্বের সেরা ফ্যাশন ট্রেন্ডগুলো পর্যবেক্ষণ করে এবং সেগুলোকে বাংলাদেশের সংস্কৃতি ও আবহাওয়ার সাথে মিলিয়ে অনন্য কালেকশন তৈরি করে। আমাদের প্রতিটি পোশাক হাতে বাছাই করা উচ্চমানের কাপড় দিয়ে তৈরি, যা আরামদায়ক এবং দীর্ঘস্থায়ী।`;
  const ourMission = settings.our_mission || "আমাদের লক্ষ্য হলো বাংলাদেশের প্রতিটি মানুষের কাছে আন্তর্জাতিক মানের ফ্যাশন সাশ্রয়ী মূল্যে পৌঁছে দেওয়া এবং দেশীয় পোশাক শিল্পকে এগিয়ে নিয়ে যাওয়া।";
  const officeAddress = settings.office_address || "ঢাকা, বাংলাদেশ";
  const supportEmail = settings.support_email || settings.contact_email || "info@sailor.com.bd";
  const phoneNumber = settings.phone_number || settings.contact_phone || "01700000000";

  const values = [
    {
      icon: Heart,
      title: "গুণগত মান",
      desc: "আমরা প্রতিটি পণ্যে সর্বোচ্চ মান নিশ্চিত করি। সেরা কাপড়, সেরা সেলাই, সেরা ফিনিশিং।",
    },
    {
      icon: Star,
      title: "অনন্য ডিজাইন",
      desc: "আমাদের প্রতিটি কালেকশন অনন্য এবং ট্রেন্ডি। বিশ্বমানের ডিজাইন, বাংলাদেশি পরিচয়।",
    },
    {
      icon: Shield,
      title: "বিশ্বস্ততা",
      desc: "গ্রাহকের সন্তুষ্টি আমাদের সর্বোচ্চ অগ্রাধিকার। সহজ রিটার্ন পলিসি এবং নিরাপদ পেমেন্ট।",
    },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-background">
        <Header />
        <main>
          {/* Hero */}
          <section className="bg-primary text-primary-foreground py-20 md:py-28">
            <div className="container mx-auto px-4 md:px-6 text-center">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <span className="text-xs uppercase tracking-[0.2em] text-primary-foreground/60 mb-4 block">আমাদের গল্প</span>
                <h1 className="font-serif text-4xl md:text-6xl tracking-wide mb-6">{storeName}</h1>
                <p className="text-primary-foreground/75 text-lg max-w-2xl mx-auto leading-relaxed">{aboutUs}</p>
              </motion.div>
            </div>
          </section>

          {/* About Content */}
          <section className="py-16 md:py-24">
            <div className="container mx-auto px-4 md:px-6 max-w-4xl">
              <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
                <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}>
                  <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-6">আমাদের গল্প</h2>
                  <div className="space-y-4 text-muted-foreground leading-relaxed text-sm">
                    {aboutUsExtended.split("\n\n").map((para, i) => (
                      <p key={i}>{para}</p>
                    ))}
                  </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}>
                  <div className="bg-secondary rounded-2xl p-8 space-y-6">
                    <div className="text-center">
                      <p className="font-serif text-5xl text-primary mb-2">২০২০</p>
                      <p className="text-sm text-muted-foreground">প্রতিষ্ঠার বছর</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                      <div className="text-center">
                        <p className="font-serif text-3xl text-foreground mb-1">৫০০+</p>
                        <p className="text-xs text-muted-foreground">প্রোডাক্ট</p>
                      </div>
                      <div className="text-center">
                        <p className="font-serif text-3xl text-foreground mb-1">১০K+</p>
                        <p className="text-xs text-muted-foreground">সন্তুষ্ট গ্রাহক</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* Mission */}
          <section className="bg-secondary py-16 md:py-20">
            <div className="container mx-auto px-4 md:px-6 max-w-3xl text-center">
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} viewport={{ once: true }}>
                <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4 block">আমাদের লক্ষ্য</span>
                <h2 className="font-serif text-3xl md:text-4xl text-foreground mb-6">আমরা কী বিশ্বাস করি</h2>
                <p className="text-muted-foreground leading-relaxed">{ourMission}</p>
              </motion.div>
            </div>
          </section>

          {/* Values */}
          <section className="py-16 md:py-24">
            <div className="container mx-auto px-4 md:px-6 max-w-4xl">
              <div className="text-center mb-12">
                <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3 block">আমাদের মূল্যবোধ</span>
                <h2 className="font-serif text-3xl md:text-4xl text-foreground">আমরা যা মানি</h2>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                {values.map((v, i) => (
                  <motion.div
                    key={v.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    viewport={{ once: true }}
                    className="text-center p-6"
                  >
                    <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-5">
                      <v.icon size={24} className="text-primary" />
                    </div>
                    <h3 className="font-serif text-xl text-foreground mb-3">{v.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Contact */}
          <section className="bg-primary text-primary-foreground py-16">
            <div className="container mx-auto px-4 md:px-6 max-w-3xl">
              <div className="text-center mb-10">
                <h2 className="font-serif text-3xl mb-3">যোগাযোগ করুন</h2>
                <p className="text-primary-foreground/70 text-sm">আমাদের সাথে যোগাযোগ করতে দ্বিধা করবেন না</p>
              </div>
              <div className="grid md:grid-cols-3 gap-6 text-center">
                {officeAddress && (
                  <div className="space-y-2">
                    <MapPin size={24} className="mx-auto text-primary-foreground/60" />
                    <p className="text-sm font-medium">ঠিকানা</p>
                    <p className="text-primary-foreground/70 text-xs">{officeAddress}</p>
                  </div>
                )}
                {supportEmail && (
                  <div className="space-y-2">
                    <Mail size={24} className="mx-auto text-primary-foreground/60" />
                    <p className="text-sm font-medium">ইমেইল</p>
                    <a href={`mailto:${supportEmail}`} className="text-primary-foreground/70 text-xs hover:text-primary-foreground transition-colors">{supportEmail}</a>
                  </div>
                )}
                {phoneNumber && (
                  <div className="space-y-2">
                    <Phone size={24} className="mx-auto text-primary-foreground/60" />
                    <p className="text-sm font-medium">ফোন</p>
                    <a href={`tel:${phoneNumber}`} className="text-primary-foreground/70 text-xs hover:text-primary-foreground transition-colors">{phoneNumber}</a>
                  </div>
                )}
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </PageTransition>
  );
};

export default AboutUs;
