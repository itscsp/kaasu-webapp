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
            <div className="bg-white/5 border border-white/10 rounded-[24px] p-6 shadow-2xl backdrop-blur-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[hsl(var(--primary))]/10 blur-3xl -mr-16 -mt-16 rounded-full"></div>
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-6 text-center">{summary.month} OVERVIEW</h2>
              
              <div className="flex flex-col gap-4 relative z-10">
                <div className="flex justify-between items-center p-3 rounded-2xl bg-white/5 border border-white/5">
                  <span className="text-sm font-medium text-gray-400">Total Income</span>
                  <span className="text-lg font-bold text-[hsl(150_70%_55%)]">₹{(Number(summary.total_income) || 0).toLocaleString()}</span>
                </div>
                
                <div className="flex justify-between items-center p-3 rounded-2xl bg-white/5 border border-white/5">
                  <span className="text-sm font-medium text-gray-400">Total Expenses</span>
                  <span className="text-lg font-bold text-[hsl(0_80%_65%)]">₹{(Number(summary.total_expenses) || 0).toLocaleString()}</span>
                </div>
                
                <div className="h-px bg-white/10 w-full my-2" />
                
                <div className="flex justify-between items-center p-4 rounded-2xl bg-[hsl(var(--primary))]/5 border border-[hsl(var(--primary))]/20">
                  <span className="text-sm font-bold text-gray-200">Net Balance</span>
                  <span className={`text-xl font-bold ${(Number(summary.net_balance) || 0) >= 0 ? "text-[hsl(150_70%_55%)]" : "text-[hsl(0_80%_65%)]"}`}>
                    ₹{(Number(summary.net_balance) || 0).toLocaleString()}
                  </span>
                </div>
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
                    .map((acc) => {
                      const groupClass = acc.group.toLowerCase().replace(' ', '-');
                      return (
                      <div key={acc.id} className={`account-card account-card-${groupClass} !mb-2`}>
                        <div className="account-info">
                          <span className="account-name">{acc.name}</span>
                          <div className="account-meta">
                            <span className={`group-badge group-badge-${groupClass}`}>
                              {acc.group}
                            </span>
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5 w-full">
                              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Month Change</span>
                              <span className={`text-xs font-bold ${
                                (() => {
                                  const change = acc.monthly_change || 0;
                                  if (change === 0) return "text-gray-400";
                                  const isLiability = ['Loan', 'Insurance'].includes(acc.group);
                                  const isImprovement = isLiability ? change < 0 : change > 0;
                                  return isImprovement ? "text-[hsl(150_70%_55%)]" : "text-[hsl(0_80%_65%)]";
                                })()
                              }`}>
                                {acc.monthly_change && acc.monthly_change > 0 ? "+" : ""}
                                ₹{(acc.monthly_change || 0).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end">
                           <span className="text-[8px] font-bold text-gray-600 uppercase tracking-widest mb-1">Total Bal</span>
                           <span className={`text-sm font-bold ${(Number(acc.amount ?? acc.balance) || 0) >= 0 ? "text-gray-200" : "text-[hsl(0_80%_65%)]"}`}>
                             ₹{(Number(acc.amount ?? acc.balance) || 0).toLocaleString()}
                           </span>
                        </div>
                      </div>
                    )})}
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
