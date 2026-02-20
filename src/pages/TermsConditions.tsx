import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const TermsConditions = () => {
  const { settings } = useSiteSettings();
  const storeName = settings.store_name || "SAILOR";
  const supportEmail = settings.support_email || settings.contact_email || "info@sailor.com.bd";

  const content = settings.terms_conditions || `**১. সেবার শর্তাবলী গ্রহণ**
এই ওয়েবসাইট ব্যবহার করে আপনি এই শর্তাবলী মেনে নিচ্ছেন। আপনি যদি এই শর্তাবলীর সাথে একমত না হন, তাহলে আমাদের সেবা ব্যবহার না করার অনুরোধ করা হচ্ছে।

**২. পণ্য ও মূল্য**
- সকল পণ্যের মূল্য বাংলাদেশী টাকায় (৳) উল্লেখ করা হয়
- মূল্য পরিবর্তনের অধিকার আমরা সংরক্ষণ করি
- অর্ডার নিশ্চিত হওয়ার পর মূল্য পরিবর্তন হবে না
- স্টক শেষ হয়ে গেলে অর্ডার বাতিল করার অধিকার আমরা রাখি

**৩. অর্ডার প্রক্রিয়া**
অর্ডার দেওয়ার পর আমাদের দল ২৪ ঘণ্টার মধ্যে আপনার সাথে যোগাযোগ করবে এবং অর্ডার নিশ্চিত করবে। অর্ডার নিশ্চিত হওয়ার পর ১-৩ কার্যদিবসের মধ্যে ডেলিভারি দেওয়া হয়।

**৪. পেমেন্ট**
- বর্তমানে আমরা বিকাশ, নগদ ও রকেটের মাধ্যমে পেমেন্ট গ্রহণ করি
- পেমেন্ট সম্পূর্ণ হওয়ার পর অর্ডার কনফার্ম হবে
- ক্যাশ অন ডেলিভারিও গ্রহণ করা হয় (নির্দিষ্ট এলাকায়)

**৫. ডেলিভারি**
- ঢাকার ভিতরে: ৮০-১২০ টাকা (১-২ কার্যদিবস)
- ঢাকার বাইরে: ১৩০-১৫০ টাকা (২-৪ কার্যদিবস)
- ডেলিভারি চার্জ এলাকা ও ওজন অনুযায়ী পরিবর্তিত হতে পারে

**৬. রিটার্ন ও এক্সচেঞ্জ পলিসি**
পণ্য পাওয়ার ৭ দিনের মধ্যে নিচের শর্তে রিটার্ন বা এক্সচেঞ্জ করা যাবে:
- পণ্যটি অব্যবহৃত ও আনওয়াশড থাকতে হবে
- ট্যাগ সম্পূর্ণ থাকতে হবে
- ত্রুটিপূর্ণ পণ্যের ক্ষেত্রে সম্পূর্ণ রিফান্ড দেওয়া হবে
- সাইজ পরিবর্তনের জন্য এক্সচেঞ্জ করা যাবে (স্টক সাপেক্ষে)

**৭. বাতিলকরণ**
অর্ডার দেওয়ার ২ ঘণ্টার মধ্যে বাতিল করা যাবে। পরবর্তীতে বাতিলের জন্য আমাদের সাথে যোগাযোগ করুন।

**৮. বৌদ্ধিক সম্পদ**
এই ওয়েবসাইটের সকল কন্টেন্ট, ছবি, লোগো ও ডিজাইন ${storeName}-এর মালিকানাধীন। অনুমতি ছাড়া ব্যবহার নিষিদ্ধ।

**৯. দায়বদ্ধতার সীমা**
${storeName} কোনো পরোক্ষ ক্ষতির জন্য দায়বদ্ধ নয়। আমাদের সর্বোচ্চ দায় পণ্যের মূল্যের মধ্যে সীমিত।

**১০. শর্তাবলী পরিবর্তন**
আমরা যেকোনো সময় এই শর্তাবলী পরিবর্তন করার অধিকার রাখি। পরিবর্তন ওয়েবসাইটে প্রকাশিত হওয়ার পর কার্যকর হবে।`;

  const renderContent = (text: string) => {
    return text.split("\n\n").map((block, i) => {
      if (block.startsWith("**")) {
        const parts = block.split("\n");
        const heading = parts[0].replace(/\*\*/g, "");
        const rest = parts.slice(1);
        return (
          <div key={i} className="mt-8 first:mt-0">
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
              <h1 className="font-serif text-3xl md:text-4xl text-foreground mb-4">ব্যবহারের শর্তাবলী</h1>
              <p className="text-sm text-muted-foreground">সর্বশেষ আপডেট: জানুয়ারি ২০২৫</p>
            </div>

            <div className="bg-card border border-border rounded-2xl p-8 md:p-10">
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                {storeName}-এ কেনাকাটা করার আগে এই শর্তাবলী মনোযোগ দিয়ে পড়ুন। আমাদের সেবা ব্যবহার করে আপনি এই শর্তাবলী মেনে নিচ্ছেন।
              </p>

              <div>{renderContent(content)}</div>

              <div className="mt-10 p-4 bg-secondary rounded-xl">
                <p className="text-xs text-muted-foreground">
                  শর্তাবলী সম্পর্কিত যেকোনো প্রশ্নের জন্য আমাদের ইমেইল করুন:{" "}
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

export default TermsConditions;
