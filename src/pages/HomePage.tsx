import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { api, Budget } from "@/lib/api";
import { useData } from "@/context/DataContext";
import BudgetPage from "./BudgetPage";
import ArchivePage from "./ArchivePage";
import TagsPage from "./TagsPage";
import AccountsPage from "./AccountsPage";
import AccountDetailsPage from "./AccountDetailsPage";
import ProfilePage from "./ProfilePage";
import SummaryPage from "./SummaryPage";

interface Props {
  onLogout: () => void;
}

export default function HomePage({ onLogout }: Props) {
  const [currentBudget, setCurrentBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creatingBudget, setCreatingBudget] = useState(false);
  const navigate = useNavigate();

  const { budgets, fetchBudgets, invalidateBudgets } = useData();

  useEffect(() => {
    setLoading(true);
    fetchBudgets().catch(() => setError("Failed to load budgets"));
  }, [fetchBudgets]);

  useEffect(() => {
    if (budgets !== null) {
      if (budgets.length > 0) {
        const now = new Date();
        const monthName = now.toLocaleString("default", { month: "long" });
        const year = now.getFullYear();
        const currentTitle = `${monthName} ${year}`;

        const sorted = [...budgets].sort((a, b) =>
          new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
        );

        const currentMonthBudget = sorted.find(b => b.title === currentTitle);
        setCurrentBudget(currentMonthBudget || sorted[0]);
      }
      setLoading(false);
    }
  }, [budgets]);

  async function handleCreateBudget() {
    const now = new Date();
    const monthName = now.toLocaleString("default", { month: "long" });
    const year = now.getFullYear();
    const title = `${monthName} ${year}`;
    setCreatingBudget(true);
    try {
      const budget = await api.budgets.create(title);
      invalidateBudgets();
      await fetchBudgets(true);
      setCurrentBudget(budget);
    } catch {
      setError("Failed to create budget");
    } finally {
      setCreatingBudget(false);
    }
  }

  if (loading) {
    return (
      <div className="phone-frame">
        <div className="flex items-center justify-center h-full">
          <p className="text-sm text-gray-500">Loading…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="phone-frame">
        <div className="flex flex-col items-center justify-center h-full gap-4 p-6">
          <p className="text-sm text-red-600">{error}</p>
          <button onClick={onLogout} className="sketch-btn">
            Logout
          </button>
        </div>
      </div>
    );
  }

  if (!currentBudget) {
    return (
      <div className="phone-frame">
        <div className="screen-header">
          <span className="header-title">Budget Tracker</span>
        </div>
        <div className="flex flex-col items-center justify-center flex-1 gap-4 p-6">
          <p className="text-sm text-gray-500 text-center">
            No budget found for this year. Create one to get started.
          </p>
          <button
            onClick={handleCreateBudget}
            className="sketch-btn sketch-btn-primary"
            disabled={creatingBudget}
          >
            {creatingBudget ? "Creating…" : "Create Budget"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<BudgetPage budgetId={currentBudget.id} isCurrentMonth={true} />} />
      <Route path="/budget/:id" element={<BudgetPage isCurrentMonth={false} />} />
      <Route path="/archive" element={<ArchivePage />} />
      <Route path="/tags" element={<TagsPage />} />
      <Route path="/accounts" element={<AccountsPage />} />
      <Route path="/accounts/:id" element={<AccountDetailsPage />} />
      <Route path="/summary" element={<SummaryPage />} />
      <Route path="/profile" element={<ProfilePage onLogout={onLogout} />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
