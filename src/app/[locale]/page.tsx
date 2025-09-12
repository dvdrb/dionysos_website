import { supabase } from "@/lib/supabaseClient";
import HomePageClient from "./HomePageClient";

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
