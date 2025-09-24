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

function slugify(input: string): string {
  return String(input)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "") // remove diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
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
  const admin = supabaseAdmin!;

  const body = await request.json().catch(() => null);
  const menu = (body?.menu as string | undefined) || "";
  if (!menu) {
    return NextResponse.json({ message: "Missing 'menu'" }, { status: 400 });
  }

  // Fetch categories for the selected menu
  const { data: categories, error: catErr } = await admin
    .from("categories")
    .select("id,name,name_ro")
    .eq("menu", menu);
  if (catErr) {
    return NextResponse.json(
      { message: "Failed to load categories", error: catErr.message },
      { status: 500 }
    );
  }

  const slugToCategory = new Map<string, { id: number; name: string }>();
  (categories || []).forEach((c: any) => {
    const base = c.name_ro || c.name || String(c.id);
    slugToCategory.set(slugify(base), { id: c.id, name: base });
  });

  // Helper to list a folder in storage
  async function listFolder(path: string) {
    const { data, error } = await admin.storage
      .from(BUCKET_MENU)
      .list(path, { limit: 1000, offset: 0 });
    if (error) throw error;
    return data || [];
  }

  // Build list of objects under `${menu}/${categorySlug}/<file>` for all categories
  const paths: { path: string; category_id: number }[] = [];
  for (const [slug, cat] of slugToCategory.entries()) {
    const basePath = `${menu}/${slug}`;
    let entries: any[] = [];
    try {
      entries = await listFolder(basePath);
    } catch (e: any) {
      // If folder missing, skip
      continue;
    }
    for (const entry of entries) {
      // Skip subfolders; storage folder entries have type='folder' in metadata or no id? We just skip names ending with '/'
      if (!entry || !entry.name || entry.name.endsWith("/")) continue;
      const fullPath = `${basePath}/${entry.name}`;
      paths.push({ path: fullPath, category_id: cat.id });
    }
  }

  if (paths.length === 0) {
    return NextResponse.json({ items: [], message: "No files found in folders" });
  }

  // Get public URLs
  const urlByPath = new Map<string, string>();
  for (const { path } of paths) {
    const { data } = admin.storage.from(BUCKET_MENU).getPublicUrl(path);
    urlByPath.set(path, data.publicUrl);
  }
  const urls = Array.from(urlByPath.values());

  // Load existing rows for these URLs
  const existingMap = new Map<string, { id: number; category_id: number }>();
  if (urls.length > 0) {
    const { data: existing } = await admin
      .from("menu_images")
      .select("id,image_url,category_id")
      .in("image_url", urls);
    (existing || []).forEach((row: any) => existingMap.set(row.image_url, row));
  }

  // Compute inserts and updates
  const toInsert: { image_url: string; category_id: number; alt_text?: string }[] = [];
  const updatesByCategory = new Map<number, number[]>(); // category_id -> list of ids

  for (const item of paths) {
    const url = urlByPath.get(item.path)!;
    const existing = existingMap.get(url);
    if (!existing) {
      const fileName = item.path.split("/").pop() || "";
      toInsert.push({ image_url: url, category_id: item.category_id, alt_text: fileName });
    } else if (existing.category_id !== item.category_id) {
      const arr = updatesByCategory.get(item.category_id) || [];
      arr.push(existing.id);
      updatesByCategory.set(item.category_id, arr);
    }
  }

  const results: any = { inserted: 0, updated: 0 };

  if (toInsert.length > 0) {
    const { error } = await admin.from("menu_images").insert(toInsert);
    if (error) {
      return NextResponse.json(
        { message: "Failed to insert new rows", error: error.message },
        { status: 500 }
      );
    }
    results.inserted = toInsert.length;
  }

  for (const [category_id, ids] of updatesByCategory.entries()) {
    const { error } = await admin
      .from("menu_images")
      .update({ category_id })
      .in("id", ids);
    if (error) {
      return NextResponse.json(
        { message: "Failed to update rows", error: error.message },
        { status: 500 }
      );
    }
    results.updated += ids.length;
  }

  return NextResponse.json({ ok: true, ...results });
}
