import { useEffect, useState } from "react";
import { api, Plan } from "@/lib/api";
import { useData } from "@/context/DataContext";
import { Pencil, Trash2, Plus, Check, X, CheckCircle, Circle, Landmark } from "lucide-react";

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

  async function handleToggleStatus(plan: Plan) {
    try {
      const newStatus = plan.status === "DONE" ? "PENDING" : "DONE";
      await api.plans.update(budgetId, plan.id, {
        title: plan.title,
        amount: plan.amount,
        status: newStatus,
      });
      invalidatePlans(budgetId);
      await fetchPlans(budgetId, true);
    } catch {
      setError("Failed to update plan status");
    }
  }

  if (loading) return <p className="text-sm text-gray-500 p-4">Loading plans…</p>;
  if (error) return <p className="text-sm text-red-600 p-4">{error}</p>;

  return (
    <div className="flex flex-col gap-5 pt-2">
      {/* Plan Summary Card */}
      {plans.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 shadow-xl backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[hsl(var(--primary))]/5 blur-2xl -mr-12 -mt-12 rounded-full"></div>
          <div className="flex justify-between items-end relative z-10">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-1">TOTAL BUDGET</span>
              <span className="text-xl font-bold text-gray-200">
                ₹{plans.reduce((acc, p) => acc + (Number(p.amount) || 0), 0).toLocaleString()}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-1">PAID / PENDING</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[hsl(150_70%_55%)]">
                  ₹{plans.filter(p => p.status === "DONE").reduce((acc, p) => acc + (Number(p.amount) || 0), 0).toLocaleString()}
                </span>
                <span className="text-gray-700">/</span>
                <span className="text-xs font-bold text-[hsl(0_80%_65%)]">
                  ₹{plans.filter(p => p.status !== "DONE").reduce((acc, p) => acc + (Number(p.amount) || 0), 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[hsl(var(--primary))] transition-all duration-500 ease-out shadow-[0_0_10px_hsla(var(--primary),0.5)]" 
              style={{ width: `${(plans.filter(p => p.status === "DONE").reduce((acc, p) => acc + (Number(p.amount) || 0), 0) / (plans.reduce((acc, p) => acc + (Number(p.amount) || 0), 0) || 1)) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex justify-between items-center px-1">
        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest pl-1">MONTHLY PLANS</h3>
        <button
          onClick={() => setShowAdd((v) => !v)}
          className="bg-white/5 hover:bg-white/10 text-gray-400 p-1.5 rounded-lg border border-white/5 transition-all active:scale-90"
        >
          <Plus size={16} />
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3 shadow-lg group focus-within:border-[hsl(var(--primary))]/30 transition-all">
          <input
            className="bg-transparent border-none outline-none text-sm font-semibold text-gray-200 placeholder:text-gray-700"
            placeholder="Plan Name (e.g. Rent)"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            required
          />
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <span className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-600 text-xs">₹</span>
              <input
                className="w-full bg-transparent border-none outline-none text-sm font-bold text-[hsl(var(--primary))] pl-3"
                type="number"
                placeholder="0.00"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                required
                min="0"
                step="0.01"
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-[hsl(var(--primary))] text-white p-2 rounded-xl active:scale-90 transition-all">
                <Check size={16} />
              </button>
              <button type="button" onClick={() => setShowAdd(false)} className="text-gray-600 p-2 hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="flex flex-col gap-2.5">
        {plans.map((plan) =>
          editId === plan.id ? (
            <form key={plan.id} onSubmit={handleUpdate} className="bg-white/5 border border-[hsl(var(--primary))]/30 rounded-2xl p-4 flex flex-col gap-3">
              <input
                className="bg-transparent border-none outline-none text-sm font-bold text-white"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
              />
              <div className="flex justify-between items-center">
                 <input
                  className="bg-transparent border-none outline-none text-sm font-bold text-[hsl(var(--primary))]"
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                />
                <div className="flex gap-2">
                  <button type="submit" className="bg-[hsl(var(--primary))] text-white p-2 rounded-xl">
                    <Check size={16} />
                  </button>
                  <button type="button" onClick={() => setEditId(null)} className="text-gray-600 p-2">
                    <X size={16} />
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div
              key={plan.id}
              onClick={() => handleToggleStatus(plan)}
              className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between group hover:bg-white/10 active:scale-[0.99] transition-all cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-xl transition-all ${plan.status === "DONE" ? "bg-[hsl(150_70%_55%)]/20 text-[hsl(150_70%_55%)]" : "bg-white/5 text-gray-700"}`}>
                  {plan.status === "DONE" ? <CheckCircle size={18} /> : <Circle size={18} />}
                </div>
                <div className="flex flex-col">
                  <span className={`text-sm font-semibold transition-all ${plan.status === "DONE" ? "text-gray-600 line-through" : "text-gray-200"}`}>
                    {plan.title}
                  </span>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">Budget Plan</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <span className={`text-sm font-bold ${plan.status === "DONE" ? "text-gray-600" : "text-[hsl(var(--primary))]"}`}>
                  ₹{(Number(plan.amount) || 0).toLocaleString()}
                </span>
                <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={(e) => { e.stopPropagation(); startEdit(plan); }} className="text-gray-600 hover:text-white transition-colors">
                    <Pencil size={12} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(plan.id); }} className="text-gray-600 hover:text-[hsl(0_80%_65%)] transition-colors">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            </div>
          )
        )}
      </div>

      {plans.length === 0 && !showAdd && (
        <div className="flex flex-col items-center justify-center py-20 opacity-20">
          <Landmark size={48} className="mb-4" />
          <p className="text-xs font-bold uppercase tracking-widest text-center">No plans for this month</p>
        </div>
      )}
    </div>
  );
}
