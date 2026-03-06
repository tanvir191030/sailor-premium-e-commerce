import { useEffect } from "react";

interface SEOHeadProps {
  title: string;
  description: string;
  canonical?: string;
  type?: string;
  image?: string;
  jsonLd?: Record<string, any> | Record<string, any>[];
}

/**
 * Dynamically sets document <title>, meta description, canonical, OG tags,
 * and injects JSON-LD structured data. Mount on each page.
 */
const SEOHead = ({ title, description, canonical, type = "website", image, jsonLd }: SEOHeadProps) => {
  useEffect(() => {
    document.title = title;

    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("name", "description", description);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:type", type);
    if (image) setMeta("property", "og:image", image);
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);
    if (image) setMeta("name", "twitter:image", image);

    // Canonical
    let link = document.querySelector("link[rel='canonical']") as HTMLLinkElement | null;
    if (canonical) {
      if (!link) {
        link = document.createElement("link");
        link.rel = "canonical";
        document.head.appendChild(link);
      }
      link.href = canonical;
    } else if (link) {
      link.remove();
    }

    return () => {
      document.title = "Modest Mart - Premium Fashion Bangladesh";
    };
  }, [title, description, canonical, type, image]);

  // JSON-LD
  useEffect(() => {
    const id = "seo-jsonld";
    let script = document.getElementById(id) as HTMLScriptElement | null;
    if (!jsonLd) {
      if (script) script.remove();
      return;
    }
    if (!script) {
      script = document.createElement("script");
      script.id = id;
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    const schemas = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
    script.textContent = JSON.stringify(schemas.length === 1 ? schemas[0] : schemas);

    return () => {
      const el = document.getElementById(id);
      if (el) el.remove();
    };
  }, [jsonLd]);

  return null;
};

export default SEOHead;

// ─── Schema helpers ───

export const organizationSchema = (name: string, url: string, logoUrl?: string) => ({
  "@context": "https://schema.org",
  "@type": "Organization",
  name,
  url,
  ...(logoUrl ? { logo: logoUrl } : {}),
  sameAs: [],
});

export const breadcrumbSchema = (items: { name: string; url: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: item.name,
    item: item.url,
  })),
});

export const productSchema = (product: {
  name: string;
  description?: string;
  image?: string;
  price: number;
  currency?: string;
  availability?: string;
  url: string;
  brand?: string;
  ratingValue?: number;
  reviewCount?: number;
}) => ({
  "@context": "https://schema.org",
  "@type": "Product",
  name: product.name,
  ...(product.description ? { description: product.description } : {}),
  ...(product.image ? { image: product.image } : {}),
  ...(product.brand ? { brand: { "@type": "Brand", name: product.brand } } : {}),
  offers: {
    "@type": "Offer",
    price: product.price,
    priceCurrency: product.currency || "BDT",
    availability: product.availability || "https://schema.org/InStock",
    url: product.url,
  },
  ...(product.reviewCount && product.reviewCount > 0
    ? {
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: product.ratingValue || 0,
          reviewCount: product.reviewCount,
        },
      }
    : {}),
});

export const siteNavigationSchema = (items: { name: string; url: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "SiteNavigationElement",
  name: items.map((i) => i.name),
  url: items.map((i) => i.url),
});
