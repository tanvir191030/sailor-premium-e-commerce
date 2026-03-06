import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/xml; charset=utf-8",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get website URL from site_settings
  const { data: urlRow } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "website_url")
    .single();
  const baseUrl = urlRow?.value || "https://modestmart.com";

  // Fetch categories
  const { data: categories } = await supabase.from("categories").select("name");
  // Fetch sub-categories with category join
  const { data: subCategories } = await supabase
    .from("sub_categories")
    .select("name, category_id, categories(name)")
  // Fetch products
  const { data: products } = await supabase
    .from("products")
    .select("id, name, created_at")
    .order("created_at", { ascending: false });

  const today = new Date().toISOString().split("T")[0];

  let urls = `
  <url><loc>${baseUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority><lastmod>${today}</lastmod></url>
  <url><loc>${baseUrl}/shop</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>${baseUrl}/about</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>
  <url><loc>${baseUrl}/contact</loc><changefreq>monthly</changefreq><priority>0.5</priority></url>
  <url><loc>${baseUrl}/faq</loc><changefreq>monthly</changefreq><priority>0.4</priority></url>
  <url><loc>${baseUrl}/privacy-policy</loc><changefreq>yearly</changefreq><priority>0.3</priority></url>
  <url><loc>${baseUrl}/terms-conditions</loc><changefreq>yearly</changefreq><priority>0.3</priority></url>
  <url><loc>${baseUrl}/track-order</loc><changefreq>monthly</changefreq><priority>0.4</priority></url>`;

  // Category pages
  if (categories) {
    for (const cat of categories) {
      const slug = cat.name.toLowerCase();
      urls += `\n  <url><loc>${baseUrl}/category/${slug}</loc><changefreq>weekly</changefreq><priority>0.8</priority></url>`;
    }
  }

  // Sub-category pages
  if (subCategories) {
    for (const sub of subCategories as any[]) {
      const catName = sub.categories?.name?.toLowerCase();
      if (catName) {
        urls += `\n  <url><loc>${baseUrl}/category/${catName}/${sub.name.toLowerCase()}</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>`;
      }
    }
  }

  // Product pages
  if (products) {
    for (const p of products) {
      const lastmod = p.created_at ? new Date(p.created_at).toISOString().split("T")[0] : today;
      urls += `\n  <url><loc>${baseUrl}/product/${p.id}</loc><changefreq>weekly</changefreq><priority>0.6</priority><lastmod>${lastmod}</lastmod></url>`;
    }
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;

  return new Response(xml, { headers: corsHeaders });
});
