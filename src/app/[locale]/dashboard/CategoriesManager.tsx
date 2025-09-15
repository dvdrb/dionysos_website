"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Category } from "./DashboardClient"; // Importăm tipul corect
import * as Icons from "lucide-react";

export default function CategoriesManager({
  initialCategories,
}: {
  initialCategories: Category[];
}) {
  const [categories, setCategories] = useState<Category[]>(
    initialCategories ?? []
  );
  const [nameRO, setNameRO] = useState("");
  const [nameRU, setNameRU] = useState("");
  const [icon, setIcon] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [iconQuery, setIconQuery] = useState("");
  const router = useRouter();

  const iconNames = useMemo(() => {
    return Object.keys(Icons)
      .filter((k) => /^[A-Z]/.test(k) && k !== "Icon")
      .sort((a, b) => a.localeCompare(b));
  }, []);

  const filteredIcons = useMemo(() => {
    const q = iconQuery.trim().toLowerCase();
    if (!q) return iconNames;
    return iconNames.filter((n) => n.toLowerCase().includes(q));
  }, [iconNames, iconQuery]);

  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name_ro: nameRO, name_ru: nameRU, icon }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.message || "Eroare la creare");
      const item: Category = j.item;
      setCategories([...categories, item]);
      setNameRO("");
      setNameRU("");
      setIcon("");
      router.refresh();
    } catch (err: any) {
      alert(err?.message || "Eroare");
    }
  };

  const deleteCategory = async (id: number) => {
    if (
      !confirm(
        "Ești sigur că vrei să ștergi această categorie? Toate imaginile asociate vor fi șterse."
      )
    )
      return;
    try {
      const res = await fetch("/api/admin/categories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.message || "Eroare la ștergere");
      setCategories(categories.filter((c) => c.id !== id));
      router.refresh();
    } catch (err: any) {
      alert(err?.message || "Eroare la ștergere");
    }
  };

  return (
    <section className="bg-white/70 backdrop-blur rounded-xl shadow-sm ring-1 ring-black/5 p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">
        Gestionează Categoriile
      </h2>
      <form
        onSubmit={addCategory}
        className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3"
      >
        <div className="col-span-1">
          <label
            className="block text-sm font-medium text-gray-700"
            htmlFor="cat-name-ro"
          >
            Nume (RO)
          </label>
          <input
            id="cat-name-ro"
            value={nameRO}
            onChange={(e) => setNameRO(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="col-span-1">
          <label
            className="block text-sm font-medium text-gray-700"
            htmlFor="cat-name-ru"
          >
            Nume (RU)
          </label>
          <input
            id="cat-name-ru"
            value={nameRU}
            onChange={(e) => setNameRU(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="col-span-1">
          <label
            className="block text-sm font-medium text-gray-700"
            htmlFor="cat-icon"
          >
            Icon (lucide-react)
          </label>
          <div className="mt-1 flex gap-2">
            <input
              id="cat-icon"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="ex: Pizza, Beef, Salad"
              className="flex-1 rounded-md border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={() => setShowPicker((s) => !s)}
              className="rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-gray-200 ring-1 ring-inset ring-gray-300"
            >
              {showPicker ? "Ascunde" : "Vezi Iconițe"}
            </button>
          </div>
          {icon && icon !== "Icon" && (Icons as any)[icon] && (
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
              {(() => {
                const Cmp = (Icons as any)[icon] as React.ComponentType<{
                  className?: string;
                }>;
                return <Cmp className="h-4 w-4" />;
              })()}
              <span>Icon valid</span>
            </div>
          )}
        </div>
        <div className="col-span-1 flex items-end">
          <button
            type="submit"
            className="inline-flex w-full sm:w-auto justify-center items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
          >
            Adaugă
          </button>
        </div>
      </form>
      {showPicker && (
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-center gap-2">
            <input
              value={iconQuery}
              onChange={(e) => setIconQuery(e.target.value)}
              placeholder="Caută icon (ex: pizza, beef, star)"
              className="w-full rounded-md border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3 max-h-[50vh] overflow-auto">
            {filteredIcons.map((name) => {
              const Cmp = (Icons as any)[name] as React.ComponentType<{
                className?: string;
              }>;
              return (
                <button
                  key={name}
                  type="button"
                  onClick={() => {
                    setIcon(name);
                    setShowPicker(false);
                  }}
                  className={`flex flex-col items-center justify-center gap-2 rounded-md border px-2 py-3 text-xs hover:bg-gray-50 ${
                    icon === name
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200"
                  }`}
                  title={name}
                >
                  <Cmp className="h-5 w-5" />
                  <span className="truncate w-full text-center">{name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
      <ul className="space-y-2">
        {(categories ?? []).map((cat) => (
          <li
            key={cat.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2"
          >
            <span className="text-sm text-gray-800 truncate">
              {cat.name_ro || cat.name} / {cat.name_ru || "-"}
              {cat.icon ? ` (${cat.icon})` : ""}
            </span>
            <button
              onClick={() => deleteCategory(cat.id)}
              className="inline-flex items-center rounded-md bg-red-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
              aria-label={`Șterge categoria ${cat.name_ro || cat.name}`}
            >
              Șterge
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
