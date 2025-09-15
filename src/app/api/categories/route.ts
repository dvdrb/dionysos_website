import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { supabase as supabaseAnon } from "@/lib/supabaseClient";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const locale = url.searchParams.get("locale") || "ro";

  const admin = getSupabaseAdmin();
  const client = admin ?? supabaseAnon;

  const orderColumn = `name_${locale}` as const;
  const { data, error } = await client
    .from("categories")
    .select("*")
    .order(orderColumn, { ascending: true, nullsFirst: false });

  if (error) {
    return NextResponse.json(
      { message: "Failed to load categories", error: error.message },
      { status: 500 }
    );
  }

  const items = (data || []).map((c: any) => {
    const localized = c[`name_${locale}`] || c.name || "";
    const slug = String(localized).toLowerCase().trim().replace(/\s+/g, "-");
    return {
      id: c.id,
      name: localized,
      icon: c.icon ?? null,
      href: `/${locale}/menu#${slug}`,
    };
  });

  return NextResponse.json({ items });
}
