"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, X, Loader2, ImagePlus } from "lucide-react";
import { uploadImage } from "@/lib/actions/storage";
import { cn } from "@/lib/utils";

export function ImageUploader({
  value,
  onChange,
  max = 8,
  folder = "services"
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
  folder?: "services" | "gallery" | "site";
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);

    const remaining = max - value.length;
    const toUpload = Array.from(files).slice(0, remaining);
    const uploaded: string[] = [];

    for (const file of toUpload) {
      const fd = new FormData();
      fd.append("file", file);
      const res = await uploadImage(fd, folder);
      if (res.error) {
        setError(res.error);
        break;
      }
      if (res.url) uploaded.push(res.url);
    }

    if (uploaded.length > 0) onChange([...value, ...uploaded]);
    setUploading(false);
    if (fileInput.current) fileInput.current.value = "";
  };

  const removeAt = (i: number) => {
    onChange(value.filter((_, idx) => idx !== i));
  };

  return (
    <div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {value.map((url, i) => (
          <div
            key={i}
            className="group relative aspect-square rounded-2xl overflow-hidden border-2 border-mauve-100 shadow-soft"
          >
            <Image
              src={url}
              alt={`Imagen ${i + 1}`}
              fill
              sizes="160px"
              className="object-cover"
            />
            {i === 0 && (
              <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-gradient-brand text-white text-[10px] font-medium shadow-soft">
                Principal
              </span>
            )}
            <button
              type="button"
              onClick={() => removeAt(i)}
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 hover:bg-red-500 hover:text-white text-charcoal flex items-center justify-center transition-colors cursor-pointer shadow-soft opacity-0 group-hover:opacity-100"
              aria-label="Eliminar imagen"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {value.length < max && (
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
            className={cn(
              "aspect-square rounded-2xl border-2 border-dashed border-mauve-200 flex flex-col items-center justify-center gap-2 text-charcoal-muted hover:border-mauve-500 hover:bg-mauve-50 transition-colors cursor-pointer",
              uploading && "opacity-60 cursor-wait"
            )}
          >
            {uploading ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span className="text-xs">Subiendo...</span>
              </>
            ) : (
              <>
                <ImagePlus className="w-6 h-6" />
                <span className="text-xs font-medium">Agregar foto</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={fileInput}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />

      {error && (
        <p className="text-xs text-red-600 mt-2">{error}</p>
      )}

      <p className="text-xs text-charcoal-muted mt-2">
        Máx {max} fotos. JPG, PNG o WebP hasta 5 MB. La primera es la principal.
      </p>
    </div>
  );
}
