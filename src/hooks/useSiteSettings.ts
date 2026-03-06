import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SiteSettings {
  store_name: string;
  announcement_bar: string;
  logo_url: string;
  favicon_url: string;
  about_us: string;
  about_us_extended: string;
  our_mission: string;
  office_address: string;
  support_email: string;
  phone_number: string;
  facebook_url: string;
  instagram_url: string;
  twitter_url: string;
  tiktok_url: string;
  youtube_url: string;
  site_title: string;
  meta_description: string;
  privacy_policy: string;
  terms_conditions: string;
  // existing settings
  site_name: string;
  contact_phone: string;
  contact_email: string;
  delivery_inside_dhaka: string;
  delivery_outside_dhaka: string;
  bkash_number: string;
  nagad_number: string;
  rocket_number: string;
  facebook_pixel_id: string;
  facebook: string;
  instagram: string;
  whatsapp_number: string;
  messenger_id: string;
  website_url: string;
  hero_image_url: string;
  hero_title: string;
  hero_subtitle: string;
  free_delivery: string;
}

const DEFAULTS: SiteSettings = {
  store_name: "Modest Mart",
  announcement_bar: "সকল অর্ডারে ফ্রি শিপিং · Free Shipping on All Orders",
  logo_url: "",
  favicon_url: "",
  about_us: "Modest Mart হলো একটি প্রিমিয়াম ফ্যাশন ব্র্যান্ড যা আপনার জীবনধারার সাথে মিলে যায়।",
  about_us_extended: "",
  our_mission: "আমাদের লক্ষ্য হলো বাংলাদেশের প্রতিটি মানুষের কাছে আন্তর্জাতিক মানের ফ্যাশন সাশ্রয়ী মূল্যে পৌঁছে দেওয়া।",
  office_address: "ঢাকা, বাংলাদেশ",
  support_email: "info@sailor.com.bd",
  phone_number: "01700000000",
  facebook_url: "https://facebook.com",
  instagram_url: "https://instagram.com",
  twitter_url: "https://twitter.com",
  tiktok_url: "",
  youtube_url: "",
  site_title: "Modest Mart - Premium Fashion Bangladesh",
  meta_description: "Modest Mart - বাংলাদেশের সেরা প্রিমিয়াম ফ্যাশন ব্র্যান্ড। নারী, পুরুষ ও শিশুদের জন্য সর্বোচ্চ মানের পোশাক।",
  privacy_policy: "",
  terms_conditions: "",
  site_name: "Modest Mart",
  contact_phone: "",
  contact_email: "",
  delivery_inside_dhaka: "80",
  delivery_outside_dhaka: "130",
  bkash_number: "",
  nagad_number: "",
  rocket_number: "",
  facebook_pixel_id: "",
  facebook: "",
  instagram: "",
  whatsapp_number: "",
  messenger_id: "",
  website_url: "",
  hero_image_url: "",
  hero_title: "",
  hero_subtitle: "",
};

export const useSiteSettings = () => {
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*");
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 min cache
  });

  const settings: SiteSettings = { ...DEFAULTS };
  rows.forEach((row: any) => {
    if (row.key in settings) {
      (settings as any)[row.key] = row.value ?? (DEFAULTS as any)[row.key];
    }
  });

  return { settings, isLoading };
};
