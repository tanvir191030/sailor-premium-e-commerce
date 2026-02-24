import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/currency";
import {
  Download, Save, Globe, Share2, Truck, Smartphone,
  Upload, Image, Search, Mail, Phone, MapPin, FileText, Palette, Zap, BookOpen, MessageCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Section = ({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) => (
  <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
    <div className="flex items-center gap-2 mb-5">
      <Icon size={18} className="text-muted-foreground" />
      <h3 className="font-serif text-base text-foreground">{title}</h3>
    </div>
    {children}
  </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="text-xs text-muted-foreground mb-1.5 block font-medium">{label}</label>
    {children}
  </div>
);

const inputCls = "w-full px-3 py-2.5 border border-border rounded-lg text-sm focus:outline-none bg-transparent text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary/30";
const textareaCls = `${inputCls} resize-none`;

const AdminSettings = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const { data: settings = [] } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*");
      if (error) throw error;
      return data;
    },
  });

  const getSetting = (key: string, fallback = "") =>
    settings.find((s: any) => s.key === key)?.value ?? fallback;

  // Brand & Header
  const [storeName, setStoreName] = useState("");
  const [announcementBar, setAnnouncementBar] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [faviconUrl, setFaviconUrl] = useState("");
  // Footer
  const [aboutUs, setAboutUs] = useState("");
  const [aboutUsExtended, setAboutUsExtended] = useState("");
  const [ourMission, setOurMission] = useState("");
  const [officeAddress, setOfficeAddress] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  // Social
  const [facebookUrl, setFacebookUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [twitterUrl, setTwitterUrl] = useState("");
  // SEO
  const [siteTitle, setSiteTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  // Delivery
  const [insideDhaka, setInsideDhaka] = useState("80");
  const [outsideDhaka, setOutsideDhaka] = useState("130");
  // Payment
  const [bkashNumber, setBkashNumber] = useState("");
  const [nagadNumber, setNagadNumber] = useState("");
  const [rocketNumber, setRocketNumber] = useState("");
  // Tracking
  const [facebookPixelId, setFacebookPixelId] = useState("");
  // Chat Widget
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [messengerUrl, setMessengerUrl] = useState("");
  // Pages
  const [privacyPolicy, setPrivacyPolicy] = useState("");
  const [termsConditions, setTermsConditions] = useState("");

  const [loaded, setLoaded] = useState(false);
  const [uploading, setUploading] = useState<"logo" | "favicon" | null>(null);

  if (settings.length > 0 && !loaded) {
    setStoreName(getSetting("store_name", "SAILOR"));
    setAnnouncementBar(getSetting("announcement_bar", "সকল অর্ডারে ফ্রি শিপিং"));
    setLogoUrl(getSetting("logo_url", ""));
    setFaviconUrl(getSetting("favicon_url", ""));
    setAboutUs(getSetting("about_us", ""));
    setAboutUsExtended(getSetting("about_us_extended", ""));
    setOurMission(getSetting("our_mission", ""));
    setOfficeAddress(getSetting("office_address", ""));
    setSupportEmail(getSetting("support_email", ""));
    setPhoneNumber(getSetting("phone_number", ""));
    setFacebookUrl(getSetting("facebook_url", getSetting("facebook", "")));
    setInstagramUrl(getSetting("instagram_url", getSetting("instagram", "")));
    setTwitterUrl(getSetting("twitter_url", ""));
    setSiteTitle(getSetting("site_title", "SAILOR - Premium Fashion Bangladesh"));
    setMetaDescription(getSetting("meta_description", ""));
    setInsideDhaka(getSetting("delivery_inside_dhaka", "80"));
    setOutsideDhaka(getSetting("delivery_outside_dhaka", "130"));
    setBkashNumber(getSetting("bkash_number", ""));
    setNagadNumber(getSetting("nagad_number", ""));
    setRocketNumber(getSetting("rocket_number", ""));
    setFacebookPixelId(getSetting("facebook_pixel_id", ""));
    setWhatsappNumber(getSetting("whatsapp_number", ""));
    setMessengerUrl(getSetting("messenger_url", ""));
    setPrivacyPolicy(getSetting("privacy_policy", ""));
    setTermsConditions(getSetting("terms_conditions", ""));
    setLoaded(true);
  }

  const saveSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const existing = settings.find((s: any) => s.key === key);
      if (existing) {
        const { error } = await supabase
          .from("site_settings")
          .update({ value, updated_at: new Date().toISOString() })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("site_settings").insert({ key, value });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["site-settings"] }),
  });

  const saveAll = (pairs: { key: string; value: string }[]) =>
    Promise.all(pairs.map((p) => saveSetting.mutateAsync(p)));

  const handleSaveBrand = async () => {
    await saveAll([
      { key: "store_name", value: storeName },
      { key: "announcement_bar", value: announcementBar },
      { key: "logo_url", value: logoUrl },
      { key: "favicon_url", value: faviconUrl },
      // keep old keys synced for backward compat
      { key: "site_name", value: storeName },
    ]);
    toast({ title: "✓ ব্র্যান্ড সেটিংস সেভ হয়েছে" });
  };

  const handleSaveFooter = async () => {
    await saveAll([
      { key: "about_us", value: aboutUs },
      { key: "about_us_extended", value: aboutUsExtended },
      { key: "our_mission", value: ourMission },
      { key: "office_address", value: officeAddress },
      { key: "support_email", value: supportEmail },
      { key: "phone_number", value: phoneNumber },
      { key: "contact_phone", value: phoneNumber },
      { key: "contact_email", value: supportEmail },
    ]);
    toast({ title: "✓ ফুটার সেটিংস সেভ হয়েছে" });
  };

  const handleSaveSocial = async () => {
    await saveAll([
      { key: "facebook_url", value: facebookUrl },
      { key: "instagram_url", value: instagramUrl },
      { key: "twitter_url", value: twitterUrl },
      { key: "facebook", value: facebookUrl },
      { key: "instagram", value: instagramUrl },
    ]);
    toast({ title: "✓ সোশ্যাল মিডিয়া সেভ হয়েছে" });
  };

  const handleSaveSEO = async () => {
    await saveAll([
      { key: "site_title", value: siteTitle },
      { key: "meta_description", value: metaDescription },
    ]);
    toast({ title: "✓ SEO সেটিংস সেভ হয়েছে" });
  };

  const handleSaveDelivery = async () => {
    await saveAll([
      { key: "delivery_inside_dhaka", value: insideDhaka },
      { key: "delivery_outside_dhaka", value: outsideDhaka },
    ]);
    toast({ title: "✓ ডেলিভারি চার্জ সেভ হয়েছে" });
  };

  const handleSavePayment = async () => {
    await saveAll([
      { key: "bkash_number", value: bkashNumber },
      { key: "nagad_number", value: nagadNumber },
      { key: "rocket_number", value: rocketNumber },
    ]);
    toast({ title: "✓ পেমেন্ট নম্বর সেভ হয়েছে" });
  };

  const handleSaveTracking = async () => {
    await saveAll([{ key: "facebook_pixel_id", value: facebookPixelId }]);
    toast({ title: "✓ Tracking সেভ হয়েছে" });
  };

  const handleSavePages = async () => {
    await saveAll([
      { key: "privacy_policy", value: privacyPolicy },
      { key: "terms_conditions", value: termsConditions },
    ]);
    toast({ title: "✓ পেজ কন্টেন্ট সেভ হয়েছে" });
  };

  // File upload helper
  const handleFileUpload = async (
    file: File,
    type: "logo" | "favicon",
    onSuccess: (url: string) => void
  ) => {
    setUploading(type);
    try {
      const ext = file.name.split(".").pop();
      const path = `${type}-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("site-assets")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("site-assets").getPublicUrl(path);
      onSuccess(data.publicUrl);

      // Auto-save
      await saveSetting.mutateAsync({ key: `${type}_url`, value: data.publicUrl });
      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
      toast({ title: `✓ ${type === "logo" ? "লোগো" : "ফেভিকন"} আপলোড হয়েছে` });
    } catch (err: any) {
      toast({ title: "আপলোড ব্যর্থ হয়েছে", description: err.message, variant: "destructive" });
    } finally {
      setUploading(null);
    }
  };

  // Reports
  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const { data: products = [] } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*");
      if (error) throw error;
      return data;
    },
  });

  const downloadCSV = (filename: string, headers: string, rows: string) => {
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const SaveBtn = ({ onClick, saving }: { onClick: () => void; saving?: boolean }) => (
    <button
      onClick={onClick}
      disabled={saving}
      className="mt-5 flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
    >
      <Save size={14} /> সেভ করুন
    </button>
  );

  return (
    <div className="space-y-6">

      {/* ── Brand & Header ── */}
      <Section icon={Palette} title="ব্র্যান্ড ও হেডার">
        <div className="space-y-4 max-w-2xl">
          <Field label="স্টোরের নাম (Header-এ দেখাবে)">
            <input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="SAILOR" className={inputCls} />
          </Field>
          <Field label="Announcement Bar টেক্সট">
            <input value={announcementBar} onChange={(e) => setAnnouncementBar(e.target.value)} placeholder="সকল অর্ডারে ফ্রি শিপিং" className={inputCls} />
          </Field>

          <div className="grid sm:grid-cols-2 gap-4 pt-2">
            {/* Logo Upload */}
            <div className="border border-dashed border-border rounded-xl p-4 text-center space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">লোগো</p>
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-12 mx-auto object-contain" />
              ) : (
                <div className="h-12 flex items-center justify-center"><Image size={28} className="text-muted-foreground/40" /></div>
              )}
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="URL অথবা নিচে আপলোড করুন"
                className={`${inputCls} text-xs`}
              />
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileUpload(f, "logo", setLogoUrl);
                }}
              />
              <button
                onClick={() => logoInputRef.current?.click()}
                disabled={uploading === "logo"}
                className="w-full flex items-center justify-center gap-2 border border-border rounded-lg py-2 text-xs hover:bg-secondary transition-colors disabled:opacity-50"
              >
                <Upload size={13} /> {uploading === "logo" ? "আপলোড হচ্ছে..." : "ফাইল আপলোড"}
              </button>
            </div>

            {/* Favicon Upload */}
            <div className="border border-dashed border-border rounded-xl p-4 text-center space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">ফেভিকন (32×32)</p>
              {faviconUrl ? (
                <img src={faviconUrl} alt="Favicon" className="h-12 mx-auto object-contain" />
              ) : (
                <div className="h-12 flex items-center justify-center"><Image size={28} className="text-muted-foreground/40" /></div>
              )}
              <input
                type="url"
                value={faviconUrl}
                onChange={(e) => setFaviconUrl(e.target.value)}
                placeholder="URL অথবা নিচে আপলোড করুন"
                className={`${inputCls} text-xs`}
              />
              <input
                ref={faviconInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileUpload(f, "favicon", setFaviconUrl);
                }}
              />
              <button
                onClick={() => faviconInputRef.current?.click()}
                disabled={uploading === "favicon"}
                className="w-full flex items-center justify-center gap-2 border border-border rounded-lg py-2 text-xs hover:bg-secondary transition-colors disabled:opacity-50"
              >
                <Upload size={13} /> {uploading === "favicon" ? "আপলোড হচ্ছে..." : "ফাইল আপলোড"}
              </button>
            </div>
          </div>
        </div>
        <SaveBtn onClick={handleSaveBrand} />
      </Section>

      {/* ── Footer Info ── */}
      <Section icon={FileText} title="ফুটার ও About Us তথ্য">
        <div className="space-y-4 max-w-2xl">
          <Field label="About Us (সংক্ষিপ্ত — ফুটারে দেখাবে)">
            <textarea rows={2} value={aboutUs} onChange={(e) => setAboutUs(e.target.value)} placeholder="SAILOR হলো একটি প্রিমিয়াম ফ্যাশন ব্র্যান্ড..." className={textareaCls} />
          </Field>
          <Field label="About Us (বিস্তারিত — About পেজে দেখাবে)">
            <textarea rows={5} value={aboutUsExtended} onChange={(e) => setAboutUsExtended(e.target.value)} placeholder="আমাদের বিস্তারিত গল্প এখানে লিখুন..." className={textareaCls} />
          </Field>
          <Field label="আমাদের লক্ষ্য (Mission)">
            <textarea rows={2} value={ourMission} onChange={(e) => setOurMission(e.target.value)} placeholder="আমাদের লক্ষ্য হলো..." className={textareaCls} />
          </Field>
          <Field label="অফিসের ঠিকানা">
            <input value={officeAddress} onChange={(e) => setOfficeAddress(e.target.value)} placeholder="ঢাকা, বাংলাদেশ" className={inputCls} />
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="সাপোর্ট ইমেইল">
              <input type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} placeholder="info@sailor.com.bd" className={inputCls} />
            </Field>
            <Field label="ফোন নম্বর">
              <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="01XXXXXXXXX" className={inputCls} />
            </Field>
          </div>
        </div>
        <SaveBtn onClick={handleSaveFooter} />
      </Section>

      {/* ── Social Media ── */}
      <Section icon={Share2} title="সোশ্যাল মিডিয়া লিংক">
        <div className="space-y-3 max-w-2xl">
          <Field label="Facebook Page URL">
            <input value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} placeholder="https://facebook.com/sailorbd" className={inputCls} />
          </Field>
          <Field label="Instagram Profile URL">
            <input value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} placeholder="https://instagram.com/sailorbd" className={inputCls} />
          </Field>
          <Field label="Twitter / X Profile URL">
            <input value={twitterUrl} onChange={(e) => setTwitterUrl(e.target.value)} placeholder="https://twitter.com/sailorbd" className={inputCls} />
          </Field>
        </div>
        <SaveBtn onClick={handleSaveSocial} />
      </Section>

      {/* ── SEO ── */}
      <Section icon={Search} title="SEO সেটিংস">
        <div className="space-y-4 max-w-2xl">
          <Field label={`সাইটের টাইটেল (${siteTitle.length}/60 অক্ষর)`}>
            <input value={siteTitle} onChange={(e) => setSiteTitle(e.target.value)} maxLength={60} placeholder="SAILOR - Premium Fashion Bangladesh" className={inputCls} />
          </Field>
          <Field label={`মেটা বিবরণ (${metaDescription.length}/160 অক্ষর)`}>
            <textarea rows={3} value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} maxLength={160} placeholder="SAILOR - বাংলাদেশের সেরা প্রিমিয়াম ফ্যাশন ব্র্যান্ড..." className={textareaCls} />
          </Field>
        </div>
        <SaveBtn onClick={handleSaveSEO} />
      </Section>

      {/* ── Delivery ── */}
      <Section icon={Truck} title="ডেলিভারি চার্জ">
        <div className="grid sm:grid-cols-2 gap-4 max-w-2xl">
          <Field label="ঢাকার ভিতরে (৳)">
            <input type="number" value={insideDhaka} onChange={(e) => setInsideDhaka(e.target.value)} className={inputCls} min="0" />
          </Field>
          <Field label="ঢাকার বাইরে (৳)">
            <input type="number" value={outsideDhaka} onChange={(e) => setOutsideDhaka(e.target.value)} className={inputCls} min="0" />
          </Field>
        </div>
        <p className="text-xs text-muted-foreground mt-3">এই চার্জ চেকআউট পেজে স্বয়ংক্রিয়ভাবে প্রয়োগ হবে।</p>
        <SaveBtn onClick={handleSaveDelivery} />
      </Section>

      {/* ── Payment Numbers ── */}
      <Section icon={Smartphone} title="পেমেন্ট নম্বর">
        <div className="space-y-3 max-w-2xl">
          <Field label="bKash নম্বর">
            <input value={bkashNumber} onChange={(e) => setBkashNumber(e.target.value)} placeholder="01XXXXXXXXX" className={inputCls} maxLength={15} />
          </Field>
          <Field label="Nagad নম্বর">
            <input value={nagadNumber} onChange={(e) => setNagadNumber(e.target.value)} placeholder="01XXXXXXXXX" className={inputCls} maxLength={15} />
          </Field>
          <Field label="Rocket নম্বর">
            <input value={rocketNumber} onChange={(e) => setRocketNumber(e.target.value)} placeholder="01XXXXXXXXX" className={inputCls} maxLength={15} />
          </Field>
        </div>
        <SaveBtn onClick={handleSavePayment} />
      </Section>

      {/* ── Tracking & Analytics ── */}
      <Section icon={Zap} title="Tracking ও Analytics">
        <div className="space-y-4 max-w-2xl">
          <Field label="Facebook Pixel ID">
            <input
              value={facebookPixelId}
              onChange={(e) => setFacebookPixelId(e.target.value.trim())}
              placeholder="যেমন: 1234567890123456"
              className={inputCls}
              maxLength={20}
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              Facebook Events Manager থেকে আপনার Pixel ID কপি করে এখানে পেস্ট করুন।{" "}
              <a
                href="https://www.facebook.com/business/help/952192354843755"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                কোথায় পাবেন?
              </a>
            </p>
          </Field>
          {facebookPixelId && (
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-xl text-xs text-primary">
              ✓ Pixel ID সেট আছে — সাইটে স্বয়ংক্রিয়ভাবে সক্রিয় হবে
            </div>
          )}
        </div>
        <SaveBtn onClick={handleSaveTracking} />
      </Section>

      {/* ── Chat Widget ── */}
      <Section icon={MessageCircle} title="চ্যাট উইজেট (WhatsApp ও Messenger)">
        <div className="space-y-4 max-w-2xl">
          <p className="text-xs text-muted-foreground">এই নম্বর/লিংক সেট করলে সাইটে একটি ফ্লোটিং চ্যাট বাটন দেখাবে।</p>
          <Field label="WhatsApp নম্বর (দেশের কোডসহ, যেমন: 8801XXXXXXXXX)">
            <input value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} placeholder="8801XXXXXXXXX" className={inputCls} maxLength={15} />
          </Field>
          <Field label="Messenger Page URL">
            <input value={messengerUrl} onChange={(e) => setMessengerUrl(e.target.value)} placeholder="https://m.me/yourpage" className={inputCls} />
          </Field>
        </div>
        <SaveBtn onClick={async () => {
          await saveAll([
            { key: "whatsapp_number", value: whatsappNumber },
            { key: "messenger_url", value: messengerUrl },
          ]);
          toast({ title: "✓ চ্যাট সেটিংস সেভ হয়েছে" });
        }} />
      </Section>

      {/* ── Pages Content ── */}
      <Section icon={BookOpen} title="পেজ কন্টেন্ট (Privacy Policy ও Terms)">
        <div className="space-y-4 max-w-2xl">
          <p className="text-xs text-muted-foreground">এখানে লেখা গুলো Privacy Policy ও Terms পেজে দেখাবে। খালি রাখলে ডিফল্ট কন্টেন্ট দেখাবে।</p>
          <Field label="Privacy Policy (প্রাইভেসি পলিসি)">
            <textarea rows={8} value={privacyPolicy} onChange={(e) => setPrivacyPolicy(e.target.value)} placeholder="**১. তথ্য সংগ্রহ**&#10;আমরা আপনার নাম..." className={textareaCls} />
          </Field>
          <Field label="Terms & Conditions (শর্তাবলী)">
            <textarea rows={8} value={termsConditions} onChange={(e) => setTermsConditions(e.target.value)} placeholder="**১. শর্তাবলী গ্রহণ**&#10;এই ওয়েবসাইট ব্যবহার করে..." className={textareaCls} />
          </Field>
        </div>
        <SaveBtn onClick={handleSavePages} />
      </Section>

      {/* ── Reports ── */}
      <Section icon={Download} title="রিপোর্ট ডাউনলোড (CSV)">
        <div className="space-y-3">
          {[
            {
              title: "সেলস রিপোর্ট",
              desc: `${orders.length} অর্ডার · মোট ${formatPrice(orders.reduce((s: number, o: any) => s + Number(o.total), 0))}`,
              fn: () => downloadCSV("sales-report", "Order ID,Customer,Phone,Address,Status,Payment,Total,Date\n",
                orders.map((o: any) => `${o.id.slice(0, 8)},"${o.customer_name}",${o.phone},"${o.address}",${o.status || "pending"},${o.payment_method || "N/A"},${o.total},${new Date(o.created_at).toLocaleDateString("en-GB")}`).join("\n")),
            },
            {
              title: "স্টক রিপোর্ট",
              desc: `${products.length} প্রোডাক্ট`,
              fn: () => downloadCSV("stock-report", "Product,Category,Brand,Stock,Price\n",
                products.map((p: any) => `"${p.name}",${p.category || "N/A"},${p.brand || "N/A"},${p.stock ?? 0},${p.price}`).join("\n")),
            },
            {
              title: "কাস্টমার রিপোর্ট",
              desc: "কাস্টমার তালিকা ও মোট খরচ",
              fn: () => {
                const m = new Map<string, any>();
                orders.forEach((o: any) => {
                  const k = `${o.customer_name}-${o.phone}`;
                  if (!m.has(k)) m.set(k, { name: o.customer_name, phone: o.phone, address: o.address, cnt: 0, total: 0 });
                  const c = m.get(k); c.cnt++; c.total += Number(o.total);
                });
                downloadCSV("customer-report", "Customer,Phone,Address,Orders,Total Spent\n",
                  Array.from(m.values()).map((c) => `"${c.name}",${c.phone},"${c.address}",${c.cnt},${c.total}`).join("\n"));
              },
            },
          ].map((r) => (
            <div key={r.title} className="flex items-center justify-between p-4 bg-secondary rounded-xl">
              <div>
                <p className="font-medium text-sm text-foreground">{r.title}</p>
                <p className="text-xs text-muted-foreground">{r.desc}</p>
              </div>
              <button
                onClick={r.fn}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-full text-xs font-medium hover:opacity-90 transition-opacity"
              >
                <Download size={14} /> ডাউনলোড
              </button>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
};

export default AdminSettings;
