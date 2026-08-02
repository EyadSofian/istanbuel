#!/usr/bin/env node
/* =============================================================================
   بناء نسخة النشر داخل مجلد dist/
   -----------------------------------------------------------------------------
   الصفحة نفسها ثابتة (مفيش build حقيقي)، بس فيه حاجة واحدة لازم تتظبط وقت
   النشر: روابط og:image و og:url و canonical لازم تكون **روابط كاملة**
   (absolute) عشان معاينة اللينك تشتغل لما حد يبعته على واتساب أو فيسبوك —
   الكراولرز دي مبتقراش الروابط النسبية ومبتشغّلش JavaScript.

   الدومين بيتحدد بالترتيب ده:
     1. متغيّر البيئة SITE_URL            ← لو عايز تتحكم فيه بنفسك
     2. VERCEL_PROJECT_PRODUCTION_URL     ← دومين الإنتاج على فيرسل (تلقائي)
     3. VERCEL_URL                        ← رابط الـ preview
   ولو مفيش ولا واحد، الملفات بتتنسخ زي ما هي والروابط بتفضل نسبية.
   ============================================================================= */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'dist');

/* الملفات والمجلدات اللي بتتنشر */
const INCLUDE = ['index.html', 'assets'];

function resolveOrigin() {
  const raw =
    process.env.SITE_URL ||
    process.env.VERCEL_PROJECT_PRODUCTION_URL ||
    process.env.VERCEL_URL ||
    '';
  if (!raw) return '';
  const trimmed = raw.trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : 'https://' + trimmed;
}

function absolutise(html, origin) {
  const before = html;

  html = html
    .replace('<link rel="canonical" href="./">', `<link rel="canonical" href="${origin}/">`)
    .replace(
      '<meta property="og:url" content="./">',
      `<meta property="og:url" content="${origin}/">`
    )
    .replace(
      '<meta property="og:image" content="assets/img/og-cover.jpg">',
      `<meta property="og:image" content="${origin}/assets/img/og-cover.jpg">`
    )
    .replace(
      '<meta name="twitter:image" content="assets/img/og-cover.jpg">',
      `<meta name="twitter:image" content="${origin}/assets/img/og-cover.jpg">`
    );

  if (html === before) {
    console.warn(
      '⚠️  لم يتم تعديل أي وسم — يبدو أن وسوم canonical/og في index.html اتغيّرت.\n' +
        '    راجع scripts/build.js لو عدّلت الوسوم دي يدوياً.'
    );
  }
  return html;
}

function main() {
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });

  for (const entry of INCLUDE) {
    const from = path.join(ROOT, entry);
    if (!fs.existsSync(from)) {
      console.error(`✗ ناقص: ${entry}`);
      process.exit(1);
    }
    fs.cpSync(from, path.join(OUT, entry), { recursive: true });
  }

  const origin = resolveOrigin();
  const indexPath = path.join(OUT, 'index.html');

  if (origin) {
    fs.writeFileSync(indexPath, absolutise(fs.readFileSync(indexPath, 'utf8'), origin));
    console.log(`✓ الدومين المستخدم في وسوم المشاركة: ${origin}`);
  } else {
    console.warn(
      '⚠️  مفيش دومين معروف — الروابط هتفضل نسبية.\n' +
        '    ضيف متغيّر البيئة SITE_URL على فيرسل (مثال: https://istanbul.example.com)\n' +
        '    عشان معاينة اللينك على واتساب وفيسبوك تشتغل صح.'
    );
  }

  console.log('✓ تم البناء في dist/');
}

main();
