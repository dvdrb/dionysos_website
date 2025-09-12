"use client";

import { Globe } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  X,
  Coffee,
  Soup,
  Salad,
  Cookie,
  Mountain,
  Pizza,
  Beef,
  Sandwich,
  ChefHat,
  IceCream,
  Cake,
  Star,
  Wine,
} from "lucide-react";

type MobileSidePanelProps = {
  isOpen: boolean;
  onClose: () => void;
  locale: string;
};
const MobileSidePanel = ({ isOpen, onClose, locale }: MobileSidePanelProps) => {
  const menuItems = [
    { name: "Sushi", icon: Coffee, href: `/${locale}/menu#sushi` },
    { name: "Dejun", icon: Coffee, href: `/${locale}/menu#dejun` },
    { name: "Felul întâi", icon: Soup, href: `/${locale}/menu#felul-intai` },
    { name: "Salate", icon: Salad, href: `/${locale}/menu#salate` },
    { name: "Paste", icon: Cookie, href: `/${locale}/menu#paste` },
    { name: "Colțunași", icon: Mountain, href: `/${locale}/menu#coltunasi` },
    { name: "Pizza", icon: Pizza, href: `/${locale}/menu#pizza` },
    { name: "Kebab", icon: Beef, href: `/${locale}/menu#kebab` },
    { name: "Burger", icon: Sandwich, href: `/${locale}/menu#burger` },
    { name: "Platouri", icon: ChefHat, href: `/${locale}/menu#platouri` },
    { name: "Gustări", icon: IceCream, href: `/${locale}/menu#gustari` },
    { name: "Deserturi", icon: Cake, href: `/${locale}/menu#deserturi` },
    { name: "Oferte", icon: Star, href: `/${locale}/menu#oferte` },
    { name: "Bar", icon: Wine, href: `/${locale}/menu#bar` },
  ];

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

        {/* Menu Items */}
        <div className="overflow-y-auto  items-center flex flex-col h-full pb-20">
          <nav className="py-4 w-fit  ">
            {menuItems.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <div key={index}>
                  <Link
                    href={item.href}
                    className="flex items-center  gap-4 px-6 py-3 text-gray-800 hover:bg-gray-200 transition-colors"
                    onClick={onClose}
                  >
                    <IconComponent className="w-6 h-6 text-gray-600" />
                    <span className="text-lg font-medium">{item.name}</span>
                  </Link>
                  {index < menuItems.length - 1 && (
                    <div className="mx-6 border-b border-gray-200" />
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
};

const Header = () => {
  const locale = useLocale();
  const pathname = usePathname();
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);

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
            htmlFor="menu-toggle"
            className="hidden md:flex flex-col gap-1 p-2 cursor-pointer"
            aria-label="Toggle menu"
          >
            <span className="block w-8 h-0.5 bg-white"></span>
            <span className="block w-8 h-0.5 bg-white"></span>
            <span className="block w-8 h-0.5 bg-white"></span>
          </label>

          {/* Logo */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <a
              href="/"
              className="text-xl md:text-2xl font-light tracking-widest text-center"
            >
              <Image
                src="/dionysos_logo.png"
                alt="Dionysos restaurant logo"
                width={130}
                height={32}
                priority
              />
            </a>
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

        {/* Desktop Menu Overlay - Hidden by default, shown when checkbox is checked */}
        <div className="fixed inset-0 bg-black bg-opacity-95 z-50 hidden peer-checked:flex flex-col">
          {/* Close Button */}
          <div className="flex justify-end p-4 md:p-8">
            <label
              htmlFor="menu-toggle"
              className="p-2 cursor-pointer"
              aria-label="Close menu"
            >
              <svg
                className="w-6 h-6 md:w-8 md:h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </label>
          </div>

          {/* Menu Content */}
          <nav className="flex-1 flex flex-col items-center justify-center">
            <ul className="space-y-8 text-center">
              <li>
                <Link
                  href={`/${locale}/about`}
                  className="text-2xl md:text-4xl font-light hover:text-red-600 block py-2"
                >
                  About
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/services`}
                  className="text-2xl md:text-4xl font-light hover:text-red-600 block py-2"
                >
                  Services
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/portfolio`}
                  className="text-2xl md:text-4xl font-light hover:text-red-600 block py-2"
                >
                  Portfolio
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/contact`}
                  className="text-2xl md:text-4xl font-light hover:text-red-600 block py-2"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </nav>

          {/* Footer in Menu */}
          <div className="p-8 text-center">
            <p className="text-sm text-gray-400">
              © 2024 Dionysos Capital. All rights reserved.
            </p>
          </div>
        </div>
      </header>

      {/* Mobile Side Panel */}
      <MobileSidePanel
        isOpen={isSidePanelOpen}
        onClose={() => setIsSidePanelOpen(false)}
        locale={locale}
      />
    </>
  );
};

export default Header;
