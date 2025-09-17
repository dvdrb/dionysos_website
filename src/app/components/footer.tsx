import { MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";

export default async function Footer() {
  const t = await getTranslations("Footer");
  const locale = await getLocale();
  const year = new Date().getFullYear();
  return (
    <footer className="bg-black border-gray-300 border-t text-white py-8 md:py-20 px-4 md:px-8">
      <div className="max-w-4xl md:max-w-6xl justify-self-center mx-auto">
        {/* Header */}
        <div className="mb-8 md:mb-16">
          <h2 className="text-xl text-center md:text-5xl font-light">
            {t("heading")} <span className="font-normal ">DIONYSOS</span>
          </h2>
        </div>

        {/* Contact Information */}
        <div className="space-y-6 md:space-y-16">
          {/* First Contact Block */}
          <div className="space-y-3 md:space-y-8">
            <div className="flex items-start gap-3 md:gap-6">
              <MapPin className="w-4 h-4 md:w-8 md:h-8 mt-1 md:mt-2 flex-shrink-0 text-white" />
              <a
                href="https://www.google.com/maps/place/Pizza+al+forno,+Strada+Suveranitatii,+MD-6401,+Nisporeni,+Moldova/@47.0800436,28.1853951,16z/data=!4m6!3m5!1s0x40ca4bb579e2f7ff:0xa4559e97c94b950f!8m2!3d47.0800436!4d28.1853951!16s%2Fg%2F11g0j0b9mx?g_ep=Eg1tbF8yMDI1MDkxMF8wIJvbDyoASAJQAQ%3D%3D"
                className="text-sm md:text-3xl font-light text-white"
              >
                {t("address")}
              </a>
            </div>

            <div className="flex items-center gap-3 md:gap-6">
              <Phone className="w-4 h-4 md:w-8 md:h-8 flex-shrink-0 text-white" />
              <a
                href="tel:0601911111"
                className="text-sm md:text-3xl font-light text-white hover:text-gray-300"
              >
                0601 911 111
              </a>
            </div>
          </div>

          {/* Divider Line */}
          <div className="border-t border-gray-600 w-full"></div>

          {/* Second Contact Block */}
          <div className="space-y-3 md:space-y-8">
            <div className="flex items-start gap-3 md:gap-6">
              <MapPin className="w-4 h-4 md:w-8 md:h-8 mt-1 md:mt-2 flex-shrink-0 text-white" />
              <a
                href="https://www.google.com/maps/place/Pizza+al+forno,+Strada+Suveranitatii,+MD-6401,+Nisporeni,+Moldova/@47.0800436,28.1853951,16z/data=!4m6!3m5!1s0x40ca4bb579e2f7ff:0xa4559e97c94b950f!8m2!3d47.0800436!4d28.1853951!16s%2Fg%2F11g0j0b9mx?g_ep=Eg1tbF8yMDI1MDkxMF8wIJvbDyoASAJQAQ%3D%3D"
                className="text-sm md:text-3xl font-light text-white"
              >
                {t("address")}
              </a>
            </div>

            <div className="flex items-center gap-3 md:gap-6">
              <Phone className="w-4 h-4 md:w-8 md:h-8 flex-shrink-0 text-white" />
              <a
                href="tel:0601911111"
                className="text-sm md:text-3xl font-light text-white hover:text-gray-300"
              >
                0601 911 111
              </a>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="mt-8 md:mt-24 pt-6 md:pt-12 border-t border-gray-700">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3 md:gap-4">
            <div className="text-xs md:text-lg text-gray-400">
              © {year} Soft & Mark. {t("rights")}
            </div>

            <div className="flex gap-4 md:gap-12 text-xs md:text-lg text-gray-400">
              <Link href={`/${locale}/login`} className="hover:text-white">
                {t("admin")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
