import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useData } from "@/context/DataContext";
import { X, Plus, CheckCircle, Circle } from "lucide-react";

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

  async function handleToggleStatus(tag: any) {
    try {
      const newStatus = tag.status === "DONE" ? "PENDING" : "DONE";
      await api.tags.update(tag.id, { status: newStatus });
      invalidateTags();
      await fetchTags(true);
    } catch {
      setError("Failed to update tag status");
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

      <div className="screen-body">
        <form onSubmit={handleCreate} className="flex gap-2 mb-4">
          <input
            className="sketch-input flex-1"
            placeholder="New tag name"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
          />
          <button type="submit" className="sketch-btn flex items-center gap-1 px-3">
            <Plus size={14} /> Add
          </button>
        </form>

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        {loading && <p className="text-sm text-gray-500">Loading…</p>}

        {!loading && (tags || []).map((tag) => (
            <div key={tag.id} className="flex items-center justify-between sketch-box px-3 py-2 mb-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleToggleStatus(tag)}
                  className={tag.status === "DONE" ? "text-green-500" : "text-gray-400 hover:text-white"}
                >
                  {tag.status === "DONE" ? <CheckCircle size={16} /> : <Circle size={16} />}
                </button>
                <span className={`text-sm font-medium ${tag.status === "DONE" ? "line-through text-gray-500" : ""}`}>
                  {tag.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {deletingId === tag.id && <span className="text-xs text-red-400">Sure?</span>}
                <button
                  onClick={() => (deletingId === tag.id ? handleDelete(tag.id) : setDeletingId(tag.id))}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          ))}
        {!loading && (tags || []).length === 0 && (
          <p className="text-sm text-gray-400 text-center">No tags yet</p>
        )}
      </div>
    </div>
  );
}
