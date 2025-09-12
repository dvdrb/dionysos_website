"use client";
import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Category } from "./DashboardClient"; // Importăm tipul corect

export default function CategoriesManager({
  initialCategories,
}: {
  initialCategories: Category[];
}) {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("");
  const router = useRouter();

  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data, error } = await supabase
      .from("categories")
      .insert({ name, icon })
      .select()
      .single();
    if (data) {
      setCategories([...categories, data]);
      setName("");
      setIcon("");
      router.refresh();
    }
  };

  const deleteCategory = async (id: number) => {
    if (
      confirm(
        "Ești sigur că vrei să ștergi această categorie? Toate imaginile asociate vor fi șterse."
      )
    ) {
      await supabase.from("categories").delete().eq("id", id);
      setCategories(categories.filter((c) => c.id !== id));
      router.refresh();
    }
  };

  return (
    <section className="bg-white/70 backdrop-blur rounded-xl shadow-sm ring-1 ring-black/5 p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Gestionează Categoriile</h2>
      <form onSubmit={addCategory} className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700" htmlFor="cat-name">Nume Categorie</label>
          <input
            id="cat-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="mt-1 block w-full rounded-md border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="col-span-1">
          <label className="block text-sm font-medium text-gray-700" htmlFor="cat-icon">Nume Iconiță (lucide-react)</label>
          <input
            id="cat-icon"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="ex: pizza"
            className="mt-1 block w-full rounded-md border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
          />
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
      <ul className="space-y-2">
        {categories.map((cat) => (
          <li
            key={cat.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2"
          >
            <span className="text-sm text-gray-800 truncate">{cat.name}{cat.icon ? ` (${cat.icon})` : ""}</span>
            <button
              onClick={() => deleteCategory(cat.id)}
              className="inline-flex items-center rounded-md bg-red-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
              aria-label={`Șterge categoria ${cat.name}`}
            >
              Șterge
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
