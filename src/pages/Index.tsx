import Header from "@/components/Header";
import HeroSlider from "@/components/HeroSlider";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import SEOHead, { organizationSchema, siteNavigationSchema } from "@/components/SEOHead";
import { useProducts, useFeaturedProducts } from "@/hooks/useProducts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { lazy, Suspense } from "react";

// Lazy-load below-the-fold sections
const NewArrivals = lazy(() => import("@/components/NewArrivals"));
const CategorySection = lazy(() => import("@/components/CategorySection"));
const ShoeCollection = lazy(() => import("@/components/ShoeCollection"));
const WatchGallery = lazy(() => import("@/components/WatchGallery"));

const SectionFallback = () => (
  <div className="py-12 flex items-center justify-center">
    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const Index = () => {
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: featuredProducts = [], isLoading: featuredLoading } = useFeaturedProducts();
  const { settings } = useSiteSettings();
  const baseUrl = settings.website_url || "https://modestmart.com";

  const { data: banners = [], isLoading: bannersLoading } = useQuery({
    queryKey: ["hero-banners-public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("id,title,subtitle,image_url,link,sort_order")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const bannerSlides = banners.map((b: any) => ({
    id: b.id,
    image: b.image_url,
    label: "",
    title: b.title || "",
    description: b.subtitle || "",
    ctaText: "Shop Now",
    ctaLink: b.link || "/shop",
  }));

  const featuredSlides = featuredProducts.map((product) => ({
    id: product.id,
    image: product.image_url || "https://images.unsplash.com/photo-1445205170230-053b83016050?w=1920&h=1080&fit=crop",
    label: product.category || "Featured",
    title: product.name,
    description: product.description || "Discover our latest collection of premium fashion pieces.",
    ctaText: "Shop Now",
    ctaLink: `/category/${(product.category || "new").toLowerCase()}`,
  }));

  const defaultSlides = [
    {
      id: "1",
      image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=1920&h=1080&fit=crop",
      label: "Spring Collection",
      title: "Timeless Elegance",
      description: "Discover our curated selection of contemporary pieces designed for the modern wardrobe.",
      ctaText: "Shop Now",
      ctaLink: "/shop",
    },
    {
      id: "2",
      image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1920&h=1080&fit=crop",
      label: "New Arrivals",
      title: "Refined Simplicity",
      description: "Explore minimalist designs that speak to your personal style.",
      ctaText: "Explore Collection",
      ctaLink: "/shop",
    },
    {
      id: "3",
      image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1920&h=1080&fit=crop",
      label: "Limited Edition",
      title: "Artisan Craft",
      description: "Handcrafted pieces that blend tradition with modern aesthetics.",
      ctaText: "Discover More",
      ctaLink: "/shop",
    },
  ];

  // Show hero immediately — don't wait for products
  const slides = bannerSlides.length > 0 ? bannerSlides : featuredProducts.length > 0 ? featuredSlides : defaultSlides;
  const heroReady = !bannersLoading || bannerSlides.length > 0;

  return (
    <PageTransition>
      <div className="min-h-screen">
        <SEOHead
          title={settings.site_title || "Modest Mart - Premium Fashion Bangladesh"}
          description={settings.meta_description || "বাংলাদেশের সেরা প্রিমিয়াম ফ্যাশন ব্র্যান্ড।"}
          canonical={baseUrl}
          jsonLd={[
            organizationSchema(settings.store_name || "Modest Mart", baseUrl, settings.logo_url || undefined),
            siteNavigationSchema([
              { name: "Shop", url: `${baseUrl}/shop` },
              { name: "Men", url: `${baseUrl}/category/men` },
              { name: "Women", url: `${baseUrl}/category/women` },
              { name: "Kids", url: `${baseUrl}/category/kids` },
              { name: "Contact", url: `${baseUrl}/contact` },
            ]),
          ]}
        />
        <Header />
        <main>
          {heroReady ? (
            <HeroSlider slides={slides} />
          ) : (
            <div className="w-full aspect-video bg-secondary animate-pulse" />
          )}
          <Suspense fallback={<SectionFallback />}>
            {productsLoading ? <SectionFallback /> : <NewArrivals products={products} />}
          </Suspense>
          <Suspense fallback={<SectionFallback />}>
            <CategorySection />
          </Suspense>
          <Suspense fallback={<SectionFallback />}>
            <ShoeCollection />
          </Suspense>
          <Suspense fallback={<SectionFallback />}>
            <WatchGallery />
          </Suspense>
        </main>
        <Footer />
      </div>
    </PageTransition>
  );
};

export default Index;
