import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface SiteSettings {
  store_name: string;
  announcement_bar: string;
  logo_url: string;
  favicon_url: string;
  about_us: string;
  office_address: string;
  support_email: string;
  phone_number: string;
  facebook_url: string;
  instagram_url: string;
  twitter_url: string;
  site_title: string;
  meta_description: string;
  // existing settings
  site_name: string;
  contact_phone: string;
  contact_email: string;
  delivery_inside_dhaka: string;
  delivery_outside_dhaka: string;
  bkash_number: string;
  nagad_number: string;
  rocket_number: string;
  facebook: string;
  instagram: string;
}

const DEFAULTS: SiteSettings = {
  store_name: "SAILOR",
  announcement_bar: "সকল অর্ডারে ফ্রি শিপিং · Free Shipping on All Orders",
  logo_url: "",
  favicon_url: "",
  about_us: "SAILOR হলো একটি প্রিমিয়াম ফ্যাশন ব্র্যান্ড যা আপনার জীবনধারার সাথে মিলে যায়।",
  office_address: "ঢাকা, বাংলাদেশ",
  support_email: "info@sailor.com.bd",
  phone_number: "01700000000",
  facebook_url: "https://facebook.com",
  instagram_url: "https://instagram.com",
  twitter_url: "https://twitter.com",
  site_title: "SAILOR - Premium Fashion Bangladesh",
  meta_description: "SAILOR - বাংলাদেশের সেরা প্রিমিয়াম ফ্যাশন ব্র্যান্ড। নারী, পুরুষ ও শিশুদের জন্য সর্বোচ্চ মানের পোশাক।",
  site_name: "SAILOR",
  contact_phone: "",
  contact_email: "",
  delivery_inside_dhaka: "80",
  delivery_outside_dhaka: "130",
  bkash_number: "",
  nagad_number: "",
  rocket_number: "",
  facebook: "",
  instagram: "",
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
