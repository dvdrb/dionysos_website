"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MenuImage, Category } from "./DashboardClient";
import { supabase } from "@/lib/supabaseClient";
import { useTranslations } from "next-intl";

async function uploadViaApi(file: File, categoryId: string, alt?: string) {
  const fd = new FormData();
  fd.set("file", file);
  fd.set("category_id", categoryId);
  if (alt) fd.set("alt_text", alt);
  const res = await fetch("/api/admin/menu-images", { method: "POST", body: fd });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    const err: any = new Error(j?.error || j?.message || `Upload failed (${res.status})`);
    (err.status = res.status);
    throw err;
  }
  const j = await res.json();
  return j.item as MenuImage;
}

async function uploadWithSignedUrl(file: File, categoryId: string, alt?: string) {
  const signRes = await fetch("/api/admin/menu-images/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: file.name, contentType: file.type }),
  });
  if (!signRes.ok) {
    const j = await signRes.json().catch(() => ({}));
    throw new Error(j?.message || `Failed to get signed URL (${signRes.status})`);
  }
  const { path, token } = await signRes.json();

  const upRes = await supabase.storage
    .from("menu")
    // @ts-ignore
    .uploadToSignedUrl(path, token, file);
  if ((upRes as any)?.error) {
    throw new Error((upRes as any).error?.message || "Signed upload failed");
  }

  const completeRes = await fetch("/api/admin/menu-images/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, category_id: Number(categoryId), alt_text: alt ?? file.name }),
  });
  if (!completeRes.ok) {
    const j = await completeRes.json().catch(() => ({}));
    throw new Error(j?.message || `DB insert failed (${completeRes.status})`);
  }
  const j = await completeRes.json();
  return j.item as MenuImage;
}

export default function MenuImagesManager({
  initialMenuImages,
  categories,
  selectedMenu,
}: {
  initialMenuImages: MenuImage[];
  categories: Category[];
  selectedMenu: string;
}) {
  const t = useTranslations("Dashboard");
  const [images, setImages] = useState(initialMenuImages ?? []);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  // Strictly show categories that belong to the selected menu
  const filteredCategories = (categories || []).filter((c) => c.menu === selectedMenu);
  useEffect(() => {
    if (filteredCategories.length === 0) {
      setSelectedCategory("");
      return;
    }
    if (!selectedCategory) {
      setSelectedCategory(String(filteredCategories[0].id));
    } else if (!filteredCategories.find((c) => String(c.id) === selectedCategory)) {
      setSelectedCategory(String(filteredCategories[0].id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMenu, categories]);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedCategory) return;
    setUploading(true);
    try {
      let item: MenuImage;
      try {
        item = await uploadViaApi(file, selectedCategory, file.name);
      } catch (err: any) {
        if (err?.status === 413) {
          item = await uploadWithSignedUrl(file, selectedCategory, file.name);
        } else {
          throw err;
        }
      }
      setImages([item, ...images]);
      router.refresh();
    } catch (error: any) {
      console.error("Upload error (menu)", error);
      alert(`${t("images.status.uploading")}: ${error?.message || error}.`);
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (id: number, imageUrl: string) => {
    if (!confirm(t("promo.confirm.delete"))) return;
    const res = await fetch("/api/admin/menu-images", {
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

  const imagesForSelectedCategory = images.filter(
    (img) => img.category_id.toString() === selectedCategory
  );

  return (
    <section className="bg-white/70 backdrop-blur rounded-xl shadow-sm ring-1 ring-black/5 p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">{t("images.heading")}</h2>
      <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
        <div className="col-span-1">
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">{t("images.labels.category")}</label>
          <select
            id="category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
          >
          {filteredCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {(cat as any).name_ro || cat.name}
            </option>
          ))}
          </select>
        </div>
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700">{t("images.labels.upload")}</label>
          <input
            type="file"
            onChange={handleUpload}
            disabled={uploading || !selectedCategory}
            className="mt-1 block w-full text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-indigo-50 file:py-2 file:px-3 file:text-indigo-700 hover:file:bg-indigo-100"
          />
          {uploading && <p className="text-sm text-gray-600 mt-1">{t("images.status.uploading")}</p>}
        </div>
        <div className="col-span-1 flex items-end">
          <p className="text-xs text-gray-500">{t("images.hints.selectCategory")}</p>
        </div>
      </div>
      {filteredCategories.length === 0 ? (
        <p className="text-sm text-gray-600">{t("images.empty.noCategories")}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {imagesForSelectedCategory.map((img) => (
          <div key={img.id} className="relative group rounded-md overflow-hidden border border-gray-200 bg-white">
            <img
              src={img.image_url}
              alt={img.alt_text ?? ""}
              loading="lazy"
              className="w-full h-40 object-cover"
            />
            <button
              onClick={() => deleteImage(img.id, img.image_url)}
              className="absolute top-1 right-1 rounded-full bg-red-600/90 p-1.5 text-white shadow hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
              aria-label={t("images.actions.deleteAria")}
              title={t("images.actions.delete")}
            >
              &times;
            </button>
          </div>
        ))}
        </div>
      )}
    </section>
  );
}
