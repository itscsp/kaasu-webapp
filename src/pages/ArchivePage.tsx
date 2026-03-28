import { useEffect, useState } from "react";
import { api, Budget } from "@/lib/api";
import { ChevronRight } from "lucide-react";

interface Props {
  onSelectBudget: (id: number) => void;
  onBack: () => void;
}

export default function ArchivePage({ onSelectBudget, onBack }: Props) {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.budgets
      .list()
      .then((data) => {
        setBudgets(data.slice().reverse());
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load budgets");
        setLoading(false);
      });
  }, []);

  return (
    <div className="phone-frame">
      <div className="screen-header">
        <button onClick={onBack} className="header-action-btn">
          Back
        </button>
        <span className="header-title">Archives</span>
        <span className="w-12" />
      </div>

      <div className="screen-body">
        {loading && (
          <div className="p-4 text-center text-sm text-gray-500">Loading…</div>
        )}
        {error && (
          <div className="p-4 text-sm text-red-600">{error}</div>
        )}
        {!loading && !error && budgets.length === 0 && (
          <div className="p-4 text-center text-sm text-gray-500">
            No budgets found
          </div>
        )}
        {!loading &&
          budgets.map((b) => (
            <button
              key={b.id}
              className="archive-row"
              onClick={() => onSelectBudget(b.id)}
            >
              <span className="archive-row-title">{b.title}</span>
              <ChevronRight size={16} className="text-gray-500" />
            </button>
          ))}
      </div>
    </div>
  );
}
