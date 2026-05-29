import { readFile } from "fs/promises";
import { join } from "path";

/**
 * Carga las fuentes Inter (bundleadas en app/_og-assets) para next/og.
 * Pasar fuentes explícitas evita que Satori intente descargar su fuente
 * default (causa de "Invalid URL" / "failed to pipe response").
 */
export async function loadOgFonts() {
  const dir = join(process.cwd(), "app", "_og-assets");
  const [semibold, bold] = await Promise.all([
    readFile(join(dir, "Inter-SemiBold.woff")),
    readFile(join(dir, "Inter-Bold.woff"))
  ]);
  return [
    { name: "Inter", data: semibold, weight: 600 as const, style: "normal" as const },
    { name: "Inter", data: bold, weight: 700 as const, style: "normal" as const }
  ];
}
