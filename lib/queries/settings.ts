import { createClient } from "@/lib/supabase/server";

export type ContactSettings = {
  phone: string;
  whatsapp: string;
  email: string;
  address: string;
  instagram: string;
  facebook: string;
  google_maps_url: string;
};

export type HeroSettings = {
  badge: string;
  title_part1: string;
  title_part2: string;
  description: string;
  image_url: string;
};

export type AboutSettings = {
  title_part1: string;
  title_part2: string;
  paragraph_1: string;
  paragraph_2: string;
  image_url: string;
  quote: string;
  stats: { label: string; value: string }[];
};

async function getSetting<T>(key: string): Promise<T | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();

  if (error) {
    console.error(`[getSetting:${key}]`, error);
    return null;
  }
  return (data?.value ?? null) as T | null;
}

export const getContactSettings = () => getSetting<ContactSettings>("contact");
export const getHeroSettings = () => getSetting<HeroSettings>("hero");
export const getAboutSettings = () => getSetting<AboutSettings>("about");
