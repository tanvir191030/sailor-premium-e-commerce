import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import Pagination from "@/components/Pagination";
import PageTransition from "@/components/PageTransition";
import SEOHead, { breadcrumbSchema, siteNavigationSchema } from "@/components/SEOHead";
import SortSelect, { SortOption } from "@/components/SortSelect";
import { useCategoryProducts, PAGE_SIZE } from "@/hooks/useCategoryProducts";
import { useSiteSettings } from "@/hooks/useSiteSettings";

const CATEGORY_META: Record<string, { title: string; description: string }> = {
  men: {
    title: "Premium Men's Collection - Panjabi, Shirts & More | Modest Mart",
    description: "পুরুষদের জন্য সেরা কালেকশন — পাঞ্জাবি, শার্ট, টি-শার্ট, পোলো, ট্রাউজার্স ও আরও অনেক কিছু। Modest Mart এ কেনাকাটা করুন।",
  },
  women: {
    title: "Women's Fashion - Borkha, Hijab, Salwar Kameez | Modest Mart",
    description: "মহিলাদের জন্য এক্সক্লুসিভ ফ্যাশন — বোরখা, হিজাব, ওড়না, সালোয়ার কামিজ ও জুয়েলারি। Modest Mart এ অর্ডার করুন।",
  },
  kids: {
    title: "Kids' Collection - Stylish Outfits for Children | Modest Mart",
    description: "শিশুদের জন্য আরামদায়ক ও স্টাইলিশ পোশাক। বাংলাদেশের সেরা কিডস ফ্যাশন Modest Mart এ পাওয়া যায়।",
  },
};

const Category = () => {
  const { categoryName, subCategoryName } = useParams<{ categoryName: string; subCategoryName?: string }>();
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState<SortOption>("newest");
  const { data, isLoading } = useCategoryProducts(categoryName, subCategoryName, page, sort);
  const { settings } = useSiteSettings();

  // Reset to page 1 when category/subcategory changes
  useEffect(() => {
    setPage(1);
  }, [categoryName, subCategoryName]);

  const products = data?.products ?? [];
  const totalProducts = data?.total ?? 0;
  const totalPages = Math.ceil(totalProducts / PAGE_SIZE);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const displayName = categoryName
    ? categoryName.charAt(0).toUpperCase() + categoryName.slice(1).toLowerCase()
    : "";

  const displaySubName = subCategoryName
    ? subCategoryName.charAt(0).toUpperCase() + subCategoryName.slice(1).toLowerCase()
    : "";

  const baseUrl = settings.website_url || "https://modestmart.com";
  const catKey = categoryName?.toLowerCase() || "";
  const catMeta = CATEGORY_META[catKey] || {
    title: `${displayName} Collection | Modest Mart`,
    description: `${displayName} ক্যাটাগরির সেরা পণ্য Modest Mart এ পাওয়া যায়।`,
  };

  const seoTitle = subCategoryName
    ? `${displaySubName} - ${displayName} Collection | Modest Mart`
    : catMeta.title;
  const seoDesc = subCategoryName
    ? `${displayName} > ${displaySubName} কালেকশন — Modest Mart এ সেরা দামে কিনুন।`
    : catMeta.description;

  const breadcrumbItems = [
    { name: "Home", url: baseUrl },
    { name: "Shop", url: `${baseUrl}/shop` },
  ];
  if (categoryName) breadcrumbItems.push({ name: displayName, url: `${baseUrl}/category/${categoryName}` });
  if (subCategoryName) breadcrumbItems.push({ name: displaySubName, url: `${baseUrl}/category/${categoryName}/${subCategoryName}` });

  const jsonLd = [
    breadcrumbSchema(breadcrumbItems),
    siteNavigationSchema([
      { name: "Men", url: `${baseUrl}/category/men` },
      { name: "Women", url: `${baseUrl}/category/women` },
      { name: "Kids", url: `${baseUrl}/category/kids` },
      { name: "Shop", url: `${baseUrl}/shop` },
    ]),
  ];

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
        <SEOHead
          title={seoTitle}
          description={seoDesc}
          canonical={subCategoryName ? `${baseUrl}/category/${categoryName}/${subCategoryName}` : `${baseUrl}/category/${categoryName}`}
          jsonLd={jsonLd}
        />
        <Header />
        <main>
          {/* Hero Banner */}
          <section className="bg-secondary py-16 md:py-24">
            <div className="container mx-auto px-4 md:px-6 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <nav aria-label="Breadcrumb" className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground mb-4">
                  <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
                  <ChevronRight size={14} />
                  {subCategoryName ? (
                    <>
                      <Link to={`/category/${categoryName}`} className="hover:text-foreground transition-colors">{displayName}</Link>
                      <ChevronRight size={14} />
                      <span className="text-foreground font-medium">{displaySubName}</span>
                    </>
                  ) : (
                    <span className="text-foreground font-medium">{displayName}</span>
                  )}
                </nav>
                <h1 className="heading-display mb-4">
                  {subCategoryName ? displaySubName : displayName}
                </h1>
                <p className="text-body max-w-lg mx-auto">
                  {subCategoryName
                    ? `${displayName} > ${displaySubName} collection`
                    : `Explore our curated ${displayName.toLowerCase()} collection.`}
                </p>
                {totalProducts > 0 && (
                  <p className="text-sm text-muted-foreground mt-3">{totalProducts} টি পণ্য</p>
                )}
              </motion.div>
            </div>
          </section>

          {/* Products */}
          <section className="py-16 md:py-24">
            <div className="container mx-auto px-4 md:px-6">
              {products.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                    {products.map((product, index) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.08 }}
                      >
                        <ProductCard
                          id={product.id}
                          name={product.name}
                          price={product.price}
                          image={product.image_url || "/placeholder.svg"}
                          category={product.category || undefined}
                          isNew={index < 4 && page === 1}
                        />
                      </motion.div>
                    ))}
                  </div>
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                </>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-20"
                >
                  <p className="text-body mb-8">No products found in this category.</p>
                  <Link to="/" className="btn-primary inline-flex items-center gap-2">
                    <ArrowLeft size={16} />
                    Back to Home
                  </Link>
                </motion.div>
              )}
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </PageTransition>
  );
};

export default Category;
