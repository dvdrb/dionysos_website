"use client";

import React, { useState, useEffect, useRef } from "react";
import Script from "next/script";
import Head from "next/head";
import { useLocale, useTranslations } from "next-intl";
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
  navRef?: React.RefObject<HTMLDivElement>;
};
const CategoryNav = ({
  categories,
  activeCategory,
  onCategoryClick,
  headerOffset,
  navRef,
}: CategoryNavProps) => (
  <div
    className="bg-black/80 backdrop-blur-sm sticky z-30 py-3"
    style={{ top: headerOffset }}
    ref={navRef}
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
  scrollMarginTop: number;
};
const MenuSection = ({
  id,
  items,
  sectionIndex,
  scrollMarginTop,
}: MenuSectionProps) => {
  return (
    <section
      id={id}
      style={{
        contentVisibility: "auto",
        containIntrinsicSize: "1200px",
        scrollMarginTop,
      }}
    >
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
                fetchPriority={isPriority ? ("high" as any) : undefined}
                decoding="async"
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
  const t = useTranslations();
  const translateCategory = (id: string, fallback: string) => {
    try {
      const v = t(`menu_categories.${id}` as any);
      return v || fallback;
    } catch {
      return fallback;
    }
  };
  const navCategories: NavCategory[] = sections.map(({ id, name }) => ({
    id,
    name: translateCategory(id, name),
  }));
  const [activeCategory, setActiveCategory] = useState<string>(
    navCategories[0]?.id ?? ""
  );
  const [headerOffset, setHeaderOffset] = useState<number>(0);
  const [navHeight, setNavHeight] = useState<number>(0);
  const [deferRest, setDeferRest] = useState(false);
  const navRef = useRef<HTMLDivElement>(null!);
  const [lastTargetId, setLastTargetId] = useState<string | null>(null);

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

  // Compute category nav height for accurate scroll offset
  useEffect(() => {
    if (typeof window === "undefined") return;
    const el = navRef.current;
    const update = () =>
      setNavHeight(el instanceof HTMLElement ? el.offsetHeight : 0);
    update();
    let ro: ResizeObserver | null = null;
    if (el instanceof HTMLElement && "ResizeObserver" in window) {
      ro = new ResizeObserver(update);
      ro.observe(el);
    }
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      if (ro && el instanceof HTMLElement) ro.disconnect();
    };
  }, [navRef]);

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

  const scrollToCategoryId = (
    id: string,
    behavior: ScrollBehavior = "smooth"
  ) => {
    const el = document.getElementById(id);
    if (!el) return false;
    // Use scrollIntoView with CSS scroll-margin-top; avoids sticky nav mid-scroll shifts
    el.scrollIntoView({ behavior, block: "start" });
    return true;
  };

  const handleCategoryClick = (categoryId: string) => {
    setDeferRest(true); // ensure all sections rendered
    setLastTargetId(categoryId);

    // Try immediate smooth scroll; if element not yet present, retry a few frames
    let attempts = 0;
    const attempt = () => {
      const ok = scrollToCategoryId(categoryId, "smooth");
      if (!ok && attempts < 12) {
        attempts += 1;
        requestAnimationFrame(attempt);
      } else if (ok) {
        // Correct once after layout settles
        requestAnimationFrame(() => scrollToCategoryId(categoryId, "auto"));
        setTimeout(() => scrollToCategoryId(categoryId, "auto"), 200);

        // Watch images in all sections up to the target; correct when they load
        try {
          const targetIndex = sections.findIndex((s) => s.id === categoryId);
          if (targetIndex >= 0) {
            const idsToWatch = sections
              .slice(0, targetIndex + 1)
              .map((s) => s.id);
            const seen = new WeakSet<EventTarget>();
            idsToWatch.forEach((id) => {
              const sec = document.getElementById(id);
              if (!sec) return;
              sec.querySelectorAll("img").forEach((img) => {
                const im = img as HTMLImageElement;
                if (im.complete || seen.has(im)) return;
                const onLoad = () => {
                  seen.add(im);
                  scrollToCategoryId(categoryId, "auto");
                  im.removeEventListener("load", onLoad);
                };
                im.addEventListener("load", onLoad, { once: true });
              });
            });
          }
        } catch {}

        // Additional timed corrections for late layout shifts
        setTimeout(() => scrollToCategoryId(categoryId, "auto"), 500);
        setTimeout(() => scrollToCategoryId(categoryId, "auto"), 900);
      }
    };
    requestAnimationFrame(attempt);
  };

  // If header/nav heights change after a click, correct position once
  useEffect(() => {
    if (!lastTargetId) return;
    // slight debounce to wait for style update
    const t = setTimeout(() => scrollToCategoryId(lastTargetId, "auto"), 50);
    return () => clearTimeout(t);
  }, [headerOffset, navHeight, lastTargetId]);

  // Support deep links like /menu/taverna#gustari
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash?.slice(1);
    if (!hash) return;
    setDeferRest(true);
    setLastTargetId(hash);
    // Attempt after paint
    requestAnimationFrame(() => {
      scrollToCategoryId(hash, "auto");
      // correct after images/nav settle
      setTimeout(() => scrollToCategoryId(hash, "auto"), 250);
      // Watch images above and inside the target
      try {
        const targetIndex = sections.findIndex((s) => s.id === hash);
        if (targetIndex >= 0) {
          const idsToWatch = sections
            .slice(0, targetIndex + 1)
            .map((s) => s.id);
          const seen = new WeakSet<EventTarget>();
          idsToWatch.forEach((id) => {
            const sec = document.getElementById(id);
            if (!sec) return;
            sec.querySelectorAll("img").forEach((img) => {
              const im = img as HTMLImageElement;
              if (im.complete || seen.has(im)) return;
              const onLoad = () => {
                seen.add(im);
                scrollToCategoryId(hash, "auto");
                im.removeEventListener("load", onLoad);
              };
              im.addEventListener("load", onLoad, { once: true });
            });
          });
        }
      } catch {}
      setTimeout(() => scrollToCategoryId(hash, "auto"), 600);
      setTimeout(() => scrollToCategoryId(hash, "auto"), 1000);
    });
  }, []);

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
        name: translateCategory(s.id, s.name),
        url: `${menuUrl}#${s.id}`,
      })),
    },
  ]);

  return (
    <div className="bg-[#1a1a1a] min-h-screen font-sans">
      <Head>
        {sections?.[0]?.items?.[0]?.image_url && (
          <link
            rel="preload"
            as="image"
            href={optimizeUrl(sections[0].items[0].image_url)}
          />
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
        navRef={navRef}
      />

      <main>
        {(deferRest ? sections : sections.slice(0, 1)).map((section, index) => (
          <React.Fragment key={section.id}>
            <MenuSection
              id={section.id}
              items={section.items.map((it) => ({
                ...it,
                image_url: optimizeUrl(it.image_url),
              }))}
              sectionIndex={index}
              scrollMarginTop={headerOffset + navHeight + 8}
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
