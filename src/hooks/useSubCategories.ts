import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SubCategory {
  id: string;
  name: string;
  category_id: string;
  measurement_template: string;
  size_chart_image?: string | null;
  size_chart_data?: any[] | null;
  created_at: string;
}

export const MEASUREMENT_TEMPLATES: Record<string, { label: string; fields: string[] }> = {
  none: { label: "কোনো সাইজ নেই (Bags, Others)", fields: [] },
  clothing: { label: "পোশাক (Chest, Length, Shoulder)", fields: ["chest", "length", "shoulder"] },
  hijab: { label: "হিজাব/ওড়না (Width × Length)", fields: ["width", "length"] },
  shoes: { label: "জুতা (EU Size)", fields: [] },
  panjabi: { label: "পাঞ্জাবি (Chest, Length)", fields: ["chest", "length"] },
  pants: { label: "প্যান্ট (Waist, Length)", fields: ["waist", "length"] },
  jewellery: { label: "জুয়েলারি (Diameter/Length)", fields: ["diameter", "length"] },
  watch: { label: "ঘড়ি (Case Size)", fields: [] },
  salwar_kameez: { label: "সালোয়ার কামিজ (Bust, Waist, Length)", fields: ["bust", "waist", "length"] },
};

export const useSubCategories = () => {
  return useQuery({
    queryKey: ["sub-categories"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("sub_categories")
        .select("id,name,category_id,measurement_template,size_chart_image,size_chart_data")
        .order("name");
      if (error) throw error;
      return data as SubCategory[];
    },
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 30,
  });
};

export const useSubCategoriesByCategory = (categoryId: string | undefined) => {
  return useQuery({
    queryKey: ["sub-categories", categoryId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("sub_categories")
        .select("id,name,category_id,measurement_template,size_chart_image,size_chart_data")
        .eq("category_id", categoryId)
        .order("name");
      if (error) throw error;
      return data as SubCategory[];
    },
    enabled: !!categoryId,
    staleTime: 1000 * 60 * 10,
  });
};
