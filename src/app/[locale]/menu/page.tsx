// src/app/[locale]/menu/page.tsx

import { supabase } from "@/lib/supabaseClient";
import MenuClient, { SectionType } from "./MenuClient";

// Această funcție va rula pe server
async function getMenuData(locale: string) {
  const { data, error } = await supabase
    .from("categories")
    .select(
      `
      *,
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
    .map((category: any) => {
      const displayName = category[`name_${locale}`] || category.name;
      const slug = String(displayName).toLowerCase().replace(/\s+/g, "-");
      return {
        id: slug,
        name: displayName,
        items: (category.menu_images || []).map((img: any) => ({
          id: img.id,
          image_url: img.image_url,
          alt_text: img.alt_text,
        })),
      } as SectionType;
    })
    .filter((category) => category.items.length > 0); // Afișează doar categoriile cu imagini

  return sections;
}

// Componenta paginii
export default async function MenuPage({ params }: { params: { locale: string } }) {
  const locale = params?.locale || "ro";
  const sections = await getMenuData(locale);

  return <MenuClient sections={sections} />;
}
