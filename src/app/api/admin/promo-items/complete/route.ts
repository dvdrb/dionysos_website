import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { BUCKET_MENU } from "@/lib/storage";

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
  const path = body?.path as string | undefined;
  const title = body?.title as string | undefined;
  const price = body?.price as string | undefined;
  if (!path || !title || !price) {
    return NextResponse.json({ message: "Missing path, title or price" }, { status: 400 });
  }

  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from(BUCKET_MENU).getPublicUrl(path);

  const { data, error } = await supabaseAdmin
    .from("promo_items")
    .insert({ title, price, image_url: publicUrl })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { message: "DB insert failed", error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ item: data });
}

