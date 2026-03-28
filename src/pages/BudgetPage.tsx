import { useEffect, useState } from "react";
import { api, Budget, Transaction, Summary } from "@/lib/api";
import TransactionItem from "@/components/TransactionItem";
import TransactionForm from "@/components/TransactionForm";
import PlansSection from "@/components/PlansSection";

interface Props {
  budgetId: number;
  onBack: () => void;
  onShowArchive: () => void;
  onShowTags: () => void;
  isCurrentMonth?: boolean;
}

export default function BudgetPage({
  budgetId,
  onBack,
  onShowArchive,
  onShowTags,
  isCurrentMonth = false,
}: Props) {
  const [budget, setBudget] = useState<Budget | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>(undefined);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"transactions" | "plans">("transactions");

  function reload() {
    setLoading(true);
    Promise.all([api.budgets.get(budgetId), api.budgets.summary(budgetId)])
      .then(([b, s]) => {
        setBudget(b);
        setSummary(s);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load budget");
        setLoading(false);
      });
  }

  useEffect(() => {
    reload();
  }, [budgetId]);

  async function handleDelete(tid: number) {
    if (!confirm("Delete this transaction?")) return;
    try {
      await api.transactions.delete(budgetId, tid);
      reload();
    } catch {
      alert("Failed to delete transaction");
    }
  }

  function handleEdit(t: Transaction) {
    setEditingTransaction(t);
    setShowForm(true);
  }

  function handleFormSave() {
    setShowForm(false);
    setEditingTransaction(undefined);
    reload();
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

  const transactions = budget?.transactions || [];

  return (
    <div className="phone-frame">
      <div className="screen-header">
        <button onClick={onBack} className="header-action-btn">
          Back
        </button>
        <span className="header-title">{budget?.title || "Loading…"}</span>
        <button
          onClick={() => {
            setEditingTransaction(undefined);
            setShowForm(true);
          }}
          className="header-action-btn"
        >
          Add
        </button>
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
        <button
          className="tab-btn"
          onClick={onShowTags}
        >
          Tags
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
          <button className="bottom-tab active">{budget?.title?.split(" ")[0]}</button>
          <button className="bottom-tab" onClick={onShowArchive}>
            Archive
          </button>
        </div>
      )}
    </div>
  );
}
