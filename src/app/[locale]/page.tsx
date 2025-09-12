"use client";

import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import { useEffect, useRef } from "react";
import type { Swiper as SwiperType } from "swiper/types";

const heroBg = "/background.webp"; // dark ambience, wine glass
const galleryImgs = [
  "/background.webp",
  "/background.webp",
  "/background.webp",
  "/background.webp",
];

const menuItems = [
  {
    id: 1,
    title: "Platou Junior",
    price: "39lei",
    img: "/background.webp",
  },
  {
    id: 2,
    title: "Platou Family",
    price: "79lei",
    img: "/background.webp",
  },
  {
    id: 3,
    title: "Flatbread",
    price: "25lei",
    img: "/background.webp",
  },
  {
    id: 4,
    title: "Souflaki",
    price: "29lei",
    img: "/background.webp",
  },
  { id: 5, title: "Gyros", price: "34lei", img: "/background.webp" },
];

export default function DionysosPage() {
  // --- Swiper #1 navigation refs ---
  const galleryPrevRef = useRef<HTMLButtonElement | null>(null);
  const galleryNextRef = useRef<HTMLButtonElement | null>(null);
  const gallerySwiperRef = useRef<SwiperType | null>(null);

  // --- Swiper #2 (menu) navigation refs ---
  const menuPrevRef = useRef<HTMLButtonElement | null>(null);
  const menuNextRef = useRef<HTMLButtonElement | null>(null);
  const menuSwiperRef = useRef<SwiperType | null>(null);

  // After mount, connect external buttons to the Swiper instance safely
  useEffect(() => {
    const swiper = gallerySwiperRef.current;
    if (!swiper || !galleryPrevRef.current || !galleryNextRef.current) return;

    // Assign navigation elements
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const navParams = (swiper.params.navigation ?? {}) as any;
    navParams.prevEl = galleryPrevRef.current;
    navParams.nextEl = galleryNextRef.current;
    swiper.params.navigation = navParams;

    // (Re)initialize & update
    if (swiper.navigation) {
      try {
        swiper.navigation.destroy();
      } catch {}
      swiper.navigation.init();
      swiper.navigation.update();
    }
  }, []);

  // Wire external navigation for the menu swiper as well
  useEffect(() => {
    const swiper = menuSwiperRef.current;
    if (!swiper || !menuPrevRef.current || !menuNextRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const navParams = (swiper.params.navigation ?? {}) as any;
    navParams.prevEl = menuPrevRef.current;
    navParams.nextEl = menuNextRef.current;
    swiper.params.navigation = navParams;
    if (swiper.navigation) {
      try {
        swiper.navigation.destroy();
      } catch {}
      swiper.navigation.init();
      swiper.navigation.update();
    }
  }, []);

  return (
    <div className="bg-black text-white pt-13">
      {/* HERO */}
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
          <p className="mb-3 text-sm tracking-wide text-gray-200">Welcome to</p>
          <Image
            src="/dionysos_logo.png"
            alt="Dionysos Logo"
            width={250}
            height={50}
            className="object-cover"
          />

          {/* Locations Row */}
          <div className="relative mt-20 grid w-full items-center max-w-3xl h-full grid-cols-2 gap-6">
            {/* Left column */}
            <LocationCard
              label="Centru"
              phone="0247928435"
              hrefMenu="#menu-centru"
            />
            {/* Divider (thin vertical line between columns for md+) */}
            <div className="pointer-events-none absolute left-1/2 top-1/2  h-full -translate-x-1/2 -translate-y-1/2 border-l border-white/50 " />
            {/* Right column */}
            <LocationCard
              label="Centru"
              phone="0247928435"
              hrefMenu="#menu-centru"
            />
          </div>
        </div>
      </section>

      {/* Galerie Dionysos */}
      <section id="galerie" className="mx-auto w-full max-w-6xl px-4 py-12">
        <h2 className="mb-6 text-center text-sm text-gray-300">
          Galerie{" "}
          <span className="font-extralight text-2xl text-white">Dionysos</span>
        </h2>

        <div className="relative">
          {/* Custom nav buttons to match thin arrows in screenshot */}
          <button
            ref={galleryPrevRef}
            aria-label="Prev"
            className="absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/20 p-2 backdrop-blur-sm transition hover:bg-white/10"
          >
            <ArrowLeftIcon />
          </button>
          <button
            ref={galleryNextRef}
            aria-label="Next"
            className="absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/20 p-2 backdrop-blur-sm transition hover:bg-white/10"
          >
            <ArrowRightIcon />
          </button>

          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            loop
            loopAdditionalSlides={galleryImgs.length}
            rewind={false}
            autoplay={{ delay: 3500, disableOnInteraction: false }}
            slidesPerView={1}
            spaceBetween={16}
            onSwiper={(swiper) => {
              gallerySwiperRef.current = swiper;
            }}
            // Do NOT pass navigation with refs at render time; we wire it in useEffect
            className="rounded-xl border border-white/10 bg-white/5 p-2"
          >
            {galleryImgs.map((src, i) => (
              <SwiperSlide key={i} className="!h-auto">
                <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg">
                  <Image
                    src={src}
                    alt={`Galerie ${i + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>

      {/* Despre Dionysos */}
      <section
        id="despre"
        className="mx-auto w-full flex flex-col items-center justify-center max-w-3xl px-10 py-8"
      >
        <h3 className="mb-4 text-base text-white">
          Despre{" "}
          <span className="  text-3xl font-extralight text-white">
            Dionysos
          </span>
        </h3>
        <p className="text-center text-[15px] leading-7 text-gray-400">
          Bine ați venit la restaurantul Dionysos, unde fiecare oaspete devine
          parte din familia noastră. Restaurantul este prezent în două locații
          confortabile, unde vă puteți bucura de atmosfera rafinată și
          splendoarea preparatelor culinare.
        </p>
      </section>

      {/* Gusta Acum */}
      <section id="gusta" className="mx-auto w-full max-w-6xl px-4 pb-24 pt-4">
        <div className="mb-6 flex items-center text-center justify-center gap-1">
          <span className="text-sm font-medium text-gray-300">Gusta</span>
          <h3 className="text-lg  font-extralight text-white">Acum</h3>
        </div>

        <div className="relative">
          {/* External nav buttons */}
          <button
            ref={menuPrevRef}
            aria-label="Prev"
            className="absolute left-0 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/20 p-2 backdrop-blur-sm transition hover:bg-white/10"
          >
            <ArrowLeftIcon />
          </button>
          <button
            ref={menuNextRef}
            aria-label="Next"
            className="absolute right-0 top-1/2 z-20 -translate-y-1/2 rounded-full border border-white/20 p-2 backdrop-blur-sm transition hover:bg-white/10"
          >
            <ArrowRightIcon />
          </button>

          <Swiper
            modules={[Navigation, Pagination]}
            className="menu-swiper"
            loop
            loopAdditionalSlides={menuItems.length * 2}
            rewind={false}
            centeredSlides
            centeredSlidesBounds
            slidesPerView="auto"
            speed={450}
            spaceBetween={18}
            onSwiper={(swiper) => {
              menuSwiperRef.current = swiper;
            }}
          >
            {menuItems.map((item) => (
              <SwiperSlide key={item.id} className="!h-auto !w-auto">
                <MenuCard
                  title={item.title}
                  price={item.price}
                  img={item.img}
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>
    </div>
  );
}

function LocationCard({
  label,
  phone,
  hrefMenu,
}: {
  label: string;
  phone: string;
  hrefMenu: string;
}) {
  return (
    <div className="flex flex-col pb-24 items-center gap-3 rounded-2xl">
      <span className="text-sm text-gray-200">{label}</span>
      <a
        href="tel:0601911111"
        className="rounded-xl bg-white px-6 py-3 text-sm font-medium text-gray-900 shadow-sm transition hover:translate-y-[-1px]"
      >
        {phone}
      </a>
      <a
        href={hrefMenu}
        className="inline-flex items-center gap-2 rounded-xl bg-[#743A3A] px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-[#8D4646]"
      >
        <span>Menu</span>
        <BurgerIcon />
      </a>
    </div>
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
          loading="eager"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />

        {/* bottom gradient for legibility */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

        {/* title + price bottom-left over image */}
        <div className="absolute bottom-0 w-fit  bg-white rounded-tr-3xl left-0 right-0 p-3">
          <div className="flex flex-col items-center gap-1 text-black drop-shadow">
            <h3 className="text-sm text-center font-normal leading-tight">
              {title}
            </h3>
            <p className="text-xs text-center text-black/90">{price}</p>
          </div>
        </div>

        {/* optional subtle badges at top */}
        <div className="pointer-events-none absolute inset-x-3 top-3 mx-auto hidden justify-between md:flex">
          <span className="h-7 w-7  rounded-full bg-white/15 backdrop-blur" />
          <span className="h-7 w-7 rounded-full bg-white/15 backdrop-blur" />
        </div>
      </div>
    </article>
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
