/*
 Mirror Supabase Storage bucket to local public/ for Vercel static serving.

 - Loads env from .env.local/.env
 - Downloads all objects (optionally only .webp) from bucket into public/<bucket>/...
 - Preserves paths so frontend can use /images/<bucket>/<key>

 Usage:
   node scripts/mirror_storage_to_public.js
   ONLY_WEBP=true node scripts/mirror_storage_to_public.js
   PREFIX=some/folder node scripts/mirror_storage_to_public.js

 Env:
   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_MENU_BUCKET (default 'menu')
   ONLY_WEBP=true   -> skip non-webp files
   PREFIX=path      -> mirror only under that folder prefix
   CONCURRENCY=5    -> parallel downloads (default 4)
*/

const path = require("path");
const fs = require("fs");
const { mkdir, writeFile } = require("fs/promises");
try {
  require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") });
} catch {}
try {
  require("dotenv").config();
} catch {}
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL =
  process.env.SUPABASE_URL || "https://jwwuilmxbiroilvurjgu.supabase.co";
const SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp3d3VpbG14Ymlyb2lsdnVyamd1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzQ4Nzk0OSwiZXhwIjoyMDczMDYzOTQ5fQ.B3VXaw4liIgI-IEjeKL1llPu-O0kRxScMUlz64KTWac";
const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_MENU_BUCKET || "menu";
const ONLY_WEBP = String(process.env.ONLY_WEBP || "").toLowerCase() === "true";
const PREFIX = process.env.PREFIX || "";
const CONCURRENCY = Math.max(1, Number(process.env.CONCURRENCY || 4));

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
    for (const entry of data) {
      // If it looks like a folder, recurse
      if (!entry.name) continue;
      if (!entry.metadata || typeof entry.metadata.size !== "number") {
        const folder = prefix ? `${prefix}/${entry.name}` : entry.name;
        const nested = await listRecursive(folder);
        out.push(...nested);
      } else {
        // File
        out.push(prefix ? `${prefix}/${entry.name}` : entry.name);
      }
    }
    if (data.length < 1000) break;
    page++;
  }
  return Array.from(new Set(out));
}

function allowFile(name) {
  const ext = path.extname(name).toLowerCase();
  if (ONLY_WEBP) return ext === ".webp";
  return true;
}

async function ensureDirFor(filePath) {
  const dir = path.dirname(filePath);
  await mkdir(dir, { recursive: true });
}

async function run() {
  console.log(
    "Mirroring bucket -> public:",
    BUCKET,
    "prefix:",
    PREFIX || "(root)"
  );
  const keys = (await listRecursive(PREFIX)).filter(allowFile);
  console.log(`Found ${keys.length} files to mirror`);

  const baseDir = path.join(process.cwd(), "public", BUCKET);
  let done = 0;

  const queue = keys.slice();
  const workers = new Array(CONCURRENCY).fill(0).map(async () => {
    while (queue.length) {
      const key = queue.shift();
      const dest = path.join(baseDir, key);
      try {
        // Skip if already present
        if (fs.existsSync(dest)) {
          done++;
          continue;
        }

        const { data: blob, error } = await supabase.storage
          .from(BUCKET)
          .download(key);
        if (error) {
          console.error("Download error", key, error.message);
          continue;
        }
        const ab = await blob.arrayBuffer();
        await ensureDirFor(dest);
        await writeFile(dest, Buffer.from(ab));
        done++;
      } catch (e) {
        console.error("Error on", key, e?.message || e);
      }
    }
  });

  await Promise.all(workers);
  console.log("Mirror done. Files saved:", done, "Location:", baseDir);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
