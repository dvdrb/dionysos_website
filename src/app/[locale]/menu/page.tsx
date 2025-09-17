import { redirect } from "next/navigation";

export default function MenuIndexRedirect({ params }: { params: { locale: string } }) {
  const locale = params?.locale || "ro";
  redirect(`/${locale}/menu/taverna`);
}
