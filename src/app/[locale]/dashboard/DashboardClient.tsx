"use client";

import { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";

// Vom crea aceste componente în pașii următori
import CategoriesManager from "./CategoriesManager";
import GalleryManager from "./GalleryManager";
import PromoItemsManager from "./PromoItemsManager";
import MenuImagesManager from "./MenuImagesManager";

// Tipuri pentru datele primite
export type Category = {
  id: number;
  name: string;
  icon: string | null;
  name_ro?: string | null;
  name_ru?: string | null;
  name_en?: string | null;
  menu?: string | null;
};
export type GalleryImage = {
  id: number;
  image_url: string;
  alt_text: string | null;
};
export type PromoItem = {
  id: number;
  title: string;
  price: string;
  image_url: string;
};
export type MenuImage = {
  id: number;
  category_id: number;
  image_url: string;
  alt_text: string | null;
};

type InitialData = {
  categories: Category[];
  galleryImages: GalleryImage[];
  promoItems: PromoItem[];
  menuImages: MenuImage[];
};

function LogoutButton() {
  const t = useTranslations("Dashboard");
  const router = useRouter();
  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };
  return (
    <button
      onClick={handleLogout}
      className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
      aria-label={t("logout")}
    >
      {t("logout")}
    </button>
  );
}

export default function DashboardClient({
  initialData,
}: {
  initialData: InitialData | undefined | null;
}) {
  const t = useTranslations("Dashboard");
  const locale = useLocale();
  const safeData: InitialData = {
    categories: initialData?.categories ?? [],
    galleryImages: initialData?.galleryImages ?? [],
    promoItems: initialData?.promoItems ?? [],
    menuImages: initialData?.menuImages ?? [],
  };
  const [activeTab, setActiveTab] = useState("categories");
  const [cats, setCats] = useState<Category[]>(safeData.categories);
  const MENUS = [
    { id: "taverna", label: t("menus.taverna") },
    { id: "bar", label: t("menus.bar") },
    { id: "sushi", label: t("menus.sushi") },
  ] as const;
  const [selectedMenu, setSelectedMenu] = useState<(typeof MENUS)[number]["id"]>(
    "taverna"
  );

  const tabs = [
    { id: "categories", label: t("tabs.categories") },
    { id: "menu_images", label: t("tabs.menu_images") },
    { id: "promo_items", label: t("tabs.promo_items") },
    { id: "gallery", label: t("tabs.gallery") },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">{t("title")}</h1>
          <div className="flex items-center gap-2">
            <label htmlFor="menu-select" className="text-sm text-gray-700">{t("menuLabel")}</label>
            <select
              id="menu-select"
              value={selectedMenu}
              onChange={(e) => setSelectedMenu(e.target.value as any)}
              className="rounded-md border-gray-300 bg-white py-1.5 px-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
            >
              {MENUS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <LogoutButton />
        </div>
        <div className="w-full overflow-x-auto">
          <nav
            className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8 flex gap-2 py-2"
            aria-label="Tab navigation"
            role="tablist"
          >
            {tabs.map((tab) => {
              const selected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={selected}
                  aria-controls={`panel-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 whitespace-nowrap ${
                    selected
                      ? "bg-indigo-600 text-white shadow"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div
          id="panel-categories"
          role="tabpanel"
          hidden={activeTab !== "categories"}
        >
          {activeTab === "categories" && (
            <CategoriesManager
              initialCategories={cats}
              selectedMenu={selectedMenu}
              onCreated={(c) => setCats((prev) => [...prev, c])}
              onDeleted={(id) => setCats((prev) => prev.filter((x) => x.id !== id))}
            />
          )}
        </div>
        <div
          id="panel-menu_images"
          role="tabpanel"
          hidden={activeTab !== "menu_images"}
        >
          {activeTab === "menu_images" && (
            <MenuImagesManager
              initialMenuImages={safeData?.menuImages}
              categories={cats}
              selectedMenu={selectedMenu}
            />
          )}
        </div>
        <div
          id="panel-promo_items"
          role="tabpanel"
          hidden={activeTab !== "promo_items"}
        >
          {activeTab === "promo_items" && (
            <PromoItemsManager initialPromoItems={safeData?.promoItems} />
          )}
        </div>
        <div
          id="panel-gallery"
          role="tabpanel"
          hidden={activeTab !== "gallery"}
        >
          {activeTab === "gallery" && (
            <GalleryManager initialGalleryImages={safeData?.galleryImages} />
          )}
        </div>
      </main>
    </div>
  );
}
