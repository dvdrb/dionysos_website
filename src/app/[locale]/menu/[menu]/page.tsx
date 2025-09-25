import { supabase } from "@/lib/supabaseClient";
import MenuClient, { SectionType } from "../MenuClient";
import type { Metadata } from "next";
import { promises as fs } from "node:fs";
import path from "node:path";

export const revalidate = 300; // ISR to cache menu data for 5 minutes

const MENUS = [
  "taverna",
  "bar",
  "sushi",
  "sushi-restaurant",
  "sushi-restaurant-sushi",
] as const;
type MenuSlug = (typeof MENUS)[number];

const IMG_EXT = new Set([".webp", ".jpg", ".jpeg", ".png", ".gif"]);
// Force local assets for all menus (requested: always use local images)
const USE_LOCAL_MENU = true;

function slugify(input: string) {
  const s = String(input)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s || "";
}

function simpleSlug(input: string) {
  return String(input).toLowerCase().replace(/\s+/g, "-");
}

function stripOrderPrefix(slug: string): string {
  // Remove leading digits and separators like '-', '_', '.' and spaces: e.g., '01-pizza' -> 'pizza'
  const s = slug.replace(/^\d+[\-_.\s]+/, "");
  return s || slug;
}

async function listLocalCategory(menu: string, slug: string, fallbackSlug?: string) {
  const base = path.join(process.cwd(), "public", "menu", menu, slug);
  try {
    const entries = await fs.readdir(base, { withFileTypes: true });
    return entries
      .filter((e) => e.isFile() && IMG_EXT.has(path.extname(e.name).toLowerCase()))
      .map((e) => ({
        file: e.name,
        url: `/menu/${menu}/${slug}/${e.name}`,
      }));
  } catch {
    if (fallbackSlug && fallbackSlug !== slug) {
      return listLocalCategory(menu, fallbackSlug);
    }
    return [] as { file: string; url: string }[];
  }
}

function getName(img: any): string {
  const fromAlt = typeof img.alt_text === "string" ? img.alt_text : "";
  const fromUrl = typeof img.image_url === "string" ? img.image_url : "";
  const pick = fromAlt || fromUrl;
  return (pick.split("/").pop() || pick) as string;
}

function getNum(name: string): number | null {
  const m = name.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

function compareItems(a: any, b: any): number {
  const an = getName(a);
  const bn = getName(b);
  const ai = getNum(an);
  const bi = getNum(bn);
  if (ai !== null && bi !== null) return ai - bi; // ascending numeric
  if (ai !== null) return -1; // numbered first
  if (bi !== null) return 1;
  const cmp = an.localeCompare(bn, undefined, { numeric: true, sensitivity: "base" });
  if (cmp !== 0) return cmp;
  const aid = typeof a.id === "number" ? a.id : Number.MAX_SAFE_INTEGER;
  const bid = typeof b.id === "number" ? b.id : Number.MAX_SAFE_INTEGER;
  return aid - bid;
}

function leadingNumber(input: string): number | null {
  const m = input.match(/^(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

function compareCategoryFolders(a: string, b: string): number {
  // Prefer numeric prefix ordering like 01-..., 02-..., fallback to natural compare
  const an = leadingNumber(a);
  const bn = leadingNumber(b);
  if (an !== null && bn !== null) return an - bn;
  if (an !== null) return -1;
  if (bn !== null) return 1;
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

async function getMenuData(locale: string, menu: string) {
  // 1) If there are local category folders with images, use ONLY local
  if (USE_LOCAL_MENU) {
    const menuBase = path.join(process.cwd(), "public", "menu", menu);
    let localOnlySections: SectionType[] = [];
    try {
      const catDirs = await fs.readdir(menuBase, { withFileTypes: true });
      const localCats: string[] = [];
      for (const dir of catDirs) {
        if (!dir.isDirectory()) continue;
        const files = await listLocalCategory(menu, dir.name);
        if (files.length > 0) localCats.push(dir.name);
      }
      if (localCats.length > 0) {
        for (const folderSlug of localCats.sort(compareCategoryFolders)) {
          const localFiles = await listLocalCategory(menu, folderSlug);
          const items = localFiles
            .map((f, idx) => ({ id: -300000 - idx, image_url: f.url, alt_text: f.file }))
            .sort(compareItems);
          const displaySlug = stripOrderPrefix(folderSlug);
          const friendly = displaySlug
            .split("-")
            .filter(Boolean)
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");
          localOnlySections.push({ id: displaySlug, name: friendly || displaySlug, items });
        }
        return localOnlySections;
      }
    } catch {}
    // Strict local-only: do not fall back to DB when enforced
    return [] as SectionType[];
  }

  // 2) Otherwise, fall back to DB categories (local-first per category) and include local-only leftover folders
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

  const sections: SectionType[] = [];
  const presentSlugs = new Set<string>();
  for (const category of data ?? []) {
    const displayName = category[`name_${locale}`] || category.name;
    const slug = slugify(displayName);
    const altSlug = simpleSlug(displayName);

    const localFiles = await listLocalCategory(menu, slug, altSlug);
    const localItems = localFiles.map((f, idx) => ({
      id: -100000 - idx, // synthetic id for React keys
      image_url: f.url,
      alt_text: f.file,
    }));

    const dbItems = (category.menu_images || []).map((img: any) => ({
      id: img.id,
      image_url: img.image_url,
      alt_text: img.alt_text,
    }));

    const source = localItems.length > 0 ? localItems : dbItems;
    const sortedItems = source.slice().sort(compareItems);

    if (sortedItems.length > 0) {
      sections.push({ id: slug, name: displayName, items: sortedItems });
      presentSlugs.add(slug);
    }
  }

  // Only categories with at least 1 image are kept
  // (either from local files or DB)
  // Additionally, include any local-only category folders not present in DB
  if (USE_LOCAL_MENU) {
    const menuBase2 = path.join(process.cwd(), "public", "menu", menu);
    try {
      const entries = await fs.readdir(menuBase2, { withFileTypes: true });
      const folderSlugs = entries
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
        .sort(compareCategoryFolders);
      for (const folderSlug of folderSlugs) {
        if (presentSlugs.has(folderSlug)) continue; // already included via DB category
        const localFiles = await listLocalCategory(menu, folderSlug);
        if (localFiles.length === 0) continue;
        const items = localFiles
          .map((f, idx) => ({ id: -200000 - idx, image_url: f.url, alt_text: f.file }))
          .sort(compareItems);
        // Friendly name from slug: kebab-case -> Title Case
        const displaySlug = stripOrderPrefix(folderSlug);
        const friendly = displaySlug
          .split("-")
          .filter(Boolean)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
        sections.push({ id: displaySlug, name: friendly || displaySlug, items });
        presentSlugs.add(displaySlug);
      }
    } catch {}
  }

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
    "sushi-restaurant": {
      ro: "Meniu Restaurant Sushi",
      ru: "Меню ресторана (Суши)",
      en: "Sushi Restaurant Menu",
    },
    "sushi-restaurant-sushi": {
      ro: "Meniu Sushi (Restaurant)",
      ru: "Суши меню (Ресторан)",
      en: "Sushi Menu (Restaurant)",
    },
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
