/*
 Batch-convert Supabase Storage images to WebP and update DB URLs.

 Prereqs:
 - npm i sharp @supabase/supabase-js
 - env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_MENU_BUCKET (or fallback 'menu')

 Usage:
   node scripts/convert_storage_images_to_webp.js            # real run
   DRY_RUN=true node scripts/convert_storage_images_to_webp.js  # preview only

 What it does:
 - Recursively lists all files in the target bucket
 - For each PNG/JPEG over a threshold, downloads, converts to WebP (width<=1600, q=80)
 - Uploads WebP next to original with same name + .webp extension
 - Updates image_url in tables: menu_images, promo_items, gallery_images
 - Optionally preserves originals (default). Delete originals manually if you want.
*/

const path = require("path");
// Load env from .env.local then .env (if present)
try {
  require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") });
} catch {}
try {
  require("dotenv").config();
} catch {}
const sharp = require("sharp");
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL =
  process.env.SUPABASE_URL || "https://jwwuilmxbiroilvurjgu.supabase.co";
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3d3VpbG14Ymlyb2lsdnVyamd1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQ4Nzk0OSwiZXhwIjoyMDczMDYzOTQ5fQ.B3VXaw4liIgI-IEjeKL1llPu-O0kRxScMUlz64KTWac";
const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_MENU_BUCKET || "menu";
const DRY_RUN = String(process.env.DRY_RUN || "").toLowerCase() === "true";

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

async function listRecursive(prefix = "") {
  const out = [];
  let page = 0;
  while (true) {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(prefix, { limit: 1000, offset: page * 1000 });
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const item of data) {
      if (item.id && item.name === undefined) {
        // older SDK shapes; skip
        continue;
      }
      if (item.name && item.metadata && item.metadata.size === null) {
        // Some SDKs mark folders via size===null and type may be 'folder'
      }
      if (item.name && item.name.endsWith("/")) {
        // unlikely
        continue;
      }
      if (
        item.name &&
        item.id === undefined &&
        item.updated_at === undefined &&
        !item.metadata
      ) {
        // Could be folder, try listing deeper
      }
    }
    // Separate files vs folders using the presence of item.metadata or type
    for (const entry of data) {
      if (
        entry.id ||
        entry.created_at ||
        entry.updated_at ||
        (entry.metadata && typeof entry.metadata.size === "number")
      ) {
        // Treat as file
        out.push(prefix ? `${prefix}/${entry.name}` : entry.name);
      } else {
        // Treat as folder; recurse
        const folder = prefix ? `${prefix}/${entry.name}` : entry.name;
        const nested = await listRecursive(folder);
        out.push(...nested);
      }
    }
    if (data.length < 1000) break;
    page++;
  }
  return Array.from(new Set(out));
}

function isConvertible(name) {
  const ext = path.extname(name).toLowerCase();
  return ext === ".png" || ext === ".jpg" || ext === ".jpeg";
}

function publicUrlFor(p) {
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(p);
  return data.publicUrl;
}

async function updateTables(oldUrl, newUrl) {
  const tables = ["menu_images", "promo_items", "gallery_images"];
  for (const table of tables) {
    // Fetch rows that reference the old URL (exact or with query params)
    const { data: rows, error } = await supabase
      .from(table)
      .select("id, image_url")
      .like("image_url", `${oldUrl}%`);
    if (error) {
      console.error(`Select error (${table})`, error.message);
      continue;
    }
    for (const row of rows || []) {
      if (DRY_RUN) {
        console.log(`[DRY] ${table}#${row.id}: ${row.image_url} -> ${newUrl}`);
      } else {
        const { error: upErr } = await supabase
          .from(table)
          .update({ image_url: newUrl })
          .eq("id", row.id);
        if (upErr)
          console.error(`Update error (${table}#${row.id})`, upErr.message);
      }
    }
  }
}

async function run() {
  console.log("Listing objects in bucket:", BUCKET);
  const files = await listRecursive("");
  console.log(`Found ${files.length} objects`);

  let converted = 0;
  for (const fp of files) {
    if (!isConvertible(fp)) continue;
    const webpPath = fp.replace(/\.(png|jpg|jpeg)$/i, ".webp");

    // Skip if a webp already exists (avoid duplicates)
    const { data: existsList } = await supabase.storage
      .from(BUCKET)
      .list(path.dirname(webpPath));
    if (
      existsList &&
      existsList.find((e) => e.name === path.basename(webpPath))
    ) {
      // WebP already present: ensure DB rows point to it
      const newUrl = publicUrlFor(webpPath);
      const oldUrl = publicUrlFor(fp);
      if (DRY_RUN) {
        console.log(`[DRY] Already exists: updating DB URLs ${oldUrl} -> ${newUrl}`);
      } else {
        await updateTables(oldUrl, newUrl);
      }
      continue;
    }

    // Download original
    const { data: blob, error: dlErr } = await supabase.storage
      .from(BUCKET)
      .download(fp);
    if (dlErr) {
      console.error("Download error:", fp, dlErr.message);
      continue;
    }
    const ab = await blob.arrayBuffer();
    const buf = Buffer.from(ab);

    // Convert
    let webpBuf;
    try {
      webpBuf = await sharp(buf)
        .resize({ width: 1600, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
    } catch (e) {
      console.error("Sharp convert error:", fp, e.message);
      continue;
    }

    const newName = webpPath;
    const newUrl = publicUrlFor(newName);
    const oldUrl = publicUrlFor(fp);

    if (DRY_RUN) {
      console.log(`[DRY] Would upload ${newName} and update URLs`);
      await updateTables(oldUrl, newUrl);
      converted++;
      continue;
    }

    // Upload WebP
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(newName, webpBuf, {
        contentType: "image/webp",
        upsert: false,
        cacheControl: "31536000",
      });
    if (upErr) {
      console.error("Upload error:", newName, upErr.message);
      continue;
    }

    // Update DB references
    await updateTables(oldUrl, newUrl);
    converted++;
  }

  console.log("Done. Converted files:", converted);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
