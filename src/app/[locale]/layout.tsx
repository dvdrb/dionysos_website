import { NextIntlClientProvider } from "next-intl";
import Header from "../components/header";
import { getMessages, locales } from "@/i18n/request";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

import { setRequestLocale } from "next-intl/server";
import Footer from "../components/footer";

export default async function LocaleLayout(props: any) {
  const { children, params } = props;
  const locale = await String(params?.locale ?? "ro");

  const { messages } = await getMessages(locale);

  // Inform Next.js about the current locale for caching
  setRequestLocale(locale);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Header />
      {children}
      <Footer />
    </NextIntlClientProvider>
  );
}
