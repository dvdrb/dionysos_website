"use client";

import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

type GalleryImage = { id: number; image_url: string; alt_text: string | null };

export default function GalleryCarousel({ images }: { images: GalleryImage[] }) {
  return (
    <Swiper
      modules={[Navigation, Autoplay]}
      loop
      autoplay={{ delay: 3500, disableOnInteraction: false }}
      navigation
      className="bg-transparent p-0 border-0 rounded-none"
    >
      {images.map((img) => (
        <SwiperSlide key={img.id} className="!h-auto">
          <div className="relative aspect-[16/9] w-full max-w-[340px] sm:max-w-[380px] md:max-w-[420px] mx-auto overflow-hidden rounded-lg">
            <Image
              src={img.image_url}
              alt={img.alt_text ?? `Galerie ${img.id}`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 380px, 420px"
              className="object-cover"
              loading="lazy"
            />
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}

