"use client";

import React, { useState, useEffect } from "react";

// --- DUMMY DATA ---
// Replace this with your actual menu images.
const menuData = {
  Pizza: [
    {
      name: "Dionysos Platter",
      image:
        "https://placehold.co/800x1100/1c1c1c/ffffff?text=Dionysos+Platter",
    },
    {
      name: "Margherita Pizza",
      image: "https://placehold.co/800x600/1c1c1c/ffffff?text=Margherita",
    },
  ],
  Pasta: [
    {
      name: "Coltunasi cu cartofi",
      image:
        "https://placehold.co/800x700/1c1c1c/ffffff?text=Coltunasi+cu+cartofi",
    },
    {
      name: "Coltunasi cu branza",
      image:
        "https://placehold.co/800x700/1c1c1c/ffffff?text=Coltunasi+cu+branza",
    },
    {
      name: "Pelimeni cu carne",
      image:
        "https://placehold.co/800x700/1c1c1c/ffffff?text=Pelimeni+cu+carne",
    },
  ],
  Salate: [
    {
      name: "Caesar Salad",
      image: "https://placehold.co/800x600/1c1c1c/ffffff?text=Caesar+Salad",
    },
  ],
  Supe: [
    {
      name: "Zama",
      image: "https://placehold.co/800x800/1c1c1c/ffffff?text=Zama",
    },
    {
      name: "Soleanca",
      image: "https://placehold.co/800x800/1c1c1c/ffffff?text=Soleanca",
    },
    {
      name: "Supa crema",
      image: "https://placehold.co/800x800/1c1c1c/ffffff?text=Supa+crema",
    },
  ],
  Garnituri: [
    {
      name: "Extra",
      image: "https://placehold.co/800x400/1c1c1c/ffffff?text=Extras",
    },
  ],
  Deserturi: [
    {
      name: "Cheesecake",
      image: "https://placehold.co/800x600/1c1c1c/ffffff?text=Cheesecake",
    },
  ],
  Bauturi: [
    {
      name: "Water",
      image: "https://placehold.co/800x600/1c1c1c/ffffff?text=Water",
    },
  ],
};

// --- COMPONENTS ---

type NavCategory = { id: string; name: string };
type CategoryNavProps = {
  categories: NavCategory[];
  activeCategory: string;
  onCategoryClick: (categoryId: string) => void;
};
const CategoryNav = ({
  categories,
  activeCategory,
  onCategoryClick,
}: CategoryNavProps) => (
  <div className="bg-black/80 backdrop-blur-sm sticky top-0 z-20 py-3">
    <div className="container mx-auto px-4">
      {/* This navigation bar scrolls horizontally on smaller screens if categories overflow.
        The scrollbar is hidden for a cleaner look, but it's still scrollable via touch/mouse.
        You might need a plugin like `tailwind-scrollbar-hide` for this to work perfectly.
      */}
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

type MenuItem = {
  name: string;
  image: string;
};

type MenuSectionProps = { id: string; title: string; items: MenuItem[] };
const MenuSection = ({ id, title, items }: MenuSectionProps) => (
  <section id={id} className="scroll-mt-20">
    <div className="container mx-auto px-2 sm:px-4">
      <div className="flex flex-col items-center gap-4">
        {items.map((item) => (
          <img
            key={item.name}
            src={item.image}
            alt={item.name}
            className="w-full max-w-3xl rounded-lg shadow-lg"
            onError={(e) => {
              (e.target as HTMLImageElement).onerror = null;
              (e.target as HTMLImageElement).src =
                "https://placehold.co/800x600/1c1c1c/ffffff?text=Image+Not+Found";
            }}
          />
        ))}
      </div>
    </div>
  </section>
);

export default function MenuPage() {
  const sections = [
    { id: "pizza", name: "Pizza", items: menuData.Pizza },
    { id: "pasta", name: "Pasta", items: menuData.Pasta },
    { id: "salate", name: "Salate", items: menuData.Salate },
    { id: "supe", name: "Supe", items: menuData.Supe },
    { id: "garnituri", name: "Garnituri", items: menuData.Garnituri },
    { id: "deserturi", name: "Deserturi", items: menuData.Deserturi },
    { id: "bauturi", name: "Bauturi", items: menuData.Bauturi },
  ];
  const navCategories: NavCategory[] = sections.map(({ id, name }) => ({
    id,
    name,
  }));
  const [activeCategory, setActiveCategory] = useState<string>(
    navCategories[0].id
  );

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
        rootMargin: "-30% 0px -70% 0px", // This determines when the category becomes "active" in the viewport
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

  return (
    <div className="bg-[#1a1a1a] min-h-screen font-sans">
      {/* You can place your main header component above this CategoryNav */}
      <CategoryNav
        categories={navCategories}
        activeCategory={activeCategory}
        onCategoryClick={handleCategoryClick}
      />

      <main>
        {sections.map((section, index) => (
          <React.Fragment key={section.id}>
            <MenuSection
              id={section.id}
              title={section.name}
              items={section.items}
            />
            {index < sections.length - 1 && (
              <hr className="border-gray-700 max-w-4xl mx-auto" />
            )}
          </React.Fragment>
        ))}
      </main>
    </div>
  );
}
