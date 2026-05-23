import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, Transaction } from "@/lib/api";
import { useData } from "@/context/DataContext";
import TransactionItem from "@/components/TransactionItem";
import TransactionForm from "@/components/TransactionForm";
import PlansSection from "@/components/PlansSection";
import { BarChart2, Home, Landmark, User, Menu, X, LogOut, Tag, Archive, Plus } from "lucide-react";

interface Props {
  budgetId?: number;
  isCurrentMonth?: boolean;
  onLogout?: () => void;
}

export default function BudgetPage({ budgetId: propsBudgetId, isCurrentMonth = false, onLogout }: Props) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const budgetId = propsBudgetId ?? (id ? parseInt(id, 10) : 0);

  const { budgetDetails, fetchBudgetDetails, invalidateBudgetDetails, invalidateBudgets, fetchBudgets, invalidateAccounts, fetchAccounts } = useData();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>(undefined);
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"transactions" | "plans">("transactions");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (!budgetId) return;
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
      {/* ── Sliding Navigation Drawer Backdrop & Overlay ── */}
      <div className={`burger-menu-backdrop ${isMenuOpen ? "open" : ""}`} onClick={() => setIsMenuOpen(false)} />
      <div className={`burger-menu-drawer ${isMenuOpen ? "open" : ""}`}>
        <div className="burger-menu-header">
          <div className="burger-menu-logo">
            <span>Kaasu</span> App
          </div>
          <button className="burger-menu-close" onClick={() => setIsMenuOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="burger-menu-links">
          <button
            className={`burger-menu-item ${isCurrentMonth && activeTab === "transactions" ? "active" : ""}`}
            onClick={() => {
              setIsMenuOpen(false);
              navigate("/");
            }}
          >
            <Home size={18} />
            Tracker
          </button>
          
          <button
            className="burger-menu-item"
            onClick={() => {
              setIsMenuOpen(false);
              navigate("/summary");
            }}
          >
            <BarChart2 size={18} />
            Stats
          </button>

          <button
            className="burger-menu-item"
            onClick={() => {
              setIsMenuOpen(false);
              navigate("/accounts");
            }}
          >
            <Landmark size={18} />
            Accounts
          </button>

          <button
            className="burger-menu-item"
            onClick={() => {
              setIsMenuOpen(false);
              navigate("/profile");
            }}
          >
            <User size={18} />
            Profile
          </button>

          <button
            className="burger-menu-item"
            onClick={() => {
              setIsMenuOpen(false);
              navigate("/tags");
            }}
          >
            <Tag size={18} />
            Tags
          </button>

          <button
            className="burger-menu-item"
            onClick={() => {
              setIsMenuOpen(false);
              navigate("/archive");
            }}
          >
            <Archive size={18} />
            Archive
          </button>
        </nav>

        {onLogout && (
          <div className="burger-menu-footer">
            <button
              className="burger-menu-logout"
              onClick={() => {
                setIsMenuOpen(false);
                onLogout();
              }}
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        )}
      </div>

      <div className="screen-header">
        {!isCurrentMonth && (
          <button onClick={() => navigate(-1)} className="header-action-btn">
            Back
          </button>
        )}
        {isCurrentMonth && (
          <button onClick={() => setIsMenuOpen(true)} className="header-action-btn flex items-center justify-center">
            <Menu size={20} strokeWidth={2.5} />
          </button>
        )}
        <span className="header-title">{budget?.title || "Loading…"}</span>
        <span className="w-12" />
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
                No transactions yet. Tap the plus button to create one.
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

      {/* ── Glowing Floating Action Button (FAB) ── */}
      <button
        className="floating-add-btn"
        onClick={() => {
          setEditingTransaction(undefined);
          setShowForm(true);
        }}
        title="Add Transaction"
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>
    </div>
  );
}
