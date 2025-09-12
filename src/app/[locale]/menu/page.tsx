// src/app/[locale]/menu/page.tsx

import { supabase } from "@/lib/supabaseClient";
import MenuClient, { SectionType } from "./MenuClient";

// Această funcție va rula pe server
async function getMenuData() {
  const { data, error } = await supabase
    .from("categories")
    .select(
      `
      id,
      name,
      menu_images (
        id,
        image_url,
        alt_text
      )
    `
    )
    .order("id", { ascending: true }); // Sortează categoriile

  if (error) {
    console.error("Error fetching menu data:", error);
    return [];
  }

  // Transformă datele în formatul așteptat de componenta client
  const sections: SectionType[] = data
    .map((category) => ({
      id: category.name.toLowerCase().replace(/\s+/g, "-"), // ex: 'Supe Ciorbe' -> 'supe-ciorbe'
      name: category.name,
      items: category.menu_images.map((img) => ({
        id: img.id,
        image_url: img.image_url,
        alt_text: img.alt_text,
      })),
    }))
    .filter((category) => category.items.length > 0); // Afișează doar categoriile cu imagini

  return sections;
}

// Componenta paginii
export default async function MenuPage() {
  const sections = await getMenuData();

  return <MenuClient sections={sections} />;
}
