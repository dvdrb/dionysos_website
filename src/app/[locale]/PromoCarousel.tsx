"use client";

import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

type PromoItem = { id: number; title: string; price: string; image_url: string };

function PromoCard({ title, price, img }: { title: string; price: string; img: string }) {
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
            <h3 className="text-sm text-center font-normal leading-tight">{title}</h3>
            <p className="text-xs text-center text-black/90">{price}</p>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function PromoCarousel({ items }: { items: PromoItem[] }) {
  return (
    <Swiper modules={[Navigation]} navigation className="menu-swiper" loop centeredSlides slidesPerView="auto" spaceBetween={18}>
      {items.map((item) => (
        <SwiperSlide key={item.id} className="!h-auto !w-auto">
          <PromoCard title={item.title} price={item.price} img={item.image_url} />
        </SwiperSlide>
      ))}
    </Swiper>
  );
}

