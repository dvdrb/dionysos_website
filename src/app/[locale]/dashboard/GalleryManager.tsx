"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { GalleryImage } from "./DashboardClient";
import { useTranslations } from "next-intl";

async function uploadViaApi(file: File, alt?: string) {
  const fd = new FormData();
  fd.set("file", file);
  if (alt) fd.set("alt_text", alt);
  const res = await fetch("/api/admin/gallery-images", { method: "POST", body: fd });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j?.error || j?.message || `Upload failed (${res.status})`);
  }
  const j = await res.json();
  return j.item as GalleryImage;
}

export default function GalleryManager({
  initialGalleryImages,
}: {
  initialGalleryImages: GalleryImage[];
}) {
  const t = useTranslations("Dashboard");
  const [images, setImages] = useState(initialGalleryImages ?? []);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const item = await uploadViaApi(file, file.name);
      setImages([item, ...images]);
      router.refresh();
    } catch (error: any) {
      console.error("Upload error (gallery)", error);
      alert(`${t("images.status.uploading")}: ${error?.message || error}.`);
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (id: number, imageUrl: string) => {
    if (!confirm(t("promo.confirm.delete"))) return;
    const res = await fetch("/api/admin/gallery-images", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, image_url: imageUrl }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j?.message || t("categories.alerts.deleteError"));
      return;
    }
    setImages(images.filter((img) => img.id !== id));
    router.refresh();
  };

  return (
    <section className="bg-white/70 backdrop-blur rounded-xl shadow-sm ring-1 ring-black/5 p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">{t("gallery.heading")}</h2>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700">{t("gallery.labels.upload")}</label>
        <input
          type="file"
          onChange={handleUpload}
          disabled={uploading}
          className="mt-1 block w-full text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-indigo-50 file:py-2 file:px-3 file:text-indigo-700 hover:file:bg-indigo-100"
        />
        {uploading && <p className="text-sm text-gray-600 mt-1">{t("gallery.status.uploading")}</p>}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {images.map((img) => (
          <div key={img.id} className="relative group rounded-md overflow-hidden border border-gray-200 bg-white">
            <img
              src={img.image_url}
              alt={img.alt_text ?? ""}
              loading="lazy"
              className="w-full h-32 object-cover"
            />
            <button
              onClick={() => deleteImage(img.id, img.image_url)}
              className="absolute top-1 right-1 rounded-full bg-red-600/90 p-1.5 text-white shadow hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
              aria-label={t("gallery.actions.deleteAria")}
              title={t("gallery.actions.delete")}
            >
              &times;
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
