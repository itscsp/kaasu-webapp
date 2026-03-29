import { useEffect, useState } from "react";
import { api, Plan } from "@/lib/api";
import { useData } from "@/context/DataContext";
import { Pencil, Trash2, Plus, Check, X } from "lucide-react";

interface Props {
  budgetId: number;
}

export default function PlansSection({ budgetId }: Props) {
  const { plans: plansCache, fetchPlans, invalidatePlans } = useData();
  const plans = plansCache[budgetId] || [];
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [editId, setEditId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetchPlans(budgetId).catch(() => setError("Failed to load plans"));
  }, [budgetId, fetchPlans]);

  useEffect(() => {
    if (plansCache[budgetId]) setLoading(false);
  }, [plansCache, budgetId]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim() || !newAmount) return;
    try {
      await api.plans.create(budgetId, {
        title: newTitle.trim(),
        amount: Number(newAmount),
      });
      setNewTitle("");
      setNewAmount("");
      setShowAdd(false);
      invalidatePlans(budgetId);
      await fetchPlans(budgetId, true);
    } catch {
      setError("Failed to create plan");
    }
  }

  function startEdit(plan: Plan) {
    setEditId(plan.id);
    setEditTitle(plan.title);
    setEditAmount(String(plan.amount));
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editId) return;
    try {
      await api.plans.update(budgetId, editId, {
        title: editTitle.trim(),
        amount: Number(editAmount),
      });
      setEditId(null);
      invalidatePlans(budgetId);
      await fetchPlans(budgetId, true);
    } catch {
      setError("Failed to update plan");
    }
  }

  async function handleDelete(pid: number) {
    if (!confirm("Delete this plan?")) return;
    try {
      await api.plans.delete(budgetId, pid);
      invalidatePlans(budgetId);
      await fetchPlans(budgetId, true);
    } catch {
      setError("Failed to delete plan");
    }
  }

  if (loading) return <p className="text-sm text-gray-500 p-4">Loading plans…</p>;
  if (error) return <p className="text-sm text-red-600 p-4">{error}</p>;

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <span className="field-label">Budget Plans</span>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="sketch-btn flex items-center gap-1 text-xs px-2 py-1"
        >
          <Plus size={12} /> Plan
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="sketch-box p-3 mb-3 flex flex-col gap-2">
          <input
            className="sketch-input"
            placeholder="Plan title"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
          />
          <input
            className="sketch-input"
            type="number"
            placeholder="Amount"
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
            required
            min="0"
            step="0.01"
          />
          <div className="flex gap-2">
            <button type="submit" className="sketch-btn sketch-btn-primary flex-1">
              Add Plan
            </button>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="sketch-btn flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {plans.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-4">No plans yet</p>
      )}

      {plans.map((plan) =>
        editId === plan.id ? (
          <form
            key={plan.id}
            onSubmit={handleUpdate}
            className="sketch-box p-3 mb-2 flex flex-col gap-2"
          >
            <input
              className="sketch-input"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
            />
            <input
              className="sketch-input"
              type="number"
              value={editAmount}
              onChange={(e) => setEditAmount(e.target.value)}
            />
            <div className="flex gap-2">
              <button type="submit" className="sketch-btn sketch-btn-primary flex-1 flex items-center justify-center gap-1">
                <Check size={14} /> Save
              </button>
              <button
                type="button"
                onClick={() => setEditId(null)}
                className="sketch-btn flex-1 flex items-center justify-center gap-1"
              >
                <X size={14} /> Cancel
              </button>
            </div>
          </form>
        ) : (
          <div
            key={plan.id}
            className="sketch-box px-3 py-2 mb-2 flex items-center justify-between"
          >
            <div>
              <p className="text-sm font-medium">{plan.title}</p>
              <p className="text-xs text-gray-500">{(Number(plan.amount) || 0).toLocaleString()}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => startEdit(plan)}
                className="text-gray-400 hover:text-gray-700"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => handleDelete(plan.id)}
                className="text-gray-400 hover:text-red-500"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        )
      )}
    </div>
  );
}
