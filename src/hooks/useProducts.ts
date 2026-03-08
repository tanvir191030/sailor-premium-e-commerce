import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { optimizeProductImage } from "@/lib/imageOptimizer";

export type Product = Tables<"products"> & { is_featured?: boolean };
export type ProductInsert = TablesInsert<"products"> & { is_featured?: boolean };
export type ProductUpdate = TablesUpdate<"products"> & { is_featured?: boolean };

// Columns needed for public product cards/listing
const PUBLIC_PRODUCT_COLS = "id,name,price,original_price,image_url,category,sub_category,created_at,is_featured,stock" as const;

export const useProducts = () => {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(PUBLIC_PRODUCT_COLS)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Product[];
    },
    staleTime: 1000 * 60 * 3, // 3 min cache
    gcTime: 1000 * 60 * 10,   // 10 min garbage collection
  });
};

export const useFeaturedProducts = () => {
  return useQuery({
    queryKey: ["products", "featured"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(PUBLIC_PRODUCT_COLS)
        .eq("is_featured", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Product[];
    },
    staleTime: 1000 * 60 * 3,
    gcTime: 1000 * 60 * 10,
  });
};

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ["products", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Product;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: ProductInsert) => {
      const { data, error } = await supabase
        .from("products")
        .insert(product)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...product }: ProductUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("products")
        .update(product)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};

export const uploadProductImage = async (file: File): Promise<string> => {
  const optimized = await optimizeProductImage(file);
  
  const fileName = `${crypto.randomUUID()}.webp`;
  const filePath = `products/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(filePath, optimized, { contentType: "image/webp" });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from("product-images")
    .getPublicUrl(filePath);

  return data.publicUrl;
};
