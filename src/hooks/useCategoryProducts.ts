import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Product } from "./useProducts";

const PAGE_SIZE = 16;

export const useCategoryProducts = (
  category: string | undefined,
  subCategory: string | undefined,
  page: number
) => {
  return useQuery({
    queryKey: ["category-products", category, subCategory, page],
    queryFn: async () => {
      if (!category) return { products: [] as Product[], total: 0 };

      // Count query
      let countQuery = supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .ilike("category", category);
      if (subCategory) countQuery = countQuery.ilike("sub_category", subCategory);
      const { count, error: countErr } = await countQuery;
      if (countErr) throw countErr;

      const total = count ?? 0;
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      // Data query
      let dataQuery = supabase
        .from("products")
        .select("*")
        .ilike("category", category)
        .order("created_at", { ascending: false })
        .range(from, to);
      if (subCategory) dataQuery = dataQuery.ilike("sub_category", subCategory);
      const { data, error } = await dataQuery;
      if (error) throw error;

      return { products: (data ?? []) as Product[], total };
    },
    enabled: !!category,
  });
};

export { PAGE_SIZE };
