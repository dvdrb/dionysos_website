"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { PromoItem } from "./DashboardClient";

async function uploadViaApi(file: File, title: string, price: string) {
  const fd = new FormData();
  fd.set("file", file);
  fd.set("title", title);
  fd.set("price", price);
  const res = await fetch("/api/admin/promo-items", { method: "POST", body: fd });
  if (!res.ok) {
    const j = await res.json().catch(() => ({}));
    throw new Error(j?.error || j?.message || `Upload failed (${res.status})`);
  }
  const j = await res.json();
  return j.item as PromoItem;
}

export default function PromoItemsManager({
  initialPromoItems,
}: {
  initialPromoItems: PromoItem[];
}) {
  const [items, setItems] = useState(initialPromoItems ?? []);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert("Selectează o imagine.");
      return;
    }
    setUploading(true);
    try {
      const item = await uploadViaApi(file, title, price);
      if (item) setItems([item, ...items]);
      setTitle("");
      setPrice("");
      setFile(null);
      router.refresh();
    } catch (error: any) {
      console.error("Upload error (promo)", error);
      alert(`Eroare la încărcare: ${error?.message || error}.`);
    } finally {
      setUploading(false);
    }
  };

  const deleteItem = async (id: number, imageUrl: string) => {
    if (!confirm("Ești sigur?")) return;
    const res = await fetch("/api/admin/promo-items", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, image_url: imageUrl }),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j?.message || "Eroare la ștergere");
      return;
    }
    setItems(items.filter((item) => item.id !== id));
    router.refresh();
  };

  return (
    <section className="bg-white/70 backdrop-blur rounded-xl shadow-sm ring-1 ring-black/5 p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Gestionează Produse Promo</h2>
      <form onSubmit={addItem} className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700" htmlFor="promo-title">Titlu</label>
          <input
            id="promo-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="ex: Platou Family"
            required
            className="mt-1 block w-full rounded-md border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700" htmlFor="promo-price">Preț</label>
          <input
            id="promo-price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="ex: 79 lei"
            required
            className="mt-1 block w-full rounded-md border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700">Imagine</label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            required
            className="mt-1 block w-full text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-indigo-50 file:py-2 file:px-3 file:text-indigo-700 hover:file:bg-indigo-100"
          />
        </div>
        <div className="col-span-1 sm:col-span-3 flex justify-start">
          <button
            type="submit"
            disabled={uploading}
            className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:opacity-60"
          >
            {uploading ? "Se încarcă..." : "Adaugă"}
          </button>
        </div>
      </form>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {items.map((item) => (
          <article
            key={item.id}
            className="relative group overflow-hidden rounded-lg border border-gray-200 bg-white"
          >
            <img src={item.image_url} className="w-full h-40 object-cover" alt={item.title} loading="lazy" />
            <div className="p-3">
              <p className="font-medium text-gray-900 text-sm">{item.title}</p>
              <p className="text-gray-600 text-sm">{item.price}</p>
            </div>
            <button
              onClick={() => deleteItem(item.id, item.image_url)}
              className="absolute top-1 right-1 rounded-full bg-red-600/90 p-1.5 text-white shadow hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
              aria-label={`Șterge ${item.title}`}
              title="Șterge"
            >
              &times;
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
