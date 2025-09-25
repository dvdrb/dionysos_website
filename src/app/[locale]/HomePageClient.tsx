"use client";

import Image from "next/image";
import Script from "next/script";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import { useEffect, useRef, useState } from "react";
import type { Swiper as SwiperType } from "swiper/types";

// Importă stilurile Swiper

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";

const heroBg = "/background.webp";
const sushiIcon = "/icon_sushi.svg";
const tavernaIcon = "/icon_taverna.svg";
const barIcon = "/icon_bar.svg";

// --- TIPURI PENTRU DATELE DINAMICE ---
type GalleryImage = {
  id: number;
  image_url: string;
  alt_text: string | null;
};

type PromoItem = {
  id: number;
  title: string;
  price: string;
  image_url: string;
};

// --- PROPS PENTRU COMPONENTA ---
type HomePageClientProps = {
  galleryImgs: GalleryImage[];
  promoItems: PromoItem[];
};

export default function HomePageClient({
  galleryImgs,
  promoItems,
}: HomePageClientProps) {
  // State pentru modal
  // Which location's menu modal is open: 'sushi' (Dionysos Restaurant) or 'taverna' (Dionysos Taverna)
  const [activeMenuModal, setActiveMenuModal] = useState<null | "sushi" | "taverna">(null);

  // Referințe pentru Swiper-e
  const galleryPrevRef = useRef<HTMLButtonElement | null>(null);
  const galleryNextRef = useRef<HTMLButtonElement | null>(null);
  const gallerySwiperRef = useRef<SwiperType | null>(null);
  const menuPrevRef = useRef<HTMLButtonElement | null>(null);
  const menuNextRef = useRef<HTMLButtonElement | null>(null);
  const menuSwiperRef = useRef<SwiperType | null>(null);
  const locale = useLocale();
  const t = useTranslations("HomePage");
  const router = useRouter();

  // Optimize Supabase public storage URLs via the render endpoint
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  let supabaseHost: string | null = null;
  try {
    if (supabaseUrl) supabaseHost = new URL(supabaseUrl).hostname;
  } catch {}
  const optimizeUrl = (url: string) => {
    try {
      const u = new URL(url);
      if (!supabaseHost || u.hostname !== supabaseHost) return url;
      const objPrefix = "/storage/v1/object/public/";
      if (!u.pathname.startsWith(objPrefix)) return url;
      const pathRest = u.pathname.slice(objPrefix.length); // `${bucket}/...`
      return `/images/${pathRest}`;
    } catch {
      return url;
    }
  };

  // Hook-uri pentru a conecta navigația externă (rămân la fel)
  useEffect(() => {
    const swiper = gallerySwiperRef.current;
    if (swiper && swiper.params && swiper.navigation) {
      // @ts-ignore
      swiper.params.navigation.prevEl = galleryPrevRef.current;
      // @ts-ignore
      swiper.params.navigation.nextEl = galleryNextRef.current;
      swiper.navigation.init();
      swiper.navigation.update();
    }
  }, []);

  useEffect(() => {
    const swiper = menuSwiperRef.current;
    if (swiper && swiper.params && swiper.navigation) {
      // @ts-ignore
      swiper.params.navigation.prevEl = menuPrevRef.current;
      // @ts-ignore
      swiper.params.navigation.nextEl = menuNextRef.current;
      swiper.navigation.init();
      swiper.navigation.update();
    }
  }, []);

  // Funcție pentru deschiderea modalului
  const openModal = (which: "sushi" | "taverna") => {
    setActiveMenuModal(which);
  };

  // Funcție pentru închiderea modalului
  const closeModal = () => {
    setActiveMenuModal(null);
  };

  // Închide modalul când se apasă ESC
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeModal();
      }
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  // Prefetch target menu pages when modal opens to reduce latency
  useEffect(() => {
    if (!activeMenuModal) return;
    const targets =
      activeMenuModal === "sushi"
        ? [`/${locale}/menu/sushi-restaurant-sushi`, `/${locale}/menu/sushi-restaurant`]
        : [`/${locale}/menu/taverna`, `/${locale}/menu/bar`, `/${locale}/menu/sushi`];
    for (const href of targets) {
      try {
        // @ts-ignore: prefetch exists in app router
        router.prefetch?.(href);
      } catch {}
    }
  }, [activeMenuModal, locale]);

  return (
    <div className="bg-black text-white pt-13">
      {/* JSON-LD: Organization/Restaurant for rich results */}
      <Script id="ld-restaurant" type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Restaurant",
          name: "Dionysos",
          url:
            typeof window !== "undefined" ? window.location.origin : undefined,
          image: "/dionysos_logo.png",
          telephone: "0247928435",
          servesCuisine: ["Greek", "Mediterranean", "European"],
          acceptsReservations: true,
        })}
      </Script>

      {/* HERO (Rămâne la fel) */}
      <section className="relative h-[86svh] min-h-[640px] w-full overflow-hidden">
        <Image
          src={heroBg}
          alt="Dionysos ambience"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col items-center pt-26 px-4">
          <p className="mb-3 text-sm tracking-wide font-medium text-gray-200">
            {t("welcomeTo")}
          </p>
          <Image
            src="/dionysos_logo.png"
            alt="Dionysos Logo"
            width={250}
            height={50}
            className="object-cover"
          />
          {activeMenuModal && (
            <div>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40 bg-black/50"
                onClick={closeModal}
                aria-hidden
              />

              {/* Modal Content */}
              <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                <div className="relative w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
                  <div className="flex items-center justify-end">
                    <button
                      onClick={closeModal}
                      aria-label="Close"
                      className="inline-flex items-center justify-center rounded-full p-2 text-gray-600 hover:bg-gray-100"
                    >
                      <CloseIcon />
                    </button>
                  </div>
                  {/* Menu Categories */}
                  <div className="mt-3 space-y-4">
                  {activeMenuModal === "taverna" ? (
                    <>
                      <MenuCategoryButton
                        icon={barIcon}
                        label={t("modal.bar")}
                        href={`/${locale}/menu/bar`}
                      />
                      <MenuCategoryButton
                        icon={tavernaIcon}
                        label={t("modal.taverna")}
                        href={`/${locale}/menu/taverna`}
                      />
                      <MenuCategoryButton
                        icon={sushiIcon}
                        label={t("modal.sushi")}
                        href={`/${locale}/menu/sushi`}
                      />
                    </>
                  ) : (
                    <>
                      <MenuCategoryButton
                        icon={sushiIcon}
                        label={t("modal.sushi")}
                        href={`/${locale}/menu/sushi-restaurant-sushi`}
                      />
                      <MenuCategoryButton
                        icon={tavernaIcon}
                        label={t("modal.sushi_restaurant")}
                        href={`/${locale}/menu/sushi-restaurant`}
                      />
                    </>
                  )}
                  </div>
                </div>
              </div>
            </div>
          )}
          {!activeMenuModal && (
            <div className="relative mt-20 grid w-full items-center max-w-3xl h-full grid-cols-2 gap-6">
              <LocationCard
                label={t("location.nisporeni")}
                phone="068118111"
                onMenuClick={() => openModal("taverna")}
              />
              <div className="pointer-events-none absolute left-1/2 top-1/2 h-full -translate-x-1/2 -translate-y-1/2 border-l border-white/50" />
              <LocationCard
                label={t("location.varzaresti")}
                phone="069993755"
                onMenuClick={() => openModal("sushi")}
              />
            </div>
          )}
        </div>
      </section>

      {/* Galerie Dionysos (Folosește galleryImgs) */}
      <section id="galerie" className="mx-auto w-full max-w-6xl px-4 py-12">
        <h2 className="mb-6 text-center text-sm text-gray-300">
          {t("gallery.label")}{" "}
          <span className="font-extralight text-2xl text-white">Dionysos</span>
        </h2>
        <div className="relative">
          <button
            ref={galleryPrevRef}
            aria-label={t("nav.prev")}
            className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/20 p-2 backdrop-blur-sm transition hover:bg-white/10"
          >
            <ArrowLeftIcon />
          </button>
          <button
            ref={galleryNextRef}
            aria-label={t("nav.next")}
            className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/20 p-2 backdrop-blur-sm transition hover:bg-white/10"
          >
            <ArrowRightIcon />
          </button>
          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            loop
            autoplay={{ delay: 3500, disableOnInteraction: false }}
            onSwiper={(swiper) => {
              gallerySwiperRef.current = swiper;
            }}
            className="bg-transparent p-0 border-0 rounded-none"
          >
            {galleryImgs.map((img) => (
              <SwiperSlide key={img.id} className="!h-auto">
                <div className="relative aspect-[16/9] w-full max-w-[340px] sm:max-w-[380px] md:max-w-[420px] mx-auto overflow-hidden rounded-lg">
                  {(() => {
                    const src = optimizeUrl(img.image_url);
                    return (
                    <Image
                      src={src}
                      alt={img.alt_text ?? `Galerie ${img.id}`}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 380px, 420px"
                      className="object-cover"
                    />
                    );
                  })()}
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>

      {/* Despre Dionysos (Rămâne la fel) */}
      <section
        id="despre"
        className="mx-auto w-full flex flex-col items-center justify-center max-w-3xl px-10 py-8"
      >
        <h3 className="mb-4 text-base text-white">
          {t("about.label")}{" "}
          <span className="text-3xl font-extralight text-white">Dionysos</span>
        </h3>
        <p className="text-center text-[15px] leading-7 text-gray-400">
          {t("about.body")}
        </p>
      </section>

      {/* Gusta Acum (Folosește promoItems) */}
      <section id="gusta" className="mx-auto w-full max-w-6xl px-4 pb-24 pt-4">
        <div className="mb-6 flex items-center text-center justify-center gap-1">
          <span className="text-sm font-medium text-gray-300">
            {t("taste")}
          </span>
          <h3 className="text-lg font-extralight text-white">{t("now")}</h3>
        </div>
        <div className="relative">
          <button
            ref={menuPrevRef}
            aria-label={t("nav.prev")}
            className="absolute left-0 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/20 p-2 backdrop-blur-sm transition hover:bg-white/10"
          >
            <ArrowLeftIcon />
          </button>
          <button
            ref={menuNextRef}
            aria-label={t("nav.next")}
            className="absolute right-0 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/20 p-2 backdrop-blur-sm transition hover:bg-white/10"
          >
            <ArrowRightIcon />
          </button>
          <Swiper
            modules={[Navigation, Pagination]}
            className="menu-swiper"
            loop
            centeredSlides
            slidesPerView="auto"
            spaceBetween={18}
            onSwiper={(swiper) => {
              menuSwiperRef.current = swiper;
            }}
          >
            {promoItems.map((item) => (
              <SwiperSlide key={item.id} className="!h-auto !w-auto">
                <MenuCard
                  title={item.title}
                  price={item.price}
                  img={optimizeUrl(item.image_url)}
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>

      {/* Modal pentru categorii meniu */}
    </div>
  );
}

// --- COMPONENTE AUXILIARE ȘI ICONIȚE ---

function LocationCard({
  label,
  phone,
  onMenuClick,
}: {
  label: string;
  phone: string;
  onMenuClick: () => void;
}) {
  const t = useTranslations("HomePage");
  return (
    <div className="flex flex-col pb-24 items-center gap-3 rounded-2xl">
      <span className="text-sm text-gray-200">{label}</span>
      <a
        href={`tel:${phone}`}
        className="rounded-xl bg-white px-6 py-3 text-sm font-medium text-gray-900 shadow-sm transition hover:translate-y-[-1px]"
      >
        {phone}
      </a>
      <button
        onClick={onMenuClick}
        className="inline-flex items-center gap-2 rounded-xl bg-[#743A3A] px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-[#8D4646]"
      >
        <span>{t("menuButton")}</span>
        <BurgerIcon />
      </button>
    </div>
  );
}

function MenuCategoryButton({
  icon,
  label,
  href,
}: {
  icon: React.ReactNode | string;
  label: string;
  href: string;
}) {
  return (
    <Link
      prefetch
      href={href}
      className="w-full flex items-center gap-4 bg-white/90 hover:bg-white text-gray-900 rounded-xl px-6 py-4 transition-all duration-200 hover:scale-[1.02] ring-1 ring-gray-300 hover:ring-gray-400 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
    >
      <div className="flex-shrink-0">
        {typeof icon === "string" ? (
          <Image
            src={icon}
            alt={label}
            width={24}
            height={24}
            className="w-6 h-6 object-contain"
          />
        ) : (
          icon
        )}
      </div>
      <span className="font-medium text-left">{label}</span>
    </Link>
  );
}

function MenuCard({
  title,
  price,
  img,
}: {
  title: string;
  price: string;
  img: string;
}) {
  return (
    <article className="group relative overflow-hidden rounded-3xl ring-1 ring-white/10 w-[50vw] sm:w-[70vw] md:w-[52vw] lg:w-[420px] xl:w-[460px]">
      <div className="relative aspect-[4/5] w-full">
        <Image
          src={img}
          alt={title}
          fill
          sizes="(max-width: 640px) 86vw, (max-width: 768px) 70vw, (max-width: 1024px) 52vw, 460px"
          loading="lazy"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-0 w-fit bg-white rounded-tr-3xl left-0 right-0 p-3">
          <div className="flex flex-col items-center gap-1 text-black drop-shadow">
            <h3 className="text-sm text-center font-normal leading-tight">
              {title}
            </h3>
            <p className="text-xs text-center text-black/90">{price}</p>
          </div>
        </div>
      </div>
    </article>
  );
}

// Iconițe pentru categorii și butoane

function CloseIcon() {
  return (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

function BurgerIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="currentColor"
    >
      <path d="M3 7a1 1 0 011-1h16a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h16a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h10a1 1 0 110 2H4a1 1 0 01-1-1z" />
    </svg>
  );
}
