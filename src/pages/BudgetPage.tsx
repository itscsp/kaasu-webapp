import { useEffect, useState } from "react";
import { api, Transaction } from "@/lib/api";
import { useData } from "@/context/DataContext";
import TransactionItem from "@/components/TransactionItem";
import TransactionForm from "@/components/TransactionForm";
import PlansSection from "@/components/PlansSection";
import { BarChart2, Home, Landmark, User } from "lucide-react";

interface Props {
  budgetId: number;
  onBack: () => void;
  onShowSummary: () => void;
  onShowAccounts: () => void;
  onShowProfile: () => void;
  isCurrentMonth?: boolean;
}

export default function BudgetPage({
  budgetId,
  onBack,
  onShowSummary,
  onShowAccounts,
  onShowProfile,
  isCurrentMonth = false,
}: Props) {
  const { budgetDetails, fetchBudgetDetails, invalidateBudgetDetails, invalidateBudgets, fetchBudgets, invalidateAccounts, fetchAccounts } = useData();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>(undefined);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"transactions" | "plans">("transactions");

  useEffect(() => {
    setLoading(true);
    fetchBudgetDetails(budgetId)
      .catch(() => setError("Failed to load budget"));
  }, [budgetId, fetchBudgetDetails]);

  useEffect(() => {
    if (budgetDetails[budgetId]) {
      setLoading(false);
    }
  }, [budgetDetails, budgetId]);

  const budget = budgetDetails[budgetId]?.budget;
  const summary = budgetDetails[budgetId]?.summary;

  async function handleDelete(tid: string) {
    try {
      await api.transactions.delete(budgetId, tid as any);
      invalidateBudgetDetails(budgetId);
      invalidateAccounts();
      await fetchBudgetDetails(budgetId, true);
      fetchAccounts(true).catch(() => {});
    } catch (error) {
      console.error("Failed to delete transaction:", error);
    }
  }

  function handleEdit(t: Transaction) {
    setEditingTransaction(t);
    setShowForm(true);
  }

  async function handleFormSave() {
    setShowForm(false);
    setEditingTransaction(undefined);
    invalidateBudgetDetails(budgetId);
    invalidateBudgets();
    invalidateAccounts();
    await fetchBudgetDetails(budgetId, true);
    fetchBudgets(true).catch(() => {});
    fetchAccounts(true).catch(() => {});
  }

  function handleFormBack() {
    setShowForm(false);
    setEditingTransaction(undefined);
  }

  if (showForm) {
    return (
      <TransactionForm
        budgetId={budgetId}
        transaction={editingTransaction}
        onSave={handleFormSave}
        onBack={handleFormBack}
      />
    );
  }

  const transactions = [...(budget?.transactions || [])].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="phone-frame">
      <div className="screen-header">
        <button onClick={onBack} className="header-action-btn">
          Back
        </button>
        <span className="header-title">{budget?.title || "Loading…"}</span>

        <button className="sketch-btn flex items-center gap-1 text-xs px-2 py-1"

          onClick={() => {
            setEditingTransaction(undefined);
            setShowForm(true);
          }}
        ><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus "><path d="M5 12h14"></path><path d="M12 5v14"></path></svg> Add</button>

      </div>

      {summary && (
        <div className="mx-4 my-2 p-4 bg-white/5 border border-white/10 rounded-2xl flex justify-between items-center shadow-lg backdrop-blur-md">
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Income</span>
            <span className="text-base font-bold text-[hsl(150_70%_55%)] leading-none">
              ₹{(Number(summary.total_income) || 0).toLocaleString()}
            </span>
          </div>
          <div className="w-[1px] h-8 bg-white/10"></div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Expenses</span>
            <span className="text-base font-bold text-[hsl(0_80%_65%)] leading-none">
              ₹{(Number(summary.total_expenses) || 0).toLocaleString()}
            </span>
          </div>
          <div className="w-[1px] h-8 bg-white/10"></div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Balance</span>
            <span className={`text-base font-bold leading-none ${(Number(summary.net_balance) || 0) >= 0 ? "text-[hsl(150_70%_55%)]" : "text-[hsl(0_80%_65%)]"}`}>
              ₹{(Number(summary.net_balance) || 0).toLocaleString()}
            </span>
          </div>
        </div>
      )}

      <div className="tab-bar">
        <button
          className={`tab-btn ${activeTab === "transactions" ? "tab-btn-active" : ""}`}
          onClick={() => setActiveTab("transactions")}
        >
          Transactions
        </button>
        <button
          className={`tab-btn ${activeTab === "plans" ? "tab-btn-active" : ""}`}
          onClick={() => setActiveTab("plans")}
        >
          Plans
        </button>
      </div>

      <div className="screen-body">
        {loading && (
          <div className="p-4 text-center text-sm text-gray-500">Loading…</div>
        )}
        {error && <div className="p-4 text-sm text-red-600">{error}</div>}

        {!loading && activeTab === "transactions" && (
          <>
            {transactions.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-6">
                No transactions yet. Tap Add to create one.
              </p>
            )}
            {transactions.map((t) => (
              <TransactionItem
                key={t.id}
                transaction={t}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </>
        )}

        {!loading && activeTab === "plans" && (
          <PlansSection budgetId={budgetId} />
        )}
      </div>

      {isCurrentMonth && (
        <div className="bottom-tab-bar bg-[#0f1115]/80 backdrop-blur-xl border-t border-white/5 px-2 py-3">
          <button className="bottom-tab active flex flex-col items-center gap-1">
            <div className={`p-1.5 rounded-xl ${activeTab === 'transactions' ? 'bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]' : 'text-gray-500'}`}>
              <Home size={18} strokeWidth={activeTab === 'transactions' ? 2.5 : 2} />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wider">{budget?.title?.split(" ")[0]}</span>
          </button>
          <button className="bottom-tab flex flex-col items-center gap-1 group" onClick={onShowSummary}>
            <div className="p-1.5 rounded-xl group-hover:bg-white/5 text-gray-500 transition-all">
              <BarChart2 size={18} strokeWidth={2} />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wider">Stats</span>
          </button>
          <button className="bottom-tab flex flex-col items-center gap-1 group" onClick={onShowAccounts}>
            <div className="p-1.5 rounded-xl group-hover:bg-white/5 text-gray-500 transition-all">
              <Landmark size={18} strokeWidth={2} />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wider">Accounts</span>
          </button>
          <button className="bottom-tab flex flex-col items-center gap-1 group" onClick={onShowProfile}>
            <div className="p-1.5 rounded-xl group-hover:bg-white/5 text-gray-500 transition-all">
              <User size={18} strokeWidth={2} />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wider">Profile</span>
          </button>
        </div>
      )}
    </div>
  );
}
