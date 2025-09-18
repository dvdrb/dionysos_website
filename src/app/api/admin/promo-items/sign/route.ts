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

export async function POST(req: Request) {
  const unauthorized = await ensureAdmin();
  if (unauthorized) return unauthorized;

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json(
      { message: "Server misconfigured: missing SUPABASE_SERVICE_ROLE_KEY" },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => null);
  const filename: string | undefined = body?.filename;
  const ext = filename?.includes(".") ? filename.split(".").pop() : undefined;
  const path = `${crypto.randomUUID()}.${ext || "bin"}`;

  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET_MENU)
    .createSignedUploadUrl(path);
  if (error || !data) {
    return NextResponse.json(
      { message: "Failed to create signed URL", error: error?.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ path, token: data.token });
}

