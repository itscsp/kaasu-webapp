import { useEffect, useState } from "react";
import { api, Transaction, TransactionBody } from "@/lib/api";
import { useData } from "@/context/DataContext";
import { X, Plus } from "lucide-react";

interface Props {
  budgetId: number;
  transaction?: Transaction;
  onSave: () => void;
  onBack: () => void;
}

export default function TransactionForm({ budgetId, transaction, onSave, onBack }: Props) {
  const { tags: allTags, fetchTags, invalidateTags, accounts: allAccounts, fetchAccounts } = useData();
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
  const [accountId, setAccountId] = useState<number | "">(
    transaction?.account_id || ""
  );
  const [toAccountId, setToAccountId] = useState<number | "">(
    transaction?.to_account_id || ""
  );
  const [selectedTags, setSelectedTags] = useState<number[]>(
    transaction?.tags || []
  );
  const [newTagName, setNewTagName] = useState("");
  const [creatingTag, setCreatingTag] = useState(false);
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

  async function handleCreateTag() {
    const name = newTagName.trim();
    if (!name) return;
    setCreatingTag(true);
    try {
      const created = await api.tags.create(name);
      invalidateTags();
      await fetchTags(true);
      setSelectedTags((prev) => [...prev, created.id]);
      setNewTagName("");
    } catch {
      setError("Failed to create tag");
    } finally {
      setCreatingTag(false);
    }
  }

  function handleNewTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCreateTag();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!amount || isNaN(Number(amount))) {
      setError("Please enter a valid amount");
      return;
    }
    setSaving(true);
    const body: TransactionBody = {
      date,
      amount: Number(amount),
      type,
      notes: notes || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      account_id: accountId ? Number(accountId) : undefined,
      to_account_id: type === "transfer" && toAccountId ? Number(toAccountId) : undefined,
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
          {isEdit ? "Edit Transaction" : "Add Transaction"}
        </span>
        <span className="w-12" />
      </div>

      <div className="screen-body">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="sketch-field">
            <select
              className="sketch-select"
              value={type}
              onChange={(e) => setType(e.target.value as "income" | "expenses" | "transfer")}
            >
              <option value="expenses">Expenses</option>
              <option value="income">Income</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>

          <div className="sketch-field">
            <select
              className="sketch-select"
              value={accountId}
              onChange={e => setAccountId(e.target.value ? Number(e.target.value) : "")}
            >
              <option value="">{type === "transfer" ? "Select Source Account" : "Select Account"}</option>
              {allAccounts?.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          {type === "transfer" && (
            <div className="sketch-field">
              <select
                className="sketch-select"
                value={toAccountId}
                onChange={e => setToAccountId(e.target.value ? Number(e.target.value) : "")}
              >
                <option value="">Select Destination Account</option>
                {allAccounts?.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
          )}

          <div className="sketch-field">
            <input
              className="sketch-input"
              type="number"
              placeholder="Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min="0"
              step="0.01"
            />
          </div>

          <div className="sketch-field">
            <textarea
              className="sketch-textarea"
              placeholder="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="sketch-field">
            <input
              className="sketch-input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* Tags section — always visible */}
          <div className="sketch-field">
            <label className="field-label mb-2 block">Tags</label>

            {/* Existing tags to select */}
            {allTags && allTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {allTags.map((tag) => {
                  const selected = selectedTags.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`tag-badge cursor-pointer ${selected ? "tag-badge-selected" : ""}`}
                    >
                      {selected && <X size={10} className="inline mr-0.5" />}
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Inline new tag creation */}
            <div className="flex gap-2">
              <input
                className="sketch-input flex-1 text-sm py-1.5"
                type="text"
                placeholder="New tag…"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={handleNewTagKeyDown}
              />
              <button
                type="button"
                onClick={handleCreateTag}
                disabled={creatingTag || !newTagName.trim()}
                className="sketch-btn flex items-center gap-1 px-3 py-1.5 text-sm whitespace-nowrap"
              >
                <Plus size={13} />
                {creatingTag ? "…" : "Add Tag"}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            className="sketch-btn sketch-btn-primary mt-1"
            disabled={saving}
          >
            {saving ? "Saving…" : isEdit ? "Update" : "Add"}
          </button>
        </form>
      </div>
    </div>
  );
}
