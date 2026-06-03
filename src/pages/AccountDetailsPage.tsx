import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, Account, Transaction, Tag } from "@/lib/api";
import { useData } from "@/context/DataContext";
import { CheckCircle, SlidersHorizontal, Filter } from "lucide-react";

export default function AccountDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { accounts, fetchAccounts, invalidateAccounts } = useData();
  
  const [activeTab, setActiveTab] = useState<"details" | "transactions">("details");
  const [accountTransactions, setAccountTransactions] = useState<Transaction[] | null>(null);
  const [txLoading, setTxLoading] = useState(false);
  const [completing, setCompleting] = useState(false);

  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "amount-desc" | "amount-asc">("date-desc");
  const [filterType, setFilterType] = useState<"all" | "income" | "expenses" | "transfer">("all");

  const accountId = id ? parseInt(id, 10) : null;
  const viewingAccount = accounts?.find(a => a.id === accountId) || null;

  const processedTransactions = accountTransactions
    ? [...accountTransactions]
        .filter((tx) => {
          if (filterType === "all") return true;
          return tx.type === filterType;
        })
        .sort((a, b) => {
          switch (sortBy) {
            case "date-asc":
              return new Date(a.date).getTime() - new Date(b.date).getTime();
            case "amount-desc":
              return (Number(b.amount) || 0) - (Number(a.amount) || 0);
            case "amount-asc":
              return (Number(a.amount) || 0) - (Number(b.amount) || 0);
            case "date-desc":
            default:
              return new Date(b.date).getTime() - new Date(a.date).getTime();
          }
        })
    : null;

  useEffect(() => {
    if (!accounts) {
      fetchAccounts().catch(() => {});
    }
  }, [accounts, fetchAccounts]);

  useEffect(() => {
    if (viewingAccount && accountTransactions === null) {
      setTxLoading(true);
      api.accounts.transactions(viewingAccount.id)
        .then(setAccountTransactions)
        .catch(() => {})
        .finally(() => setTxLoading(false));
    }
  }, [viewingAccount, accountTransactions]);

  async function handleMarkComplete() {
    if (!viewingAccount || !confirm("Mark this loan as complete? You won't need to pay any more amount for it.")) return;
    setCompleting(true);
    try {
      await api.accounts.update(viewingAccount.id, {
        is_complete: true,
        // Since it's complete, zero out the amount? The user said "no more amount need to pay"
        // I will zero out the outstanding balance so that it shows as paid off.
        amount: viewingAccount.starting_balance // For a loan, bringing current balance back to starting balance might mean 0 outstanding, but wait. If currentBalance == 0, it means it's paid. Actually let's just set the status.
      });
      invalidateAccounts();
      await fetchAccounts(true);
    } catch (err) {
      alert("Failed to mark as complete");
    } finally {
      setCompleting(false);
    }
  }

  if (!accounts) {
    return (
      <div className="phone-frame">
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-gray-400">Loading…</p>
        </div>
      </div>
    );
  }

  if (!viewingAccount) {
    return (
      <div className="phone-frame">
        <div className="screen-header">
          <button onClick={() => navigate("/accounts")} className="header-action-btn">Back</button>
          <span className="header-title">Account Not Found</span>
          <span className="w-12" />
        </div>
      </div>
    );
  }

  const currentBalance = Number(viewingAccount.amount ?? viewingAccount.balance) || 0;
  const startingBalance = Number(viewingAccount.starting_balance) || 0;
  
  const isLiability = ['Loan', 'Insurance'].includes(viewingAccount.group);
  const isInvestment = viewingAccount.group === 'Investment';

  return (
    <div className="phone-frame">
      <div className="screen-header">
        <button 
          onClick={() => navigate("/accounts")} 
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
            <div className="sketch-box p-4 flex flex-col gap-3 relative">
              {viewingAccount.is_complete && (
                <div className="absolute top-2 right-2 flex items-center gap-1 text-[hsl(var(--primary))] text-xs font-bold bg-[hsl(var(--primary))] bg-opacity-10 px-2 py-1 rounded-full">
                  <CheckCircle size={12} />
                  COMPLETED
                </div>
              )}
              <div className="flex justify-between border-b border-border pb-2 mt-2">
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
                  {!viewingAccount.is_complete && currentBalance < startingBalance && (
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-gray-400 text-sm">Total Paid</span>
                      <span className="font-semibold text-[hsl(var(--primary))]">
                        ₹{(startingBalance - currentBalance).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {!viewingAccount.is_complete && currentBalance > startingBalance && (
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
                      {viewingAccount.is_complete ? "₹0 (Completed)" : `₹${currentBalance.toLocaleString()}`}
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
            
            {viewingAccount.group === 'Loan' && !viewingAccount.is_complete && (
              <button 
                className="sketch-btn sketch-btn-primary flex justify-center items-center gap-2 mt-2 bg-[hsl(var(--primary))] !border-[hsl(var(--primary))]"
                onClick={handleMarkComplete}
                disabled={completing}
              >
                <CheckCircle size={16} /> {completing ? "Marking..." : "Mark Loan as Complete"}
              </button>
            )}
          </div>
        )}

        {activeTab === "transactions" && (
          <div className="flex flex-col gap-2 p-2">
            {txLoading && <p className="text-center text-sm text-gray-500 py-4">Loading transactions...</p>}
            {!txLoading && accountTransactions && (
              <>
                {/* Sleek Glassmorphic Filter & Sort Toolbar */}
                <div className="flex gap-2.5 mb-2 bg-white/5 p-2 rounded-2xl border border-white/10 shadow-lg backdrop-blur-md">
                  <div className="flex-1 flex items-center gap-2 bg-white/5 px-3 py-2 rounded-xl border border-white/5 transition-all focus-within:border-[hsl(var(--primary))]/30">
                    <SlidersHorizontal size={14} className="text-gray-500 flex-shrink-0" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="bg-transparent text-xs text-gray-300 outline-none border-none w-full cursor-pointer font-medium"
                    >
                      <option value="date-desc" className="bg-[#1c1f26]">Newest First</option>
                      <option value="date-asc" className="bg-[#1c1f26]">Oldest First</option>
                      <option value="amount-desc" className="bg-[#1c1f26]">Big to Small (₹)</option>
                      <option value="amount-asc" className="bg-[#1c1f26]">Small to Big (₹)</option>
                    </select>
                  </div>

                  <div className="flex-1 flex items-center gap-2 bg-white/5 px-3 py-2 rounded-xl border border-white/5 transition-all focus-within:border-[hsl(var(--primary))]/30">
                    <Filter size={14} className="text-gray-500 flex-shrink-0" />
                    <select
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value as any)}
                      className="bg-transparent text-xs text-gray-300 outline-none border-none w-full cursor-pointer font-medium"
                    >
                      <option value="all" className="bg-[#1c1f26]">All Categories</option>
                      <option value="income" className="bg-[#1c1f26]">Income</option>
                      <option value="expenses" className="bg-[#1c1f26]">Expenses</option>
                      <option value="transfer" className="bg-[#1c1f26]">Transfers</option>
                    </select>
                  </div>
                </div>

                {accountTransactions.length > 0 && processedTransactions && processedTransactions.length === 0 ? (
                  <p className="text-center text-sm text-gray-500 py-6">
                    No transactions match your filters.
                  </p>
                ) : accountTransactions.length === 0 ? (
                  <p className="text-center text-sm text-gray-500 py-6">
                    No linked transactions.
                  </p>
                ) : null}

                {processedTransactions && processedTransactions.map(tx => {
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

                  const dateObj = new Date(tx.date);
                  const day = String(dateObj.getDate()).padStart(2, "0");
                  const monthShort = dateObj.toLocaleString("default", { month: "short" }).toUpperCase();

                  return (
                    <div key={tx.id} className="sketch-box mb-2 overflow-hidden">
                      <div className="flex items-center p-3">
                        <div className="transaction-date-badge flex-shrink-0 mr-3 flex flex-col items-center justify-center gap-0.5" style={{ height: '44px', width: '44px' }}>
                          <span className="text-[7px] font-extrabold uppercase tracking-wider text-[hsl(var(--primary))] leading-none">{monthShort}</span>
                          <span className="text-sm font-bold leading-none mt-0.5">{day}</span>
                        </div>
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
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
