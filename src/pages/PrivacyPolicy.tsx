import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const PrivacyPolicy = () => {
  const { settings } = useSiteSettings();
  const storeName = settings.store_name || "SAILOR";
  const supportEmail = settings.support_email || settings.contact_email || "info@sailor.com.bd";

  const content = settings.privacy_policy || `**১. তথ্য সংগ্রহ**
আমরা আপনার নাম, ইমেইল, ফোন নম্বর এবং ডেলিভারি ঠিকানা সংগ্রহ করি। এই তথ্যগুলো শুধুমাত্র অর্ডার প্রক্রিয়াকরণ ও ডেলিভারির জন্য ব্যবহার করা হয়।

**২. তথ্য ব্যবহার**
আপনার ব্যক্তিগত তথ্য নিম্নলিখিত উদ্দেশ্যে ব্যবহার করা হয়:
- অর্ডার প্রক্রিয়াকরণ ও ডেলিভারি নিশ্চিত করতে
- অর্ডার সম্পর্কিত আপডেট ও নোটিফিকেশন পাঠাতে
- গ্রাহক সেবা উন্নত করতে
- নতুন পণ্য ও অফার সম্পর্কে জানাতে (আপনার অনুমতি সাপেক্ষে)

**৩. তথ্যের নিরাপত্তা**
আমরা আপনার তথ্য সুরক্ষার জন্য সর্বোচ্চ নিরাপত্তা ব্যবস্থা গ্রহণ করি। আমাদের ওয়েবসাইট SSL এনক্রিপশন ব্যবহার করে। তৃতীয় পক্ষের সাথে আপনার তথ্য শেয়ার করা হয় না।

**৪. কুকি পলিসি**
আমরা ওয়েবসাইটের অভিজ্ঞতা উন্নত করতে কুকি ব্যবহার করি। আপনি যেকোনো সময় ব্রাউজার সেটিংস থেকে কুকি বন্ধ করতে পারেন।

**৫. তৃতীয় পক্ষ**
পেমেন্ট প্রক্রিয়াকরণের জন্য আমরা bKash, Nagad এবং Rocket-এর সেবা ব্যবহার করি। এই প্ল্যাটফর্মগুলোর নিজস্ব প্রাইভেসি পলিসি রয়েছে।

**৬. আপনার অধিকার**
আপনি যেকোনো সময়:
- আপনার তথ্য দেখার অনুরোধ করতে পারেন
- আপনার তথ্য আপডেট করতে পারেন
- আপনার অ্যাকাউন্ট মুছে ফেলার অনুরোধ করতে পারেন
- মার্কেটিং ইমেইল থেকে আনসাবস্ক্রাইব করতে পারেন

**৭. যোগাযোগ**
এই প্রাইভেসি পলিসি সম্পর্কে কোনো প্রশ্ন থাকলে আমাদের সাথে যোগাযোগ করুন।`;

  const renderContent = (text: string) => {
    return text.split("\n\n").map((block, i) => {
      if (block.startsWith("**") && block.endsWith("**")) {
        return <h3 key={i} className="font-serif text-lg text-foreground mt-8 mb-3">{block.replace(/\*\*/g, "")}</h3>;
      }
      if (block.startsWith("**")) {
        const parts = block.split("\n");
        const heading = parts[0].replace(/\*\*/g, "");
        const rest = parts.slice(1);
        return (
          <div key={i} className="mt-8">
            <h3 className="font-serif text-lg text-foreground mb-3">{heading}</h3>
            {rest.map((line, j) =>
              line.startsWith("- ") ? (
                <p key={j} className="text-sm text-muted-foreground leading-relaxed pl-4 mb-1">• {line.slice(2)}</p>
              ) : (
                <p key={j} className="text-sm text-muted-foreground leading-relaxed mb-2">{line}</p>
              )
            )}
          </div>
        );
      }
      if (block.includes("\n- ")) {
        const lines = block.split("\n");
        return (
          <ul key={i} className="space-y-1 my-3">
            {lines.map((line, j) =>
              line.startsWith("- ") ? (
                <li key={j} className="text-sm text-muted-foreground pl-4">• {line.slice(2)}</li>
              ) : (
                <p key={j} className="text-sm text-muted-foreground">{line}</p>
              )
            )}
          </ul>
        );
      }
      return <p key={i} className="text-sm text-muted-foreground leading-relaxed mb-4">{block}</p>;
    });
  };

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
              <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3 block">আইনি তথ্য</span>
              <h1 className="font-serif text-3xl md:text-4xl text-foreground mb-4">প্রাইভেসি পলিসি</h1>
              <p className="text-sm text-muted-foreground">সর্বশেষ আপডেট: জানুয়ারি ২০২৫</p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-8 md:p-10 prose-content">
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                {storeName}-এ আপনাকে স্বাগতম। আমরা আপনার গোপনীয়তাকে অত্যন্ত গুরুত্ব দিই। এই প্রাইভেসি পলিসি ব্যাখ্যা করে যে আমরা আপনার তথ্য কীভাবে সংগ্রহ, ব্যবহার এবং সুরক্ষিত রাখি।
              </p>

              <div className="divide-y divide-border">
                <div className="pb-6">
                  {renderContent(content)}
                </div>
              </div>

              <div className="mt-8 p-4 bg-secondary rounded-xl">
                <p className="text-xs text-muted-foreground">
                  প্রাইভেসি সম্পর্কিত যেকোনো প্রশ্নের জন্য আমাদের ইমেইল করুন:{" "}
                  <a href={`mailto:${supportEmail}`} className="text-primary hover:underline">{supportEmail}</a>
                </p>
              </div>
            </div>
          </motion.div>
        </main>
        <Footer />
      </div>
    </PageTransition>
  );
};

export default PrivacyPolicy;
