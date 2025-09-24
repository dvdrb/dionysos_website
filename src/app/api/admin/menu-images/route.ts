import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { BUCKET_MENU } from "@/lib/storage";

export const runtime = "nodejs";

async function ensureAdmin() {
  const jar = await cookies();
  const token = jar.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  return null;
}

// Note: POST upload with image processing was removed to keep serverless bundles small.
// Use the signed upload flow instead.

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
  const imageUrl = body?.image_url as string | undefined;
  if (!id || !imageUrl) {
    return NextResponse.json(
      { message: "Missing id or image_url" },
      { status: 400 }
    );
  }

  const fileName = imageUrl.split("/").pop();
  if (fileName) {
    await supabaseAdmin.storage.from(BUCKET_MENU).remove([fileName]);
  }

  const { error } = await supabaseAdmin
    .from("menu_images")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { message: "DB delete failed", error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
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
  const ids = (body?.ids as number[] | undefined) || [];
  const categoryId = body?.category_id as number | undefined;

  if (!Array.isArray(ids) || ids.length === 0 || !categoryId) {
    return NextResponse.json(
      { message: "Missing ids[] or category_id" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("menu_images")
    .update({ category_id: categoryId })
    .in("id", ids)
    .select();

  if (error) {
    return NextResponse.json(
      { message: "DB update failed", error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ items: data ?? [] });
}
