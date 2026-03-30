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
  const { budgetDetails, fetchBudgetDetails, invalidateBudgetDetails } = useData();
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
      await fetchBudgetDetails(budgetId, true);
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
    await fetchBudgetDetails(budgetId, true);
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
        <div className="summary-bar">
          <div className="summary-item">
            <span className="summary-label">Income</span>
            <span className="summary-value income">+{(Number(summary.total_income) || 0).toLocaleString()}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Expenses</span>
            <span className="summary-value expenses">-{(Number(summary.total_expenses) || 0).toLocaleString()}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Balance</span>
            <span className={`summary-value ${(Number(summary.net_balance) || 0) >= 0 ? "income" : "expenses"}`}>
              {(Number(summary.net_balance) || 0) >= 0 ? "+" : ""}
              {(Number(summary.net_balance) || 0).toLocaleString()}
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
        <div className="bottom-tab-bar">
          <button className="bottom-tab active flex flex-col items-center gap-0.5">
            <Home size={16} />
            <span className="text-[10px]">{budget?.title?.split(" ")[0]}</span>
          </button>
          <button className="bottom-tab flex flex-col items-center gap-0.5" onClick={onShowSummary}>
            <BarChart2 size={16} />
            <span className="text-[10px]">Stats</span>
          </button>
          <button className="bottom-tab flex flex-col items-center gap-0.5" onClick={onShowAccounts}>
            <Landmark size={16} />
            <span className="text-[10px]">Accounts</span>
          </button>
          <button className="bottom-tab flex flex-col items-center gap-0.5" onClick={onShowProfile}>
            <User size={16} />
            <span className="text-[10px]">Profile</span>
          </button>
        </div>
      )}
    </div>
  );
}
