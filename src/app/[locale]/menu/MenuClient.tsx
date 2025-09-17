// src/app/[locale]/menu/MenuClient.tsx

"use client";

import React, { useState, useEffect } from "react";
import Script from "next/script";
import { useLocale } from "next-intl";

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
type MenuSectionProps = { id: string; items: MenuImageType[] };
const MenuSection = ({ id, items }: MenuSectionProps) => (
  <section id={id} className="scroll-mt-20">
    <div className="container mx-auto px-2 sm:px-4">
      <div className="flex flex-col items-center ">
        {items.map((item) => (
          <img
            key={item.id}
            src={item.image_url}
            alt={item.alt_text ?? ""}
            className="w-full max-w-3xl shadow-lg"
          />
        ))}
      </div>
    </div>
  </section>
);

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
        {sections.map((section, index) => (
          <React.Fragment key={section.id}>
            <MenuSection id={section.id} items={section.items} />
          </React.Fragment>
        ))}
      </main>
    </div>
  );
}
