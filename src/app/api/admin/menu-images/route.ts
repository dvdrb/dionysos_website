import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { Buffer } from "node:buffer";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { BUCKET_MENU } from "@/lib/storage";
import sharp from "sharp";

export const runtime = "nodejs";

async function ensureAdmin() {
  const jar = await cookies();
  const token = jar.get("auth_token")?.value;
  if (!token) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
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

  const form = await request.formData();
  const file = form.get("file") as File | null;
  const categoryId = form.get("category_id") as string | null;
  const alt = (form.get("alt_text") as string | null) || undefined;

  if (!file || !categoryId) {
    return NextResponse.json(
      { message: "Missing file or category_id" },
      { status: 400 }
    );
  }

  const baseName = crypto.randomUUID();
  const arrayBuffer = await file.arrayBuffer();
  let webp: Buffer;
  try {
    webp = await sharp(Buffer.from(arrayBuffer))
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();
  } catch (e: any) {
    return NextResponse.json(
      { message: "Image processing failed", error: e?.message || String(e) },
      { status: 500 }
    );
  }
  const fileName = `${baseName}.webp`;
  const { error: upErr } = await supabaseAdmin.storage
    .from(BUCKET_MENU)
    .upload(fileName, webp, {
      contentType: "image/webp",
      upsert: false,
      cacheControl: "31536000",
    });
  if (upErr) {
    return NextResponse.json(
      { message: "Storage upload failed", error: upErr.message },
      { status: 500 }
    );
  }

  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from(BUCKET_MENU).getPublicUrl(fileName);

  const { data, error } = await supabaseAdmin
    .from("menu_images")
    .insert({
      image_url: publicUrl,
      category_id: parseInt(categoryId, 10),
      alt_text: alt ?? file.name,
    })
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
