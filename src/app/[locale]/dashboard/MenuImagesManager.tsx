"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MenuImage, Category } from "./DashboardClient";
import { supabase } from "@/lib/supabaseClient";
import { BUCKET_MENU } from "@/lib/storage";
import { useTranslations } from "next-intl";

// Uploads use signed-URL flow to keep serverless bundles lean

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
    .from(BUCKET_MENU)
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
  useEffect(() => {
    setImages(initialMenuImages ?? []);
  }, [initialMenuImages]);
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
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [moveToCat, setMoveToCat] = useState<string>("");
  const [syncing, setSyncing] = useState(false);
  const router = useRouter();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !selectedCategory) return;
    setUploading(true);
    try {
      const uploaded: MenuImage[] = [];
      for (const file of files) {
        try {
          const item = await uploadWithSignedUrl(file, selectedCategory, file.name);
          uploaded.push(item);
        } catch (err: any) {
          console.error("Upload error (menu)", err);
        }
      }
      if (uploaded.length > 0) {
        setImages([...uploaded, ...images]);
        router.refresh();
      }
    } catch (error: any) {
      console.error("Upload batch error (menu)", error);
      alert(`${t("images.status.uploading")}: ${error?.message || error}.`);
    } finally {
      setUploading(false);
      e.currentTarget.value = ""; // reset input for re-upload
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const moveSelected = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    const target = moveToCat || selectedCategory;
    if (!target) return;
    const res = await fetch("/api/admin/menu-images", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, category_id: Number(target) }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j?.message || "Failed to move images");
      return;
    }
    const j = await res.json();
    const updated: MenuImage[] = j.items || [];
    const updatedMap = new Map(updated.map((u) => [u.id, u] as const));
    setImages((prev) => prev.map((img) => updatedMap.get(img.id) || img));
    clearSelection();
    router.refresh();
  };

  const syncFromFolders = async () => {
    if (!selectedMenu) return;
    setSyncing(true);
    try {
      const res = await fetch("/api/admin/menu-images/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ menu: selectedMenu }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(j?.message || "Sync failed");
        return;
      }
      router.refresh();
    } catch (e: any) {
      alert(e?.message || String(e));
    } finally {
      setSyncing(false);
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
  const getName = (img: MenuImage) => {
    const pick = (img.alt_text || img.image_url || "") as string;
    return (pick.split("/").pop() || pick) as string;
  };
  const getNum = (name: string) => {
    const m = name.match(/(\d+)/);
    return m ? parseInt(m[1], 10) : null;
  };
  const compareItems = (a: MenuImage, b: MenuImage) => {
    const an = getName(a);
    const bn = getName(b);
    const ai = getNum(an);
    const bi = getNum(bn);
    if (ai !== null && bi !== null) return ai - bi;
    if (ai !== null) return -1;
    if (bi !== null) return 1;
    const cmp = an.localeCompare(bn, undefined, { numeric: true, sensitivity: "base" });
    if (cmp !== 0) return cmp;
    return a.id - b.id;
  };
  const imagesSorted = imagesForSelectedCategory.slice().sort(compareItems);

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
            multiple
            onChange={handleUpload}
            disabled={uploading || !selectedCategory}
            className="mt-1 block w-full text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-indigo-50 file:py-2 file:px-3 file:text-indigo-700 hover:file:bg-indigo-100"
          />
          {uploading && <p className="text-sm text-gray-600 mt-1">{t("images.status.uploading")}</p>}
        </div>
        <div className="col-span-1 flex items-end gap-2">
          <p className="text-xs text-gray-500 mr-auto">{t("images.hints.selectCategory")}</p>
          <div className="flex items-center gap-2">
            <button
              onClick={syncFromFolders}
              disabled={syncing}
              className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow disabled:opacity-50"
              title="Sync from storage folders for this menu"
            >
              {syncing ? "Syncing…" : "Sync from folders"}
            </button>
            <select
              value={moveToCat || selectedCategory}
              onChange={(e) => setMoveToCat(e.target.value)}
              className="rounded-md border-gray-300 bg-white py-2 px-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
            >
              {filteredCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {(cat as any).name_ro || cat.name}
                </option>
              ))}
            </select>
            <button
              onClick={moveSelected}
              disabled={selectedIds.size === 0}
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow disabled:opacity-50"
              title="Move selected to category"
            >
              Move selected
            </button>
            {selectedIds.size > 0 && (
              <button
                onClick={clearSelection}
                className="rounded-md bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700 shadow"
                title="Clear selection"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>
      {filteredCategories.length === 0 ? (
        <p className="text-sm text-gray-600">{t("images.empty.noCategories")}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {imagesSorted.map((img) => (
          <div key={img.id} className="relative group rounded-md overflow-hidden border border-gray-200 bg-white">
            <label className="absolute top-1 left-1 z-10 bg-white/90 rounded-md px-1.5 py-1 shadow text-xs text-gray-700 flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedIds.has(img.id)}
                onChange={() => toggleSelect(img.id)}
              />
              {img.id}
            </label>
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
