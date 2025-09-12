import { supabase } from "@/lib/supabaseClient";
import DashboardClient from "./DashboardClient"; // Vom crea acest fișier

// Funcții pentru a prelua toate datele necesare
async function getData() {
  const categoriesReq = supabase.from("categories").select("*").order("name");
  const galleryReq = supabase
    .from("gallery_images")
    .select("*")
    .order("created_at", { ascending: false });
  const promoReq = supabase
    .from("promo_items")
    .select("*")
    .order("created_at", { ascending: false });
  const menuImagesReq = supabase
    .from("menu_images")
    .select("*")
    .order("created_at", { ascending: false });

  const [
    { data: categories, error: catError },
    { data: galleryImages, error: galError },
    { data: promoItems, error: promoError },
    { data: menuImages, error: menuImgError },
  ] = await Promise.all([categoriesReq, galleryReq, promoReq, menuImagesReq]);

  if (catError || galError || promoError || menuImgError) {
    console.error("Error fetching dashboard data:", {
      catError,
      galError,
      promoError,
      menuImgError,
    });
  }

  return {
    categories: categories ?? [],
    galleryImages: galleryImages ?? [],
    promoItems: promoItems ?? [],
    menuImages: menuImages ?? [],
  };
}

export default async function DashboardPage() {
  const initialData = await getData();

  return <DashboardClient initialData={initialData} />;
}
