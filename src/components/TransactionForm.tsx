import { useEffect, useState } from "react";
import { api, Transaction, TransactionBody } from "@/lib/api";
import { useData } from "@/context/DataContext";

interface Props {
  budgetId: number;
  transaction?: Transaction;
  onSave: () => void;
  onBack: () => void;
}

export default function TransactionForm({ budgetId, transaction, onSave, onBack }: Props) {
  const { tags: allTags, fetchTags, accounts: allAccounts, fetchAccounts } = useData();
  const isEdit = !!transaction;
  const [type, setType] = useState<"income" | "expenses" | "transfer">(
    transaction?.type || "expenses"
  );
  const [amount, setAmount] = useState(
    transaction?.amount ? String(transaction.amount) : ""
  );
  const [notes, setNotes] = useState(transaction?.notes || "");
  const [date, setDate] = useState(
    transaction?.date || new Date().toISOString().split("T")[0]
  );
  const [fromAccountId, setFromAccountId] = useState<number | "">(
    transaction?.from_account_id || ""
  );
  const [toAccountId, setToAccountId] = useState<number | "">(
    transaction?.to_account_id || ""
  );
  const [selectedTags, setSelectedTags] = useState<number[]>(
    transaction?.tags || []
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTags().catch(() => {});
    fetchAccounts().catch(() => {});
  }, [fetchTags, fetchAccounts]);

  function toggleTag(id: number) {
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!amount || isNaN(Number(amount))) {
      setError("Please enter a valid amount");
      return;
    }
    if (type === "transfer" && (!fromAccountId || !toAccountId)) {
      setError("Transfer requires both From and To accounts");
      return;
    }
    setSaving(true);
    const body: TransactionBody = {
      date,
      amount: Number(amount),
      type,
      notes: notes || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      from_account_id: fromAccountId ? Number(fromAccountId) : undefined,
      to_account_id: toAccountId ? Number(toAccountId) : undefined,
    };
    try {
      if (isEdit && transaction) {
        await api.transactions.update(budgetId, transaction.id as any, body);
      } else {
        await api.transactions.create(budgetId, body);
      }
      onSave();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save transaction");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="phone-frame">
      <div className="screen-header">
        <button onClick={onBack} className="header-action-btn">
          Back
        </button>
        <span className="header-title">
          {isEdit ? "Edit Transaction" : "New Transaction"}
        </span>
        <span className="w-12" />
      </div>

      <div className="screen-body py-4">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Type Selector (Custom Segmented Control) */}
          <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
            {(["expenses", "income", "transfer"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${
                  type === t 
                    ? "bg-[hsl(var(--primary))] text-white shadow-lg" 
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Amount Input */}
          <div className="relative">
             <div className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-500">₹</div>
             <input
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 pl-10 pr-4 text-3xl font-bold text-[hsl(var(--primary))] outline-none focus:border-[hsl(var(--primary))]/30 transition-all placeholder:text-gray-800"
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                min="0"
                step="0.01"
              />
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* Notes */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest ml-1">Notes</label>
              <textarea
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-gray-200 outline-none focus:border-[hsl(var(--primary))]/30 transition-all placeholder:text-gray-700"
                placeholder="What was this for?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            {/* Date */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest ml-1">Date</label>
              <input
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-gray-200 outline-none focus:border-[hsl(var(--primary))]/30 transition-all"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Accounts Section */}
          {(type === "expenses" || type === "transfer") && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest ml-1">
                {type === "transfer" ? "From Account" : "Paid From"}
              </label>
              <select
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-gray-200 outline-none focus:border-[hsl(var(--primary))]/30 transition-all appearance-none"
                value={fromAccountId}
                onChange={e => setFromAccountId(e.target.value ? Number(e.target.value) : "")}
                required={type === "transfer"}
              >
                <option value="" className="bg-[#1c1f26]">Select account...</option>
                {allAccounts?.map(a => <option key={a.id} value={a.id} className="bg-[#1c1f26]">{a.name}</option>)}
              </select>
            </div>
          )}

          {(type === "income" || type === "transfer") && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest ml-1">
                {type === "transfer" ? "To Account" : "Deposited To"}
              </label>
              <select
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-gray-200 outline-none focus:border-[hsl(var(--primary))]/30 transition-all appearance-none"
                value={toAccountId}
                onChange={e => setToAccountId(e.target.value ? Number(e.target.value) : "")}
                required={type === "transfer"}
              >
                <option value="" className="bg-[#1c1f26]">Select account...</option>
                {allAccounts?.map(a => <option key={a.id} value={a.id} className="bg-[#1c1f26]">{a.name}</option>)}
              </select>
            </div>
          )}

          {/* Tags */}
          <div className="space-y-3 pt-2">
            <label className="text-[10px] font-bold text-gray-600 uppercase tracking-widest ml-1">Tags</label>
            <div className="flex flex-wrap gap-2">
              {allTags?.map((tag) => {
                const selected = selectedTags.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border transition-all ${
                      selected 
                        ? "bg-[hsl(var(--primary))]/10 border-[hsl(var(--primary))]/40 text-[hsl(var(--primary))]" 
                        : "bg-white/5 border-white/5 text-gray-500 hover:text-gray-300"
                    }`}
                  >
                    {tag.name}
                  </button>
                );
              })}
            </div>
          </div>

          {error && <p className="text-xs font-bold text-[hsl(0_80%_65%)] uppercase tracking-widest text-center mt-2">{error}</p>}

          <button
            type="submit"
            className="w-full bg-white text-black font-extrabold uppercase tracking-[0.2em] py-5 rounded-2xl shadow-2xl shadow-white/5 hover:scale-[1.01] active:scale-[0.98] transition-all mt-4 disabled:opacity-50"
            disabled={saving}
          >
            {saving ? "Saving..." : isEdit ? "Update Transaction" : "Create Transaction"}
          </button>
        </form>
      </div>
    </div>
  );
}
