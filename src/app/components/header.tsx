"use client";

import { Globe } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useLocale } from "next-intl";
import { usePathname } from "next/navigation";

const Header = () => {
  const locale = useLocale();
  const pathname = usePathname();
  const switchTo = (target: "ro" | "ru") => {
    const path = pathname || "/";
    const replaced = path.replace(/^\/(ro|ru)(?=\/|$)/, `/${target}`);
    // If no locale prefix was present, add it
    return replaced === path
      ? `/${target}${path === "/" ? "" : path}`
      : replaced;
  };
  return (
    <header className="sticky top-0 z-40 bg-black text-white">
      {/* Hidden checkbox for menu toggle */}
      <input type="checkbox" id="menu-toggle" className="hidden peer" />

      {/* Main Header */}
      <div className="relative flex items-center justify-between px-4 py-6 md:px-8">
        {/* Mobile Menu Button */}
        <label
          htmlFor="menu-toggle"
          className="flex flex-col gap-1 p-2 cursor-pointer md:hidden"
          aria-label="Toggle menu"
        >
          <span className="block w-6 h-0.5 bg-white transition-transform duration-300 peer-checked:rotate-45 peer-checked:translate-y-1.5"></span>
          <span className="block w-6 h-0.5 bg-white transition-opacity duration-300 peer-checked:opacity-0"></span>
          <span className="block w-6 h-0.5 bg-white transition-transform duration-300 peer-checked:-rotate-45 peer-checked:-translate-y-1.5"></span>
        </label>

        {/* Desktop Menu Button */}
        <label
          htmlFor="menu-toggle"
          className="hidden md:flex flex-col gap-1 p-2 cursor-pointer"
          aria-label="Toggle menu"
        >
          <span className="block w-8 h-0.5 bg-white transition-all duration-300"></span>
          <span className="block w-8 h-0.5 bg-white transition-all duration-300"></span>
          <span className="block w-8 h-0.5 bg-white transition-all duration-300"></span>
        </label>

        {/* Logo */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <h1 className="text-xl md:text-2xl font-light tracking-widest text-center">
            <Image
              src="/dionysos_logo.png"
              alt="Dionysos restaurant logo"
              width={160}
              height={32}
              priority
            />
          </h1>
        </div>

        {/* Language Selector */}
        <div className="flex items-center gap-3 p-2">
          <Globe className="w-5 h-5 md:w-6 md:h-6" />
          <div className="flex items-center  text-sm md:text-base">
            <Link
              href={switchTo("ro")}
              className={`px-2 py-1 rounded ${
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
                  ? "hidden  bg-white text-black"
                  : "hover:underline"
              }`}
            >
              RU
            </Link>
          </div>
        </div>
      </div>

      {/* Menu Overlay - Hidden by default, shown when checkbox is checked */}
      <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex-col opacity-0 invisible peer-checked:opacity-100 peer-checked:visible transition-all duration-300">
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
                className="text-2xl md:text-4xl font-light hover:text-red-600 transition-colors block py-2"
              >
                About
              </Link>
            </li>
            <li>
              <Link
                href={`/${locale}/services`}
                className="text-2xl md:text-4xl font-light hover:text-red-600 transition-colors block py-2"
              >
                Services
              </Link>
            </li>
            <li>
              <Link
                href={`/${locale}/portfolio`}
                className="text-2xl md:text-4xl font-light hover:text-red-600 transition-colors block py-2"
              >
                Portfolio
              </Link>
            </li>
            <li>
              <Link
                href={`/${locale}/contact`}
                className="text-2xl md:text-4xl font-light hover:text-red-600 transition-colors block py-2"
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
  );
};

export default Header;
