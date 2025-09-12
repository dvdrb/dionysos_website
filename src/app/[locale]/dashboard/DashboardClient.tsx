"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

// Vom crea aceste componente în pașii următori
import CategoriesManager from "./CategoriesManager";
import GalleryManager from "./GalleryManager";
import PromoItemsManager from "./PromoItemsManager";
import MenuImagesManager from "./MenuImagesManager";

// Tipuri pentru datele primite
export type Category = { id: number; name: string; icon: string | null };
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
      aria-label="Logout"
    >
      Logout
    </button>
  );
}

export default function DashboardClient({
  initialData,
}: {
  initialData: InitialData;
}) {
  const [activeTab, setActiveTab] = useState("categories");

  const tabs = [
    { id: "categories", label: "Categorii" },
    { id: "menu_images", label: "Imagini meniu" },
    { id: "promo_items", label: "Promo" },
    { id: "gallery", label: "Galerie" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">Admin Dashboard</h1>
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
        <div id="panel-categories" role="tabpanel" hidden={activeTab !== "categories"}>
          {activeTab === "categories" && (
            <CategoriesManager initialCategories={initialData.categories} />
          )}
        </div>
        <div id="panel-menu_images" role="tabpanel" hidden={activeTab !== "menu_images"}>
          {activeTab === "menu_images" && (
            <MenuImagesManager
              initialMenuImages={initialData.menuImages}
              categories={initialData.categories}
            />
          )}
        </div>
        <div id="panel-promo_items" role="tabpanel" hidden={activeTab !== "promo_items"}>
          {activeTab === "promo_items" && (
            <PromoItemsManager initialPromoItems={initialData.promoItems} />
          )}
        </div>
        <div id="panel-gallery" role="tabpanel" hidden={activeTab !== "gallery"}>
          {activeTab === "gallery" && (
            <GalleryManager initialGalleryImages={initialData.galleryImages} />
          )}
        </div>
      </main>
    </div>
  );
}
