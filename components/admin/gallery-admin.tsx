"use client";

import { useState, useRef, useTransition } from "react";
import Image from "next/image";
import { Eye, EyeOff, Trash2, ImagePlus, Loader2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { uploadImage } from "@/lib/actions/storage";
import {
  addGalleryImage,
  deleteGalleryImage,
  toggleGalleryVisible,
  reorderGallery
} from "@/lib/actions/gallery";
import type { GalleryItem } from "@/lib/supabase/types";

export function GalleryAdmin({ initial }: { initial: GalleryItem[] }) {
  const [items, setItems] = useState(initial);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    setUploading(true);
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      const upload = await uploadImage(fd, "gallery");
      if (upload.error) {
        setError(upload.error);
        break;
      }
      if (upload.url) {
        const res = await addGalleryImage(upload.url, "");
        if (res.error) {
          setError(res.error);
          break;
        }
        if (res.item) setItems((it) => [...it, res.item]);
      }
    }
    setUploading(false);
    if (fileInput.current) fileInput.current.value = "";
  };

  const handleDelete = (item: GalleryItem) => {
    if (!confirm("¿Eliminar esta foto?")) return;
    startTransition(async () => {
      const res = await deleteGalleryImage(item.id);
      if (res.error) return alert(res.error);
      setItems((it) => it.filter((i) => i.id !== item.id));
    });
  };

  const handleToggle = (item: GalleryItem) => {
    startTransition(async () => {
      const next = !item.visible;
      await toggleGalleryVisible(item.id, next);
      setItems((it) => it.map((i) => (i.id === item.id ? { ...i, visible: next } : i)));
    });
  };

  const handleDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const src = items.findIndex((i) => i.id === dragId);
    const tgt = items.findIndex((i) => i.id === targetId);
    const next = [...items];
    const [moved] = next.splice(src, 1);
    next.splice(tgt, 0, moved);
    setItems(next);
    setDragId(null);
    startTransition(() => {
      reorderGallery(next.map((i) => i.id));
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-mauve-100 p-4 shadow-card flex items-center justify-between gap-4">
        <p className="text-sm text-charcoal-muted">
          {items.length} foto{items.length !== 1 && "s"} ·{" "}
          {items.filter((i) => i.visible).length} visible{items.filter((i) => i.visible).length !== 1 && "s"}
        </p>
        <Button onClick={() => fileInput.current?.click()} disabled={uploading} size="sm">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
          {uploading ? "Subiendo..." : "Subir fotos"}
        </Button>
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-800">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-mauve-200 p-16 text-center">
          <ImagePlus className="w-10 h-10 mx-auto mb-3 text-mauve-400" />
          <p className="text-charcoal-muted mb-4">
            La galería está vacía. Sube tus primeras fotos.
          </p>
          <Button onClick={() => fileInput.current?.click()}>
            <ImagePlus className="w-4 h-4" />
            Subir fotos
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => setDragId(item.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(item.id)}
              className={cn(
                "group relative aspect-square rounded-2xl overflow-hidden border-2 border-mauve-100 shadow-card transition-all cursor-move",
                !item.visible && "opacity-50",
                dragId === item.id && "ring-2 ring-mauve-500 scale-95"
              )}
            >
              <Image
                src={item.image_url}
                alt={item.alt_text ?? ""}
                fill
                sizes="(max-width: 640px) 50vw, 25vw"
                className="object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/0 to-charcoal/0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                <div className="flex justify-end gap-1">
                  <button
                    onClick={() => handleToggle(item)}
                    title={item.visible ? "Ocultar" : "Mostrar"}
                    className="w-8 h-8 rounded-lg bg-white/90 hover:bg-white text-charcoal flex items-center justify-center cursor-pointer"
                  >
                    {item.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => handleDelete(item)}
                    title="Eliminar"
                    className="w-8 h-8 rounded-lg bg-white/90 hover:bg-red-500 hover:text-white text-charcoal flex items-center justify-center cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-1 text-white text-xs">
                  <GripVertical className="w-3 h-3" />
                  <span>Arrastra para reordenar</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
