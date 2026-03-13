import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPrice } from "@/lib/currency";
import { optimizeHeroImage } from "@/lib/imageOptimizer";
import {
  Download, Save, Globe, Share2, Truck, Smartphone,
  Upload, Image, Search, Mail, Phone, MapPin, FileText, Palette, Zap, BookOpen, MessageCircle, FileSpreadsheet, File
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { exportAoaToExcel } from "@/lib/excelExport";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  // SEO
  const [siteTitle, setSiteTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
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
  const [messengerId, setMessengerId] = useState("");
  // Pages
  const [privacyPolicy, setPrivacyPolicy] = useState("");
  const [termsConditions, setTermsConditions] = useState("");
  // Category Images
  const [catImageMen, setCatImageMen] = useState("");
  const [catImageWomen, setCatImageWomen] = useState("");
  const [catImageKids, setCatImageKids] = useState("");
  const catFileRefs = { men: useRef<HTMLInputElement>(null), women: useRef<HTMLInputElement>(null), kids: useRef<HTMLInputElement>(null) };
  const [catUploading, setCatUploading] = useState<string | null>(null);

  const [loaded, setLoaded] = useState(false);
  const [uploading, setUploading] = useState<"logo" | "favicon" | null>(null);

  // Hero slides (multi-slide from banners table)
  const { data: heroSlides = [], refetch: refetchHeroSlides } = useQuery({
    queryKey: ["hero-banners"],
    queryFn: async () => {
      const { data, error } = await supabase.from("banners").select("*").order("sort_order");
      if (error) throw error;
      return data;
    },
  });
  const [heroForm, setHeroForm] = useState({ title: "", subtitle: "", image_url: "" });
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [heroEditId, setHeroEditId] = useState<string | null>(null);
  const [heroUploading, setHeroUploading] = useState(false);
  const heroFileRef = useRef<HTMLInputElement>(null);

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
    setTiktokUrl(getSetting("tiktok_url", ""));
    setYoutubeUrl(getSetting("youtube_url", ""));
    setSiteTitle(getSetting("site_title", "Modest Mart - Premium Fashion Bangladesh"));
    setMetaDescription(getSetting("meta_description", ""));
    setWebsiteUrl(getSetting("website_url", ""));
    setInsideDhaka(getSetting("delivery_inside_dhaka", "80"));
    setOutsideDhaka(getSetting("delivery_outside_dhaka", "130"));
    setBkashNumber(getSetting("bkash_number", ""));
    setNagadNumber(getSetting("nagad_number", ""));
    setRocketNumber(getSetting("rocket_number", ""));
    setFacebookPixelId(getSetting("facebook_pixel_id", ""));
    setWhatsappNumber(getSetting("whatsapp_number", ""));
    setMessengerId(getSetting("messenger_id", ""));
    setPrivacyPolicy(getSetting("privacy_policy", ""));
    setTermsConditions(getSetting("terms_conditions", ""));
    setCatImageMen(getSetting("category_image_men", ""));
    setCatImageWomen(getSetting("category_image_women", ""));
    setCatImageKids(getSetting("category_image_kids", ""));
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
      { key: "tiktok_url", value: tiktokUrl },
      { key: "youtube_url", value: youtubeUrl },
      { key: "facebook", value: facebookUrl },
      { key: "instagram", value: instagramUrl },
    ]);
    toast({ title: "✓ সোশ্যাল মিডিয়া সেভ হয়েছে" });
  };

  const handleSaveSEO = async () => {
    await saveAll([
      { key: "site_title", value: siteTitle },
      { key: "meta_description", value: metaDescription },
      { key: "website_url", value: websiteUrl },
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

  const handleSaveHeroSlide = async () => {
    setHeroUploading(true);
    try {
      let image_url = heroForm.image_url;
      if (heroFile) {
        const optimized = await optimizeHeroImage(heroFile);
        const path = `hero-${Date.now()}.webp`;
        const { error: uploadError } = await supabase.storage.from("site-assets").upload(path, optimized, { upsert: true, contentType: "image/webp" });
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from("site-assets").getPublicUrl(path);
        image_url = data.publicUrl;
      }
      if (!image_url) throw new Error("ইমেজ দিন");

      if (heroEditId) {
        const { error } = await supabase.from("banners").update({ title: heroForm.title, subtitle: heroForm.subtitle, image_url }).eq("id", heroEditId);
        if (error) throw error;
      } else {
        const nextOrder = heroSlides.length;
        const { error } = await supabase.from("banners").insert({ title: heroForm.title || "Slide", subtitle: heroForm.subtitle, image_url, sort_order: nextOrder, is_active: true });
        if (error) throw error;
      }
      refetchHeroSlides();
      queryClient.invalidateQueries({ queryKey: ["banners"] });
      setHeroForm({ title: "", subtitle: "", image_url: "" });
      setHeroFile(null);
      setHeroEditId(null);
      toast({ title: heroEditId ? "✓ স্লাইড আপডেট হয়েছে" : "✓ নতুন স্লাইড যোগ হয়েছে" });
    } catch (err: any) {
      toast({ title: "ত্রুটি", description: err.message, variant: "destructive" });
    } finally {
      setHeroUploading(false);
    }
  };

  const handleDeleteHeroSlide = async (id: string) => {
    const { error } = await supabase.from("banners").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    refetchHeroSlides();
    queryClient.invalidateQueries({ queryKey: ["banners"] });
    toast({ title: "✓ স্লাইড ডিলিট হয়েছে" });
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

  // ── Report helpers ──
  type ReportData = { headers: string[]; rows: (string | number)[][] };

  const downloadExcel = (filename: string, data: ReportData) => {
    exportAoaToExcel(data.headers, data.rows, "Report", `${filename}-${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  const downloadPDF = (filename: string, title: string, data: ReportData) => {
    const doc = new jsPDF({ orientation: data.headers.length > 6 ? "landscape" : "portrait" });
    doc.setFontSize(16);
    doc.text(title, 14, 18);
    doc.setFontSize(9);
    doc.text(`Generated: ${new Date().toLocaleDateString("en-GB")}`, 14, 25);
    autoTable(doc, {
      head: [data.headers],
      body: data.rows.map(r => r.map(c => String(c))),
      startY: 30,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [30, 30, 30], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });
    doc.save(`${filename}-${new Date().toISOString().split("T")[0]}.pdf`);
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

      {/* ── Hero Slides (Multi-Slide) ── */}
      <Section icon={Image} title="হিরো স্লাইডার (হোমপেজ ব্যানার)">
        <div className="space-y-4 max-w-2xl">
          <p className="text-xs text-muted-foreground">একাধিক স্লাইড যোগ করুন। প্রতিটি স্লাইডে আলাদা ইমেজ, টাইটেল ও সাব-টাইটেল দেওয়া যাবে। কোনো স্লাইড না থাকলে ডিফল্ট স্লাইডার দেখাবে।</p>

          {/* Existing slides list */}
          {heroSlides.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">বর্তমান স্লাইড ({heroSlides.length} টি)</p>
              {heroSlides.map((slide: any, idx: number) => (
                <div key={slide.id} className="flex items-center gap-3 p-3 bg-secondary/30 rounded-lg border border-border/50">
                  <span className="text-xs font-bold text-muted-foreground w-6 text-center">{idx + 1}</span>
                  {slide.image_url && <img src={slide.image_url} alt="" className="w-20 h-12 object-cover rounded" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{slide.title || "Untitled"}</p>
                    {slide.subtitle && <p className="text-xs text-muted-foreground truncate">{slide.subtitle}</p>}
                  </div>
                  <button onClick={() => { setHeroEditId(slide.id); setHeroForm({ title: slide.title || "", subtitle: slide.subtitle || "", image_url: slide.image_url || "" }); setHeroFile(null); }} className="text-xs text-primary hover:underline">Edit</button>
                  <button onClick={() => handleDeleteHeroSlide(slide.id)} className="text-xs text-destructive hover:underline">Delete</button>
                </div>
              ))}
            </div>
          )}

          {/* Add / Edit form */}
          <div className="border border-dashed border-border rounded-xl p-4 space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {heroEditId ? "স্লাইড এডিট করুন" : "নতুন স্লাইড যোগ করুন"}
            </p>
            {(heroForm.image_url || heroFile) && (
              <img src={heroFile ? URL.createObjectURL(heroFile) : heroForm.image_url} alt="Preview" className="w-full h-40 object-cover rounded-lg" />
            )}
            <input
              type="url"
              value={heroForm.image_url}
              onChange={(e) => setHeroForm({ ...heroForm, image_url: e.target.value })}
              placeholder="ইমেজ URL পেস্ট করুন অথবা নিচে আপলোড করুন"
              className={`${inputCls} text-xs`}
            />
            <input ref={heroFileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) setHeroFile(f); }} />
            <button onClick={() => heroFileRef.current?.click()} className="w-full flex items-center justify-center gap-2 border border-border rounded-lg py-2 text-xs hover:bg-secondary transition-colors">
              <Upload size={13} /> ইমেজ আপলোড
            </button>
            <Field label="শিরোনাম (Title)">
              <input value={heroForm.title} onChange={(e) => setHeroForm({ ...heroForm, title: e.target.value })} placeholder="Timeless Elegance" className={inputCls} />
            </Field>
            <Field label="সাব-টাইটেল (Subtitle)">
              <textarea rows={2} value={heroForm.subtitle} onChange={(e) => setHeroForm({ ...heroForm, subtitle: e.target.value })} placeholder="Discover our curated selection..." className={textareaCls} />
            </Field>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSaveHeroSlide}
              disabled={heroUploading}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Save size={14} /> {heroEditId ? "আপডেট করুন" : "স্লাইড যোগ করুন"}
            </button>
            {heroEditId && (
              <button onClick={() => { setHeroEditId(null); setHeroForm({ title: "", subtitle: "", image_url: "" }); setHeroFile(null); }} className="px-4 py-2.5 border border-border rounded-full text-sm hover:bg-secondary transition-colors">
                বাতিল
              </button>
            )}
          </div>
        </div>
      </Section>

      {/* ── Category Images ── */}
      <Section icon={Image} title="ক্যাটাগরি ইমেজ (Shop by Category)">
        <div className="space-y-5 max-w-2xl">
          <p className="text-xs text-muted-foreground">হোমপেজে "Shop by Category" সেকশনে যে ইমেজ দেখাবে সেগুলো এখান থেকে আপডেট করুন।</p>
          {([
            { key: "men", label: "Men Category Image", state: catImageMen, setter: setCatImageMen, defaultImg: "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=800&h=800&fit=crop" },
            { key: "women", label: "Women Category Image", state: catImageWomen, setter: setCatImageWomen, defaultImg: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&h=800&fit=crop" },
            { key: "kids", label: "Kids Category Image", state: catImageKids, setter: setCatImageKids, defaultImg: "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=800&h=800&fit=crop" },
          ] as const).map((cat) => (
            <div key={cat.key} className="flex items-center gap-4 p-3 border border-border rounded-xl bg-secondary/30">
              <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-secondary">
                <img src={cat.state || cat.defaultImg} alt={cat.label} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground mb-2">{cat.label}</p>
                <input
                  ref={catFileRefs[cat.key]}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setCatUploading(cat.key);
                    try {
                      const optimized = await optimizeHeroImage(file);
                      const path = `category-${cat.key}-${Date.now()}.webp`;
                      const { error: uploadError } = await supabase.storage.from("site-assets").upload(path, optimized, { upsert: true, contentType: "image/webp" });
                      if (uploadError) throw uploadError;
                      const { data } = supabase.storage.from("site-assets").getPublicUrl(path);
                      cat.setter(data.publicUrl);
                      await saveSetting.mutateAsync({ key: `category_image_${cat.key}`, value: data.publicUrl });
                      queryClient.invalidateQueries({ queryKey: ["site-settings"] });
                      toast({ title: `✓ ${cat.label} আপডেট হয়েছে` });
                    } catch (err: any) {
                      toast({ title: "আপলোড ব্যর্থ", description: err.message, variant: "destructive" });
                    } finally {
                      setCatUploading(null);
                    }
                  }}
                />
                <button
                  onClick={() => catFileRefs[cat.key].current?.click()}
                  disabled={catUploading === cat.key}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <Upload size={12} /> {catUploading === cat.key ? "আপলোড হচ্ছে..." : "ইমেজ আপডেট"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </Section>

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
          <Field label="TikTok Profile URL (টিকটক)">
            <input value={tiktokUrl} onChange={(e) => setTiktokUrl(e.target.value)} placeholder="https://tiktok.com/@sailorbd" className={inputCls} />
          </Field>
          <Field label="YouTube Channel URL (ইউটিউব)">
            <input value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} placeholder="https://youtube.com/@sailorbd" className={inputCls} />
          </Field>
        </div>
        <SaveBtn onClick={handleSaveSocial} />
      </Section>

      {/* ── SEO ── */}
      <Section icon={Search} title="SEO সেটিংস">
        <div className="space-y-4 max-w-2xl">
          <Field label={`সাইটের টাইটেল (${siteTitle.length}/60 অক্ষর)`}>
            <input value={siteTitle} onChange={(e) => setSiteTitle(e.target.value)} maxLength={60} placeholder="Modest Mart - Premium Fashion Bangladesh" className={inputCls} />
          </Field>
          <Field label={`মেটা বিবরণ (${metaDescription.length}/160 অক্ষর)`}>
            <textarea rows={3} value={metaDescription} onChange={(e) => setMetaDescription(e.target.value)} maxLength={160} placeholder="Modest Mart - বাংলাদেশের সেরা প্রিমিয়াম ফ্যাশন ব্র্যান্ড..." className={textareaCls} />
          </Field>
          <Field label="ওয়েবসাইট URL (ইনভয়েসে QR Code হিসেবে দেখাবে)">
            <input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://yoursite.com" className={inputCls} />
            <p className="text-xs text-muted-foreground mt-1.5">এই URL ইনভয়েসের নিচে QR Code আকারে দেখাবে।</p>
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
          <Field label="Messenger Link (যেমন: m.me/yourpageid অথবা পেজ ID)">
            <input value={messengerId} onChange={(e) => setMessengerId(e.target.value)} placeholder="m.me/yourpageid" className={inputCls} />
          </Field>
        </div>
        <SaveBtn onClick={async () => {
          await saveAll([
            { key: "whatsapp_number", value: whatsappNumber },
            { key: "messenger_id", value: messengerId },
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
      <Section icon={Download} title="রিপোর্ট ডাউনলোড (Excel ও PDF)">
        <div className="space-y-3">
          {(() => {
            const reports: { title: string; desc: string; filename: string; getData: () => ReportData }[] = [
              {
                title: "সেলস রিপোর্ট",
                desc: `${orders.length} অর্ডার · মোট ${formatPrice(orders.reduce((s: number, o: any) => s + Number(o.total), 0))}`,
                filename: "sales-report",
                getData: () => ({
                  headers: ["Order ID", "Customer", "Phone", "Address", "Status", "Payment", "Total", "Date"],
                  rows: orders.map((o: any) => [
                    o.id.slice(0, 8), o.customer_name, o.phone, o.address,
                    o.status || "pending", o.payment_method || "N/A", o.total,
                    new Date(o.created_at).toLocaleDateString("en-GB"),
                  ]),
                }),
              },
              {
                title: "স্টক রিপোর্ট",
                desc: `${products.length} প্রোডাক্ট`,
                filename: "stock-report",
                getData: () => ({
                  headers: ["Product", "Category", "Brand", "Stock", "Price"],
                  rows: products.map((p: any) => [
                    p.name, p.category || "N/A", p.brand || "N/A", p.stock ?? 0, p.price,
                  ]),
                }),
              },
              {
                title: "কাস্টমার রিপোর্ট",
                desc: "কাস্টমার তালিকা ও মোট খরচ",
                filename: "customer-report",
                getData: () => {
                  const m = new Map<string, any>();
                  orders.forEach((o: any) => {
                    const k = `${o.customer_name}-${o.phone}`;
                    if (!m.has(k)) m.set(k, { name: o.customer_name, phone: o.phone, address: o.address, cnt: 0, total: 0 });
                    const c = m.get(k); c.cnt++; c.total += Number(o.total);
                  });
                  return {
                    headers: ["Customer", "Phone", "Address", "Orders", "Total Spent"],
                    rows: Array.from(m.values()).map((c) => [c.name, c.phone, c.address, c.cnt, c.total]),
                  };
                },
              },
            ];

            return reports.map((r) => (
              <div key={r.title} className="flex items-center justify-between p-4 bg-secondary rounded-xl">
                <div>
                  <p className="font-medium text-sm text-foreground">{r.title}</p>
                  <p className="text-xs text-muted-foreground">{r.desc}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => downloadExcel(r.filename, r.getData())}
                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-full text-xs font-medium hover:opacity-90 transition-opacity"
                  >
                    <FileSpreadsheet size={14} /> Excel
                  </button>
                  <button
                    onClick={() => downloadPDF(r.filename, r.title, r.getData())}
                    className="flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white rounded-full text-xs font-medium hover:opacity-90 transition-opacity"
                  >
                    <File size={14} /> PDF
                  </button>
                </div>
              </div>
            ));
          })()}
        </div>
      </Section>
    </div>
  );
};

export default AdminSettings;
