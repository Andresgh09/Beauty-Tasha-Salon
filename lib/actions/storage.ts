"use server";

import { createClient } from "@/lib/supabase/server";

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * Sube una imagen al bucket "images" y devuelve la URL pública.
 */
export async function uploadImage(formData: FormData, folder: "services" | "gallery" | "site") {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado" };

  const file = formData.get("file") as File | null;
  if (!file) return { error: "Archivo no provisto" };

  if (!ALLOWED.includes(file.type)) {
    return { error: "Formato no permitido. Usa JPG, PNG o WebP." };
  }
  if (file.size > MAX_SIZE) {
    return { error: "Imagen muy pesada. Máximo 5 MB." };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const filename = `${folder}/${crypto.randomUUID()}.${ext}`;

  const { error } = await supabase.storage
    .from("images")
    .upload(filename, file, {
      contentType: file.type,
      cacheControl: "31536000",
      upsert: false
    });

  if (error) return { error: error.message };

  const { data: pub } = supabase.storage.from("images").getPublicUrl(filename);
  return { ok: true, url: pub.publicUrl, path: filename };
}

/**
 * Elimina una imagen del bucket por su URL pública.
 */
export async function deleteImage(url: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "No autorizado" };

  // Extraer path del bucket de la URL pública
  // Formato: https://xxxx.supabase.co/storage/v1/object/public/images/<path>
  const match = url.match(/\/storage\/v1\/object\/public\/images\/(.+)$/);
  if (!match) return { error: "URL no válida" };

  const { error } = await supabase.storage.from("images").remove([match[1]]);
  if (error) return { error: error.message };
  return { ok: true };
}
