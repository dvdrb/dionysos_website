import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

async function ensureAdmin() {
  const jar = await cookies();
  const token = jar.get("auth_token")?.value;
  if (!token) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  return null;
}

export async function POST(request: Request) {
  const unauthorized = await ensureAdmin();
  if (unauthorized) return unauthorized;

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json(
      { message: "Server misconfigured: missing SUPABASE_SERVICE_ROLE_KEY" },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ message: "Invalid body" }, { status: 400 });
  const { name_ro, name_ru, name_en, icon, menu } = body;
  const ALLOWED_MENUS = new Set(["taverna", "bar", "sushi"]);

  // Prefer ro as base name if available
  const baseName = name_ro || body.name || "";
  if (!baseName) {
    return NextResponse.json(
      { message: "Missing name_ro (or name)" },
      { status: 400 }
    );
  }

  if (menu && !ALLOWED_MENUS.has(menu)) {
    return NextResponse.json(
      { message: "Invalid menu. Allowed: taverna, bar, sushi" },
      { status: 400 }
    );
  }

  // Try insert with multilingual fields if present; if columns do not exist, retry with minimal fields
  let insertObj: any = { name: baseName, icon: icon ?? null };
  if (name_ro) insertObj.name_ro = name_ro;
  if (name_ru) insertObj.name_ru = name_ru;
  if (menu) insertObj.menu = menu;
  if (name_en) insertObj.name_en = name_en;

  let data, error;
  ({ data, error } = await supabaseAdmin
    .from("categories")
    .insert(insertObj)
    .select("*")
    .single());

  if (error) {
    // Retry without multilingual fields in case columns don't exist
    ({ data, error } = await supabaseAdmin
      .from("categories")
      .insert({ name: baseName, icon: icon ?? null })
      .select("*")
      .single());
  }

  if (error) {
    return NextResponse.json(
      { message: "Create failed", error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ item: data });
}

export async function DELETE(request: Request) {
  const unauthorized = await ensureAdmin();
  if (unauthorized) return unauthorized;

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json(
      { message: "Server misconfigured: missing SUPABASE_SERVICE_ROLE_KEY" },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => null);
  const id = body?.id as number | undefined;
  if (!id) return NextResponse.json({ message: "Missing id" }, { status: 400 });

  // Best-effort: delete related menu_images first (no storage cleanup here)
  await supabaseAdmin.from("menu_images").delete().eq("category_id", id);
  const { error } = await supabaseAdmin.from("categories").delete().eq("id", id);
  if (error) {
    return NextResponse.json(
      { message: "Delete failed", error: error.message },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}
