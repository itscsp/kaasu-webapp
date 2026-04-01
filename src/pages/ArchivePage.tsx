import { useEffect, useState } from "react";

import { useData } from "@/context/DataContext";
import { ChevronRight } from "lucide-react";

interface Props {
  onSelectBudget: (id: number) => void;
  onBack: () => void;
}

export default function ArchivePage({ onSelectBudget, onBack }: Props) {
  const { budgets, fetchBudgets } = useData();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchBudgets()
      .catch(() => setError("Failed to load budgets"));
  }, [fetchBudgets]);

  useEffect(() => {
    if (budgets !== null) {
      setLoading(false);
    }
  }, [budgets]);

  const sortedBudgets = budgets ? [...budgets].reverse() : [];

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
        {!loading && !error && sortedBudgets.length === 0 && (
          <div className="p-4 text-center text-sm text-gray-500">
            No budgets found
          </div>
        )}
        {!loading &&
          sortedBudgets.map((b) => (
            <button
              key={b.id}
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 mb-3 flex items-center justify-between hover:bg-white/10 transition-all active:scale-[0.98] group"
              onClick={() => onSelectBudget(b.id)}
            >
              <div className="flex flex-col items-start gap-1">
                <span className="text-base font-semibold text-gray-200 group-hover:text-white transition-colors">{b.title}</span>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest px-2 py-0.5 bg-white/5 rounded-md border border-white/5">Budget Archive</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-500 group-hover:text-white group-hover:bg-white/10 transition-all">
                <ChevronRight size={18} />
              </div>
            </button>
          ))}
      </div>
    </div>
  );
}
