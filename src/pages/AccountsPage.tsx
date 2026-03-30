import { useEffect, useState } from "react";
import { api, Account } from "@/lib/api";
import { useData } from "@/context/DataContext";
import { Plus, Edit2, Trash2 } from "lucide-react";

interface Props {
  onBack: () => void;
}

export default function AccountsPage({ onBack }: Props) {
  const { accounts, fetchAccounts, invalidateAccounts } = useData();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  
  // form state
  const [name, setName] = useState("");
  const [group, setGroup] = useState<"Cash"|"Accounts"|"Investment"|"Loan"|"Insurance"|"Saving">("Accounts");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);

  useEffect(() => {
    fetchAccounts().catch(() => setError("Failed to load accounts"));
  }, [fetchAccounts]);

  useEffect(() => {
    if (accounts !== null) {
      setLoading(false);
    }
  }, [accounts]);

  function resetForm() {
    setName("");
    setGroup("Accounts");
    setAmount("");
    setDescription("");
    setEditingId(null);
    setShowForm(false);
    setError("");
  }

  function handleEdit(acc: Account) {
    setName(acc.name);
    setGroup(acc.group);
    setAmount(String(acc.balance)); // showing balance as amount to edit (note: API might have special behavior here)
    setDescription(acc.description || "");
    setEditingId(acc.id);
    setShowForm(true);
  }

  async function handleDelete(id: number) {
    if (!confirm("Are you sure?")) return;
    try {
      await api.accounts.delete(id);
      invalidateAccounts();
      await fetchAccounts(true);
    } catch {
      alert("Failed to delete account");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !amount) return;
    
    try {
      if (editingId) {
        await api.accounts.update(editingId, {
          name: name.trim(),
          group,
          amount: Number(amount),
          description: description.trim() || undefined,
        });
      } else {
        await api.accounts.create({
          name: name.trim(),
          group,
          amount: Number(amount),
          description: description.trim() || undefined,
        });
      }
      invalidateAccounts();
      await fetchAccounts(true);
      resetForm();
    } catch (err: any) {
      setError(err.message || "Failed to save account");
    }
  }

  if (showForm) {
    return (
      <div className="phone-frame">
        <div className="screen-header">
          <button onClick={resetForm} className="header-action-btn">Back</button>
          <span className="header-title">{editingId ? "Edit Account" : "Add Account"}</span>
          <span className="w-12" />
        </div>
        <div className="screen-body">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="sketch-field">
              <label className="field-label">Name</label>
              <input className="sketch-input" required value={name} onChange={e => setName(e.target.value)} placeholder="e.g. HDFC Bank" />
            </div>
            <div className="sketch-field">
              <label className="field-label">Group</label>
              <select className="sketch-select" value={group} onChange={(e: any) => setGroup(e.target.value)}>
                <option value="Cash">Cash</option>
                <option value="Accounts">Accounts (Bank)</option>
                <option value="Saving">Saving</option>
                <option value="Investment">Investment</option>
                <option value="Loan">Loan</option>
                <option value="Insurance">Insurance</option>
              </select>
            </div>
            <div className="sketch-field">
              <label className="field-label">Amount</label>
              <input className="sketch-input" type="number" step="0.01" required value={amount} onChange={e => setAmount(e.target.value)} />
            </div>
            <div className="sketch-field">
              <label className="field-label">Description (optional)</label>
              <input className="sketch-input" value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
            <button className="sketch-btn sketch-btn-primary mt-2 flex justify-center items-center gap-2">
              Save Account
            </button>
          </form>
        </div>
      </div>
    );
  }

  const groupedAccounts = (accounts || []).reduce((acc, curr) => {
    if (!acc[curr.group]) acc[curr.group] = [];
    acc[curr.group].push(curr);
    return acc;
  }, {} as Record<string, Account[]>);

  return (
    <div className="phone-frame">
      <div className="screen-header">
        <button onClick={onBack} className="header-action-btn">Back</button>
        <span className="header-title">Accounts</span>
        <button className="sketch-btn flex items-center gap-1 text-xs px-2 py-1" onClick={() => setShowForm(true)}>
          <Plus size={12} /> Add
        </button>
      </div>

      <div className="screen-body">
        {loading && <div className="p-4 text-center text-sm text-gray-400">Loading…</div>}
        {error && <div className="p-4 text-sm text-red-500">{error}</div>}

        {!loading && Object.keys(groupedAccounts).length === 0 && (
          <p className="text-center text-sm text-gray-500 py-6">No accounts yet. Tap Add to create one.</p>
        )}

        {!loading && Object.keys(groupedAccounts).map(grp => (
          <div key={grp} className="mb-6">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{grp}</h3>
            <div className="flex flex-col gap-2">
              {groupedAccounts[grp].map(acc => (
                <div key={acc.id} className="sketch-box p-3 flex justify-between items-center group">
                  <div className="flex flex-col">
                    <span className="font-medium">{acc.name}</span>
                    <span className="text-xs text-gray-400">{acc.description || "No description"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-semibold ${acc.balance >= 0 ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--destructive))]"}`}>
                      ₹{acc.balance.toLocaleString()}
                    </span>
                    <div className="flex gap-2 text-gray-400 ml-2">
                      <button onClick={() => handleEdit(acc)} className="hover:text-white"><Edit2 size={14}/></button>
                      <button onClick={() => handleDelete(acc.id)} className="hover:text-red-500"><Trash2 size={14}/></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
