import { useEffect, useState } from "react";
import { api, Tag } from "@/lib/api";
import { X, Plus } from "lucide-react";

interface Props {
  onBack: () => void;
}

export default function TagsPage({ onBack }: Props) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [newTag, setNewTag] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function reload() {
    setLoading(true);
    api.tags
      .list()
      .then((data) => {
        setTags(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load tags");
        setLoading(false);
      });
  }

  useEffect(() => {
    reload();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newTag.trim()) return;
    try {
      await api.tags.create(newTag.trim());
      setNewTag("");
      reload();
    } catch {
      setError("Failed to create tag");
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this tag?")) return;
    try {
      await api.tags.delete(id);
      setTags((prev) => prev.filter((t) => t.id !== id));
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

        {!loading &&
          tags.map((tag) => (
            <div key={tag.id} className="flex items-center justify-between sketch-box px-3 py-2 mb-2">
              <span className="text-sm font-medium">{tag.name}</span>
              <button
                onClick={() => handleDelete(tag.id)}
                className="text-gray-400 hover:text-red-500"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        {!loading && tags.length === 0 && (
          <p className="text-sm text-gray-400 text-center">No tags yet</p>
        )}
      </div>
    </div>
  );
}
