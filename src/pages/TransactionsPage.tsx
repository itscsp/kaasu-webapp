import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { api, Transaction, Tag, Account } from "@/lib/api";
import { useData } from "@/context/DataContext";
import { 
  ChevronDown, 
  ChevronUp, 
  ArrowRight, 
  Filter, 
  Calendar, 
  Tag as TagIcon, 
  Landmark, 
  ArrowUpDown, 
  Search, 
  X, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowLeftRight 
} from "lucide-react";
import TransactionForm from "@/components/TransactionForm";

// Local Helper Component for Expandable Transaction Row
interface TxRowProps {
  transaction: Transaction;
  accounts: Account[] | null;
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
}

function ExpandableTransactionRow({ transaction, accounts, onEdit, onDelete }: TxRowProps) {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const sign = transaction.type === "transfer" ? "" : transaction.type === "income" ? "+" : "-";
  
  // Format Date
  const dateObj = new Date(transaction.date);
  const day = String(dateObj.getDate()).padStart(2, "0");
  const monthShort = dateObj.toLocaleString("default", { month: "short" }).toUpperCase();
  const fullDateFormatted = dateObj.toLocaleDateString("default", { 
    weekday: "short", 
    year: "numeric", 
    month: "long", 
    day: "numeric" 
  });

  const fromAccount = accounts?.find(a => a.id === transaction.from_account_id);
  const toAccount = accounts?.find(a => a.id === transaction.to_account_id);

  // Type Color Configuration
  let typeColorClass = "text-gray-400";
  let TypeIcon = ArrowLeftRight;
  
  if (transaction.type === "income") {
    typeColorClass = "text-[hsl(150_70%_55%)]";
    TypeIcon = ArrowDownLeft;
  } else if (transaction.type === "expenses") {
    typeColorClass = "text-[hsl(0_80%_65%)]";
    TypeIcon = ArrowUpRight;
  } else if (transaction.type === "transfer") {
    typeColorClass = "text-[hsl(45_95%_55%)]";
    TypeIcon = ArrowLeftRight;
  }

  return (
    <div className="transaction-item transition-all hover:border-white/20">
      <button
        className="transaction-row"
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Customized Date Badge */}
        <div className="transaction-date-badge flex flex-col items-center justify-center gap-0.5 !bg-white/5 border border-white/5" style={{ height: "46px", width: "46px" }}>
          <span className="text-[8px] font-extrabold uppercase tracking-wider text-[hsl(var(--primary))] leading-none">{monthShort}</span>
          <span className="text-sm font-bold text-gray-200 leading-none">{day}</span>
        </div>

        <div className="transaction-info">
          <div className="transaction-notes font-medium text-gray-200">
            {transaction.notes || (transaction.type === "transfer" ? "Transfer" : "No description")}
          </div>
          <div className={`transaction-amount ${typeColorClass} flex items-center gap-1.5`}>
            <TypeIcon size={12} className="opacity-70" />
            <span>{sign} ₹{Math.abs(Number(transaction.amount) || 0).toLocaleString()}</span>
            {transaction.type === "transfer" && <span className="badge-transfer">Transfer</span>}
          </div>
        </div>

        <div className="text-gray-500 hover:text-gray-300 transition-colors">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </button>

      {expanded && (
        <div className="transaction-detail border-t border-white/5 bg-white/[0.01] px-4 py-4 flex flex-col gap-3">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-white/5 p-2.5 rounded-xl border border-white/5 flex flex-col gap-0.5">
              <span className="text-[8px] font-bold uppercase tracking-widest text-gray-500">Transaction Date</span>
              <span className="text-gray-200 font-medium">{fullDateFormatted}</span>
            </div>
            <div className="bg-white/5 p-2.5 rounded-xl border border-white/5 flex flex-col gap-0.5">
              <span className="text-[8px] font-bold uppercase tracking-widest text-gray-500">Category Type</span>
              <span className="text-gray-200 font-medium capitalize">{transaction.type}</span>
            </div>
          </div>

          {/* Accounts Flow Info */}
          {(fromAccount || toAccount) && (
            <div className="flex items-center gap-3 text-xs bg-white/5 p-3 rounded-xl border border-white/5 overflow-hidden">
              {transaction.type === "transfer" ? (
                <>
                  <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                    <span className="text-[8px] font-bold uppercase tracking-widest text-gray-500">Source Account</span>
                    <span className="truncate font-semibold text-gray-200">{fromAccount?.name || "Unknown"}</span>
                  </div>
                  <ArrowRight size={14} className="flex-shrink-0 opacity-55 text-gray-500 mt-2" />
                  <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                    <span className="text-[8px] font-bold uppercase tracking-widest text-gray-500">Destination Account</span>
                    <span className="truncate font-semibold text-gray-200">{toAccount?.name || "Unknown"}</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                  <span className="text-[8px] font-bold uppercase tracking-widest text-gray-500">
                    {transaction.type === "income" ? "Deposited To" : "Paid From"}
                  </span>
                  <span className="truncate font-semibold text-gray-200">
                    {(transaction.type === "income" ? toAccount?.name : fromAccount?.name) || "Not connected"}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          {transaction.tag_objects && transaction.tag_objects.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[8px] font-bold uppercase tracking-widest text-gray-500 ml-1">Tags</span>
              <div className="flex flex-wrap gap-1.5">
                {transaction.tag_objects.map((tag: Tag) => (
                  <span key={tag.id} className="tag-badge text-[10px] py-1 px-3 bg-white/5 border-white/5 hover:bg-white/10 transition-colors">
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Notes if present */}
          {transaction.notes && (
            <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex flex-col gap-1.5 text-left">
              <span className="text-[8px] font-bold uppercase tracking-widest text-gray-500">Detailed Notes</span>
              <p className="text-xs text-gray-300 whitespace-pre-wrap break-words">
                {transaction.notes}
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2.5 mt-2">
            <button
              className="sketch-btn flex-1 py-2 text-xs font-semibold hover:bg-white/10 active:scale-[0.98] transition-all"
              onClick={() => onEdit(transaction)}
            >
              Edit
            </button>
            {confirmDelete ? (
              <button
                className="sketch-btn sketch-btn-danger flex-1 py-2 text-xs font-bold bg-[hsl(var(--destructive))] text-white active:scale-[0.98] transition-all"
                onClick={() => onDelete(transaction.id)}
              >
                Confirm Delete
              </button>
            ) : (
              <button
                className="sketch-btn sketch-btn-danger flex-1 py-2 text-xs font-semibold hover:bg-red-500/10 active:scale-[0.98] transition-all"
                onClick={() => setConfirmDelete(true)}
                onBlur={() => setConfirmDelete(false)}
              >
                Delete
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TransactionsPage() {
  const navigate = useNavigate();
  const { 
    budgets, 
    accounts, 
    tags, 
    fetchBudgets, 
    fetchAccounts, 
    fetchTags, 
    invalidateBudgets, 
    invalidateAccounts, 
    invalidateBudgetDetails 
  } = useData();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Filter States
  const [datePreset, setDatePreset] = useState<"all" | "this-month" | "last-30-days" | "this-year" | "custom">("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState<number | "all">("all");
  const [selectedTagId, setSelectedTagId] = useState<number | "all">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expenses" | "transfer">("all");
  const [sortBy, setSortBy] = useState<"date-desc" | "date-asc" | "amount-desc" | "amount-asc">("date-desc");
  const [searchQuery, setSearchQuery] = useState("");

  // Edit State
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>(undefined);
  const [editingBudgetId, setEditingBudgetId] = useState<number | undefined>(undefined);
  const [showForm, setShowForm] = useState(false);

  // Fetch initial data
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchBudgets(),
      fetchAccounts(),
      fetchTags()
    ])
      .catch(() => setError("Failed to load transactions data"))
      .finally(() => setLoading(false));
  }, [fetchBudgets, fetchAccounts, fetchTags]);

  // Extract all transactions from all budgets
  const allTransactions = useMemo(() => {
    if (!budgets) return [];
    return budgets.flatMap(b => b.transactions || []);
  }, [budgets]);

  // Apply filters and sorting
  const filteredTransactions = useMemo(() => {
    let result = [...allTransactions];

    // 1. Search Query Filter (notes)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => t.notes?.toLowerCase().includes(q));
    }

    // 2. Type Filter
    if (typeFilter !== "all") {
      result = result.filter(t => t.type === typeFilter);
    }

    // 3. Account Filter
    if (selectedAccountId !== "all") {
      result = result.filter(t => 
        t.from_account_id === selectedAccountId || t.to_account_id === selectedAccountId
      );
    }

    // 4. Tag Filter
    if (selectedTagId !== "all") {
      result = result.filter(t => t.tags?.includes(selectedTagId));
    }

    // 5. Date Filter
    if (datePreset === "this-month") {
      const now = new Date();
      const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      result = result.filter(t => t.date.startsWith(prefix));
    } else if (datePreset === "last-30-days") {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];
      const nowStr = now.toISOString().split("T")[0];
      result = result.filter(t => t.date >= thirtyDaysAgoStr && t.date <= nowStr);
    } else if (datePreset === "this-year") {
      const now = new Date();
      const prefix = `${now.getFullYear()}`;
      result = result.filter(t => t.date.startsWith(prefix));
    } else if (datePreset === "custom") {
      if (customStartDate) {
        result = result.filter(t => t.date >= customStartDate);
      }
      if (customEndDate) {
        result = result.filter(t => t.date <= customEndDate);
      }
    }

    // 6. Sorting
    result.sort((a, b) => {
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
    });

    return result;
  }, [allTransactions, searchQuery, typeFilter, selectedAccountId, selectedTagId, datePreset, customStartDate, customEndDate, sortBy]);

  // Aggregate stats of filtered transactions
  const stats = useMemo(() => {
    let income = 0;
    let expenses = 0;
    filteredTransactions.forEach(t => {
      const amt = Number(t.amount) || 0;
      if (t.type === "income") {
        income += amt;
      } else if (t.type === "expenses") {
        expenses += amt;
      }
    });
    return {
      income,
      expenses,
      net: income - expenses
    };
  }, [filteredTransactions]);

  // Handle Edit/Delete Actions
  async function handleDelete(tid: string) {
    const parentBudget = budgets?.find(b => 
      b.transactions?.some(t => t.id === tid)
    );
    if (!parentBudget) {
      alert("Could not find parent budget for this transaction.");
      return;
    }
    const budgetId = parentBudget.id;
    try {
      await api.transactions.delete(budgetId, tid as any);
      invalidateBudgetDetails(budgetId);
      invalidateBudgets();
      invalidateAccounts();
      
      // refetch all lists to update UI
      await Promise.all([
        fetchBudgets(true),
        fetchAccounts(true)
      ]);
    } catch (error) {
      console.error("Failed to delete transaction:", error);
      alert("Failed to delete transaction.");
    }
  }

  function handleEdit(t: Transaction) {
    const parentBudget = budgets?.find(b => 
      b.transactions?.some(tx => tx.id === t.id)
    );
    if (!parentBudget) {
      alert("Could not find parent budget for this transaction.");
      return;
    }
    setEditingTransaction(t);
    setEditingBudgetId(parentBudget.id);
    setShowForm(true);
  }

  async function handleFormSave() {
    setShowForm(false);
    setEditingTransaction(undefined);
    setEditingBudgetId(undefined);
    
    if (editingBudgetId) {
      invalidateBudgetDetails(editingBudgetId);
    }
    invalidateBudgets();
    invalidateAccounts();
    
    await Promise.all([
      fetchBudgets(true),
      fetchAccounts(true)
    ]);
  }

  function handleFormBack() {
    setShowForm(false);
    setEditingTransaction(undefined);
    setEditingBudgetId(undefined);
  }

  if (showForm && editingBudgetId) {
    return (
      <TransactionForm
        budgetId={editingBudgetId}
        transaction={editingTransaction}
        onSave={handleFormSave}
        onBack={handleFormBack}
      />
    );
  }

  return (
    <div className="phone-frame">
      <div className="screen-header">
        <button onClick={() => navigate("/")} className="header-action-btn">
          Back
        </button>
        <span className="header-title flex items-center gap-1.5">
          All Transactions
          <span className="text-xs font-normal text-gray-500">
            ({filteredTransactions.length})
          </span>
        </span>
        <span className="w-12" />
      </div>

      <div className="screen-body">
        {loading && budgets === null ? (
          <div className="p-12 text-center text-sm text-gray-500">Loading transactions...</div>
        ) : error ? (
          <div className="p-6 text-center text-sm text-[hsl(var(--destructive))]">{error}</div>
        ) : (
          <div className="flex flex-col gap-4">
            
            {/* Dynamic Totals Panel */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex justify-between items-center shadow-lg backdrop-blur-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[hsl(var(--primary))]/5 blur-2xl -mr-12 -mt-12 rounded-full"></div>
              <div className="flex flex-col items-center flex-1">
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Income</span>
                <span className="text-sm font-bold text-[hsl(150_70%_55%)] leading-none">
                  ₹{stats.income.toLocaleString()}
                </span>
              </div>
              <div className="w-[1px] h-8 bg-white/10"></div>
              <div className="flex flex-col items-center flex-1">
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Expenses</span>
                <span className="text-sm font-bold text-[hsl(0_80%_65%)] leading-none">
                  ₹{stats.expenses.toLocaleString()}
                </span>
              </div>
              <div className="w-[1px] h-8 bg-white/10"></div>
              <div className="flex flex-col items-center flex-1">
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mb-1.5">Net Flow</span>
                <span className={`text-sm font-bold leading-none ${stats.net >= 0 ? "text-[hsl(150_70%_55%)]" : "text-[hsl(0_80%_65%)]"}`}>
                  ₹{stats.net.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Filter and Control Dashboard */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-col gap-2.5 shadow-md">
              {/* Search Notes Bar */}
              <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-xl border border-white/5 focus-within:border-[hsl(var(--primary))]/30 transition-all">
                <Search size={14} className="text-gray-500 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search by notes description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent text-xs text-gray-300 outline-none border-none w-full placeholder:text-gray-600 font-medium"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} className="text-gray-500 hover:text-gray-300">
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Advanced Filter Selection Grid */}
              <div className="grid grid-cols-2 gap-2">
                {/* Date Dropdown */}
                <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-2 rounded-xl border border-white/5 transition-all focus-within:border-[hsl(var(--primary))]/30">
                  <Calendar size={13} className="text-gray-500 flex-shrink-0" />
                  <select
                    value={datePreset}
                    onChange={(e) => setDatePreset(e.target.value as any)}
                    className="bg-transparent text-[11px] text-gray-300 outline-none border-none w-full cursor-pointer font-medium"
                  >
                    <option value="all" className="bg-[#1c1f26]">All Time</option>
                    <option value="this-month" className="bg-[#1c1f26]">This Month</option>
                    <option value="last-30-days" className="bg-[#1c1f26]">Last 30 Days</option>
                    <option value="this-year" className="bg-[#1c1f26]">This Year</option>
                    <option value="custom" className="bg-[#1c1f26]">Custom Range...</option>
                  </select>
                </div>

                {/* Account Filter */}
                <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-2 rounded-xl border border-white/5 transition-all focus-within:border-[hsl(var(--primary))]/30">
                  <Landmark size={13} className="text-gray-500 flex-shrink-0" />
                  <select
                    value={selectedAccountId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedAccountId(val === "all" ? "all" : Number(val));
                    }}
                    className="bg-transparent text-[11px] text-gray-300 outline-none border-none w-full cursor-pointer font-medium"
                  >
                    <option value="all" className="bg-[#1c1f26]">All Accounts</option>
                    {accounts?.map(acc => (
                      <option key={acc.id} value={acc.id} className="bg-[#1c1f26]">{acc.name}</option>
                    ))}
                  </select>
                </div>

                {/* Tag Filter */}
                <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-2 rounded-xl border border-white/5 transition-all focus-within:border-[hsl(var(--primary))]/30">
                  <TagIcon size={13} className="text-gray-500 flex-shrink-0" />
                  <select
                    value={selectedTagId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedTagId(val === "all" ? "all" : Number(val));
                    }}
                    className="bg-transparent text-[11px] text-gray-300 outline-none border-none w-full cursor-pointer font-medium"
                  >
                    <option value="all" className="bg-[#1c1f26]">All Tags</option>
                    {tags?.map(t => (
                      <option key={t.id} value={t.id} className="bg-[#1c1f26]">{t.name}</option>
                    ))}
                  </select>
                </div>

                {/* Type Filter */}
                <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-2 rounded-xl border border-white/5 transition-all focus-within:border-[hsl(var(--primary))]/30">
                  <Filter size={13} className="text-gray-500 flex-shrink-0" />
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as any)}
                    className="bg-transparent text-[11px] text-gray-300 outline-none border-none w-full cursor-pointer font-medium"
                  >
                    <option value="all" className="bg-[#1c1f26]">All Categories</option>
                    <option value="income" className="bg-[#1c1f26]">Income</option>
                    <option value="expenses" className="bg-[#1c1f26]">Expenses</option>
                    <option value="transfer" className="bg-[#1c1f26]">Transfers</option>
                  </select>
                </div>
              </div>

              {/* Sorting Selection Bar */}
              <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-xl border border-white/5 transition-all focus-within:border-[hsl(var(--primary))]/30">
                <ArrowUpDown size={13} className="text-gray-500 flex-shrink-0" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-xs text-gray-300 outline-none border-none w-full cursor-pointer font-medium"
                >
                  <option value="date-desc" className="bg-[#1c1f26]">Sort: Newest First</option>
                  <option value="date-asc" className="bg-[#1c1f26]">Sort: Oldest First</option>
                  <option value="amount-desc" className="bg-[#1c1f26]">Sort: Big to Small (₹)</option>
                  <option value="amount-asc" className="bg-[#1c1f26]">Sort: Small to Big (₹)</option>
                </select>
              </div>

              {/* Custom Date Input Fields (Renders if DatePreset is Custom) */}
              {datePreset === "custom" && (
                <div className="grid grid-cols-2 gap-2 mt-1 pt-1.5 border-t border-white/5">
                  <div className="flex flex-col gap-1">
                    <span className="text-[7px] font-bold text-gray-500 uppercase tracking-widest ml-1">Start Date</span>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="bg-white/5 text-[10px] text-gray-300 border border-white/5 rounded-xl px-2 py-1.5 outline-none focus:border-[hsl(var(--primary))]/30"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[7px] font-bold text-gray-500 uppercase tracking-widest ml-1">End Date</span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="bg-white/5 text-[10px] text-gray-300 border border-white/5 rounded-xl px-2 py-1.5 outline-none focus:border-[hsl(var(--primary))]/30"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* List of Filtered Transactions */}
            <div className="mt-2 flex flex-col">
              {filteredTransactions.length === 0 ? (
                <div className="text-center text-xs text-gray-500 py-16 bg-white/5 border border-white/5 rounded-2xl p-6">
                  No transactions match your search filters.
                </div>
              ) : (
                filteredTransactions.map((tx) => (
                  <ExpandableTransactionRow
                    key={tx.id}
                    transaction={tx}
                    accounts={accounts}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
