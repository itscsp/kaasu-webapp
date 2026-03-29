import { useEffect, useState } from "react";
import { api, Budget } from "@/lib/api";
import { useData } from "@/context/DataContext";
import BudgetPage from "./BudgetPage";
import ArchivePage from "./ArchivePage";
import TagsPage from "./TagsPage";
import { clearCredentials } from "@/lib/auth";

interface Props {
  onLogout: () => void;
}

type View =
  | { type: "current" }
  | { type: "budget"; id: number }
  | { type: "archive" }
  | { type: "tags" };

export default function HomePage({ onLogout }: Props) {
  const [view, setView] = useState<View>({ type: "current" });
  const [currentBudget, setCurrentBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [creatingBudget, setCreatingBudget] = useState(false);

  const { budgets, fetchBudgets, invalidateBudgets } = useData();

  useEffect(() => {
    setLoading(true);
    fetchBudgets().catch(() => setError("Failed to load budgets"));
  }, [fetchBudgets]);

  useEffect(() => {
    if (budgets !== null) {
      if (budgets.length > 0) {
        const sorted = [...budgets].sort((a, b) =>
          new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
        );
        setCurrentBudget(sorted[0]);
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

  function handleLogout() {
    clearCredentials();
    onLogout();
  }

  if (view.type === "archive") {
    return (
      <ArchivePage
        onSelectBudget={(id) => setView({ type: "budget", id })}
        onBack={() => setView({ type: "current" })}
      />
    );
  }

  if (view.type === "tags") {
    return (
      <TagsPage
        onBack={() => {
          if (currentBudget) {
            setView({ type: "current" });
          } else {
            setView({ type: "current" });
          }
        }}
      />
    );
  }

  if (view.type === "budget") {
    return (
      <BudgetPage
        budgetId={view.id}
        onBack={() => setView({ type: "archive" })}
        onShowArchive={() => setView({ type: "archive" })}
        onShowTags={() => setView({ type: "tags" })}
        isCurrentMonth={false}
      />
    );
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
          <button onClick={handleLogout} className="sketch-btn">
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
          <button onClick={handleLogout} className="header-action-btn text-xs">
            Logout
          </button>
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
    <BudgetPage
      budgetId={currentBudget.id}
      onBack={handleLogout}
      onShowArchive={() => setView({ type: "archive" })}
      onShowTags={() => setView({ type: "tags" })}
      isCurrentMonth={true}
    />
  );
}
