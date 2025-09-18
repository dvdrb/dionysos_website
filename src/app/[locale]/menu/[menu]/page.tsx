import { supabase } from "@/lib/supabaseClient";
import MenuClient, { SectionType } from "../MenuClient";
import type { Metadata } from "next";

const MENUS = ["taverna", "bar", "sushi"] as const;
type MenuSlug = (typeof MENUS)[number];

async function getMenuData(locale: string, menu: string) {
  // Try to filter by a 'menu' column on categories; if column missing, fall back to all
  // and let the UI handle grouping.
  let data: any[] | null = null;
  let error: any = null;
  try {
    const res = await supabase
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
      .eq("menu", menu)
      .order("id", { ascending: true });
    data = res.data as any[] | null;
    error = res.error;
  } catch (e) {
    error = e;
  }

  if (error || !data) {
    // Fallback: fetch without filter when 'menu' column not available
    const res = await supabase
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
      .order("id", { ascending: true });
    data = res.data ?? [];
  }

  const sections: SectionType[] = (data ?? [])
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
    .filter((category) => category.items.length > 0);

  return sections;
}

export default async function MenuPage({
  params,
}: {
  params: Promise<{ locale: string; menu: string }>;
}) {
  const { locale = "ro", menu: rawMenu = "taverna" } = await params;
  const menu = rawMenu as string;
  const sections = await getMenuData(locale, menu);
  return <MenuClient sections={sections} />;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; menu: string }>;
}): Promise<Metadata> {
  const { locale = "ro", menu: rawMenu = "taverna" } = await params;
  const menu = rawMenu as string;
  const menuNames: Record<string, { ro: string; ru: string; en: string }> = {
    taverna: { ro: "Meniu Taverna", ru: "Меню таверны", en: "Taverna Menu" },
    bar: { ro: "Bar", ru: "Бар", en: "Bar" },
    sushi: { ro: "Meniu Sushi", ru: "Суши меню", en: "Sushi Menu" },
  };
  const title = menuNames[menu]?.[locale as "ro" | "ru" | "en"] || menu;
  const description =
    locale === "ru"
      ? `Меню (${title}) ресторана Dionysos.`
      : locale === "en"
        ? `Dionysos restaurant (${title}) menu.`
        : `Meniul (${title}) restaurantului Dionysos.`;
  return {
    title,
    description,
    alternates: {
      canonical: `/${locale}/menu/${menu}`,
      languages: {
        ro: `/ro/menu/${menu}`,
        ru: `/ru/menu/${menu}`,
        en: `/en/menu/${menu}`,
      },
    },
    openGraph: {
      title,
      description,
      url: `/${locale}/menu/${menu}`,
      locale,
    },
  };
}
