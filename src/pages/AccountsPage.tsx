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
  const [amount, setAmount] = useState(""); // This is Starting Balance in the form
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
    if (viewingAccount && accountTransactions === null) {
      setTxLoading(true);
      api.accounts.transactions(viewingAccount.id)
        .then(setAccountTransactions)
        .catch(() => {})
        .finally(() => setTxLoading(false));
    }
  }, [viewingAccount, accountTransactions]);

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
    setAmount(String(acc.starting_balance ?? acc.amount ?? 0));
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
          amount: Number(amount), // Note: The backend currently maps 'amount' to '_bt_account_amount'
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
    const currentBalance = Number(viewingAccount.amount) || 0;
    const startingBalance = Number(viewingAccount.starting_balance) || 0;
    
    // Group analysis
    const isLiability = ['Loan', 'Insurance'].includes(viewingAccount.group);
    const isInvestment = viewingAccount.group === 'Investment';

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
                
                {isLiability ? (
                  <>
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-gray-400 text-sm">Starting Balance (Debt)</span>
                      <span className="font-semibold text-[hsl(var(--destructive))]">
                        ₹{startingBalance.toLocaleString()}
                      </span>
                    </div>
                    {currentBalance < startingBalance && (
                      <div className="flex justify-between border-b border-border pb-2">
                        <span className="text-gray-400 text-sm">Total Paid</span>
                        <span className="font-semibold text-[hsl(var(--primary))]">
                          ₹{(startingBalance - currentBalance).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {currentBalance > startingBalance && (
                      <div className="flex justify-between border-b border-border pb-2">
                        <span className="text-gray-400 text-sm">Additional Borrowing</span>
                        <span className="font-semibold text-[hsl(var(--destructive))]">
                          ₹{(currentBalance - startingBalance).toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-gray-400 text-sm">Current Outstanding</span>
                      <span className="font-semibold text-[hsl(var(--destructive))]">
                        ₹{currentBalance.toLocaleString()}
                      </span>
                    </div>
                  </>
                ) : isInvestment ? (
                  <>
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-gray-400 text-sm">Starting Investment</span>
                      <span className="font-semibold text-[hsl(var(--primary))]">
                        ₹{startingBalance.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-gray-400 text-sm">Current Value</span>
                      <span className="font-semibold text-[hsl(var(--primary))]">
                        ₹{currentBalance.toLocaleString()}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-gray-400 text-sm">Starting Balance</span>
                      <span className="font-semibold">
                        ₹{startingBalance.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-gray-400 text-sm">Current Balance</span>
                      <span className={`font-semibold ${currentBalance >= 0 ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--destructive))]"}`}>
                        ₹{currentBalance.toLocaleString()}
                      </span>
                    </div>
                  </>
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
              {!txLoading && accountTransactions && accountTransactions.map(tx => {
                // New logic: from = minus, to = plus (adjusted by group in backend, but here we just show the impact)
                const isFrom = tx.from_account_id === viewingAccount.id;
                const isTo = tx.to_account_id === viewingAccount.id;
                
                let multiplier = 0;
                if (isTo) multiplier = isLiability ? -1 : 1;
                if (isFrom) multiplier = isLiability ? 1 : -1;
                
                const impactAmount = Number(tx.amount) * multiplier;
                const sign = impactAmount > 0 ? '+' : impactAmount < 0 ? '-' : '';
                const colorClass = impactAmount > 0 ? "text-[hsl(var(--primary))]" : impactAmount < 0 ? "text-[hsl(var(--destructive))]" : "text-[hsl(var(--muted-foreground))]";
                
                const otherAccountId = isFrom ? tx.to_account_id : tx.from_account_id;
                const otherAccount = otherAccountId ? accounts?.find(a => a.id === otherAccountId) : null;

                return (
                <div key={tx.id} className="sketch-box mb-2 overflow-hidden">
                  <div className="flex items-center p-3">
                    <div className="transaction-date-badge flex-shrink-0 mr-3">{new Date(tx.date).getDate()}</div>
                    <div className="flex flex-col flex-grow min-w-0">
                      <span className="text-sm font-medium text-[hsl(var(--foreground))] truncate">
                        {tx.notes || (tx.type === 'transfer' ? "Transfer" : "No notes")}
                      </span>
                      {otherAccount && (
                        <span className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5 truncate">
                          {isFrom ? "To |" : "From |"} {otherAccount.name}
                        </span>
                      )}
                    </div>
                    <div className={`text-sm font-semibold flex-shrink-0 ml-3 ${colorClass}`}>
                      {sign}₹{Math.abs(impactAmount).toLocaleString()}
                    </div>
                  </div>
                  {tx.tag_objects && tx.tag_objects.length > 0 && (
                    <div className="px-3 pb-3 pt-1 flex flex-wrap gap-1 border-t border-[hsl(var(--border))] border-opacity-50">
                      {tx.tag_objects.map((tag: Tag) => (
                        <span key={tag.id} className="tag-badge text-[10px] py-[2px] px-2">{tag.name}</span>
                      ))}
                    </div>
                  )}
                </div>
              )})}
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
                    onClick={() => setViewingAccount(acc)}
                  >
                    <div className="account-info">
                      <span className="account-name">{acc.name}</span>
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
                        <span className="account-amount">
                          ₹{(Number(acc.amount) || 0).toLocaleString()}
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
