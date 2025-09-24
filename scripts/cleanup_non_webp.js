/*
 Remove non-WebP images from public/<bucket> to keep only .webp locally.

 Usage:
   node scripts/cleanup_non_webp.js
   DRY_RUN=true node scripts/cleanup_non_webp.js
   PREFIX=sushi-restaurant node scripts/cleanup_non_webp.js

 Env:
   NEXT_PUBLIC_SUPABASE_MENU_BUCKET (default 'menu')
   DRY_RUN=true  -> preview only
   PREFIX=path   -> limit to subfolder under public/<bucket>
*/

const fs = require('fs');
const path = require('path');

const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_MENU_BUCKET || 'menu';
const DRY = String(process.env.DRY_RUN || '').toLowerCase() === 'true';
const PREFIX = process.env.PREFIX || '';

const baseDir = path.join(process.cwd(), 'public', BUCKET, PREFIX);

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir)) {
    const fp = path.join(dir, entry);
    const st = fs.statSync(fp);
    if (st.isDirectory()) out.push(...walk(fp));
    else out.push(fp);
  }
  return out;
}

function isNonWebp(file) {
  const ext = path.extname(file).toLowerCase();
  return ext === '.png' || ext === '.jpg' || ext === '.jpeg';
}

async function run() {
  console.log('Cleaning non-WebP under:', baseDir);
  const files = walk(baseDir).filter(isNonWebp);
  console.log('Found files:', files.length);
  let removed = 0;
  for (const fp of files) {
    if (DRY) {
      console.log('[DRY] remove', fp);
    } else {
      try { fs.unlinkSync(fp); removed++; } catch (e) { console.error('Failed to remove', fp, e.message); }
    }
  }
  if (!DRY) console.log('Removed files:', removed);
}

run().catch((e) => { console.error(e); process.exit(1); });

