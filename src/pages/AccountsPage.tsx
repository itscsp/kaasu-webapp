import { useEffect, useState } from "react";
import { api, Account } from "@/lib/api";
import { useData } from "@/context/DataContext";
import { Plus, Edit2, Trash2, Link as LinkIcon, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AccountsPage() {
  const { accounts, fetchAccounts, invalidateAccounts } = useData();
  const navigate = useNavigate();
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
    setAmount(String(acc.starting_balance ?? acc.amount ?? acc.balance ?? 0));
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
              <label className="field-label">Starting Balance</label>
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

  const groupDisplayMap: Record<string, string> = {
    "Accounts": "Bank / Accounts",
    "Loan": "Loan",
    "Investment": "Investment",
    "Cash": "Cash",
    "Saving": "Saving",
    "Insurance": "Insurance"
  };

  return (
    <div className="phone-frame">
      <div className="screen-header">
        <button onClick={() => navigate("/")} className="header-action-btn">Back</button>
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
            <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 ml-1">
              {groupDisplayMap[grp] || grp}
            </h3>
            <div className="flex flex-col gap-2">
              {groupedAccounts[grp].map(acc => {
                const groupClass = acc.group.toLowerCase().replace(' ', '-');
                return (
                  <div 
                    key={acc.id} 
                    className={`account-card account-card-${groupClass}`}
                    onClick={() => navigate(`/accounts/${acc.id}`)}
                  >
                    <div className="account-info">
                      <div className="flex items-center gap-2">
                        <span className="account-name">{acc.name}</span>
                        {acc.is_complete && <CheckCircle size={12} className="text-[hsl(var(--primary))]" />}
                      </div>
                      <div className="account-meta">
                        <span className={`group-badge group-badge-${groupClass}`}>
                          {acc.group}
                        </span>
                        {acc.is_connected && (
                          <span className="txn-chip">
                            <LinkIcon size={10} /> {acc.transaction_count} txn
                          </span>
                        )}
                        <span className="account-desc">{acc.description}</span>
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`account-amount ${acc.is_complete ? 'opacity-50 line-through' : ''}`}>
                          ₹{(Number(acc.amount ?? acc.balance) || 0).toLocaleString()}
                        </span>
                        <div className="account-actions">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleEdit(acc); }} 
                            className="action-btn"
                          >
                            <Edit2 size={16}/>
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {acc.is_connected ? (
                          <div className="text-gray-600 opacity-40">
                             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                          </div>
                        ) : (
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(acc.id); }} 
                            className="text-gray-600 hover:text-red-500 opacity-40 hover:opacity-100 transition-all"
                          >
                            <Trash2 size={14}/>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
