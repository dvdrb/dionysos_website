import { NextResponse } from "next/server";
import { stat, readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";

function contentType(filePath: string) {
  const lower = filePath.toLowerCase();
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".gif")) return "image/gif";
  return "application/octet-stream";
}

export async function GET(
  request: Request,
  ctx: { params: Promise<{ bucket: string; path: string[] }> }
) {
  const { bucket, path: parts } = await ctx.params;
  const relPath = parts.join("/");
  const localPath = join(process.cwd(), "public", bucket, relPath);

  try {
    await stat(localPath);
    const data = await readFile(localPath); // Buffer
    const ab = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength); // ArrayBuffer
    return new NextResponse(ab, {
      status: 200,
      headers: {
        "Content-Type": contentType(localPath),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    // Fallback: proxy from Supabase public storage
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || "";
    if (!base) return NextResponse.json({ message: "Missing SUPABASE_URL" }, { status: 500 });
    const url = `${base.replace(/\/$/, "")}/storage/v1/object/public/${bucket}/${relPath}`;
    try {
      const resp = await fetch(url, {
        headers: { "Cache-Control": "public, max-age=86400" },
        // Rely on Supabase caching; we just stream
      });
      if (!resp.ok) return NextResponse.json({ message: `Upstream ${resp.status}` }, { status: resp.status });
      const body = await resp.arrayBuffer();
      return new NextResponse(body, {
        status: 200,
        headers: {
          "Content-Type": contentType(url),
          "Cache-Control": "public, max-age=86400",
        },
      });
    } catch (e: any) {
      return NextResponse.json({ message: e?.message || "Proxy failed" }, { status: 500 });
    }
  }
}
