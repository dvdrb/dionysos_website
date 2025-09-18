import { supabase } from "@/lib/supabaseClient";
import HomePageClient from "./HomePageClient";
import type { Metadata } from "next";

// Funcția pentru a prelua imaginile din GALERIE
async function getGalleryImages() {
  const { data, error } = await supabase
    .from("gallery_images")
    .select("id, image_url, alt_text")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching gallery images:", error);
    return [];
  }
  return data;
}

// Funcția pentru a prelua produsele PROMOVATE
async function getPromoItems() {
  const { data, error } = await supabase
    .from("promo_items")
    .select("id, title, price, image_url")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching promo items:", error);
    return [];
  }
  return data;
}

// Componenta Server care trimite datele
export default async function DionysosPage() {
  const galleryImgs = await getGalleryImages();
  const promoItems = await getPromoItems();

  return <HomePageClient galleryImgs={galleryImgs} promoItems={promoItems} />;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale = "ro" } = await params;
  const titles: Record<string, string> = {
    ro: "Dionysos – Restaurant în orașul Nisporeni",
    ru: "Dionysos – Ресторан в городе Ниспорены",
    en: "Dionysos – Restaurant in Nisporeni",
  };
  const descriptions: Record<string, string> = {
    ro: "Preparate proaspete, atmosferă primitoare. Vezi meniul și galeria restaurantului Dionysos.",
    ru: "Свежие блюда и уютная атмосфера. Ознакомьтесь с меню и галереей ресторана Dionysos.",
    en: "Fresh dishes and a welcoming atmosphere. Explore Dionysos restaurant's menu and gallery.",
  };
  const currentTitle = titles[locale] ?? titles.ro;
  const currentDesc = descriptions[locale] ?? descriptions.ro;

  return {
    title: currentTitle,
    description: currentDesc,
    alternates: {
      canonical: `/${locale}`,
      languages: {
        ro: "/ro",
        ru: "/ru",
        en: "/en",
      },
    },
    openGraph: {
      title: currentTitle,
      description: currentDesc,
      url: `/${locale}`,
      locale,
    },
  };
}
