import { useEffect, useState } from "react";
import { useData } from "@/context/DataContext";

interface Props {
  budgetId?: number;
  onBack: () => void;
}

export default function SummaryPage({ budgetId, onBack }: Props) {
  const { budgetDetails, fetchBudgetDetails } = useData();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (budgetId) {
      fetchBudgetDetails(budgetId)
        .catch(() => setError("Failed to load summary"))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
      setError("No active budget found.");
    }
  }, [budgetId, fetchBudgetDetails]);

  const summary = budgetId ? budgetDetails[budgetId]?.summary : null;

  return (
    <div className="phone-frame">
      <div className="screen-header">
        <button onClick={onBack} className="header-action-btn">Back</button>
        <span className="header-title">Summary</span>
        <span className="w-12" />
      </div>

      <div className="screen-body py-4">
        {loading && <div className="p-4 text-center text-sm text-[hsl(var(--muted-foreground))]">Loading…</div>}
        {error && <div className="p-4 text-center text-sm text-[hsl(var(--destructive))]">{error}</div>}

        {!loading && summary && (
          <div className="flex flex-col gap-6">
            <div className="sketch-box p-4">
              <h2 className="text-xl font-bold mb-4 text-center">{summary.month} Overview</h2>
              
              <div className="flex justify-between items-center mb-3">
                <span className="text-[hsl(var(--muted-foreground))]">Total Income</span>
                <span className="font-bold text-[hsl(var(--primary))]">₹{(Number(summary.total_income) || 0).toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between items-center mb-3">
                <span className="text-[hsl(var(--muted-foreground))]">Total Expenses</span>
                <span className="font-bold text-[hsl(var(--destructive))]">₹{(Number(summary.total_expenses) || 0).toLocaleString()}</span>
              </div>
              
              <div className="h-px bg-[hsl(var(--border))] w-full my-3" />
              
              <div className="flex justify-between items-center text-lg">
                <span className="font-medium">Net Balance</span>
                <span className={`font-bold ${(Number(summary.net_balance) || 0) >= 0 ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--destructive))]"}`}>
                  ₹{(Number(summary.net_balance) || 0).toLocaleString()}
                </span>
              </div>
            </div>

            {summary.accounts && summary.accounts.filter(acc => acc.monthly_change && acc.monthly_change !== 0).length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-3 px-1">
                  Active Accounts This Month
                </h3>
                <div className="flex flex-col gap-2">
                  {summary.accounts
                    .filter(acc => acc.monthly_change !== undefined && acc.monthly_change !== 0)
                    .map((acc) => (
                    <div key={acc.id} className="sketch-box p-3 flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <span className="font-medium text-[hsl(var(--foreground))]">{acc.name}</span>
                          <span className="text-xs text-[hsl(var(--muted-foreground))]">{acc.group}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase tracking-wider mb-0.5">Overall Balance</span>
                          <span className={`font-semibold ${(Number(acc.amount ?? acc.balance) || 0) >= 0 ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--destructive))]"}`}>
                            ₹{(Number(acc.amount ?? acc.balance) || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center mt-1 pt-2 border-t border-[hsl(var(--border))]">
                        <span className="text-xs text-[hsl(var(--muted-foreground))]">This Month's Change</span>
                        <span className={`text-sm font-medium ${
                          (() => {
                            const change = acc.monthly_change || 0;
                            if (change === 0) return "text-[hsl(var(--foreground))]";
                            const isLiability = ['Loan', 'Insurance'].includes(acc.group);
                            const isImprovement = isLiability ? change < 0 : change > 0;
                            return isImprovement ? "text-[hsl(var(--primary))]" : "text-[hsl(var(--destructive))]";
                          })()
                        }`}>
                          {acc.monthly_change && acc.monthly_change > 0 ? "+" : ""}
                          ₹{(acc.monthly_change || 0).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {(!summary.accounts || summary.accounts.filter(acc => acc.monthly_change && acc.monthly_change !== 0).length === 0) && (
              <p className="text-center text-sm text-[hsl(var(--muted-foreground))] mt-4">
                No account activity tracked for this month.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
