import { useState } from "react";
import { motion } from "framer-motion";
import { SlidersHorizontal } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import PageTransition from "@/components/PageTransition";
import FilterSidebar, { FilterState, PRICE_MAX } from "@/components/FilterSidebar";
import { useProducts } from "@/hooks/useProducts";
import { useTranslation } from "react-i18next";

const DEFAULT_FILTERS: FilterState = { sizes: [], colors: [], subCategories: [], priceMin: 0, priceMax: PRICE_MAX };

const Shop = () => {
  const { data: products = [], isLoading } = useProducts();
  const { t } = useTranslation();
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const filtered = products.filter((p) => {
    const inPrice = p.price >= filters.priceMin && (filters.priceMax >= PRICE_MAX || p.price <= filters.priceMax);

    let productSub = p.sub_category;
    if (!productSub && p.sizes && typeof p.sizes === 'object' && !Array.isArray(p.sizes) && (p.sizes as any).sub_category) {
      productSub = (p.sizes as any).sub_category;
    }
    const inSubCategory = !filters.subCategories || filters.subCategories.length === 0 || (productSub && filters.subCategories.includes(productSub));

    return inPrice && inSubCategory;
  });

  const activeCount =
    filters.sizes.length + filters.colors.length + (filters.subCategories?.length || 0) +
    (filters.priceMin > 0 ? 1 : 0) + (filters.priceMax < PRICE_MAX ? 1 : 0);

  if (isLoading) {
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
          <section className="bg-secondary py-14 md:py-20">
            <div className="container mx-auto px-4 md:px-6 text-center">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <span className="text-label mb-4 block">{t("shop.allProducts")}</span>
                <h1 className="heading-display mb-4">{t("shop.title")}</h1>
                <p className="text-body max-w-lg mx-auto">{t("shop.browseCollection")}</p>
              </motion.div>
            </div>
          </section>

          <section className="py-10 md:py-14">
            <div className="container mx-auto px-4 md:px-6">
              {/* Mobile filter toggle */}
              <div className="flex items-center justify-between mb-6 lg:hidden">
                <p className="text-sm text-muted-foreground">{filtered.length} পণ্য</p>
                <button
                  onClick={() => setMobileFilterOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-sm font-medium text-foreground hover:bg-secondary transition-colors"
                >
                  <SlidersHorizontal size={15} />
                  ফিল্টার
                  {activeCount > 0 && (
                    <span className="w-5 h-5 bg-primary text-primary-foreground rounded-full text-xs flex items-center justify-center font-bold">
                      {activeCount}
                    </span>
                  )}
                </button>
              </div>

              <div className="flex gap-8">
                <FilterSidebar
                  filters={filters}
                  onChange={setFilters}
                  mobileOpen={mobileFilterOpen}
                  onClose={() => setMobileFilterOpen(false)}
                />

                <div className="flex-1 min-w-0">
                  <div className="hidden lg:flex items-center justify-between mb-5">
                    <p className="text-sm text-muted-foreground">{filtered.length} পণ্য পাওয়া গেছে</p>
                    {activeCount > 0 && (
                      <button
                        onClick={() => setFilters(DEFAULT_FILTERS)}
                        className="text-xs text-primary hover:underline"
                      >
                        সব ফিল্টার মুছুন ({activeCount})
                      </button>
                    )}
                  </div>

                  {filtered.length === 0 ? (
                    <div className="text-center py-20">
                      <p className="text-muted-foreground text-sm mb-3">এই ফিল্টারে কোনো পণ্য পাওয়া যায়নি।</p>
                      <button onClick={() => setFilters(DEFAULT_FILTERS)} className="text-sm text-primary hover:underline">
                        ফিল্টার মুছুন
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                      {filtered.map((product, index) => (
                        <motion.div
                          key={product.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: index * 0.05 }}
                        >
                          <ProductCard
                            id={product.id}
                            name={product.name}
                            price={product.price}
                            image={product.image_url || "/placeholder.svg"}
                            category={product.category || undefined}
                            isNew={index < 4}
                          />
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </PageTransition>
  );
};

export default Shop;
