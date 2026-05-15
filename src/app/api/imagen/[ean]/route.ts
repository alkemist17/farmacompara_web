import { readFile, stat } from "fs/promises";
import path from "path";
import { NextRequest } from "next/server";

const MEDIA_DIR =
  process.env.MEDIA_PRODUCTOS_DIR ??
  "/drive/axonode/demos/farmacompara_scrapper/media/productos";

function sanitizeEan(raw: string): string {
  return raw.replace(/[^0-9]/g, "");
}

// SVG placeholder cuando no existe imagen real
const PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <rect width="200" height="200" fill="#f3f4f6" rx="12"/>
  <g transform="translate(100,90)">
    <rect x="-28" y="-32" width="56" height="44" rx="4" fill="none" stroke="#9ca3af" stroke-width="3"/>
    <rect x="-18" y="-24" width="14" height="28" rx="2" fill="#d1d5db"/>
    <rect x="4"  y="-24" width="14" height="28" rx="2" fill="#9ca3af"/>
    <line x1="-28" y1="0" x2="28" y2="0" stroke="#9ca3af" stroke-width="2"/>
  </g>
  <text x="100" y="148" text-anchor="middle" font-family="system-ui,sans-serif" font-size="11" fill="#9ca3af">Sin imagen</text>
</svg>`;

async function fileHasContent(filePath: string): Promise<boolean> {
  try {
    const info = await stat(filePath);
    return info.size > 0;
  } catch {
    return false;
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ean: string }> }
) {
  const { ean } = await params;
  const safeEan = sanitizeEan(ean);
  const imagePath = path.join(MEDIA_DIR, `${safeEan}.webp`);

  if (await fileHasContent(imagePath)) {
    const bytes = await readFile(imagePath);
    return new Response(new Blob([bytes], { type: "image/webp" }), {
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  }

  // Fallback SVG
  return new Response(PLACEHOLDER_SVG, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
