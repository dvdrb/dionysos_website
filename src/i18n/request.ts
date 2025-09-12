import {getRequestConfig} from "next-intl/server";

export const locales = ["ro", "ru"] as const;
export type AppLocale = (typeof locales)[number];

export async function getMessages(locale: string) {
  const safeLocale = (locales as readonly string[]).includes(locale)
    ? (locale as AppLocale)
    : ("ro" as AppLocale);

  const messages = (await import(`../../messages/${safeLocale}.json`)).default;
  return {
    locale: safeLocale,
    messages,
  };
}

export default getRequestConfig(async ({locale}) => {
  const requested = typeof locale === "string" ? locale : "ro";
  const {messages, locale: resolved} = await getMessages(requested);
  return {
    locale: resolved,
    messages,
  };
});
