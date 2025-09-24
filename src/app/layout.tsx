import "./styles/globals.css";
import { Inter } from "next/font/google";
import type { Metadata } from "next";
import { cookies } from "next/headers";

const inter = Inter({
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-inter",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://example.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Dionysos Restaurant",
    template: "%s | Dionysos Restaurant",
  },
  description:
    "Dionysos – restaurant eurpoean, preparate proaspete și atmosferă primitoare. Vezi meniul și galeria noastră.",
  applicationName: "Dionysos",
  robots: {
    index: true,
    follow: true,
  },
  themeColor: "#000000",
  openGraph: {
    type: "website",
    title: "Dionysos Restaurant",
    siteName: "Dionysos",
    description:
      "Preparate proaspete, atmosferă primitoare. Descoperă meniul și galeria.",
    images: [
      {
        url: "/dionysos_logo.png",
        width: 1200,
        height: 630,
        alt: "Dionysos",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dionysos Restaurant",
    description:
      "Preparate proaspete, atmosferă primitoare. Descoperă meniul și galeria.",
    images: ["/dionysos_logo.png"],
  },
  icons: {
    icon: "/dionysos_logo.png",
    shortcut: "/dionysos_logo.png",
    apple: "/dionysos_logo.png",
  },
  alternates: {
    canonical: "/",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const detectedLang = cookieStore.get("NEXT_LOCALE")?.value || "ro";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  let supabaseHost: string | null = null;
  try {
    if (supabaseUrl) supabaseHost = new URL(supabaseUrl).hostname;
  } catch {}
  return (
    <html lang={detectedLang}>
      <head>
        {supabaseHost ? (
          <>
            <link rel="preconnect" href={`https://${supabaseHost}`} crossOrigin="" />
            <link rel="dns-prefetch" href={`https://${supabaseHost}`} />
          </>
        ) : null}
      </head>
      <body className={`${inter.className} ${inter.variable}`}>{children}</body>
    </html>
  );
}
