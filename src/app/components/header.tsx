"use client";

import { Globe } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import * as Icons from "lucide-react";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";

type SideMenuItem = {
  name: string;
  href: string;
  Icon?: React.ComponentType<{ className?: string }>;
  imgSrc?: string; // optional custom icon from /public
};

type MobileSidePanelProps = {
  isOpen: boolean;
  onClose: () => void;
  locale: string;
  items: SideMenuItem[];
  menuTypes: SideMenuItem[];
};
const MobileSidePanel = ({
  isOpen,
  onClose,
  locale,
  items,
  menuTypes,
}: MobileSidePanelProps) => {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}

      {/* Side Panel */}
      <div
        className={`fixed top-0 left-0 h-full w-[70vw] bg-gray-100 z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex justify-end items-center p-4">
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200 text-gray-600"
            aria-label="Close menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Side Panel Content */}
        <div className="overflow-y-auto items-center flex flex-col h-full pb-20">
          {/* Menu Types only */}
          <nav className="py-2 w-full">
            {menuTypes.map((item, index) => (
              <div key={`menu-${index}`}>
                <Link
                  href={item.href}
                  className="flex items-center gap-4 px-6 py-3 text-gray-800 hover:bg-gray-200 transition-colors"
                  onClick={onClose}
                >
                  {item.imgSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imgSrc}
                      alt={item.name}
                      className="w-6 h-6"
                    />
                  ) : item.Icon ? (
                    <item.Icon className="w-6 h-6 text-gray-600" />
                  ) : null}
                  <span className="text-lg font-medium">{item.name}</span>
                </Link>
                {index < menuTypes.length - 1 && (
                  <div className="mx-6 border-b border-gray-200" />
                )}
              </div>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
};

const Header = () => {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations("HomePage");
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [cats, setCats] = useState<
    Array<{ id: number; name: string; icon: string | null; href: string }>
  >([]);
  const [loadingCats, setLoadingCats] = useState(false);
  const [catsError, setCatsError] = useState<string | null>(null);

  const switchTo = (target: string) => {
    const path = pathname || "/";
    const replaced = path.replace(/^\/(ro|ru)(?=\/|$)/, `/${target}`);
    // If no locale prefix was present, add it
    return replaced === path
      ? `/${target}${path === "/" ? "" : path}`
      : replaced;
  };

  const toggleSidePanel = () => {
    setIsSidePanelOpen(!isSidePanelOpen);
  };

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadingCats(true);
      setCatsError(null);
      try {
        const res = await fetch(`/api/categories?locale=${locale}`);
        if (!res.ok)
          throw new Error(`Failed to fetch categories (${res.status})`);
        const j = await res.json();
        if (!cancelled) setCats(j.items || []);
      } catch (e: any) {
        if (!cancelled)
          setCatsError(e?.message || "Nu s-au putut încărca categoriile");
      } finally {
        if (!cancelled) setLoadingCats(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [locale]);

  function pickIconComponent(iconName: string | null | undefined) {
    const fallback = Icons.ChefHat;
    if (!iconName || iconName === "Icon") return fallback;
    // Try exact match first (e.g., "Pizza")
    // Then try capitalizing (e.g., "pizza" -> "Pizza")
    const exact = (Icons as any)[iconName];
    if (exact) return exact;
    const cap = iconName.charAt(0).toUpperCase() + iconName.slice(1);
    const guessed = (Icons as any)[cap];
    return guessed || fallback;
  }

  const sideMenuItems: SideMenuItem[] = useMemo(() => {
    if (loadingCats || catsError) return [];
    return cats.map((c) => ({
      name: c.name,
      href: c.href,
      Icon: pickIconComponent(c.icon),
    }));
  }, [cats, loadingCats, catsError, locale]);

  const menuTypes: SideMenuItem[] = useMemo(() => {
    return [
      {
        name: t("modal.taverna"),
        href: `/${locale}/menu/taverna`,
        imgSrc: "/icon_taverna.svg",
      },
      {
        name: t("modal.bar"),
        href: `/${locale}/menu/bar`,
        imgSrc: "/icon_bar.svg",
      },
      {
        name: t("modal.sushi"),
        href: `/${locale}/menu/sushi`,
        imgSrc: "/icon_sushi.svg",
      },
    ];
  }, [locale, t]);

  return (
    <>
      <header className="sticky top-0 z-40 bg-black text-white">
        {/* Hidden checkbox for menu toggle */}
        <input type="checkbox" id="menu-toggle" className="hidden peer" />

        {/* Main Header */}
        <div className="relative flex items-center justify-between px-4 py-6 md:px-8">
          {/* Mobile Menu Button */}
          <button
            onClick={toggleSidePanel}
            className="flex flex-col gap-1 p-2 cursor-pointer md:hidden"
            aria-label="Toggle menu"
          >
            <span className="block w-5 h-0.5 bg-gray-300"></span>
            <span className="block w-5 h-0.5 bg-gray-300"></span>
            <span className="block w-5 h-0.5 bg-gray-300"></span>
          </button>

          {/* Desktop Menu Button */}
          <label
            onClick={toggleSidePanel}
            className="hidden md:flex flex-col gap-1 p-2 cursor-pointer"
            aria-label="Toggle menu"
          >
            <span className="block w-8 h-0.5 bg-white"></span>
            <span className="block w-8 h-0.5 bg-white"></span>
            <span className="block w-8 h-0.5 bg-white"></span>
          </label>

          {/* Desktop Menu Types */}
          <nav className="hidden md:flex items-center gap-5 ml-3">
            {menuTypes.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex items-center gap-2 text-sm text-gray-200 hover:text-white"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {item.imgSrc ? (
                  <img src={item.imgSrc} alt={item.name} className="w-5 h-5" />
                ) : item.Icon ? (
                  <item.Icon className="w-5 h-5" />
                ) : null}
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* Logo */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <Link
              href={`/${locale}`}
              className="text-xl md:text-2xl font-light tracking-widest text-center"
            >
              <Image
                src="/dionysos_logo.png"
                alt="Dionysos restaurant logo"
                width={130}
                height={32}
                priority
              />
            </Link>
          </div>

          {/* Language Selector */}
          <div className="flex items-center  py-2 pl-2">
            <Globe className="w-5 h-5 md:w-6 md:h-6 text-gray-300" />
            <div className="flex items-center text-gray-300 text-sm md:text-base font-light">
              <Link
                href={switchTo("ro")}
                className={`px-2 py-1 rounded  ${
                  locale === "ro"
                    ? "hidden bg-white text-black"
                    : "hover:underline"
                }`}
              >
                RO
              </Link>

              <Link
                href={switchTo("ru")}
                className={`px-2 py-1 rounded ${
                  locale === "ru"
                    ? "hidden bg-white text-black"
                    : "hover:underline"
                }`}
              >
                RU
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Side Panel */}
      <MobileSidePanel
        isOpen={isSidePanelOpen}
        onClose={() => setIsSidePanelOpen(false)}
        locale={locale}
        items={sideMenuItems}
        menuTypes={menuTypes}
      />
    </>
  );
};

export default Header;
