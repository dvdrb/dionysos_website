"use client";

import React, { useState, useEffect } from "react";
import Script from "next/script";
import Head from "next/head";
import { useLocale } from "next-intl";
import Image from "next/image";

// Map Supabase public storage URLs to a local-first route (/images/<bucket>/<path>)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
let SUPABASE_HOST: string | null = null;
try {
  if (SUPABASE_URL) SUPABASE_HOST = new URL(SUPABASE_URL).hostname;
} catch {}
function optimizeUrl(url: string) {
  try {
    const u = new URL(url);
    if (!SUPABASE_HOST || u.hostname !== SUPABASE_HOST) return url;
    const objPrefix = "/storage/v1/object/public/";
    if (!u.pathname.startsWith(objPrefix)) return url;
    const pathRest = u.pathname.slice(objPrefix.length); // `${bucket}/...`
    return `/images/${pathRest}`;
  } catch {
    return url;
  }
}

// --- TIPURI ---
// Aceste tipuri trebuie să corespundă cu datele pe care le vom primi
export type MenuImageType = {
  id: number;
  image_url: string;
  alt_text: string | null;
};

export type SectionType = {
  id: string; // Acesta va fi numele categoriei, ex: 'pizza'
  name: string;
  items: MenuImageType[];
};

type NavCategory = { id: string; name: string };

// --- COMPONENTE ---

// CategoryNav (componenta pentru navigarea prin categorii)
type CategoryNavProps = {
  categories: NavCategory[];
  activeCategory: string;
  onCategoryClick: (categoryId: string) => void;
  headerOffset: number;
};
const CategoryNav = ({
  categories,
  activeCategory,
  onCategoryClick,
  headerOffset,
}: CategoryNavProps) => (
  <div
    className="bg-black/80 backdrop-blur-sm sticky z-30 py-3"
    style={{ top: headerOffset }}
  >
    <div className="container mx-auto px-4">
      <nav className="flex items-center gap-4 overflow-x-auto pb-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => onCategoryClick(category.id)}
            className={`px-6 py-2 text-sm font-semibold rounded-full transition-colors duration-300 flex-shrink-0
              ${
                activeCategory === category.id
                  ? "bg-white text-gray-900 shadow-lg"
                  : "bg-white/80 text-gray-900 hover:bg-white"
              }`}
          >
            {category.name}
          </button>
        ))}
      </nav>
    </div>
  </div>
);

// MenuSection (componenta pentru afișarea imaginilor dintr-o categorie)
type MenuSectionProps = {
  id: string;
  items: MenuImageType[];
  sectionIndex: number;
};
const MenuSection = ({ id, items, sectionIndex }: MenuSectionProps) => {
  return (
    <section id={id} className="scroll-mt-20">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex flex-col items-center gap-0">
          {items.map((item, itemIndex) => {
            const isPriority = sectionIndex === 0 && itemIndex === 0;
            const src = optimizeUrl(item.image_url);
            return (
              <img
                key={item.id}
                src={src}
                alt={item.alt_text ?? ""}
                loading={isPriority ? "eager" : "lazy"}
                fetchPriority={isPriority ? "high" as any : undefined}
                sizes="(max-width: 1024px) 100vw, 900px"
                className="block w-full max-w-3xl select-none"
              />
            );
          })}
        </div>
      </div>
    </section>
  );
};

// --- COMPONENTA PRINCIPALĂ CLIENT ---
export default function MenuClient({ sections }: { sections: SectionType[] }) {
  const locale = useLocale();
  const navCategories: NavCategory[] = sections.map(({ id, name }) => ({
    id,
    name,
  }));
  const [activeCategory, setActiveCategory] = useState<string>(
    navCategories[0]?.id ?? ""
  );
  const [headerOffset, setHeaderOffset] = useState<number>(0);
  const [deferRest, setDeferRest] = useState(false);

  // Defer rendering of below-the-fold sections to after idle to improve LCP
  useEffect(() => {
    if (typeof window === "undefined") return;
    const ric = (window as any).requestIdleCallback as
      | ((cb: () => void, opts?: { timeout?: number }) => number)
      | undefined;
    let t: any;
    if (ric) {
      t = ric(() => setDeferRest(true), { timeout: 1500 });
    } else {
      t = setTimeout(() => setDeferRest(true), 200);
    }
    return () => {
      if (t) clearTimeout(t);
    };
  }, []);

  // Compute header height to stick nav right under it
  useEffect(() => {
    if (typeof window === "undefined") return;
    const header = document.querySelector("header");
    const update = () => {
      const h = header instanceof HTMLElement ? header.offsetHeight : 0;
      setHeaderOffset(h);
    };
    update();
    // Observe header size changes
    let ro: ResizeObserver | null = null;
    if (header instanceof HTMLElement && "ResizeObserver" in window) {
      ro = new ResizeObserver(update);
      ro.observe(header);
    }
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      if (ro && header instanceof HTMLElement) ro.disconnect();
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveCategory(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-30% 0px -70% 0px",
        threshold: 0,
      }
    );

    navCategories.forEach((category) => {
      const element = document.getElementById(category.id);
      if (element) observer.observe(element);
    });

    return () => {
      navCategories.forEach((category) => {
        const element = document.getElementById(category.id);
        if (element) observer.unobserve(element);
      });
    };
  }, [navCategories]);

  const handleCategoryClick = (categoryId: string) => {
    const element = document.getElementById(categoryId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (!sections || sections.length === 0) {
    return (
      <div className="bg-[#1a1a1a] min-h-screen font-sans text-white flex items-center justify-center">
        <p>Meniul este în curs de actualizare. Vă rugăm reveniți mai târziu.</p>
      </div>
    );
  }

  const isBrowser = typeof window !== "undefined";
  const origin = isBrowser
    ? window.location.origin
    : process.env.NEXT_PUBLIC_SITE_URL || "";
  const menuUrl = isBrowser
    ? `${origin}${window.location.pathname}`
    : `${origin}/${locale}/menu`;
  const ld = JSON.stringify([
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: `${origin}/${locale}`,
        },
        { "@type": "ListItem", position: 2, name: "Menu", item: menuUrl },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "Menu",
      name: "Dionysos Menu",
      hasMenuSection: sections.map((s) => ({
        "@type": "MenuSection",
        name: s.name,
        url: `${menuUrl}#${s.id}`,
      })),
    },
  ]);

  return (
    <div className="bg-[#1a1a1a] min-h-screen font-sans">
      <Head>
        {sections?.[0]?.items?.[0]?.image_url && (
          <link rel="preload" as="image" href={optimizeUrl(sections[0].items[0].image_url)} />
        )}
      </Head>
      {/* JSON-LD: Breadcrumbs + Menu schema */}
      <Script id="ld-menu" type="application/ld+json">
        {ld}
      </Script>
      <CategoryNav
        categories={navCategories}
        activeCategory={activeCategory}
        onCategoryClick={handleCategoryClick}
        headerOffset={headerOffset}
      />

      <main>
        {(deferRest ? sections : sections.slice(0, 1)).map((section, index) => (
          <React.Fragment key={section.id}>
            <MenuSection
              id={section.id}
              items={section.items.map((it) => ({ ...it, image_url: optimizeUrl(it.image_url) }))}
              sectionIndex={index}
            />
          </React.Fragment>
        ))}
        {!deferRest && sections.length > 1 && (
          <div aria-hidden className="h-24" />
        )}
      </main>
    </div>
  );
}
