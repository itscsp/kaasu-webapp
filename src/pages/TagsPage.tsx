import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useData } from "@/context/DataContext";
import { X, Plus } from "lucide-react";

interface Props {
  onBack: () => void;
}

export default function TagsPage({ onBack }: Props) {
  const { tags, fetchTags, invalidateTags } = useData();
  const [newTag, setNewTag] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTags().catch(() => setError("Failed to load tags"));
  }, [fetchTags]);

  useEffect(() => {
    if (tags !== null) {
      setLoading(false);
    }
  }, [tags]);



  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTag.trim()) return;
    try {
      await api.tags.create(newTag.trim());
      setNewTag("");
      invalidateTags();
      await fetchTags(true);
    } catch {
      setError("Failed to create tag");
    }
  }

  async function handleDelete(id: number) {
    try {
      await api.tags.delete(id);
      setDeletingId(null);
      invalidateTags();
      await fetchTags(true);
    } catch {
      setError("Failed to delete tag");
    }
  }



  return (
    <div className="phone-frame">
      <div className="screen-header">
        <button onClick={onBack} className="header-action-btn">
          Back
        </button>
        <span className="header-title">Tags</span>
        <span className="w-12" />
      </div>

      <div className="screen-body py-2">
        <form onSubmit={handleCreate} className="flex gap-2 mb-6 bg-white/5 p-2 rounded-2xl border border-white/10 shadow-lg group focus-within:border-[hsl(var(--primary))]/30 transition-all">
          <input
            className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-gray-600 px-3 py-2 text-gray-200"
            placeholder="New tag name..."
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
          />
          <button type="submit" className="bg-[hsl(var(--primary))] text-white p-2.5 rounded-xl shadow-lg shadow-[hsl(var(--primary))]/20 active:scale-95 transition-all flex items-center justify-center">
            <Plus size={18} strokeWidth={3} />
          </button>
        </form>

        {error && <p className="text-[10px] font-bold text-[hsl(0_80%_65%)] uppercase tracking-[0.1em] mb-4 text-center px-4">{error}</p>}
        {loading && <p className="text-center text-[10px] text-gray-600 py-12 tracking-[0.2em] uppercase font-bold">Loading tags…</p>}

        <div className="grid grid-cols-2 gap-3 pb-8">
          {!loading && (tags || []).map((tag) => (
              <div key={tag.id} className="flex items-center justify-between bg-white/5 border border-white/5 rounded-xl px-3 py-2 hover:bg-white/10 hover:border-white/10 transition-all group relative overflow-hidden">
                <span className="text-xs font-semibold text-gray-400 group-hover:text-gray-100 transition-colors truncate pr-2">
                  {tag.name}
                </span>
                <button
                  onClick={() => (deletingId === tag.id ? handleDelete(tag.id) : setDeletingId(tag.id))}
                  className={`flex-shrink-0 p-1.5 rounded-lg transition-all ${deletingId === tag.id ? 'bg-[hsl(0_80%_65%)] text-white shadow-lg shadow-[hsl(0_80%_65%)]/20' : 'text-gray-700 hover:text-[hsl(0_80%_65%)] hover:bg-[hsl(0_80%_65%)]/10'}`}
                >
                  <X size={12} strokeWidth={2.5} />
                </button>
              </div>
            ))}
        </div>
        
        {!loading && (tags || []).length === 0 && (
          <p className="text-xs font-bold uppercase tracking-widest text-center py-20 text-gray-700">No tags found</p>
        )}
      </div>
    </div>
  );
}
