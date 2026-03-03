import Header from "@/components/Header";
import HeroSlider from "@/components/HeroSlider";
import NewArrivals from "@/components/NewArrivals";
import CategorySection from "@/components/CategorySection";
import Footer from "@/components/Footer";
import PageTransition from "@/components/PageTransition";
import { useProducts, useFeaturedProducts } from "@/hooks/useProducts";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const Index = () => {
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: featuredProducts = [], isLoading: featuredLoading } = useFeaturedProducts();
  const { settings, isLoading: settingsLoading } = useSiteSettings();

  const hasAdminHero = !!settings.hero_image_url;

  const heroSlides = featuredProducts.map((product) => ({
    id: product.id,
    image: product.image_url || "https://images.unsplash.com/photo-1445205170230-053b83016050?w=1920&h=1080&fit=crop",
    label: product.category || "Featured",
    title: product.name,
    description: product.description || "Discover our latest collection of premium fashion pieces.",
    ctaText: "Shop Now",
    ctaLink: `/category/${(product.category || "new").toLowerCase()}`,
  }));

  const adminSlides = hasAdminHero
    ? [{
        id: "admin-hero",
        image: settings.hero_image_url,
        label: "",
        title: settings.hero_title || "Modest Mart",
        description: settings.hero_subtitle || "",
        ctaText: "Shop Now",
        ctaLink: "/shop",
      }]
    : [];

  const defaultSlides = [
    {
      id: "1",
      image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=1920&h=1080&fit=crop",
      label: "Spring Collection",
      title: "Timeless Elegance",
      description: "Discover our curated selection of contemporary pieces designed for the modern wardrobe.",
      ctaText: "Shop Now",
      ctaLink: "/",
    },
    {
      id: "2",
      image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1920&h=1080&fit=crop",
      label: "New Arrivals",
      title: "Refined Simplicity",
      description: "Explore minimalist designs that speak to your personal style.",
      ctaText: "Explore Collection",
      ctaLink: "/",
    },
    {
      id: "3",
      image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1920&h=1080&fit=crop",
      label: "Limited Edition",
      title: "Artisan Craft",
      description: "Handcrafted pieces that blend tradition with modern aesthetics.",
      ctaText: "Discover More",
      ctaLink: "/",
    },
  ];

  // Priority: Admin hero > Featured products > Default slides
  const slides = hasAdminHero ? adminSlides : featuredProducts.length > 0 ? heroSlides : defaultSlides;

  if (productsLoading || featuredLoading || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen">
        <Header />
        <main>
          <HeroSlider slides={slides} />
          <NewArrivals products={products} />
          <CategorySection />
        </main>
        <Footer />
      </div>
    </PageTransition>
  );
};

export default Index;
