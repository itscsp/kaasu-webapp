import { useEffect, useState } from "react";
import { api, Account, Transaction, Tag } from "@/lib/api";
import { useData } from "@/context/DataContext";
import { Plus, Edit2, Trash2, Link as LinkIcon } from "lucide-react";

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

  const [activeTab, setActiveTab] = useState<"details" | "transactions">("details");
  const [accountTransactions, setAccountTransactions] = useState<Transaction[] | null>(null);
  const [txLoading, setTxLoading] = useState(false);
  const [viewingAccount, setViewingAccount] = useState<Account | null>(null);

  useEffect(() => {
    fetchAccounts().catch(() => setError("Failed to load accounts"));
  }, [fetchAccounts]);

  useEffect(() => {
    if (accounts !== null) {
      setLoading(false);
    }
  }, [accounts]);

  useEffect(() => {
    if (viewingAccount && activeTab === "transactions" && accountTransactions === null) {
      setTxLoading(true);
      api.accounts.transactions(viewingAccount.id)
        .then(setAccountTransactions)
        .catch(() => {})
        .finally(() => setTxLoading(false));
    }
  }, [viewingAccount, activeTab, accountTransactions]);

  function resetForm() {
    setName("");
    setGroup("Accounts");
    setAmount("");
    setDescription("");
    setEditingId(null);
    setShowForm(false);
    setError("");
    setActiveTab("details");
    setAccountTransactions(null);
  }

  function handleEdit(acc: Account) {
    setName(acc.name);
    setGroup(acc.group);
    setAmount(String(acc.amount ?? acc.balance ?? 0));
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

  if (viewingAccount) {
    const currentBalance = Number(viewingAccount.amount ?? viewingAccount.balance) || 0;
    let totalRemoved = 0;
    
    if (accountTransactions) {
      accountTransactions.forEach(tx => {
        let multiplier = 1;
        const group = viewingAccount.group;
        if (tx.type === 'transfer') {
          if (tx.account_id === viewingAccount.id) {
            multiplier = ['Loan', 'Insurance'].includes(group) ? 1 : -1;
          } else if (tx.to_account_id === viewingAccount.id) {
            multiplier = ['Loan', 'Insurance'].includes(group) ? -1 : 1;
          }
        } else if (tx.type === 'expenses') {
          multiplier = ['Investment'].includes(group) ? 1 : -1;
        } else if (tx.type === 'income') {
          multiplier = ['Investment'].includes(group) ? -1 : 1;
        }
        
        const impactAmount = Number(tx.amount) * multiplier;
        if (impactAmount < 0) totalRemoved += Math.abs(impactAmount);
      });
    }

    return (
      <div className="phone-frame">
        <div className="screen-header">
          <button 
            onClick={() => { setViewingAccount(null); setAccountTransactions(null); setActiveTab("details"); }} 
            className="header-action-btn"
          >
            Back
          </button>
          <span className="header-title">{viewingAccount.name}</span>
          <span className="w-12" />
        </div>

        <div className="tab-bar">
          <button 
            className={`tab-btn ${activeTab === 'details' ? 'tab-btn-active' : ''}`} 
            onClick={() => setActiveTab("details")}
          >
            Details
          </button>
          <button 
            className={`tab-btn ${activeTab === 'transactions' ? 'tab-btn-active' : ''}`} 
            onClick={() => setActiveTab("transactions")}
          >
            Transactions
          </button>
        </div>

        <div className="screen-body">
          {activeTab === "details" && (
            <div className="flex flex-col gap-4 p-2">
              <div className="sketch-box p-4 flex flex-col gap-3">
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-gray-400 text-sm">Account Name</span>
                  <span className="font-medium">{viewingAccount.name}</span>
                </div>
                <div className="flex justify-between border-b border-border pb-2">
                  <span className="text-gray-400 text-sm">Group</span>
                  <span className="font-medium">{viewingAccount.group}</span>
                </div>
                
                {['Loan', 'Insurance'].includes(viewingAccount.group) ? (
                  <>
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-gray-400 text-sm">Total loan taken</span>
                      <span className="font-semibold text-[hsl(var(--destructive))]">
                        ₹{(currentBalance + totalRemoved).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-gray-400 text-sm">Total amount paid till now</span>
                      <span className="font-semibold text-[hsl(var(--primary))]">
                        ₹{totalRemoved.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-gray-400 text-sm">Total outstanding</span>
                      <span className="font-semibold text-[hsl(var(--destructive))]">
                        ₹{currentBalance.toLocaleString()}
                      </span>
                    </div>
                  </>
                ) : viewingAccount.group === 'Investment' ? (
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-gray-400 text-sm">Total investment</span>
                    <span className="font-semibold text-[hsl(var(--primary))]">
                      ₹{currentBalance.toLocaleString()}
                    </span>
                  </div>
                ) : (
                  <div className="flex justify-between border-b border-border pb-2">
                    <span className="text-gray-400 text-sm">Total amount in bank</span>
                    <span className={`font-semibold ${currentBalance >= 0 ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--destructive))]"}`}>
                      ₹{currentBalance.toLocaleString()}
                    </span>
                  </div>
                )}
                
                <div className="flex flex-col gap-1">
                  <span className="text-gray-400 text-sm">Description</span>
                  <span className="text-sm">{viewingAccount.description || "No description provided."}</span>
                </div>
              </div>
              
              <button 
                className="sketch-btn sketch-btn-primary flex justify-center items-center gap-2 mt-4"
                onClick={() => {
                  setViewingAccount(null);
                  handleEdit(viewingAccount);
                }}
              >
                <Edit2 size={16} /> Edit Account
              </button>
            </div>
          )}

          {activeTab === "transactions" && (
            <div className="flex flex-col gap-2">
              {txLoading && <p className="text-center text-sm text-gray-500 py-4">Loading transactions...</p>}
              {!txLoading && accountTransactions && accountTransactions.length === 0 && (
                <p className="text-center text-sm text-gray-500 py-4">No linked transactions.</p>
              )}
              {!txLoading && accountTransactions && accountTransactions.map(tx => (
                <div key={tx.id} className="transaction-item mb-2">
                  <div className="transaction-row !cursor-default">
                    <div className="transaction-date-badge">{new Date(tx.date).getDate()}</div>
                    <div className="transaction-amount">
                      <div className="text-sm font-medium text-foreground">{tx.notes || "No notes"}</div>
                      <div className={`text-xs ${(tx.type === 'income') ? "text-[hsl(var(--primary))]" : tx.type === 'expenses' ? "text-[hsl(var(--destructive))]" : "text-gray-400"}`}>
                        {tx.type === 'income' ? '+' : tx.type === 'expenses' ? '-' : ''}₹{Math.abs(Number(tx.amount)).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  {tx.tag_objects && tx.tag_objects.length > 0 && (
                    <div className="px-3 pb-3 flex flex-wrap gap-1">
                      {tx.tag_objects.map((tag: Tag) => (
                        <span key={tag.id} className="tag-badge text-[10px] py-0.5 px-2">{tag.name}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
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
                <div 
                  key={acc.id} 
                  className="sketch-box p-3 flex justify-between items-center group cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => setViewingAccount(acc)}
                >
                  <div className="flex flex-col">
                    <span className="font-medium flex items-center gap-2">
                      {acc.name}
                      {acc.is_connected && (
                        <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded flex items-center gap-1" title={`Linked to ${acc.transaction_count} transactions`}>
                          <LinkIcon size={10} /> {acc.transaction_count}
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-gray-400">{acc.description || "No description"}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`font-semibold ${(Number(acc.amount ?? acc.balance) || 0) >= 0 ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--destructive))]"}`}>
                      ₹{(Number(acc.amount ?? acc.balance) || 0).toLocaleString()}
                    </span>
                    <div className="flex gap-2 text-gray-400 ml-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleEdit(acc); }} 
                        className="hover:text-white"
                      >
                        <Edit2 size={14}/>
                      </button>
                      {!acc.is_connected && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDelete(acc.id); }} 
                          className="hover:text-red-500"
                        >
                          <Trash2 size={14}/>
                        </button>
                      )}
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
